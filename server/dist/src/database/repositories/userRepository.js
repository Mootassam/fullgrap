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
const user_1 = __importDefault(require("../models/user"));
const auditLogRepository_1 = __importDefault(require("./auditLogRepository"));
const mongooseQueryUtils_1 = __importDefault(require("../utils/mongooseQueryUtils"));
const fileRepository_1 = __importDefault(require("./fileRepository"));
const crypto_1 = __importDefault(require("crypto"));
const Error404_1 = __importDefault(require("../../errors/Error404"));
const settingsRepository_1 = __importDefault(require("./settingsRepository"));
const userTenantUtils_1 = require("../utils/userTenantUtils");
const lodash_1 = __importDefault(require("lodash"));
const vip_1 = __importDefault(require("../models/vip"));
const Error400_1 = __importDefault(require("../../errors/Error400"));
const axios_1 = __importDefault(require("axios"));
const company_1 = __importDefault(require("../models/company"));
class UserRepository {
    static create(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            data = this._preSave(data);
            const [user] = yield user_1.default(options.database).create([
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
            ], options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: user.id,
                action: auditLogRepository_1.default.CREATE,
                values: user,
            }, options);
            return this.findById(user.id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
        });
    }
    static createUniqueRefCode(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let code;
            let exists = true;
            while (exists) {
                code = this.generateRefCode();
                exists = yield user_1.default(options.database).exists({ refCode: code });
            }
            return code;
        });
    }
    static generateRefCode() {
        return __awaiter(this, void 0, void 0, function* () {
            const prefix = "NO";
            const randomPart = Math.floor(1000 + Math.random() * 9000); // 6 digits
            return `${prefix}${randomPart}`;
        });
    }
    static updateUser(tenantId, id, fullName, phoneNumber, passportNumber, nationality, country, passportPhoto, balance, minbalance, vip, options, status, product, itemNumber, prizes, prizesNumber, withdrawPassword, score, grab, withdraw, freezeblance, preferredcoin, productItemMappings, tasksDone, photoProfile, notification) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findById(id), options);
            yield user_1.default(options.database).updateOne({ _id: id }, {
                $set: {
                    fullName: fullName,
                    phoneNumber: phoneNumber,
                    passportNumber: passportNumber,
                    nationality: nationality,
                    country: country,
                    passportPhoto: passportPhoto,
                    options: options,
                    balance: balance,
                    minbalance: minbalance,
                    vip: vip,
                    product: product,
                    itemNumber: itemNumber,
                    prizes: prizes,
                    prizesNumber: prizesNumber,
                    withdrawPassword: withdrawPassword,
                    score: score,
                    grab: grab,
                    withdraw: withdraw,
                    freezeblance: freezeblance,
                    preferredcoin: preferredcoin,
                    tasksDone: tasksDone,
                    productItemMappings: productItemMappings,
                    photoProfile: photoProfile,
                    notification: notification,
                    $tenant: { status }
                },
            }, options);
        });
    }
    static generateCouponCode() {
        return __awaiter(this, void 0, void 0, function* () {
            const randomNumber = Math.floor(Math.random() * 10000000);
            const randomNumberPadded = randomNumber.toString().padStart(7, "0");
            const randomCode = yield `6L${randomNumberPadded}`;
            return randomCode;
        });
    }
    static getCountry(ip) {
        return __awaiter(this, void 0, void 0, function* () {
            const response = yield axios_1.default.get(`http://ip-api.com/json/${ip}`);
            const data = response.data;
            return data.country; // e.g., "United States"
        });
    }
    static createFromAuth(data, options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            data = this._preSave(data);
            const req = data.req;
            const normalizeIP = (ip) => ip.replace(/^::ffff:/, "");
            const rawIP = ((_a = req.headers["x-forwarded-for"]) === null || _a === void 0 ? void 0 : _a.toString().split(",")[0]) ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress || ((_b = req.connection.socket) === null || _b === void 0 ? void 0 : _b.remoteAddress);
            const clientIP = normalizeIP(rawIP);
            const country = yield this.getCountry(clientIP);
            let [user] = yield user_1.default(options.database).create([
                {
                    email: data.email,
                    password: data.password,
                    phoneNumber: data.phoneNumber,
                    country: country,
                    ipAddress: clientIP,
                    firstName: data.firstName,
                    fullName: data.fullName,
                    withdrawPassword: data.withdrawPassword,
                    invitationcode: data.invitationcode,
                    refcode: yield this.createUniqueRefCode(options),
                    couponcode: yield this.createUniqueRefCode(options),
                },
            ], options);
            delete user.password;
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: user.id,
                action: auditLogRepository_1.default.CREATE,
                values: user,
            }, options);
            return this.findById(user.id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
        });
    }
    static VipLevel(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const sort = mongooseQueryUtils_1.default.sort("createdAt_ASC");
            const skip = Number(0) || undefined;
            const limitEscaped = Number(0) || undefined;
            let rows = yield vip_1.default(options.database)
                .find()
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("members");
            const count = yield vip_1.default(options.database).countDocuments();
            return { rows, count };
        });
    }
    static createFromAuthMobile(data, options) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const vip = yield this.VipLevel(options);
            const id = (_a = vip === null || vip === void 0 ? void 0 : vip.rows[0]) === null || _a === void 0 ? void 0 : _a.id;
            data = this._preSave(data);
            const req = data.req;
            const normalizeIP = (ip) => ip.replace(/^::ffff:/, "");
            const rawIP = ((_b = req.headers["x-forwarded-for"]) === null || _b === void 0 ? void 0 : _b.toString().split(",")[0]) ||
                req.connection.remoteAddress ||
                req.socket.remoteAddress || ((_c = req.connection.socket) === null || _c === void 0 ? void 0 : _c.remoteAddress);
            const clientIP = normalizeIP(rawIP);
            const country = yield this.getCountry(clientIP);
            const defaultBalance = yield company_1.default(options.database).find({});
            let settingsBalance;
            if (defaultBalance.length > 0) {
                settingsBalance = defaultBalance[0].defaultBalance;
            }
            let [user] = yield user_1.default(options.database).create([
                {
                    email: data.email,
                    password: data.password,
                    phoneNumber: data.phoneNumber,
                    ipAddress: clientIP,
                    country: country,
                    firstName: data.firstName,
                    fullName: data.fullName,
                    gender: data.gender,
                    withdrawPassword: data.withdrawPassword,
                    invitationcode: data.invitationcode,
                    refcode: yield this.createUniqueRefCode(options),
                    balance: settingsBalance,
                    vip: id ? id : "",
                },
            ], options);
            delete user.password;
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: user.id,
                action: auditLogRepository_1.default.CREATE,
                values: user,
            }, options);
            return this.findByIdMobile(user.id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
        });
    }
    static updatePassword(id, password, invalidateOldTokens, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const data = {
                password,
                updatedBy: id,
            };
            if (invalidateOldTokens) {
                data.jwtTokenInvalidBefore = new Date();
            }
            yield user_1.default(options.database).updateOne({ _id: id }, data, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: {
                    id,
                    password: "secret",
                },
            }, options);
            return this.findById(id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
        });
    }
    static updateProfile(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            yield this.checkSolde(data, options);
            data = this._preSave(data);
            yield user_1.default(options.database).updateOne({ _id: id }, {
                firstName: data.firstName || currentUser.firstName,
                lastName: data.lastName || currentUser.lastName,
                fullName: data.fullName || currentUser.fullName,
                phoneNumber: data.phoneNumber || currentUser.phoneNumber,
                updatedBy: currentUser.id,
                avatars: data.avatars || [],
                vip: data.vip || currentUser.vip,
                balance: data.balance || currentUser.balance,
                trc20: data.trc20 || currentUser.trc20,
                walletname: data.walletname || currentUser.walletname,
                usernamewallet: data.usernamewallet || currentUser.usernamewallet,
                product: data === null || data === void 0 ? void 0 : data.product,
                itemNumber: data === null || data === void 0 ? void 0 : data.itemNumber,
                preferredcoin: data === null || data === void 0 ? void 0 : data.preferredcoin
            }, options);
            const user = yield this.findById(id, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: user,
            }, options);
            return user;
        });
    }
    static updateProfileGrap(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            // await this.checkSolde(data, options);
            data = this._preSave(data);
            yield user_1.default(options.database).updateOne({ _id: id }, {
                firstName: data.firstName || currentUser.firstName,
                lastName: data.lastName || currentUser.lastName,
                fullName: data.fullName || currentUser.fullName,
                phoneNumber: data.phoneNumber || currentUser.phoneNumber,
                updatedBy: currentUser.id,
                avatars: data.avatars || [],
                vip: data.vip || currentUser.vip,
                balance: data.balance,
                freezeblance: data.freezeblance,
                erc20: data.erc20 || currentUser.erc20,
                trc20: data.trc20 || currentUser.trc20,
                walletname: data.walletname || currentUser.walletname,
                usernamewallet: data.usernamewallet || currentUser.usernamewallet,
                product: (data === null || data === void 0 ? void 0 : data.product) || (currentUser === null || currentUser === void 0 ? void 0 : currentUser.product),
            }, options);
            const user = yield this.findById(id, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: user,
            }, options);
            return user;
        });
    }
    static updateSolde(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            // await this.checkSolde(data, options);
            data = this._preSave(data);
            yield user_1.default(options.database).updateOne({ _id: id }, {
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
                product: data === null || data === void 0 ? void 0 : data.product,
            }, options);
            const user = yield this.findById(id, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: user,
            }, options);
            return user;
        });
    }
    static updateBalance(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = yield mongooseRepository_1.default.getCurrentUser(options);
            const currentBalance = currentUser.balance;
            const currentVip = currentUser.vip.id;
            if (!data)
                return;
        });
    }
    static checkSolde(data, options) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = yield mongooseRepository_1.default.getCurrentUser(options);
            const currentBalance = currentUser.balance;
            const currentVip = currentUser.vip.id;
            if (!((_a = data === null || data === void 0 ? void 0 : data.vip) === null || _a === void 0 ? void 0 : _a.id))
                return;
            if (currentVip === ((_b = data === null || data === void 0 ? void 0 : data.vip) === null || _b === void 0 ? void 0 : _b.id)) {
                throw new Error400_1.default(options.language, "validation.duplicateSubsctription");
            }
            if (currentBalance < ((_c = data === null || data === void 0 ? void 0 : data.vip) === null || _c === void 0 ? void 0 : _c.levellimit)) {
                throw new Error400_1.default(options.language, "validation.InsufficientBalance");
            }
        });
    }
    static generateEmailVerificationToken(email, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const { id } = yield this.findByEmailWithoutAvatar(email, options);
            const emailVerificationToken = crypto_1.default.randomBytes(20).toString("hex");
            const emailVerificationTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
            yield user_1.default(options.database).updateOne({ _id: id }, {
                emailVerificationToken,
                emailVerificationTokenExpiresAt,
                updatedBy: currentUser.id,
            }, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: {
                    id,
                    emailVerificationToken,
                    emailVerificationTokenExpiresAt,
                },
            }, options);
            return emailVerificationToken;
        });
    }
    static generatePasswordResetToken(email, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const { id } = yield this.findByEmailWithoutAvatar(email, options);
            const passwordResetToken = crypto_1.default.randomBytes(20).toString("hex");
            const passwordResetTokenExpiresAt = Date.now() + 24 * 60 * 60 * 1000;
            yield user_1.default(options.database).updateOne({ _id: id }, {
                passwordResetToken,
                passwordResetTokenExpiresAt,
                updatedBy: currentUser.id,
            }, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: {
                    id,
                    passwordResetToken,
                    passwordResetTokenExpiresAt,
                },
            }, options);
            return passwordResetToken;
        });
    }
    static findByEmail(email, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const record = yield this.findByEmailWithoutAvatar(email, options);
            return yield this._fillRelationsAndFileDownloadUrls(record, options);
        });
    }
    static findByEmailWithoutAvatar(email, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                .findOne({
                email: {
                    $regex: new RegExp(`^${mongooseQueryUtils_1.default.escapeRegExp(email)}$`),
                    $options: "i",
                },
            })
                .populate("tenants.tenant"), options);
        });
    }
    static findAndCountAll({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [];
            criteriaAnd.push({
                tenants: { $elemMatch: { tenant: currentTenant.id } },
            });
            if (filter) {
                if (filter.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
                    });
                }
                if (filter.fullName) {
                    criteriaAnd.push({
                        ["fullName"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.fullName),
                            $options: "i",
                        },
                    });
                }
                if (filter.email) {
                    criteriaAnd.push({
                        ["email"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.email),
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
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.invitationcode),
                            $options: "i",
                        },
                    });
                }
                if (filter.couponcode) {
                    criteriaAnd.push({
                        ["couponcode"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.couponcode),
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
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let rows = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("tenants.tenant")
                .populate("vip")
                .populate("product")
                .populate("prizes"), options);
            const count = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).countDocuments(criteria), options);
            rows = this._mapUserForTenantForRows(rows, currentTenant);
            rows = yield Promise.all(rows.map((row) => this._fillRelationsAndFileDownloadUrls(row, options)));
            return { rows, count };
        });
    }
    static findReferralChain({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            let criteriaAnd = [];
            // Base tenant filter
            criteriaAnd.push({
                tenants: { $elemMatch: { tenant: currentTenant.id } },
            });
            // Add referral chain filter for current user
            if (currentUser && currentUser.refcode) {
                // Get ALL users in the complete referral tree (all levels)
                const allReferralUserIds = yield this.getAllReferralUserIds(currentUser.refcode, options);
                if (allReferralUserIds.length > 0) {
                    criteriaAnd.push({
                        _id: { $in: allReferralUserIds }
                    });
                }
                else {
                    // No referrals found, return empty result
                    return { rows: [], count: 0 };
                }
            }
            // Apply additional filters if provided
            if (filter) {
                if (filter.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
                    });
                }
                if (filter.fullName) {
                    criteriaAnd.push({
                        ["fullName"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.fullName),
                            $options: "i",
                        },
                    });
                }
                if (filter.email) {
                    criteriaAnd.push({
                        ["email"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.email),
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
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.invitationcode),
                            $options: "i",
                        },
                    });
                }
                if (filter.couponcode) {
                    criteriaAnd.push({
                        ["couponcode"]: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.couponcode),
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
                // Add balance range filter
                if (filter.balanceMin !== undefined || filter.balanceMax !== undefined) {
                    const balanceFilter = {};
                    if (filter.balanceMin !== undefined) {
                        balanceFilter.$gte = filter.balanceMin;
                    }
                    if (filter.balanceMax !== undefined) {
                        balanceFilter.$lte = filter.balanceMax;
                    }
                    criteriaAnd.push({ balance: balanceFilter });
                }
                // Add VIP level filter
                if (filter.vipLevel) {
                    criteriaAnd.push({
                        vip: filter.vipLevel,
                    });
                }
            }
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let rows = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("tenants.tenant")
                .populate("vip")
                .populate("product")
                .populate("prizes"), options);
            const count = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).countDocuments(criteria), options);
            rows = this._mapUserForTenantForRows(rows, currentTenant);
            rows = yield Promise.all(rows.map((row) => this._fillRelationsAndFileDownloadUrls(row, options)));
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
                if (processedRefcodes.has(currentRefcode)) {
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
     * Alternative method using aggregation pipeline for better performance with large datasets
     * This method returns the complete user objects instead of just IDs
     */
    static getAllReferralUsers(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const allUsers = [];
            const processedRefcodes = new Set();
            const queue = [refcode];
            while (queue.length > 0) {
                const currentRefcode = queue.shift();
                if (processedRefcodes.has(currentRefcode)) {
                    continue;
                }
                processedRefcodes.add(currentRefcode);
                // Find all users who used this refcode as their invitation code
                const referrals = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                    .find({
                    invitationcode: currentRefcode,
                    tenants: { $elemMatch: { tenant: currentTenant.id } }
                })
                    .populate("tenants.tenant")
                    .populate("vip")
                    .populate("product")
                    .populate("prizes")
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
     * Advanced: Using MongoDB aggregation with $graphLookup for better performance
     * Use this method if you have a very large referral tree
     */
    static getAllReferralUserIdsAggregation(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const pipeline = [
                // Start with the root user
                {
                    $match: {
                        refcode: refcode,
                        tenants: { $elemMatch: { tenant: currentTenant.id } }
                    }
                },
                // Use graphLookup to find all descendants
                {
                    $graphLookup: {
                        from: "users",
                        startWith: "$refcode",
                        connectFromField: "refcode",
                        connectToField: "invitationcode",
                        as: "allDescendants",
                        maxDepth: 20,
                        depthField: "level"
                    }
                },
                // Unwind the descendants array
                {
                    $unwind: {
                        path: "$allDescendants",
                        preserveNullAndEmptyArrays: false
                    }
                },
                // Replace root with the descendant
                {
                    $replaceRoot: {
                        newRoot: "$allDescendants"
                    }
                },
                // Filter to ensure tenant isolation
                {
                    $match: {
                        tenants: { $elemMatch: { tenant: currentTenant.id } }
                    }
                },
                // Group by _id to remove duplicates
                {
                    $group: {
                        _id: "$_id",
                        userId: { $first: "$_id" }
                    }
                },
                // Replace root with just the user ID
                {
                    $replaceRoot: {
                        newRoot: {
                            _id: "$userId"
                        }
                    }
                }
            ];
            const results = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).aggregate(pipeline), options);
            // Extract just the user IDs
            return results.map(result => result._id);
        });
    }
    static filterIdInTenant(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return lodash_1.default.get(yield this.filterIdsInTenant([id], options), "[0]", null);
        });
    }
    static filterIdsInTenant(ids, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!ids || !ids.length) {
                return ids;
            }
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let users = yield user_1.default(options.database)
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
        });
    }
    static cleanupForRelationships(userOrUsers) {
        if (!userOrUsers) {
            return userOrUsers;
        }
        if (Array.isArray(userOrUsers)) {
            return userOrUsers.map((user) => lodash_1.default.pick(user, ["_id", "id", "firstName", "lastName", "email"]));
        }
        return lodash_1.default.pick(userOrUsers, [
            "_id",
            "id",
            "firstName",
            "lastName",
            "email",
        ]);
    }
    static findAllAutocomplete(search, limit, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [
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
                            _id: mongooseQueryUtils_1.default.uuid(search),
                        },
                        {
                            fullName: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                        {
                            email: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                    ],
                });
            }
            const sort = mongooseQueryUtils_1.default.sort("fullName_ASC");
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = { $and: criteriaAnd };
            let users = yield user_1.default(options.database)
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
        });
    }
    static findByIdWithPassword(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findById(id).populate("tenants.tenant"), options);
        });
    }
    static findById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                .findById(id)
                .populate("tenants.tenant")
                .populate("vip")
                .populate("productItemMappings.productId")
                .populate("prizes"), options);
            if (!record) {
                throw new Error404_1.default();
            }
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            if (!options || !options.bypassPermissionValidation) {
                if (!userTenantUtils_1.isUserInTenant(record, currentTenant.id)) {
                    throw new Error404_1.default();
                }
                record = this._mapUserForTenant(record, currentTenant);
            }
            record = yield this._fillRelationsAndFileDownloadUrls(record, options);
            return record;
        });
    }
    static findByIdMobile(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database)
                .findById(id)
                .populate("tenants.tenant")
                .populate("vip")
                .populate("product")
                .populate("prizes"), options);
            if (!record) {
                throw new Error404_1.default();
            }
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            if (!options || !options.bypassPermissionValidation) {
                if (!userTenantUtils_1.isUserInTenant(record, currentTenant.id)) {
                    throw new Error404_1.default();
                }
                record = this._mapUserForTenantMobile(record, currentTenant);
            }
            record = yield this._fillRelationsAndFileDownloadUrls(record, options);
            return record;
        });
    }
    static checkRefcode(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const checkref = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findOne({
                refcode: refcode,
            }), options);
            if (!checkref) {
                return null;
            }
            return true;
        });
    }
    static findPassword(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findById(id).select("+password"), options);
            if (!record) {
                return null;
            }
            return record.password;
        });
    }
    static findByIdWithoutAvatar(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return this.findById(id, options);
        });
    }
    static Destroy(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return user_1.default(options.database).deleteOne({ _id: id });
        });
    }
    static destroyWithAllRelations(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield this.findById(id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
            if (!user) {
                return;
            }
            // Delete all related records across all models
            const database = options.database;
            // Delete records (tasks)
            yield database.model('records').deleteMany({ user: id }, options);
            // Delete transactions
            yield database.model('transaction').deleteMany({ user: id }, options);
            // Delete notifications
            yield database.model('notification').deleteMany({ user: id }, options);
            // Delete mouvements
            yield database.model('mouvements').deleteMany({ createdBy: id }, options);
            // Delete dons
            yield database.model('dons').deleteMany({ adherent: id }, options);
            yield database.model('dons').deleteMany({ createdBy: id }, options);
            // Delete historiquePoints
            yield database.model('historiquePoints').deleteMany({ user: id }, options);
            // Delete votes
            yield database.model('votes').deleteMany({ user: id }, options);
            // Delete company records
            yield database.model('company').deleteMany({ createdBy: id }, options);
            // Delete products
            yield database.model('product').deleteMany({ createdBy: id }, options);
            // Delete categories
            yield database.model('category').deleteMany({ createdBy: id }, options);
            // Remove user from tenantUsers (tenants array)
            yield database.model('user').updateOne({ _id: id }, { $set: { tenants: [] } }, options);
            // Finally delete the user
            yield user_1.default(database).deleteOne({ _id: id }, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.DELETE,
                values: { email: user.email },
            }, options);
        });
    }
    /**
     * Finds the user by the password token if not expired.
     */
    static findByPasswordResetToken(token, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findOne({
                passwordResetToken: token,
                passwordResetTokenExpiresAt: { $gt: Date.now() },
            }), options);
        });
    }
    /**
     * Finds the user by the email verification token if not expired.
     */
    static findByEmailVerificationToken(token, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).findOne({
                emailVerificationToken: token,
                emailVerificationTokenExpiresAt: {
                    $gt: Date.now(),
                },
            }), options);
        });
    }
    static markEmailVerified(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            yield user_1.default(options.database).updateOne({ _id: id }, {
                emailVerified: true,
                updatedBy: currentUser.id,
            }, options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: id,
                action: auditLogRepository_1.default.UPDATE,
                values: {
                    emailVerified: true,
                },
            }, options);
            return true;
        });
    }
    static count(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            return mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).countDocuments(filter), options);
        });
    }
    /**
     * Normalize the user fields.
     */
    static _preSave(data) {
        if (data.firstName || data.lastName) {
            data.fullName = `${(data.firstName || "").trim()} ${(data.lastName || "").trim()}`.trim();
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
        const tenantUser = user.tenants.find((tenantUser) => tenantUser &&
            tenantUser.tenant &&
            String(tenantUser.tenant.id) === String(tenant.id));
        delete user.tenants;
        const status = tenantUser ? tenantUser.status : "active";
        const roles = tenantUser ? tenantUser.roles : ["member"];
        // If the user is only invited,
        // tenant members can only see its email
        const otherData = status === "active" ? user.toObject() : {};
        return Object.assign(Object.assign({}, otherData), { id: user.id, email: user.email, phoneNumber: user.phoneNumber, firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, passportNumber: user.passportNumber, country: user.country, withdrawPassword: user.withdrawPassword, balance: user.balance, invitationcode: user.invitationcode, nationality: user.nationality, refcode: user.refcode, roles,
            status, vip: user.vip, product: user.product, itemNumber: user.itemNumber, prizes: user.prizes, prizesNumber: user.prizesNumber, productItemMappings: user.productItemMappings, grab: user.grab, withdraw: user.withdraw, freezeblance: user.freezeblance, minbalance: user.minbalance, score: user.score, tasksDone: user.tasksDone, preferredcoin: user.preferredcoin, passportPhoto: user.passportPhoto, 护照Document: user.passportDocument, avatars: user.avatars });
    }
    static _mapUserForTenantMobile(user, tenant) {
        if (!user || !user.tenants) {
            return user;
        }
        const tenantUser = user.tenants.find((tenantUser) => tenantUser &&
            tenantUser.tenant &&
            String(tenantUser.tenant.id) === String(tenant.id));
        // delete user.tenants;
        const status = "active";
        const roles = ["member"];
        // If the user is only invited,
        // tenant members can only see its email
        const otherData = status === "active" ? user.toObject() : {};
        return Object.assign(Object.assign({}, otherData), { id: user.id, email: user.email, phoneNumber: user.phoneNumber, firstName: user.firstName, lastName: user.lastName, fullName: user.fullName, passportNumber: user.passportNumber, country: user.country, withdrawPassword: user.withdrawPassword, balance: user.balance, invitationcode: user.invitationcode, nationality: user.nationality, refcode: user.refcode, roles,
            status, vip: user.vip, product: user.product, itemNumber: user.itemNumber, prizes: user.prizes, prizesNumber: user.prizesNumber, productItemMappings: user.productItemMappings, grab: user.grab, withdraw: user.withdraw, freezeblance: user.freezeblance, minbalance: user.minbalance, score: user.score, tasksDone: user.tasksDone, preferredcoin: user.preferredcoin, passportPhoto: user.passportPhoto, passportDocument: user.passportDocument, avatars: user.avatars });
    }
    static findByRoleAutocomplete(search, limit, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant1 = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [
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
                            _id: mongooseQueryUtils_1.default.uuid(search),
                        },
                        {
                            fullName: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                        {
                            email: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                    ],
                });
            }
            const sort = mongooseQueryUtils_1.default.sort("fullName_ASC");
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = { $and: criteriaAnd };
            let users = yield user_1.default(options.database)
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
        });
    }
    static _fillRelationsAndFileDownloadUrls(record, options) {
        return __awaiter(this, void 0, void 0, function* () {
            if (!record) {
                return null;
            }
            const output = record.toObject ? record.toObject() : record;
            if (output.tenants && output.tenants.length) {
                yield Promise.all(output.tenants.map((userTenant) => __awaiter(this, void 0, void 0, function* () {
                    userTenant.tenant.settings = yield settingsRepository_1.default.find(Object.assign({ currentTenant: userTenant.tenant }, options));
                })));
            }
            output.avatars = yield fileRepository_1.default.fillDownloadUrl(output.avatars);
            output.passportPhoto = yield fileRepository_1.default.fillDownloadUrl(output.passportPhoto);
            output.passportDocument = yield fileRepository_1.default.fillDownloadUrl(output.passportDocument);
            return output;
        });
    }
    static createFromSocial(provider, providerId, email, emailVerified, firstName, lastName, options) {
        return __awaiter(this, void 0, void 0, function* () {
            let data = {
                email,
                emailVerified,
                providerId,
                provider,
                firstName,
                lastName,
            };
            data = this._preSave(data);
            let [user] = yield user_1.default(options.database).create([data], options);
            yield auditLogRepository_1.default.log({
                entityName: "user",
                entityId: user.id,
                action: auditLogRepository_1.default.CREATE,
                values: user,
            }, options);
            return this.findById(user.id, Object.assign(Object.assign({}, options), { bypassPermissionValidation: true }));
        });
    }
    static CountUser(options) {
        return __awaiter(this, void 0, void 0, function* () {
            let rows = yield user_1.default(options.database).aggregate([
                { $group: { _id: null, count: { $sum: 1 } } },
            ]);
            return rows;
        });
    }
    static CountUsers(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const count = yield mongooseRepository_1.default.wrapWithSessionIfExists(user_1.default(options.database).countDocuments(), options);
            return count;
        });
    }
}
exports.default = UserRepository;
//# sourceMappingURL=userRepository.js.map