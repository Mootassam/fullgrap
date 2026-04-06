import MongooseRepository from "./mongooseRepository";
import MongooseQueryUtils from "../utils/mongooseQueryUtils";
import AuditLogRepository from "./auditLogRepository";
import Error404 from "../../errors/Error404";
import { IRepositoryOptions } from "./IRepositoryOptions";
import FileRepository from "./fileRepository";
import Transaction from "../models/transaction";
import Error400 from "../../errors/Error400";
import UserRepository from "./userRepository";
import Error405 from "../../errors/Error405";
import User from "../models/user";

class TransactionRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    const currentUser = MongooseRepository.getCurrentUser(options);
    const [record] = await Transaction(options.database).create(
      [
        {
          ...data,
          tenant: currentTenant.id,
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      ],
      options
    );

    await this._createAuditLog(
      AuditLogRepository.CREATE,
      record.id,
      data,
      options
    );

    return this.findById(record.id, options);
  }

  


  static async update(id, data, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let record = await MongooseRepository.wrapWithSessionIfExists(
      Transaction(options.database).findById(id),
      options
    );

    if (!record || String(record.tenant) !== String(currentTenant.id)) {
      throw new Error404();
    }

    await Transaction(options.database).updateOne(
      { _id: id },
      {
        ...data,
        updatedBy: MongooseRepository.getCurrentUser(options).id,
      },
      options
    );
    await this._createAuditLog(AuditLogRepository.UPDATE, id, data, options);
    record = await this.findById(id, options);
    return record;
  }

  static async destroy(id, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let record = await MongooseRepository.wrapWithSessionIfExists(
      Transaction(options.database).findById(id),
      options
    );

    if (!record || String(record.tenant) !== String(currentTenant.id)) {
      throw new Error404();
    }

    await Transaction(options.database).deleteOne({ _id: id }, options);

    await this._createAuditLog(AuditLogRepository.DELETE, id, record, options);
  }

  static async count(filter, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    return MongooseRepository.wrapWithSessionIfExists(
      Transaction(options.database).countDocuments({
        ...filter,
        tenant: currentTenant.id,
      }),
      options
    );
  }


  

  static async findById(id, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let record = await MongooseRepository.wrapWithSessionIfExists(
      Transaction(options.database).findById(id).populate("user"),
      options
    );

    if (!record || String(record.tenant) !== String(currentTenant.id)) {
      throw new Error404();
    }
    return this._fillFileDownloadUrls(record);
  }

