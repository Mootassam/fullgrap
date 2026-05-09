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
const records_1 = __importDefault(require("../models/records"));
const Error405_1 = __importDefault(require("../../errors/Error405"));
const Dates_1 = __importDefault(require("../utils/Dates"));
const product_1 = __importDefault(require("../models/product"));
const user_1 = __importDefault(require("../models/user"));
const Error400_1 = __importDefault(require("../../errors/Error400"));
class RecordRepository {
    static create(data, options) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const { database } = options;
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            if (!currentUser) {
                console.error("User not authenticated");
                throw new Error("User not authenticated");
            }
            const mergeDataPosition = currentUser.itemNumber || 0;
            const prizesPosition = currentUser.prizesNumber || 0;
            const tasksDone = currentUser.tasksDone || 0;
            const isPositionMatch = tasksDone === (mergeDataPosition - 1);
            const isPrizesMatch = tasksDone === (prizesPosition - 1);
            // Execute required checks (NOT in parallel with financial mutations)
            yield this.checkOrder(options);
            console.error("Order check passed");
            // Financial logic first
            yield this.calculeGrap(data, options);
            console.error('Financial calculation completed');
            const hasProduct = Array.isArray(currentUser.product) &&
                currentUser.product.length > 0;
            const hasPrizes = (_a = currentUser === null || currentUser === void 0 ? void 0 : currentUser.prizes) === null || _a === void 0 ? void 0 : _a.id;
            /* =====================================================
               1️⃣ COMBO MODE
            ====================================================== */
            if (hasProduct && isPositionMatch) {
                const recordDataArray = [];
                let totalUserEarning = 0;
                for (let i = 0; i < currentUser.product.length; i++) {
                    const productItem = currentUser.product[i];
                    const productAmount = Number(productItem === null || productItem === void 0 ? void 0 : productItem.amount) || 0;
                    const commissionPercent = Number(productItem === null || productItem === void 0 ? void 0 : productItem.commission) || 0;
                    const earning = (commissionPercent / 100) * productAmount;
                    totalUserEarning += earning;
                    recordDataArray.push({
                        number: `${data.number}-${i}`,
                        product: productItem,
                        price: productAmount,
                        commission: commissionPercent,
                        user: data.user || currentUser.id,
                        status: i === 0 ? (data.status || "pending") : "frozen",
                        tenant: currentTenant.id,
                        createdBy: currentUser.id,
                        updatedBy: currentUser.id,
                        date: Dates_1.default.getDate(),
                        datecreation: Dates_1.default.getTimeZoneDate(),
                    });
                }
                const records = yield records_1.default(database).create(recordDataArray);
                console.log("🚀 ~ RecordRepository ~ create ~ records:", records);
                // Increment tasksDone safely
                yield user_1.default(database).updateOne({ _id: currentUser.id }, {
                    $inc: { tasksDone: currentUser.product.length },
                    $set: {
                        updatedAt: new Date(),
                        updatedBy: currentUser.id,
                    },
                });
                /* ================================
                   Referral 20% of earnings
                ================================= */
                if (currentUser.invitationcode && totalUserEarning > 0) {
                    const parentUser = yield user_1.default(database)
                        .findOne({ refcode: currentUser.invitationcode })
                        .lean();
                    if (parentUser) {
                        const referralReward = totalUserEarning * 0.20;
                        yield user_1.default(database).updateOne({ _id: parentUser._id }, {
                            $inc: { balance: referralReward },
                            $set: { updatedAt: new Date() },
                        });
                    }
                }
                // Audit logs
                for (const record of records) {
                    this._createAuditLog(auditLogRepository_1.default.CREATE, record.id, data, options).catch(console.error);
                }
                return this.findById(records[0].id, options);
            }
            /* =====================================================
               2️⃣ PRIZE MODE
            ====================================================== */
            if (hasPrizes && isPrizesMatch) {
                const recordData = Object.assign(Object.assign({}, data), { price: ((_b = currentUser.prizes) === null || _b === void 0 ? void 0 : _b.amount) || 0, commission: ((_c = currentUser.prizes) === null || _c === void 0 ? void 0 : _c.commission) || 0, tenant: currentTenant.id, createdBy: currentUser.id, updatedBy: currentUser.id, date: Dates_1.default.getDate(), datecreation: Dates_1.default.getTimeZoneDate() });
                const [record] = yield records_1.default(database).create([recordData]);
                yield user_1.default(database).updateOne({ _id: currentUser.id }, {
                    $inc: { tasksDone: 1 },
                    $set: {
                        prizes: null,
                        prizesNumber: 0,
                        updatedAt: new Date(),
                        updatedBy: currentUser.id,
                    },
                });
                yield this._createAuditLog(auditLogRepository_1.default.CREATE, record.id, recordData, options);
                return this.findById(record.id, options);
            }
            /* =====================================================
               3️⃣ NORMAL MODE
            ====================================================== */
            const pendingRecord = yield records_1.default(database).findOne({
                tenant: currentTenant.id,
                user: currentUser.id,
                status: "pending",
            });
            if (!pendingRecord) {
                throw new Error400_1.default(options.language, "validation.noPendingRecord");
            }
            const recordPrice = Number(pendingRecord.price) || 0;
            const commissionPercent = Number(pendingRecord.commission) || 0;
            const profit = (commissionPercent / 100) * recordPrice;
            // Mark record as completed
            pendingRecord.status = data.status || "completed";
            pendingRecord.updatedBy = currentUser.id;
            pendingRecord.updatedAt = new Date();
            yield pendingRecord.save();
            // Safely update user balance
            yield user_1.default(database).updateOne({ _id: currentUser.id }, {
                $inc: {
                    balance: profit + (currentUser.freezeblance || 0),
                    tasksDone: 1,
                },
                $set: {
                    freezeblance: 0,
                    updatedAt: new Date(),
                    updatedBy: currentUser.id,
                },
            });
            yield this._createAuditLog(auditLogRepository_1.default.UPDATE, pendingRecord.id, { status: pendingRecord.status }, options);
            return this.findById(pendingRecord.id, options);
        });
    }
    static calculeGrap(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const { database } = options;
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            if (!currentUser) {
                throw new Error("User not authenticated");
            }
            // Get product
            const currentProduct = yield product_1.default(database)
                .findById(data.product)
                .lean();
            if (!currentProduct) {
                throw new Error("Product not found");
            }
            const userId = currentUser.id;
            const userBalance = Number(currentUser.balance) || 0;
            const productAmount = Number(currentProduct.amount) || 0;
            const commissionPercent = Number(currentProduct.commission) || 0;
            const itemPosition = Number(currentUser.itemNumber) || 0;
            const prizePosition = Number(currentUser.prizesNumber) || 0;
            const tasksDone = Number(currentUser.tasksDone) || 0;
            const isPositionMatch = tasksDone === (itemPosition - 1);
            const isPrizeMatch = tasksDone === (prizePosition - 1);
            let balanceIncrement = 0;
            let freezeAmount = 0;
            /* =====================================================
               CASE 1: Combo Product Freeze
            ====================================================== */
            if (Array.isArray(currentUser.product) &&
                currentUser.product.length > 0 &&
                isPositionMatch) {
                let comboPrice = 0;
                for (const item of currentUser.product) {
                    comboPrice += Number(item.amount) || 0;
                }
                balanceIncrement = -comboPrice;
                freezeAmount = comboPrice;
                yield user_1.default(database).updateOne({ _id: userId }, {
                    $inc: {
                        balance: balanceIncrement,
                        freezeblance: freezeAmount,
                    },
                    $set: { updatedAt: new Date() },
                });
                return;
            }
            /* =====================================================
               CASE 2: Prize Unlock
            ====================================================== */
            if (currentUser.prizes && isPrizeMatch) {
                balanceIncrement = productAmount;
                yield user_1.default(database).updateOne({ _id: userId }, {
                    $inc: { balance: balanceIncrement },
                    $set: { freezeblance: 0, updatedAt: new Date() },
                });
                return;
            }
            /* =====================================================
               CASE 3: Normal Commission Flow
            ====================================================== */
            // Calculate user earning
            const userEarning = (commissionPercent / 100) * (Number(data.price) || 0);
            if (userEarning <= 0) {
                throw new Error("Invalid commission calculation");
            }
            balanceIncrement = userEarning;
            // Update user balance first (atomic)
            yield user_1.default(database).updateOne({ _id: userId }, {
                $inc: { balance: balanceIncrement },
                $set: { freezeblance: 0, updatedAt: new Date() },
            });
            /* =============================
               Referral Commission (20% of user earning)
            ============================== */
            if (currentUser.invitationcode) {
                const invitedUser = yield user_1.default(database)
                    .findOne({ refcode: currentUser.invitationcode })
                    .lean();
                if (invitedUser) {
                    const referralReward = userEarning * 0.20;
                    yield user_1.default(database).updateOne({ _id: invitedUser._id }, {
                        $inc: { balance: referralReward },
                        $set: { updatedAt: new Date() },
                    });
                }
            }
            return;
        });
    }
    static checkOrderCombo(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const currentDate = this.getTimeZoneDate(); // Get current date
            const record = yield records_1.default(options.database)
                .find({
                user: currentUser.id,
                // Compare dates in the same format
                datecreation: { $in: Dates_1.default.getTimeZoneDate() },
            })
                .countDocuments();
            const dailyOrder = currentUser.vip.dailyorder;
            const mergeDataPosition = currentUser.itemNumber;
            if (currentUser && currentUser.vip && currentUser.vip.id) {
                if (currentUser.tasksDone >= dailyOrder) {
                    throw new Error405_1.default("This is your limit. Please contact customer support for more tasks");
                }
                if (currentUser.balance <= 0) {
                    throw new Error405_1.default("insufficient balance please upgrade.");
                }
                // if (currentUser.balance <= 49) {
                //     throw new Error405("Your account must have a minimum balance of 50 USDT.");
                //   }
            }
            else {
                throw new Error405_1.default("Please subscribe to at least one VIP package.");
            }
        });
    }
    // Utility functions with validation
    static calculeTotal(price, commission) {
        const numPrice = Number(price);
        const numCommission = Number(commission);
        if (isNaN(numPrice) || isNaN(numCommission)) {
            throw new Error('Invalid price or commission values');
        }
        return (numPrice * numCommission) / 100;
    }
    static calculeTotalMerge(price, commission) {
        const numPrice = Number(price);
        const numCommission = Number(commission);
        if (isNaN(numPrice) || isNaN(numCommission)) {
            throw new Error405_1.default('Invalid price or commission values');
        }
        return numPrice + (numPrice * numCommission) / 100;
    }
    static CountOrder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const currentDate = Dates_1.default.getTimeZoneDate();
            const record = yield records_1.default(options.database)
                .countDocuments({
                user: currentUser.id,
                datecreation: currentDate
            });
            return { record };
        });
    }
    static tasksDone(currentUser, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const user = yield user_1.default(options.database)
                .findById(currentUser)
                .select('tasksDone')
                .lean();
            if (!user) {
                throw new Error('User not found');
            }
            return { record: user.tasksDone || 0 };
        });
    }
    static checkOrder(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const currentDate = Dates_1.default.getTimeZoneDate();
            // Use Promise.all for parallel execution
            const [recordCount, userVip] = yield Promise.all([
                records_1.default(options.database).countDocuments({
                    user: currentUser.id,
                    datecreation: currentDate
                }),
                // Get fresh VIP data to ensure accuracy
                user_1.default(options.database)
                    .findById(currentUser.id)
                    .select('vip balance tasksDone')
                    .lean()
            ]);
            if (!(userVip === null || userVip === void 0 ? void 0 : userVip.vip)) {
                throw new Error400_1.default(options.language, "validation.requiredSubscription");
            }
            const dailyOrder = userVip.vip.dailyorder;
            if (userVip.tasksDone >= dailyOrder) {
                throw new Error400_1.default(options.language, "validation.moretasks");
            }
            if (userVip.balance <= 0) {
                throw new Error400_1.default(options.language, "validation.InsufficientBalance");
            }
        });
    }
    static getTimeZoneDate() {
        const dubaiTimezone = "Asia/Dubai";
        const options = {
            timeZone: dubaiTimezone,
            month: "2-digit",
            day: "2-digit",
            year: "numeric",
        };
        const currentDateTime = new Date().toLocaleDateString("en-US", options);
        return currentDateTime;
    }
    static update(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(records_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield records_1.default(options.database).updateOne({ _id: id }, Object.assign(Object.assign({}, data), { updatedBy: mongooseRepository_1.default.getCurrentUser(options).id }), options);
            yield this._createAuditLog(auditLogRepository_1.default.UPDATE, id, data, options);
            record = yield this.findById(id, options);
            return record;
        });
    }
    static updateStatus(options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const session = options === null || options === void 0 ? void 0 : options.session;
            // Start transaction if session is provided
            if (session) {
                session.startTransaction();
            }
            try {
                // Fetch the current user with product details
                const user = yield user_1.default(options.database)
                    .findById(currentUser.id)
                    .populate('product') // Populate product details to get commission
                    .session(session || null);
                if (!user) {
                    throw new Error404_1.default();
                }
                // Check if user has sufficient balance (not 0 or negative)
                const currentBalance = parseFloat(user.balance) || 0;
                if (currentBalance <= 0) {
                    throw new Error405_1.default('Please contact the customer service to recharge');
                }
                // Find ALL records that need to be completed (both pending AND frozen)
                const recordsToComplete = yield records_1.default(options.database)
                    .find({
                    tenant: currentTenant.id,
                    user: currentUser.id,
                    status: { $in: ['pending', 'frozen'] } // Include both statuses
                })
                    .populate('product') // Populate to get product details
                    .session(session || null);
                if (!recordsToComplete || recordsToComplete.length === 0) {
                    throw new Error405_1.default('No records found to complete (pending or frozen)');
                }
                // Update ALL pending and frozen records to completed
                yield records_1.default(options.database).updateMany({
                    tenant: currentTenant.id,
                    user: currentUser.id,
                    status: { $in: ['pending', 'frozen'] }
                }, {
                    status: 'completed',
                    updatedBy: currentUser.id,
                    updatedAt: new Date()
                }, Object.assign({ session }, options));
                // COMMON LOGIC: Add frozen balance to balance and reset frozen balance
                const frozenBalance = parseFloat(user.freezeblance) || 0;
                const newBalance = currentBalance + frozenBalance;
                // Now handle the specific logic based on whether user has products
                if (user.product && Array.isArray(user.product) && user.product.length > 0) {
                    // USER HAS PRODUCTS: Calculate commission from products
                    const productIds = user.product.map(product => product._id || product);
                    // Filter records that belong to user's products (both pending and frozen)
                    const productRecords = recordsToComplete.filter(record => { var _a, _b, _c; return productIds.includes(((_b = (_a = record.product) === null || _a === void 0 ? void 0 : _a._id) === null || _b === void 0 ? void 0 : _b.toString()) || ((_c = record.product) === null || _c === void 0 ? void 0 : _c.toString())); });
                    let totalCommission = 0;
                    // Calculate commission from ALL product records (both pending and frozen)
                    for (const record of productRecords) {
                        if (record.product && record.product.amount && record.product.commission) {
                            const recordCommission = this.calculeTotal(record.product.amount, record.product.commission);
                            totalCommission += recordCommission;
                        }
                        else if (record.product && record.product.type === "prizes" && record.product.amount) {
                            totalCommission += parseFloat(record.product.amount) || 0;
                        }
                    }
                    // Add commission to the new balance
                    const finalBalance = newBalance + totalCommission;
                    // Update user: clear products, reset itemNumber, update balance with commission
                    yield user_1.default(options.database).updateOne({ _id: currentUser.id }, {
                        $set: {
                            product: [],
                            itemNumber: 0,
                            balance: finalBalance,
                            freezeblance: 0 // Reset frozen balance to 0
                        },
                        $inc: {
                            tasksDone: productRecords.length // Increment tasksDone by number of product records
                        },
                        updatedBy: currentUser.id,
                        updatedAt: new Date()
                    }, Object.assign({ session }, options));
                }
                else {
                    // USER HAS NO PRODUCTS: Just update balance without commission
                    // Filter only normal/pending records (not frozen ones from combo mode)
                    const normalRecords = recordsToComplete.filter(record => { var _a; return record.status === 'pending' || !((_a = record.product) === null || _a === void 0 ? void 0 : _a.type) || record.product.type === 'normal'; });
                    yield user_1.default(options.database).updateOne({ _id: currentUser.id }, {
                        $set: {
                            balance: newBalance,
                            freezeblance: 0 // Reset frozen balance to 0
                        },
                        $inc: {
                            tasksDone: normalRecords.length // Increment tasksDone by normal records count
                        },
                        updatedBy: currentUser.id,
                        updatedAt: new Date()
                    }, Object.assign({ session }, options));
                }
                // Commit transaction if started
                if (session) {
                    yield session.commitTransaction();
                }
                // Fire-and-forget audit logs for all completed records
                recordsToComplete.forEach(record => {
                    this._createAuditLog(auditLogRepository_1.default.UPDATE, record._id, {
                        status: 'completed',
                        previousStatus: record.status // Log what it was before
                    }, options).catch(console.error);
                });
                // Return first record
                return this.findById(recordsToComplete[0]._id, options);
            }
            catch (error) {
                // Abort transaction on error
                if (session) {
                    yield session.abortTransaction();
                }
                throw error;
            }
        });
    }
    static destroy(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(records_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield records_1.default(options.database).deleteOne({ _id: id }, options);
            yield this._createAuditLog(auditLogRepository_1.default.DELETE, id, record, options);
        });
    }
    static count(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            return mongooseRepository_1.default.wrapWithSessionIfExists(records_1.default(options.database).countDocuments(Object.assign(Object.assign({}, filter), { tenant: currentTenant.id })), options);
        });
    }
    static findById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(records_1.default(options.database)
                .findById(id)
                .populate("user")
                .populate("product"), options);
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
            // Apply role-based filtering on the "user" field
            if (userRole === "admin") {
                // Admin sees all records – no additional user filter
            }
            else if (userRole === "agent") {
                // Agent sees their own + downline users' records
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
                // Member (default) sees only their own records
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
                    // Admin: can filter by any user
                    if (userRole === "admin") {
                        criteriaAnd.push({
                            user: filter.user,
                        });
                    }
                    // Agent: only allow filtering to users within their referral chain
                    else if (userRole === "agent") {
                        const referralUserIds = yield this.getAllReferralUserIds(currentUser.refcode, options);
                        referralUserIds.push(currentUser._id);
                        const userObjectId = typeof filter.user === 'string'
                            ? mongooseQueryUtils_1.default.uuid(filter.user)
                            : filter.user;
                        const isUserInReferralChain = referralUserIds.some(id => id.toString() === (userObjectId === null || userObjectId === void 0 ? void 0 : userObjectId.toString()));
                        if (isUserInReferralChain) {
                            criteriaAnd.push({ user: filter.user });
                        }
                        else {
                            return { rows: [], count: 0 };
                        }
                    }
                    // Member: only allow filtering to themselves
                    else {
                        if (filter.user.toString() === (currentUser === null || currentUser === void 0 ? void 0 : currentUser._id.toString())) {
                            criteriaAnd.push({ user: filter.user });
                        }
                        else {
                            return { rows: [], count: 0 };
                        }
                    }
                }
                if (filter.product) {
                    criteriaAnd.push({
                        product: filter.product,
                    });
                }
                if (filter.number) {
                    criteriaAnd.push({
                        number: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.number),
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
                // Date range filter
                if (filter.createdAtRange) {
                    const [start, end] = filter.createdAtRange;
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
                // Product name search (cross-collection)
                if (filter.productName) {
                    const Product = options.database.model('product');
                    const matchingProducts = yield Product.find({
                        name: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.productName),
                            $options: "i",
                        }
                    }).select('_id');
                    const productIds = matchingProducts.map(p => p._id);
                    if (productIds.length > 0) {
                        criteriaAnd.push({
                            product: { $in: productIds }
                        });
                    }
                    else {
                        return { rows: [], count: 0 };
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
            let rows = yield records_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("user")
                .populate("product");
            const count = yield records_1.default(options.database).countDocuments(criteria);
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
     * Get summary statistics for records in referral chain (optional helper)
     */
    static getReferralRecordsSummary(refcode, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const referralUserIds = yield this.getAllReferralUserIds(refcode, options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            // Include current user
            if (currentUser) {
                referralUserIds.push(currentUser._id);
            }
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const summary = yield records_1.default(options.database).aggregate([
                {
                    $match: {
                        user: { $in: referralUserIds },
                        tenant: currentTenant.id
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalRecords: { $sum: 1 },
                        byStatus: {
                            $push: {
                                status: '$status'
                            }
                        },
                        byProduct: {
                            $push: {
                                product: '$product',
                                count: 1
                            }
                        }
                    }
                },
                {
                    $project: {
                        totalRecords: 1,
                        statusBreakdown: {
                            $reduce: {
                                input: "$byStatus",
                                initialValue: {},
                                in: {
                                    $mergeObjects: [
                                        "$$value",
                                        {
                                            $arrayToObject: [[
                                                    { k: "$$this.status", v: { $add: [{ $ifNull: [{ $getField: { field: "$$this.status", input: "$$value" } }, 0] }, 1] } }
                                                ]]
                                        }
                                    ]
                                }
                            }
                        }
                    }
                }
            ]);
            return summary.length > 0 ? summary[0] : {
                totalRecords: 0,
                statusBreakdown: {}
            };
        });
    }
    static findAndCountAllMobile({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            let criteriaAnd = [];
            criteriaAnd.push({
                tenant: currentTenant.id,
                user: currentUser.id,
            });
            if (filter) {
                if (filter.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
                    });
                }
                if (filter.user) {
                    criteriaAnd.push({
                        user: filter.user,
                    });
                }
                if (filter.product) {
                    criteriaAnd.push({
                        product: filter.product,
                    });
                }
                if (filter.number) {
                    criteriaAnd.push({
                        number: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.number),
                            $options: "i",
                        },
                    });
                }
                if (filter.status) {
                    // ALWAYS: when status is "pending", return both "pending" and "frozen"
                    if (filter.status.toLowerCase() === "pending") {
                        criteriaAnd.push({
                            status: {
                                $in: ["pending", "frozen"] // Include both statuses
                            }
                        });
                    }
                    else {
                        // For other statuses ("completed", "frozen"), use exact match
                        criteriaAnd.push({
                            status: filter.status
                        });
                    }
                }
            }
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let listitems = yield records_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .sort(sort)
                .populate("user")
                .populate("product");
            let rows = yield records_1.default(options.database)
                .find(criteria)
                .limit(limitEscaped)
                .sort(sort)
                .populate("user")
                .populate("product");
            const count = yield records_1.default(options.database).countDocuments(criteria);
            rows = yield Promise.all(rows.map(this._fillFileDownloadUrls));
            let total = 0;
            listitems.map((item) => {
                let data = item.product;
                let itemTotal = (parseFloat(data.commission) * parseFloat(data.amount)) / 100;
                total += itemTotal;
            });
            total = parseFloat(total.toFixed(3));
            return { rows, count, total };
        });
    }
    static findAndCountPerDay({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            // Build criteria for the query
            const criteriaAnd = [
                { tenant: currentTenant.id },
                { user: currentUser.id },
                { status: "completed" } // only completed records
            ];
            // Set start and end of today
            const start = new Date();
            start.setHours(0, 0, 0, 0);
            const end = new Date();
            end.setHours(23, 59, 59, 999);
            criteriaAnd.push({
                createdAt: { $gte: start, $lte: end },
            });
            const criteria = { $and: criteriaAnd };
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            // Fetch the records
            const records = yield records_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .sort(sort)
                .populate("user")
                .populate("product");
            // Calculate daily profit
            let totalProfit = 0;
            for (const record of records) {
                const price = parseFloat(record.price || "0"); // convert price to number
                const commission = parseFloat(record.commission || "0"); // convert commission to number
                // Calculate profit = (price * commission%) / 100
                const profit = (price * commission) / 100;
                totalProfit += profit;
            }
            totalProfit = parseFloat(totalProfit.toFixed(3));
            return { total: totalProfit };
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
            const records = yield records_1.default(options.database)
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
                entityName: records_1.default(options.database).modelName,
                entityId: id,
                action,
                values: data,
            }, options);
        });
    }
    static _fillFileDownloadUrls(record) {
        var _a;
        return __awaiter(this, void 0, void 0, function* () {
            if (!record) {
                return null;
            }
            const output = record.toObject ? record.toObject() : record;
            output.product.photo = yield fileRepository_1.default.fillDownloadUrl((_a = output === null || output === void 0 ? void 0 : output.product) === null || _a === void 0 ? void 0 : _a.photo);
            return output;
        });
    }
}
exports.default = RecordRepository;
//# sourceMappingURL=recordRepository.js.map