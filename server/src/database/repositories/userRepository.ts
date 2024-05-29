import MongooseRepository from "./mongooseRepository";
import User from "../models/user";
import AuditLogRepository from "./auditLogRepository";
import MongooseQueryUtils from "../utils/mongooseQueryUtils";
import FileRepository from "./fileRepository";
import crypto from "crypto";
import Error404 from "../../errors/Error404";
import SettingsRepository from "./settingsRepository";
import { isUserInTenant } from "../utils/userTenantUtils";
import { IRepositoryOptions } from "./IRepositoryOptions";
import lodash from "lodash";
import Error405 from "../../errors/Error405";
import product from "../models/product";
export default class UserRepository {
  static async create(data, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    data = this._preSave(data);

    const [user] = await User(options.database).create(
      [
        {
          email: data.email,
          fullName: data.fullName || null,
          phoneNumber: data.phoneNumber || null,
          country: data.country || null,
          nationality: data.nationality || null,
          passportPhoto: data.passportPhoto || null,
          passportDocument: data.passportDocument || null,
          avatars: data.avatars || [],
          createdBy: currentUser.id,
          updatedBy: currentUser.id,
        },
      ],
      options
    );

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: user.id,
        action: AuditLogRepository.CREATE,
        values: user,
      },
      options
    );

    return this.findById(user.id, {
      ...options,
      bypassPermissionValidation: true,
    });
  }

  static async updateUser(
    tenantId,
    id,
    fullName,
    phoneNumber,
    passportNumber,
    nationality,
    country,
    passportPhoto,
    balance,
    vip,
    options,
    status,
    product,
    itemNumber,
    withdrawPassword
  ) {
    const user = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findById(id),
      options
    );


    await User(options.database).updateOne(
      { _id: id },
      {
        $set: {
          fullName: fullName,
          phoneNumber: phoneNumber,
          passportNumber: passportNumber,
          nationality: nationality,
          country: country,
          passportPhoto: passportPhoto,
          options: options,
          balance: balance,
          vip: vip,
          product: product,
          itemNumber: itemNumber,
          withdrawPassword: withdrawPassword,
          $tenant: { status },
        },
      },
      options
    );
  }

  static async generateRandomCode() {
    const randomNumber = Math.floor(Math.random() * 10000000);
    const randomNumberPadded = randomNumber.toString().padStart(7, "0");
    const randomCode = await `ECL${randomNumberPadded}`;
    return randomCode;
  }

  static async createFromAuth(data, options: IRepositoryOptions) {
    data = this._preSave(data);

    let [user] = await User(options.database).create(
      [
        {
          email: data.email,
          password: data.password,
          username: data.username,
          phoneNumber: data.phoneNumber,
          country: data.country,
          firstName: data.firstName,
          fullName: data.fullName,
          withdrawPassword: data.withdrawPassword,
          invitationcode: data.invitationcode,
          refcode: await this.generateRandomCode(),
        },
      ],
      options
    );

    delete user.password;
    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: user.id,
        action: AuditLogRepository.CREATE,
        values: user,
      },
      options
    );

    return this.findById(user.id, {
      ...options,
      bypassPermissionValidation: true,
    });
  }

  static async updatePassword(
    id,
    password,
    invalidateOldTokens: boolean,
    options: IRepositoryOptions
  ) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    const data: any = {
      password,
      updatedBy: id,
    };

    if (invalidateOldTokens) {
      data.jwtTokenInvalidBefore = new Date();
    }

    await User(options.database).updateOne({ _id: id }, data, options);

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: {
          id,
          password: "secret",
        },
      },
      options
    );

    return this.findById(id, {
      ...options,
      bypassPermissionValidation: true,
    });
  }

  static async updateProfile(id, data, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    await this.checkSolde(data, options);
    data = this._preSave(data);
    await User(options.database).updateOne(
      { _id: id },
      {
        firstName: data.firstName || currentUser.firstName,
        lastName: data.lastName || currentUser.lastName,
        fullName: data.fullName || currentUser.fullName,
        phoneNumber: data.phoneNumber || currentUser.phoneNumber,
        updatedBy: currentUser.id,
        avatars: data.avatars || [],
        vip: data.vip || currentUser.vip,
        balance: data.balance,
        erc20: data.erc20 || currentUser.erc20,
        trc20: data.trc20 || currentUser.trc20,
        walletname: data.walletname || currentUser.walletname,
        usernamewallet: data.usernamewallet || currentUser.usernamewallet,
        product: data?.product,
        itemNumber: data?.itemNumber,
      },
      options
    );

    const user = await this.findById(id, options);

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: user,
      },
      options
    );

    return user;
  }

  static async updateProfileGrap(id, data, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);
    // await this.checkSolde(data, options);

    data = this._preSave(data);
    await User(options.database).updateOne(
      { _id: id },
      {
        firstName: data.firstName || currentUser.firstName,
        lastName: data.lastName || currentUser.lastName,
        fullName: data.fullName || currentUser.fullName,
        phoneNumber: data.phoneNumber || currentUser.phoneNumber,
        updatedBy: currentUser.id,
        avatars: data.avatars || [],
        vip: data.vip || currentUser.vip,
        balance: data.balance,
        erc20: data.erc20 || currentUser.erc20,
        trc20: data.trc20 || currentUser.trc20,
        walletname: data.walletname || currentUser.walletname,
        usernamewallet: data.usernamewallet || currentUser.usernamewallet,
        product: data?.product || currentUser?.product,
      },
      options
    );

    const user = await this.findById(id, options);

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: user,
      },
      options
    );

    return user;
  }

  static async updateSolde(id, data, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);
    // await this.checkSolde(data, options);

    data = this._preSave(data);
    await User(options.database).updateOne(
      { _id: id },
      {
        firstName: data.firstName || currentUser.firstName,
        lastName: data.lastName || currentUser.lastName,
        fullName: data.fullName || currentUser.fullName,
        phoneNumber: data.phoneNumber || currentUser.phoneNumber,
        updatedBy: currentUser.id,
        avatars: data.avatars || [],
        vip: data.vip || currentUser.vip,
        balance: data.balances,
        erc20: data.erc20 || currentUser.erc20,
        trc20: data.trc20 || currentUser.trc20,
        walletname: data.walletname || currentUser.walletname,
        usernamewallet: data.usernamewallet || currentUser.usernamewallet,
        product: data?.product,
      },
      options
    );

    const user = await this.findById(id, options);

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: user,
      },
      options
    );

    return user;
  }

  static async updateBalance(data, options) {
    const currentUser = await MongooseRepository.getCurrentUser(options);

    const currentBalance = currentUser.balance;
    const currentVip = currentUser.vip.id;

    if (!data) return;
  }

  static async checkSolde(data, options) {
    const currentUser = await MongooseRepository.getCurrentUser(options);

    const currentBalance = currentUser.balance;
    const currentVip = currentUser.vip.id;

    if (!data?.vip?.id) return;

    if (currentVip === data?.vip?.id) {
      throw new Error405("You are ready subscribed to this vip");
    }
    if (currentBalance < data?.vip?.levellimit) {
      throw new Error405("Insufficient balance please upgrade");
    }
  }

  static async generateEmailVerificationToken(
    email,
    options: IRepositoryOptions
  ) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    const { id } = await this.findByEmailWithoutAvatar(email, options);

    const emailVerificationToken = crypto.randomBytes(20).toString("hex");
    const emailVerificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await User(options.database).updateOne(
      { _id: id },
      {
        emailVerificationToken,
        emailVerificationTokenExpiresAt,
        updatedBy: currentUser.id,
      },
      options
    );

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: {
          id,
          emailVerificationToken,
          emailVerificationTokenExpiresAt,
        },
      },
      options
    );

    return emailVerificationToken;
  }

  static async generatePasswordResetToken(email, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    const { id } = await this.findByEmailWithoutAvatar(email, options);

    const passwordResetToken = crypto.randomBytes(20).toString("hex");
    const passwordResetTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;

    await User(options.database).updateOne(
      { _id: id },
      {
        passwordResetToken,
        passwordResetTokenExpiresAt,
        updatedBy: currentUser.id,
      },
      options
    );

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: {
          id,
          passwordResetToken,
          passwordResetTokenExpiresAt,
        },
      },
      options
    );

    return passwordResetToken;
  }

  static async findByEmail(email, options: IRepositoryOptions) {
    const record = await this.findByEmailWithoutAvatar(email, options);
    return await this._fillRelationsAndFileDownloadUrls(record, options);
  }

  static async findByEmailWithoutAvatar(email, options: IRepositoryOptions) {
    return MongooseRepository.wrapWithSessionIfExists(
      User(options.database)
        .findOne({
          email: {
            $regex: new RegExp(`^${MongooseQueryUtils.escapeRegExp(email)}$`),
            $options: "i",
          },
        })
        .populate("tenants.tenant"),
      options
    );
  }

  static async findAndCountAll(
    { filter, limit = 0, offset = 0, orderBy = "" },
    options: IRepositoryOptions
  ) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: any = [];

    criteriaAnd.push({
      tenants: { $elemMatch: { tenant: currentTenant.id } },
    });

    if (filter) {
      if (filter.id) {
        criteriaAnd.push({
          ["_id"]: MongooseQueryUtils.uuid(filter.id),
        });
      }

      if (filter.fullName) {
        criteriaAnd.push({
          ["fullName"]: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.fullName),
            $options: "i",
          },
        });
      }

      if (filter.email) {
        criteriaAnd.push({
          ["email"]: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.email),
            $options: "i",
          },
        });
      }

      if (filter.role) {
        criteriaAnd.push({
          tenants: { $elemMatch: { roles: filter.role } },
        });
      }

      if (filter.invitationcode) {
        criteriaAnd.push({
          ["invitationcode"]: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.invitationcode),
            $options: "i",
          },
        });
      }

      if (filter.status) {
        criteriaAnd.push({
          tenants: {
            $elemMatch: { status: filter.status },
          },
        });
      }

      if (filter.createdAtRange) {
        const [start, end] = filter.createdAtRange;

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

    let rows = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database)
        .find(criteria)
        .skip(skip)
        .limit(limitEscaped)
        .sort(sort)
        .populate("tenants.tenant")
        .populate("vip")
        .populate("product"),
      options
    );

    const count = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).countDocuments(criteria),
      options
    );

    rows = this._mapUserForTenantForRows(rows, currentTenant);
    rows = await Promise.all(
      rows.map((row) => this._fillRelationsAndFileDownloadUrls(row, options))
    );

    return { rows, count };
  }

  static async filterIdInTenant(id, options: IRepositoryOptions) {
    return lodash.get(await this.filterIdsInTenant([id], options), "[0]", null);
  }

  static async filterIdsInTenant(ids, options: IRepositoryOptions) {
    if (!ids || !ids.length) {
      return ids;
    }

    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let users = await User(options.database)
      .find({
        _id: {
          $in: ids,
        },
        tenants: {
          $elemMatch: { tenant: currentTenant.id },
        },
      })
      .select(["_id"]);

    return users.map((user) => user._id);
  }

  static cleanupForRelationships(userOrUsers) {
    if (!userOrUsers) {
      return userOrUsers;
    }

    if (Array.isArray(userOrUsers)) {
      return userOrUsers.map((user) =>
        lodash.pick(user, ["_id", "id", "firstName", "lastName", "email"])
      );
    }

    return lodash.pick(userOrUsers, [
      "_id",
      "id",
      "firstName",
      "lastName",
      "email",
    ]);
  }

  static async findAllAutocomplete(search, limit, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: Array<any> = [
      {
        tenants: {
          $elemMatch: { tenant: currentTenant.id },
        },
      },
    ];

    if (search) {
      criteriaAnd.push({
        $or: [
          {
            _id: MongooseQueryUtils.uuid(search),
          },
          {
            fullName: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
          {
            email: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
        ],
      });
    }

    const sort = MongooseQueryUtils.sort("fullName_ASC");
    const limitEscaped = Number(limit || 0) || undefined;

    const criteria = { $and: criteriaAnd };

    let users = await User(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    users = this._mapUserForTenantForRows(users, currentTenant);

    const buildText = (user) => {
      if (!user.fullName) {
        return user.email;
      }

      return `${user.fullName} <${user.email}>`;
    };

    return users.map((user) => ({
      id: user.id,
      label: buildText(user),
    }));
  }

  static async findByIdWithPassword(id, options: IRepositoryOptions) {
    return await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findById(id).populate("tenants.tenant"),
      options
    );
  }

  static async findById(id, options: IRepositoryOptions) {
    let record = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database)
        .findById(id)
        .populate("tenants.tenant")
        .populate("vip")
        .populate("product"),
      options
    );

    if (!record) {
      throw new Error404();
    }


   
    
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    if (!options || !options.bypassPermissionValidation) {
      if (!isUserInTenant(record, currentTenant.id)) {
        throw new Error404();
      }
      record = this._mapUserForTenant(record, currentTenant);
    }

    record = await this._fillRelationsAndFileDownloadUrls(record, options);


    return record;
  }

  static async checkRefcode( refcode, options: IRepositoryOptions) {
    const checkref = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findOne({
        refcode: refcode
        
      }),
      options
    );
    
    if (!checkref) {
      return null;
    }
    return true
  }

  static async findPassword(id, options: IRepositoryOptions) {
    let record = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findById(id).select("+password"),
      options
    );

    if (!record) {
      return null;
    }

    return record.password;
  }

  static async findByIdWithoutAvatar(id, options: IRepositoryOptions) {
    return this.findById(id, options);
  }

  static async Destroy(id, options) {
    return User(options.database).deleteOne({ _id: id });
  }

  /**
   * Finds the user by the password token if not expired.
   */
  static async findByPasswordResetToken(token, options: IRepositoryOptions) {
    return MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findOne({
        passwordResetToken: token,
        passwordResetTokenExpiresAt: { $gt: Date.now() },
      }),
      options
    );
  }

  /**
   * Finds the user by the email verification token if not expired.
   */
  static async findByEmailVerificationToken(
    token,
    options: IRepositoryOptions
  ) {
    return MongooseRepository.wrapWithSessionIfExists(
      User(options.database).findOne({
        emailVerificationToken: token,
        emailVerificationTokenExpiresAt: {
          $gt: Date.now(),
        },
      }),
      options
    );
  }

  static async markEmailVerified(id, options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);

    await User(options.database).updateOne(
      { _id: id },
      {
        emailVerified: true,
        updatedBy: currentUser.id,
      },
      options
    );

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: id,
        action: AuditLogRepository.UPDATE,
        values: {
          emailVerified: true,
        },
      },
      options
    );

    return true;
  }

  static async count(filter, options: IRepositoryOptions) {
    return MongooseRepository.wrapWithSessionIfExists(
      User(options.database).countDocuments(filter),
      options
    );
  }

  /**
   * Normalize the user fields.
   */
  static _preSave(data) {
    if (data.firstName || data.lastName) {
      data.fullName = `${(data.firstName || "").trim()} ${(
        data.lastName || ""
      ).trim()}`.trim();
    }

    data.email = data.email ? data.email.trim() : null;

    data.firstName = data.firstName ? data.firstName.trim() : null;

    data.lastName = data.lastName ? data.lastName.trim() : null;

    return data;
  }

  /**
   * Maps the users data to show only the current tenant related info
   */
  static _mapUserForTenantForRows(rows, tenant) {
    if (!rows) {
      return rows;
    }

    return rows.map((record) => this._mapUserForTenant(record, tenant));
  }

  /**
   * Maps the user data to show only the current tenant related info
   */
  static _mapUserForTenant(user, tenant) {
    if (!user || !user.tenants) {
      return user;
    }

    const tenantUser = user.tenants.find(
      (tenantUser) =>
        tenantUser &&
        tenantUser.tenant &&
        String(tenantUser.tenant.id) === String(tenant.id)
    );

    delete user.tenants;

    const status = tenantUser ? tenantUser.status : null;
    const roles = tenantUser ? tenantUser.roles : [];

    // If the user is only invited,
    // tenant members can only see its email
    const otherData = status === "active" ? user.toObject() : {};

    return {
      ...otherData,
      id: user.id,
      email: user.email,
      phoneNumber: user.phoneNumber,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      passportNumber: user.passportNumber,
      country: user.country,
      withdrawPassword: user.withdrawPassword,
      balance: user.balance,
      invitationcode: user.invitationcode,
      nationality: user.nationality,
      refcode: user.refcode,
      roles,
      status,
    };
  }
  static async findByRoleAutocomplete(
    search,
    limit,
    options: IRepositoryOptions
  ) {
    const currentTenant1 = MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: Array<any> = [
      {
        tenants: {
          $elemMatch: { tenant: currentTenant1.id },
        },
      },
    ];
    if (search) {
      criteriaAnd.push({
        $or: [
          {
            _id: MongooseQueryUtils.uuid(search),
          },
          {
            fullName: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
          {
            email: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
        ],
      });
    }

    const sort = MongooseQueryUtils.sort("fullName_ASC");
    const limitEscaped = Number(limit || 0) || undefined;

    const criteria = { $and: criteriaAnd };

    let users = await User(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    users = this._mapUserForTenantForRows(users, currentTenant1);

    const buildText = (user) => {
      if (!user.fullName) {
        return user.email;
      }

      return `${user.fullName} <${user.email}>`;
    };

    return users.map((user) => ({
      id: user.id,
      label: buildText(user),
    }));
  }

  static async _fillRelationsAndFileDownloadUrls(
    record,
    options: IRepositoryOptions
  ) {
    if (!record) {
      return null;
    }

    const output = record.toObject ? record.toObject() : record;

    if (output.tenants && output.tenants.length) {
      await Promise.all(
        output.tenants.map(async (userTenant) => {
          userTenant.tenant.settings = await SettingsRepository.find({
            currentTenant: userTenant.tenant,
            ...options,
          });
        })
      );
    }

    output.avatars = await FileRepository.fillDownloadUrl(output.avatars);
    output.passportPhoto = await FileRepository.fillDownloadUrl(
      output.passportPhoto
    );
    output.passportDocument = await FileRepository.fillDownloadUrl(
      output.passportDocument
    );
    return output;
  }

  static async createFromSocial(
    provider,
    providerId,
    email,
    emailVerified,
    firstName,
    lastName,
    options
  ) {
    let data = {
      email,
      emailVerified,
      providerId,
      provider,
      firstName,
      lastName,
    };

    data = this._preSave(data);

    let [user] = await User(options.database).create([data], options);

    await AuditLogRepository.log(
      {
        entityName: "user",
        entityId: user.id,
        action: AuditLogRepository.CREATE,
        values: user,
      },
      options
    );

    return this.findById(user.id, {
      ...options,
      bypassPermissionValidation: true,
    });
  }

  static async CountUser(options: IRepositoryOptions) {
    let rows = await User(options.database).aggregate([
      { $group: { _id: null, count: { $sum: 1 } } },
    ]);
    return rows;
  }

  static async CountUsers(options: IRepositoryOptions) {
    const count = await MongooseRepository.wrapWithSessionIfExists(
      User(options.database).countDocuments(),
      options
    );

    return count
  }
}