static async findAndCountAll(
  { filter, limit = 0, offset = 0, orderBy = "" },
  options: IRepositoryOptions
) {
  const currentTenant = MongooseRepository.getCurrentTenant(options);
  const currentUser = MongooseRepository.getCurrentUser(options);

  let criteriaAnd: any = [];

  // Base tenant filter (always applied)
  criteriaAnd.push({
    tenant: currentTenant.id,
  });

  // Determine user's role within this tenant
  const tenantMembership = currentUser?.tenants?.find(
    (tenantUser: any) => {
      const tenantId = tenantUser.tenant?._id || tenantUser.tenant;
      return tenantId?.toString() === currentTenant.id?.toString();
    }
  );

  const userRole = tenantMembership?.roles?.[0] || "member"; // default to member

  // Apply role-based filtering on transactions.user field
  if (userRole === "admin") {
    // Admin sees all transactions – no additional user filter
    // (only tenant filter applies)
  } 
  else if (userRole === "agent") {
    // Agent sees their own + downline users' transactions
    if (currentUser?.refcode) {
      const referralUserIds = await this.getAllReferralUserIds(currentUser.refcode, options);
      referralUserIds.push(currentUser._id);
      criteriaAnd.push({
        user: { $in: referralUserIds }
      });
    } else {
      // Agent without refcode sees only themselves
      criteriaAnd.push({
        user: currentUser?._id
      });
    }
  } 
  else {
    // Member (default) sees only their own transactions
    criteriaAnd.push({
      user: currentUser?._id
    });
  }

  // Apply additional filters if provided
  if (filter) {
    if (filter.id) {
      criteriaAnd.push({
        ["_id"]: MongooseQueryUtils.uuid(filter.id),
      });
    }
    
    if (filter.user) {
      // For admin: can filter by any user
      if (userRole === "admin") {
        criteriaAnd.push({
          user: filter.user,
        });
      } 
      // For agent: only allow filtering to users within their referral chain
      else if (userRole === "agent") {
        const referralUserIds = await this.getAllReferralUserIds(currentUser.refcode, options);
        referralUserIds.push(currentUser._id);
        if (referralUserIds.includes(filter.user)) {
          criteriaAnd.push({ user: filter.user });
        } else {
          return { rows: [], count: 0 };
        }
      } 
      // For member: only allow filtering to themselves
      else {
        if (filter.user.toString() === currentUser?._id.toString()) {
          criteriaAnd.push({ user: filter.user });
        } else {
          return { rows: [], count: 0 };
        }
      }
    }

    if (filter.amount) {
      criteriaAnd.push({
        amount: {
          $regex: MongooseQueryUtils.escapeRegExp(filter.amount),
          $options: "i",
        },
      });
    }

    if (filter.status) {
      criteriaAnd.push({
        status: {
          $regex: MongooseQueryUtils.escapeRegExp(filter.status),
          $options: "i",
        },
      });
    }

    if (filter.type) {
      criteriaAnd.push({
        type: {
          $regex: MongooseQueryUtils.escapeRegExp(filter.type),
          $options: "i",
        },
      });
    }

    if (filter.datetransaction) {
      const [start, end] = filter.datetransaction;
      if (start && start !== "") {
        criteriaAnd.push({
          createdAt: { $gte: start },
        });
      }
      if (end && end !== "") {
        criteriaAnd.push({
          createdAt: { $lte: end },
        });
      }
    }

    // Amount range filter
    if (filter.amountMin !== undefined || filter.amountMax !== undefined) {
      const amountFilter: any = {};
      if (filter.amountMin !== undefined) {
        amountFilter.$gte = parseFloat(filter.amountMin);
      }
      if (filter.amountMax !== undefined) {
        amountFilter.$lte = parseFloat(filter.amountMax);
      }
      criteriaAnd.push({ amount: amountFilter });
    }
  }

  const sort = MongooseQueryUtils.sort(orderBy || "createdAt_DESC");
  const skip = Number(offset || 0) || undefined;
  const limitEscaped = Number(limit || 0) || undefined;
  const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;

  let rows = await Transaction(options.database)
    .find(criteria)
    .skip(skip)
    .limit(limitEscaped)
    .sort(sort)
    .populate("user");

  const count = await Transaction(options.database).countDocuments(criteria);

  rows = await Promise.all(rows.map(this._fillFileDownloadUrls));

  return { rows, count };
}

  /**
   * Get ALL user IDs in the complete referral tree (all levels)
   * @param {string} refcode - The reference code to start from
   * @param {IRepositoryOptions} options - Repository options
   * @returns {Promise<Array>} - Array of user IDs in the referral tree
   */
  static async getAllReferralUserIds(refcode, options) {
    const allUserIds: any[] = [];
    const processedRefcodes = new Set<string>(); // Track processed refcodes to avoid cycles
    const queue: string[] = [refcode]; // Queue for BFS traversal
    
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    
    while (queue.length > 0) {
      const currentRefcode = queue.shift();
      
      // Skip if we've already processed this refcode
      if (!currentRefcode || processedRefcodes.has(currentRefcode)) {
        continue;
      }
      processedRefcodes.add(currentRefcode);
      
      // Find all users who used this refcode as their invitation code
      const referrals = await MongooseRepository.wrapWithSessionIfExists(
        User(options.database)
          .find({ 
            invitationcode: currentRefcode,
            tenants: { $elemMatch: { tenant: currentTenant.id } }
          })
          .select('_id refcode invitationcode')
          .lean(),
        options
      );
      
      for (const referral of referrals) {
        // Add this user's ID to the result list
        allUserIds.push(referral._id);
        
        // If this referral has their own refcode, add it to the queue to find their referrals
        if (referral.refcode) {
          queue.push(referral.refcode);
        }
      }
    }
    
    return allUserIds;
  }

  /**
   * Alternative: Get all users in referral chain with their details
   * Useful if you need user information for additional filtering
   */
  static async getAllReferralUsers(refcode, options) {
    const allUsers: any[] = [];
    const processedRefcodes = new Set<string>();
    const queue: string[] = [refcode];
    
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    
    while (queue.length > 0) {
      const currentRefcode = queue.shift();
      
      if (!currentRefcode || processedRefcodes.has(currentRefcode)) {
        continue;
      }
      processedRefcodes.add(currentRefcode);
      
      const referrals = await MongooseRepository.wrapWithSessionIfExists(
        User(options.database)
          .find({ 
            invitationcode: currentRefcode,
            tenants: { $elemMatch: { tenant: currentTenant.id } }
          })
          .select('_id refcode invitationcode fullName email balance')
          .lean(),
        options
      );
      
      for (const referral of referrals) {
        allUsers.push(referral);
        
        if (referral.refcode) {
          queue.push(referral.refcode);
        }
      }
    }
    
    return allUsers;
  }

  /**
   * Check if a user is an admin for the current tenant
   */
  static async isUserAdmin(userId, tenantId, options) {
    const user = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database)
        .findOne({
          _id: userId,
          tenants: {
            $elemMatch: {
              tenant: tenantId,
              roles: 'admin',
              status: 'active'
            }
          }
        })
        .select('_id'),
      options
    );
    
    return !!user;
  }

  /**
   * Get transaction summary for referral chain (optional helper method)
   */
  static async getReferralTransactionSummary(refcode, options) {
    const referralUserIds = await this.getAllReferralUserIds(refcode, options);
    const currentUser = MongooseRepository.getCurrentUser(options);
    
    // Include current user
    if (currentUser) {
      referralUserIds.push(currentUser._id);
    }
    
    const summary = await Transaction(options.database).aggregate([
      {
        $match: {
          user: { $in: referralUserIds },
          tenant: MongooseRepository.getCurrentTenant(options).id
        }
      },
      {
        $group: {
          _id: null,
          totalTransactions: { $sum: 1 },
          totalAmount: { $sum: '$amount' },
          avgAmount: { $avg: '$amount' },
          byType: {
            $push: {
              type: '$type',
              amount: '$amount'
            }
          }
        }
      }
    ]);
    
    return summary.length > 0 ? summary[0] : {
      totalTransactions: 0,
      totalAmount: 0,
      avgAmount: 0,
      byType: []
    };
  }


  static async findAndCountByUser(
    { filter, limit = 0, offset = 0, orderBy = "" },
    options: IRepositoryOptions
  ) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    const currentUser = MongooseRepository.getCurrentUser(options);

    let criteriaAnd: any = [];

    const search = filter

    criteriaAnd.push({
      tenant: currentTenant.id,
      user: currentUser.id,
    });

    if (search) {
      if (search.id) {
        criteriaAnd.push({
          ["_id"]: MongooseQueryUtils.uuid(filter.id),
        });
      }
      if (search.user) {
        criteriaAnd.push({
          user: filter.user,
        });
      }

      if (search.amount) {
        criteriaAnd.push({
          amount: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.amount),
            $options: "i",
          },
        });
      }

      if (search.status) {
        criteriaAnd.push({
          status: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.status),
            $options: "i",
          },
        });
      }

      if (search.type) {
        criteriaAnd.push({
          type: {
            $regex: MongooseQueryUtils.escapeRegExp(search.type),
            $options: "i",
          },
        });
      }

      if (search.datetransaction) {
        const [start, end] = search.datetransaction;

        if (start !== undefined && start !== null && start !== "") {
          criteriaAnd.push({
            ["createdAt"]: {
              $gte: start,
            },
          });
        }

        if (end !== undefined && end !== null && end !== "") {
          criteriaAnd.push({
            ["createdAt"]: {
              $lte: end,
            },
          });
        }
      }
    }

    const sort = MongooseQueryUtils.sort(orderBy || "createdAt_DESC");

    const skip = Number(offset || 0) || undefined;
    const limitEscaped = Number(limit || 0) || undefined;
    const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;

    let rows = await Transaction(options.database)
      .find(criteria)
      // .skip(skip)
      // .limit(limitEscaped)
      .sort(sort)
      .populate("user");

    const count = await Transaction(options.database).countDocuments(criteria);

    rows = await Promise.all(rows.map(this._fillFileDownloadUrls));

    return { rows, count };
  }

  static async findAllAutocomplete(search, limit, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: Array<any> = [
      {
        tenant: currentTenant.id,
      },
    ];

    if (search) {
      criteriaAnd.push({
        $or: [
          {
            _id: MongooseQueryUtils.uuid(search),
          },
          {
            titre: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
        ],
      });
    }

    const sort = MongooseQueryUtils.sort("titre_ASC");
    const limitEscaped = Number(limit || 0) || undefined;

    const criteria = { $and: criteriaAnd };

    const records = await Transaction(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    return records.map((record) => ({
      id: record.id,
      label: record.titre,
    }));
  }

  static async _createAuditLog(action, id, data, options: IRepositoryOptions) {
    await AuditLogRepository.log(
      {
        entityName: Transaction(options.database).modelName,
        entityId: id,
        action,
        values: data,
      },
      options
    );
  }

  static async _fillFileDownloadUrls(record) {
    if (!record) {
      return null;
    }

    const output = record.toObject ? record.toObject() : record;
    output.photo = await FileRepository.fillDownloadUrl(output.photo);

    return output;
  }
}

export default TransactionRepository;
