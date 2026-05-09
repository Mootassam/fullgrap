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
const product_1 = __importDefault(require("../models/product"));
const Error400_1 = __importDefault(require("../../errors/Error400"));
const axios_1 = __importDefault(require("axios"));
const records_1 = __importDefault(require("../models/records"));
const Dates_1 = __importDefault(require("../utils/Dates"));
class ProductRepository {
    static create(data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const [record] = yield product_1.default(options.database).create([
                Object.assign(Object.assign({}, data), { tenant: currentTenant.id, createdBy: currentUser.id, updatedBy: currentUser.id }),
            ], options);
            yield this._createAuditLog(auditLogRepository_1.default.CREATE, record.id, data, options);
            return this.findById(record.id, options);
        });
    }
    static fetchKaggleData(dataConfig, value, titleIndex, imageIndex) {
        var _a, _b, _c;
        return __awaiter(this, void 0, void 0, function* () {
            const url = "https://www.kaggle.com/api/i/datasets.DatasetService/GetDataViewExternal";
            try {
                const response = yield axios_1.default.post(url, dataConfig, { headers: this.baseConfig });
                const payload = (_c = (_b = (_a = response === null || response === void 0 ? void 0 : response.data) === null || _a === void 0 ? void 0 : _a.dataView) === null || _b === void 0 ? void 0 : _b.dataTable) === null || _c === void 0 ? void 0 : _c.rows;
                if (!payload || !Array.isArray(payload)) {
                    return [];
                }
                const values = payload.map((item) => {
                    return {
                        title: item.text[titleIndex] || 'No Title',
                        image: item.text[imageIndex] || 'No Image',
                        commission: value.comisionrate,
                        vip: value.vipId,
                        amount: this.generateRandomPrice(value.min, value.max)
                    };
                });
                return values;
            }
            catch (error) {
                console.error('Error fetching data from Kaggle:', error);
                throw error;
            }
        });
    }
    static generateRandomPrice(minStr, maxStr) {
        const min = parseFloat(minStr);
        const max = parseFloat(maxStr);
        if (isNaN(min) || isNaN(max)) {
            return '0.00';
        }
        const randomPrice = (Math.random() * (max - min) + min).toFixed(2);
        return randomPrice;
    }
    // VIP 1 - Amazon Canada Products
    static Vip1(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                verificationInfo: {
                    datasetId: 3892743,
                    databundleVersionId: 7739884
                },
                firestorePath: "FTFGzaZX82u89A2tMkJX/versions/AQr8CIhNOjHHDrZPl1l1/files/amz_ca_total_products_data_processed.csv",
                tableQuery: {
                    skip: 0,
                    take: 1000,
                    filter: { constantFilter: { value: true } },
                    selectedColumns: [],
                    sorts: []
                }
            };
            return yield ProductRepository.fetchKaggleData(data, value, 1, 2);
        });
    }
    // VIP 2 - Home and Kitchen
    static Vip2(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                verificationInfo: {
                    datasetId: 3020336,
                    databundleVersionId: 5312147
                },
                firestorePath: "xPzcStLbnsPzJKeYPOag/versions/DCzIM1E87eQwV2sueUk6/files/All Home and Kitchen.csv",
                tableQuery: {
                    skip: 0,
                    take: 1000,
                    filter: { constantFilter: { value: true } },
                    selectedColumns: [],
                    sorts: []
                }
            };
            return yield ProductRepository.fetchKaggleData(data, value, 0, 3);
        });
    }
    // VIP 3 - Car Parts
    static Vip3(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                verificationInfo: {
                    datasetId: 3020336,
                    databundleVersionId: 5312147
                },
                firestorePath: "xPzcStLbnsPzJKeYPOag/versions/DCzIM1E87eQwV2sueUk6/files/Car Parts.csv",
                tableQuery: {
                    skip: 0,
                    take: 1000,
                    filter: { constantFilter: { value: true } },
                    selectedColumns: [],
                    sorts: []
                }
            };
            return yield ProductRepository.fetchKaggleData(data, value, 0, 3);
        });
    }
    // VIP 4 - Air Conditioners
    static Vip4(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                verificationInfo: {
                    datasetId: 3020336,
                    databundleVersionId: 5312147
                },
                firestorePath: "xPzcStLbnsPzJKeYPOag/versions/DCzIM1E87eQwV2sueUk6/files/Air Conditioners.csv",
                tableQuery: {
                    skip: 0,
                    take: 1000,
                    filter: { constantFilter: { value: true } },
                    selectedColumns: [],
                    sorts: []
                }
            };
            return yield ProductRepository.fetchKaggleData(data, value, 0, 3);
        });
    }
    // VIP 5 - Grocery and Gourmet Foods
    static Vip5(value) {
        return __awaiter(this, void 0, void 0, function* () {
            const data = {
                verificationInfo: {
                    datasetId: 3020336,
                    databundleVersionId: 5312147
                },
                firestorePath: "xPzcStLbnsPzJKeYPOag/versions/DCzIM1E87eQwV2sueUk6/files/All Grocery and Gourmet Foods.csv",
                tableQuery: {
                    skip: 0,
                    take: 1000,
                    filter: { constantFilter: { value: true } },
                    selectedColumns: [],
                    sorts: []
                }
            };
            return yield ProductRepository.fetchKaggleData(data, value, 0, 3);
        });
    }
    static update(id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(product_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield product_1.default(options.database).updateOne({ _id: id }, Object.assign(Object.assign({}, data), { updatedBy: mongooseRepository_1.default.getCurrentUser(options).id }), options);
            yield this._createAuditLog(auditLogRepository_1.default.UPDATE, id, data, options);
            record = yield this.findById(id, options);
            return record;
        });
    }
    static destroy(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(product_1.default(options.database).findById(id), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            yield product_1.default(options.database).deleteOne({ _id: id }, options);
            yield this._createAuditLog(auditLogRepository_1.default.DELETE, id, record, options);
        });
    }
    static count(filter, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            return mongooseRepository_1.default.wrapWithSessionIfExists(product_1.default(options.database).countDocuments(Object.assign(Object.assign({}, filter), { tenant: currentTenant.id })), options);
        });
    }
    static findById(id, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let record = yield mongooseRepository_1.default.wrapWithSessionIfExists(product_1.default(options.database).findById(id).populate("vip"), options);
            if (!record || String(record.tenant) !== String(currentTenant.id)) {
                throw new Error404_1.default();
            }
            return this._fillFileDownloadUrls(record);
        });
    }
    static findAndCountAll({ filter, limit = 0, offset = 0, orderBy = "" }, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [];
            criteriaAnd.push({
                tenant: currentTenant.id,
            });
            if (filter) {
                if (filter.id) {
                    criteriaAnd.push({
                        ["_id"]: mongooseQueryUtils_1.default.uuid(filter.id),
                    });
                }
                if (filter.title) {
                    criteriaAnd.push({
                        title: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.title),
                            $options: "i",
                        },
                    });
                }
                if (filter.amount) {
                    criteriaAnd.push({
                        amount: {
                            $regex: mongooseQueryUtils_1.default.escapeRegExp(filter.amount),
                            $options: "i",
                        },
                    });
                }
                if (filter.vip) {
                    criteriaAnd.push({
                        vip: filter.vip,
                    });
                }
            }
            const sort = mongooseQueryUtils_1.default.sort(orderBy || "createdAt_DESC");
            const skip = Number(offset || 0) || undefined;
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;
            let rows = yield product_1.default(options.database)
                .find(criteria)
                .skip(skip)
                .limit(limitEscaped)
                .populate("vip")
                .sort(sort);
            const count = yield product_1.default(options.database).countDocuments(criteria);
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
            const records = yield product_1.default(options.database)
                .find(criteria)
                .limit(limitEscaped)
                .sort(sort);
            return records.map((record) => ({
                id: record.id,
                label: record.title,
            }));
        });
    }
    static findAllAutocompleteProduct(search, limit, options) {
        return __awaiter(this, void 0, void 0, function* () {
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            let criteriaAnd = [
                {
                    tenant: currentTenant.id,
                },
                {
                    // Filter by type: either "combo" OR "prizes"
                    type: {
                        $in: ["combo", "prizes"]
                    }
                }
            ];
            if (search) {
                criteriaAnd.push({
                    $or: [
                        {
                            _id: mongooseQueryUtils_1.default.uuid(search),
                        },
                        {
                            title: {
                                $regex: mongooseQueryUtils_1.default.escapeRegExp(search),
                                $options: "i",
                            },
                        },
                    ],
                });
            }
            const sort = mongooseQueryUtils_1.default.sort("title_ASC");
            const limitEscaped = Number(limit || 0) || undefined;
            const criteria = { $and: criteriaAnd };
            const records = yield product_1.default(options.database)
                .find(criteria)
                .limit(limitEscaped)
                .sort(sort);
            return records.map((record) => ({
                id: record.id,
                label: record.title,
            }));
        });
    }
    static _createAuditLog(action, id, data, options) {
        return __awaiter(this, void 0, void 0, function* () {
            yield auditLogRepository_1.default.log({
                entityName: product_1.default(options.database).modelName,
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
    static grapOrders(options) {
        var _a, _b;
        return __awaiter(this, void 0, void 0, function* () {
            const currentUser = mongooseRepository_1.default.getCurrentUser(options);
            const currentVip = currentUser.vip.id;
            // Handle productItemMappings if available
            let mergeDataPosition = currentUser.itemNumber; // fallback to legacy
            let giftPosition = currentUser.prizesNumber; // fallback to legacy
            // Check if we have productItemMappings and use them
            if (currentUser.productItemMappings && Array.isArray(currentUser.productItemMappings) && currentUser.productItemMappings.length > 0) {
                // For now, we'll still use the legacy system for determining which product to show
                // but we'll modify the logic to check mappings
                const taskNumber = currentUser.tasksDone + 1; // Next task number
                const mapping = currentUser.productItemMappings.find(m => m.itemNumber === taskNumber);
                if (mapping) {
                    // If we have a mapping for this task, we'll use the mapped product
                    // For backward compatibility, we'll still set mergeDataPosition to taskNumber
                    mergeDataPosition = taskNumber;
                }
            }
            if (!(currentUser === null || currentUser === void 0 ? void 0 : currentUser.vip)) {
                console.log("1 ");
                throw new Error400_1.default(options.language, "validation.requiredSubscription");
            }
            // Check for pending orders
            const pendingRecords = yield records_1.default(options.database).find({
                user: currentUser.id,
                status: 'pending'
            });
            if (pendingRecords.length > 0) {
                console.log("2");
                throw new Error400_1.default(options.language, "validation.submitPendingProducts");
            }
            // Check daily order limit
            const dailyOrder = currentUser.vip.dailyorder;
            if (currentUser.tasksDone >= dailyOrder) {
                console.log("3");
                throw new Error400_1.default(options.language, "validation.moretasks");
            }
            // Check balance
            if (currentUser.balance <= 0 || currentUser.balance < currentUser.minbalance) {
                console.log("4");
                throw new Error400_1.default(options.language, "validation.deposit");
            }
            // Special VIP products - check if we have a mapping for current task
            const taskNumber = currentUser.tasksDone + 1;
            const mapping = (_a = currentUser.productItemMappings) === null || _a === void 0 ? void 0 : _a.find(m => m.itemNumber === taskNumber);
            if (mapping && mapping.productId) {
                // Check if we're at the right task for this mapped product
                if (currentUser.tasksDone === (taskNumber - 1)) {
                    console.log("5 - Using mapped product");
                    // Find the mapped product
                    const mappedProduct = yield product_1.default(options.database).findById(mapping.productId);
                    if (mappedProduct) {
                        // Populate VIP info if needed
                        const populatedProduct = yield mappedProduct.populate("vip");
                        populatedProduct.photo = yield fileRepository_1.default.fillDownloadUrl(populatedProduct === null || populatedProduct === void 0 ? void 0 : populatedProduct.photo);
                        return populatedProduct;
                    }
                }
            }
            else if (((_b = currentUser === null || currentUser === void 0 ? void 0 : currentUser.product) === null || _b === void 0 ? void 0 : _b.length) > 0 && currentUser.tasksDone === (mergeDataPosition - 1)) {
                console.log("5");
                let product = currentUser.product[0];
                product.photo = yield fileRepository_1.default.fillDownloadUrl(product === null || product === void 0 ? void 0 : product.photo);
                return product;
            }
            else if ((currentUser === null || currentUser === void 0 ? void 0 : currentUser.prizes) && currentUser.tasksDone === (giftPosition - 1)) {
                console.log("6");
                let product = currentUser.prizes;
                product.photo = yield fileRepository_1.default.fillDownloadUrl(product === null || product === void 0 ? void 0 : product.photo);
                return product;
            }
            // -------------------------
            // Normal product selection
            // -------------------------
            let finalPrice;
            if (currentUser.vip.isFixedAmount) {
                // Use min/max as fixed price
                const vipMinPrice = parseFloat(currentUser.vip.min) || 20;
                const vipMaxPrice = parseFloat(currentUser.vip.max) || 50;
                const minPrice = Math.min(vipMinPrice, vipMaxPrice);
                const maxPrice = Math.max(vipMinPrice, vipMaxPrice);
                finalPrice = Math.random() * (maxPrice - minPrice) + minPrice;
            }
            else {
                // Use min/max as percentage of balance (existing logic)
                const vipMinPercentage = parseFloat(currentUser.vip.min) || 20;
                const vipMaxPercentage = parseFloat(currentUser.vip.max) || 50;
                const minPercent = Math.min(vipMinPercentage, vipMaxPercentage);
                const maxPercent = Math.max(vipMaxPercentage, vipMaxPercentage);
                const randomPercentage = Math.random() * (maxPercent - minPercent) + minPercent;
                finalPrice = (currentUser.balance * randomPercentage) / 100;
            }
            finalPrice = Math.round(finalPrice * 100) / 100;
            if (finalPrice > currentUser.balance) {
                throw new Error400_1.default(options.language, "validation.insufficientBalance");
            }
            // Get random normal product
            let products = yield product_1.default(options.database)
                .find({ vip: currentVip, type: 'normal' })
                .populate("vip");
            if (products.length === 0) {
                throw new Error400_1.default(options.language, "validation.noProductsAvailable");
            }
            const randomIndex = Math.floor(Math.random() * products.length);
            const selectedProduct = products[randomIndex];
            // Generate unique record number
            const today = new Date();
            const datePart = today.getFullYear().toString() +
                (today.getMonth() + 1).toString().padStart(2, '0') +
                today.getDate().toString().padStart(2, '0');
            const randomPart = Math.random().toString(36).substr(2, 8);
            const recordNumber = datePart + randomPart;
            const currentTenant = mongooseRepository_1.default.getCurrentTenant(options);
            const recordData = {
                number: recordNumber,
                product: selectedProduct.id,
                price: finalPrice.toString(),
                commission: selectedProduct === null || selectedProduct === void 0 ? void 0 : selectedProduct.commission,
                status: 'pending',
                user: currentUser.id,
                tenant: currentTenant.id,
                createdBy: currentUser.id,
                updatedBy: currentUser.id,
                date: Dates_1.default.getDate(),
                datecreation: Dates_1.default.getTimeZoneDate(),
            };
            // Save record
            let createdRecord;
            try {
                const [record] = yield records_1.default(options.database).create([recordData], options);
                createdRecord = record;
            }
            catch (error) {
                const RecordModel = options.database.model('records');
                createdRecord = yield RecordModel.create(recordData);
            }
            // Update user balance and freeze balance
            try {
                const UserModel = options.database.model('user');
                yield UserModel.findByIdAndUpdate(currentUser.id, {
                    $inc: {
                        balance: -finalPrice,
                        freezeblance: finalPrice,
                    },
                }, { new: true });
            }
            catch (balanceUpdateError) {
                throw new Error400_1.default(options.language, "validation.balanceUpdateFailed");
            }
            // Update product for return
            selectedProduct.amount = finalPrice.toString();
            selectedProduct.photo = yield fileRepository_1.default.fillDownloadUrl(selectedProduct === null || selectedProduct === void 0 ? void 0 : selectedProduct.photo);
            return selectedProduct;
        });
    }
}
ProductRepository.baseConfig = {
    "cookie": "ka_sessionid=bf403f9b5a9c413a0b2277c373caf9cc; _ga=GA1.1.1181949918.1771128107; ACCEPTED_COOKIES=true; CSRF-TOKEN=CfDJ8E2Nv-_xTuFMnx6IZ-XCV9wTYFCeYd6-lLUZ4aIvgZ7HaS2J5Hhjx4u7tBxo53a-b9C0DqA_CZDTJuoVlFzSbYk1KY56hqd4zxP2c6BMZA; GCLB=CNrq7NWqgL-MmwEQAw; build-hash=ccf1b65165acc28087b8988bb6e571c240fdf249; XSRF-TOKEN=CfDJ8E2Nv-_xTuFMnx6IZ-XCV9xzjTdHBZAlBD6-xRWkn-j29m4wlyWsJeNAnK55cbn65gFbeys7b4hBjXNJ3s1yVKRJdvbzihka4sxON-ZARxfICA; CLIENT-TOKEN=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJrYWdnbGUiLCJhdWQiOiJjbGllbnQiLCJzdWIiOiIiLCJuYnQiOiIyMDI2LTAyLTI1VDE2OjA5OjU5LjQ0ODg4OTdaIiwiaWF0IjoiMjAyNi0wMi0yNVQxNjowOTo1OS40NDg4ODk3WiIsImp0aSI6IjcwMDRiYmJhLTM2NzEtNDE3NS1iODIzLWExMGQ5MGRmOTVlZiIsImV4cCI6IjIwMjYtMDMtMjVUMTY6MDk6NTkuNDQ4ODg5N1oiLCJhbm9uIjp0cnVlLCJmZmgiOiJlOTg1MWM4ZTdiYzE3ZjliMTY0ZjIzMjRlZmZmMjEzZDRkZDM5NzMxZmJkYTk2NWFiMzgzNzhhN2Q1MjgyMWMzIiwicGlkIjoia2FnZ2xlLTE2MTYwNyIsInN2YyI6IndlYi1mZSIsInNkYWsiOiJBSXphU3lBNGVOcVVkUlJza0pzQ1pXVnotcUw2NTVYYTVKRU1yZUUiLCJibGQiOiJjY2YxYjY1MTY1YWNjMjgwODdiODk4OGJiNmU1NzFjMjQwZmRmMjQ5In0.; _ga_T7QHS60L4Q=GS2.1.s1772035782$o5$g1$t1772035800$j42$l0$h0",
    "origin": "https://www.kaggle.com",
    "referer": "https://www.kaggle.com/datasets/asaniczka/amazon-canada-products-2023-2-1m-products",
    "x-kaggle-build-version": "29506ea853cc6a3a542f130dec2b4a40863d7254",
    "Content-Type": "application/json",
    "x-xsrf-token": "CfDJ8E2Nv-_xTuFMnx6IZ-XCV9xzjTdHBZAlBD6-xRWkn-j29m4wlyWsJeNAnK55cbn65gFbeys7b4hBjXNJ3s1yVKRJdvbzihka4sxON-ZARxfICA"
};
exports.default = ProductRepository;
//# sourceMappingURL=productRepository.js.map