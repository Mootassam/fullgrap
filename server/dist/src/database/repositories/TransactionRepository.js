"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongooseRepository_1 = __importDefault(require("./mongooseRepository"));
const mongooseQueryUtils_1 = __importDefault(require("../utils/mongooseQueryUtils"));
const auditLogRepository_1 = __importDefault(require("./auditLogRepository"));
const Error404_1 = __importDefault(require("../../errors/Error404"));
const fileRepository_1 = __importDefault(require("./fileRepository"));
const transaction_1 = __importDefault(require("../models/transaction"));
const user_1 = __importDefault(require("../models/user"));
class TransactionRepository {
    static create(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const [record] = yield transaction_1.default(options.database).create([
                Object.assign(Object.assign({}, data), { tenant: currentTenant.id, createdBy: currentUser.id, updatedBy: currentUser.id }),
            ], options);
            yield this._createAuditLog(auditLogRepository_1.default.CREATE, record.id, data, options);
            return this.findById(record.id, options);
        });
    }
    static update(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(transaction_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield transaction_1.default(options.database).updateOne({ _id: id }, Object.assign(Object.assign({}, data), { updatedBy: mongooseRepository_1.default.getCurrentUser(options).id }), options);
            yield this._createAuditLog(auditLogRepository_1.default.UPDATE, id, data, options);
            record = yield this.findById(id, options);
            return record;
        });
    }
    static destroy(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(transaction_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield transaction_1.default(options.database).deleteOne({ _id: id }, options);
            yield this._createAuditLog(auditLogRepository_1.default.DELETE, id, record, options);
        });
    }
    static count(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            return mongooseRepository_1.default.wrapWithSessionIfExists(transaction_1.default(options.database).countDocuments(Object.assign(Object.assign({}, filter), { tenant: currentTenant.id })), options);
        });
    }
    static findById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(transaction_1.default(options.database).findById(id).populate("user"), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            return this._fillFileDownloadUrls(record);
        });
    }
    static findAndCountAll({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            let criteriaAnd = [];
            // Base tenant filter (always applied)
            criteriaAnd.push({
                tenant: currentTenant.id,
            });
            // Determine user's role within this tenant
            const tenantMembership = (_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.tenants) === null || _a === void 0 ? void 0 : _a.find((tenantUser) => {
                var _a, _b;
                const tenantId = ((_a = tenantUser.tenant) === null || _a === void 0 ? void 0 : _a._id) || tenantUser.tenant;
                return (tenantId === null || tenantId === void 0 ? void 0 : tenantId.toString()) === ((_b = currentTenant.id) === null || _b === void 0 ? void 0 : _b.toString());
            });
            const userRole = ((_b = tenantMembership === null || tenantMembership === void 0 ? void 0 : tenantMembership.roles) === null || _b === void 0 ? void 0 : _b[0]) || "member"; // default to member
            // Apply role-based filtering on transactions.user field
            if (userRole === "admin") {
                // Admin sees all transactions – no additional user filter
                // (only tenant filter applies)
            }
            else if (userRole === "agent") {
                // Agent sees their own + downline users' transactions
                if (currentUser === null || currentUser === void 0 ? void 0 : currentUser.refcode) {
                    const referralUserIds = yield this.getAllReferralUserIds(currentUser.refcode, options);
                    referralUserIds.push(currentUser._id);
                    criteriaAnd.push({
                        user: { $in: referralUserIds }
                    });
                }
                else {
                    // Agent without refcode sees only themselves
                    criteriaAnd.push({
                        user: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id
                    });
                }
            }
            else {
                // Member (default) sees only their own transactions
                criteriaAnd.push({
                    user: currentUser === null || currentUser === void 0 ? void 0 : currentUser._id
                });
            }
            // Apply additional filters if provided
            if (filter) {
                if (filter.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
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
                        const referralUserIds = yield this.getAllReferralUserIds(currentUser.refcode, options);
                        referralUserIds.push(currentUser._id);
                        if (referralUserIds.includes(filter.user)) {
                            criteriaAnd.push({ user: filter.user });
                        }
                        else {
                            return { rows: [], count: 0 };
                        }
                    }
                    // For member: only allow filtering to themselves
                    else {
                        if (filter.user.toString() === (currentUser === null || currentUser === void 0 ? void 0 : currentUser._id.toString())) {
                            criteriaAnd.push({ user: filter.user });
                        }
                        else {
                            return { rows: [], count: 0 };
                        }
                    }
                }
                if (filter.amount) {
                    criteriaAnd.push({
                        amount: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.amount),
                            $options: "i",
                        },
                    });
                }
                if (filter.status) {
                    criteriaAnd.push({
                        status: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.status),
                            $options: "i",
                        },
                    });
                }
                if (filter.type) {
                    criteriaAnd.push({
                        type: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.type),
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
                    const amountFilter = {};
                    if (filter.amountMin !== undefined) {
                        amountFilter.$gte = parseFloat(filter.amountMin);
                    }
                    if (filter.amountMax !== undefined) {
                        amountFilter.$lte = parseFloat(filter.amountMax);
                    }
                    criteriaAnd.push({ amount: amountFilter });
                }
            }
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let rows = yield transaction_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("user");
            const count = yield transaction_1.default(options.database).countDocuments(criteria);
            rows = yield Promise.all(rows.map(this._fillFileDownloadUrls));
            return { rows, count };
        });
    }
    /**
     * Get ALL user IDs in the complete referral tree (all levels)
     * @param {string} refcode - The reference code to start from
     * @param {IRepositoryOptions} options - Repository options
     * @returns {Promise<Array>} - Array of user IDs in the referral tree
     */
    static getAllReferralUserIds(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const allUserIds = [];
            const processedRefcodes = new Set(); // Track processed refcodes to avoid cycles
            const queue = [refcode]; // Queue for BFS traversal
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            while (queue.length > 0) {
                const currentRefcode = queue.shift();
                // Skip if we've already processed this refcode
                if (!currentRefcode || processedRefcodes.has(currentRefcode)) {
                    continue;
                }
                processedRefcodes.add(currentRefcode);
                // Find all users who used this refcode as their invitation code
                const referrals = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                    .find({
                    invitationcode: currentRefcode,
                    tenants: { $elemMatch: { tenant: currentTenant.id } }
                })
                    .select('_id refcode invitationcode')
                    .lean(), options);
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
        });
    }
    /**
     * Alternative: Get all users in referral chain with their details
     * Useful if you need user information for additional filtering
     */
    static getAllReferralUsers(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const allUsers = [];
            const processedRefcodes = new Set();
            const queue = [refcode];
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            while (queue.length > 0) {
                const currentRefcode = queue.shift();
                if (!currentRefcode || processedRefcodes.has(currentRefcode)) {
                    continue;
                }
                processedRefcodes.add(currentRefcode);
                const referrals = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                    .find({
                    invitationcode: currentRefcode,
                    tenants: { $elemMatch: { tenant: currentTenant.id } }
                })
                    .select('_id refcode invitationcode fullName email balance')
                    .lean(), options);
                for (const referral of referrals) {
                    allUsers.push(referral);
                    if (referral.refcode) {
                        queue.push(referral.refcode);
                    }
                }
            }
            return allUsers;
        });
    }
    /**
     * Check if a user is an admin for the current tenant
     */
    static isUserAdmin(userId, tenantId, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
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
                .select('_id'), options);
            return !!user;
        });
    }
    /**
     * Get transaction summary for referral chain (optional helper method)
     */
    static getReferralTransactionSummary(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const referralUserIds = yield this.getAllReferralUserIds(refcode, options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            // Include current user
            if (currentUser) {
                referralUserIds.push(currentUser._id);
            }
            const summary = yield transaction_1.default(options.database).aggregate([
                {
                    $match: {
                        user: { $in: referralUserIds },
                        tenant: mongooseRepository_1.default.getCurrentTenant(options).id
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
        });
    }
    static findAndCountByUser({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            let criteriaAnd = [];
            const search = filter;
            criteriaAnd.push({
                tenant: currentTenant.id,
                user: currentUser.id,
            });
            if (search) {
                if (search.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
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
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.amount),
                            $options: "i",
                        },
                    });
                }
                if (search.status) {
                    criteriaAnd.push({
                        status: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.status),
                            $options: "i",
                        },
                    });
                }
                if (search.type) {
                    criteriaAnd.push({
                        type: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(search.type),
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
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let rows = yield transaction_1.default(options.database)
                .find(criteria)
                // .skip(skip)
                // .limit(limitEscaped)
                .sort(sort)
                .populate("user");
            const count = yield transaction_1.default(options.database).countDocuments(criteria);
            rows = yield Promise.all(rows.map(this._fillFileDownloadUrls));
            return { rows, count };
        });
    }
    static findAllAutocomplete(search, limit, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [
                {
                    tenant: currentTenant.id,
                },
            ];
            if (search) {
                criteriaAnd.push({
                    $or: [
                        {
                            _id: mongooseQueryUtils_1.default.uuid(search),
                        },
                        {
                            titre: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                    ],
                });
            }
            const sort = mongooseQueryUtils_1.default.sort("titre_ASC");
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = { $and: criteriaAnd };
            const records = yield transaction_1.default(options.database)
                .find(criteria)
                .limit(limitEscaped)
                .sort(sort);
            return records.map((record) => ({
                id: record.id,
                label: record.titre,
            }));
        });
    }
    static _createAuditLog(action, id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield auditLogRepository_1.default.log({
                entityName: transaction_1.default(options.database).modelName,
                entityId: id,
                action,
                values: data,
            }, options);
        });
    }
    static _fillFileDownloadUrls(record) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!record) {
                return null;
            }
            const output = record.toObject ? record.toObject() : record;
            output.photo = yield fileRepository_1.default.fillDownloadUrl(output.photo);
            return output;
        });
    }
}
exports.default = TransactionRepository;
//# sourceMappingURL=TransactionRepository.js.map