import MongooseRepository from "./mongooseRepository";
import MongooseQueryUtils from "../utils/mongooseQueryUtils";
import AuditLogRepository from "./auditLogRepository";
import Error404 from "../../errors/Error404";
import { IRepositoryOptions } from "./IRepositoryOptions";
import FileRepository from "./fileRepository";
import Product from "../models/product";
import UserRepository from "./userRepository";
import RecordRepository from "./recordRepository";
import Error405 from "../../errors/Error405";
import Error400 from "../../errors/Error400";
import axios from "axios";
import Records from "../models/records";
class ProductRepository {

  private static baseConfig = {
    "cookie": "ka_sessionid=bf403f9b5a9c413a0b2277c373caf9cc; _ga=GA1.1.1181949918.1771128107; ACCEPTED_COOKIES=true; CSRF-TOKEN=CfDJ8E2Nv-_xTuFMnx6IZ-XCV9wTYFCeYd6-lLUZ4aIvgZ7HaS2J5Hhjx4u7tBxo53a-b9C0DqA_CZDTJuoVlFzSbYk1KY56hqd4zxP2c6BMZA; GCLB=CNrq7NWqgL-MmwEQAw; build-hash=ccf1b65165acc28087b8988bb6e571c240fdf249; XSRF-TOKEN=CfDJ8E2Nv-_xTuFMnx6IZ-XCV9xzjTdHBZAlBD6-xRWkn-j29m4wlyWsJeNAnK55cbn65gFbeys7b4hBjXNJ3s1yVKRJdvbzihka4sxON-ZARxfICA; CLIENT-TOKEN=eyJhbGciOiJub25lIiwidHlwIjoiSldUIn0.eyJpc3MiOiJrYWdnbGUiLCJhdWQiOiJjbGllbnQiLCJzdWIiOiIiLCJuYnQiOiIyMDI2LTAyLTI1VDE2OjA5OjU5LjQ0ODg4OTdaIiwiaWF0IjoiMjAyNi0wMi0yNVQxNjowOTo1OS40NDg4ODk3WiIsImp0aSI6IjcwMDRiYmJhLTM2NzEtNDE3NS1iODIzLWExMGQ5MGRmOTVlZiIsImV4cCI6IjIwMjYtMDMtMjVUMTY6MDk6NTkuNDQ4ODg5N1oiLCJhbm9uIjp0cnVlLCJmZmgiOiJlOTg1MWM4ZTdiYzE3ZjliMTY0ZjIzMjRlZmZmMjEzZDRkZDM5NzMxZmJkYTk2NWFiMzgzNzhhN2Q1MjgyMWMzIiwicGlkIjoia2FnZ2xlLTE2MTYwNyIsInN2YyI6IndlYi1mZSIsInNkYWsiOiJBSXphU3lBNGVOcVVkUlJza0pzQ1pXVnotcUw2NTVYYTVKRU1yZUUiLCJibGQiOiJjY2YxYjY1MTY1YWNjMjgwODdiODk4OGJiNmU1NzFjMjQwZmRmMjQ5In0.; _ga_T7QHS60L4Q=GS2.1.s1772035782$o5$g1$t1772035800$j42$l0$h0",
    "origin": "https://www.kaggle.com",
    "referer": "https://www.kaggle.com/datasets/asaniczka/amazon-canada-products-2023-2-1m-products",
    "x-kaggle-build-version": "29506ea853cc6a3a542f130dec2b4a40863d7254",
    "Content-Type": "application/json",
    "x-xsrf-token": "CfDJ8E2Nv-_xTuFMnx6IZ-XCV9xzjTdHBZAlBD6-xRWkn-j29m4wlyWsJeNAnK55cbn65gFbeys7b4hBjXNJ3s1yVKRJdvbzihka4sxON-ZARxfICA"
  };
  static async create(data, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);
    const currentUser = MongooseRepository.getCurrentUser(options);

    const [record] = await Product(options.database).create(
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


  private static async fetchKaggleData(dataConfig: any, value: any, titleIndex: number, imageIndex: number) {
    const url = "https://www.kaggle.com/api/i/datasets.DatasetService/GetDataViewExternal";

    try {
      const response = await axios.post(url, dataConfig, { headers: this.baseConfig });
      const payload = response?.data?.dataView?.dataTable?.rows;

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
    } catch (error) {
      console.error('Error fetching data from Kaggle:', error);
      throw error;
    }
  }


  private static generateRandomPrice(minStr: string, maxStr: string): string {
    const min = parseFloat(minStr);
    const max = parseFloat(maxStr);

    if (isNaN(min) || isNaN(max)) {
      return '0.00';
    }

    const randomPrice = (Math.random() * (max - min) + min).toFixed(2);
    return randomPrice;
  }
  // VIP 1 - Amazon Canada Products
  static async Vip1(value: any) {
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

    return await ProductRepository.fetchKaggleData(data, value, 1, 2);
  }

  // VIP 2 - Home and Kitchen
  static async Vip2(value: any) {
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
    return await ProductRepository.fetchKaggleData(data, value, 0, 3);


  }

  // VIP 3 - Car Parts
  static async Vip3(value: any) {
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

    return await ProductRepository.fetchKaggleData(data, value, 0, 3);

  }

  // VIP 4 - Air Conditioners
  static async Vip4(value: any) {
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

    return await ProductRepository.fetchKaggleData(data, value, 0, 3);

  }

  // VIP 5 - Grocery and Gourmet Foods
  static async Vip5(value: any) {
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

    return await ProductRepository.fetchKaggleData(data, value, 0, 3);

  }




  static async update(id, data, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let record = await MongooseRepository.wrapWithSessionIfExists(
      Product(options.database).findById(id),
      options
    );

    if (!record || String(record.tenant) !== String(currentTenant.id)) {
      throw new Error404();
    }

    await Product(options.database).updateOne(
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
      Product(options.database).findById(id),
      options
    );

    if (!record || String(record.tenant) !== String(currentTenant.id)) {
      throw new Error404();
    }

    await Product(options.database).deleteOne({ _id: id }, options);

    await this._createAuditLog(AuditLogRepository.DELETE, id, record, options);
  }

  static async count(filter, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    return MongooseRepository.wrapWithSessionIfExists(
      Product(options.database).countDocuments({
        ...filter,
        tenant: currentTenant.id,
      }),
      options
    );
  }

  static async findById(id, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let record = await MongooseRepository.wrapWithSessionIfExists(
      Product(options.database).findById(id).populate("vip"),
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

    let criteriaAnd: any = [];

    criteriaAnd.push({
      tenant: currentTenant.id,
    });

    if (filter) {
      if (filter.id) {
        criteriaAnd.push({
          ["_id"]: MongooseQueryUtils.uuid(filter.id),
        });
      }

      if (filter.title) {
        criteriaAnd.push({
          title: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.title),
            $options: "i",
          },
        });
      }

      if (filter.amount) {
        criteriaAnd.push({
          amount: {
            $regex: MongooseQueryUtils.escapeRegExp(filter.amount),
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

    const sort = MongooseQueryUtils.sort(orderBy || "createdAt_DESC");

    const skip = Number(offset || 0) || undefined;
    const limitEscaped = Number(limit || 0) || undefined;
    const criteria = criteriaAnd.length ? { $and: criteriaAnd } : null;

    let rows = await Product(options.database)
      .find(criteria)
      .skip(skip)
      .limit(limitEscaped)
      .populate("vip")
      .sort(sort);

    const count = await Product(options.database).countDocuments(criteria);

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

    const records = await Product(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    return records.map((record) => ({
      id: record.id,
      label: record.title,
      price: record.price
    }));
  }



  static async findAllAutocompleteProduct(search, limit, options: IRepositoryOptions) {
    const currentTenant = MongooseRepository.getCurrentTenant(options);

    let criteriaAnd: Array<any> = [
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
            _id: MongooseQueryUtils.uuid(search),
          },
          {
            title: {
              $regex: MongooseQueryUtils.escapeRegExp(search),
              $options: "i",
            },
          },
        ],
      });
    }

    const sort = MongooseQueryUtils.sort("title_ASC");
    const limitEscaped = Number(limit || 0) || undefined;

    const criteria = { $and: criteriaAnd };

    const records = await Product(options.database)
      .find(criteria)
      .limit(limitEscaped)
      .sort(sort);

    return records.map((record) => {
      return {
      id: record.id,
      label: record.title,
      amount: record.amount
    };
    });
  }

  static async _createAuditLog(action, id, data, options: IRepositoryOptions) {
    await AuditLogRepository.log(
      {
        entityName: Product(options.database).modelName,
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

  static async grapOrders(options: IRepositoryOptions) {
    const currentUser = MongooseRepository.getCurrentUser(options);
    const currentVip = currentUser.vip.id;
    const giftPosition = Number(currentUser.prizesNumber) || 0;
    if (!currentUser?.vip) {


      throw new Error400(options.language, "validation.requiredSubscription");
    }

    // Check for pending orders
    const pendingRecords = await Records(options.database).find({
      user: currentUser.id,
      status: 'pending'
    });

    if (pendingRecords.length > 0) {


      throw new Error400(options.language, "validation.submitPendingProducts");
    }

    // Check daily order limit
    const dailyOrder = currentUser.vip.dailyorder;
    if (currentUser.tasksDone >= dailyOrder) {

      throw new Error400(options.language, "validation.moretasks");
    }

    // Check balance
    if (currentUser.balance <= 0 || currentUser.balance < currentUser.minbalance) {

      throw new Error400(options.language, "validation.deposit");
    }


    // Special VIP products - check if we have a mapping for current task
    const taskNumber = currentUser.tasksDone + 1;
    const mapping = currentUser.productItemMappings?.find(m => m.itemNumber === taskNumber);

    if (mapping && mapping.productId) {
      // Check if we're at the right task for this mapped product
      if (currentUser.tasksDone === (taskNumber - 1)) {

        // Find the mapped product
        const mappedProduct = await Product(options.database).findById(mapping.productId);
        if (mappedProduct) {
          // Populate VIP info if needed
          const populatedProduct = await mappedProduct.populate("vip");
          populatedProduct.photo = await FileRepository.fillDownloadUrl(populatedProduct?.photo);
          return populatedProduct;
        }
      }
    } else if (currentUser?.prizes && currentUser.tasksDone === (giftPosition - 1)) {

      let product = currentUser.prizes;
      product.photo = await FileRepository.fillDownloadUrl(product?.photo);
      return product;
    }

    // -------------------------
    // Normal product selection
    // -------------------------

    let finalPrice: number;

    if (currentUser.vip.isFixedAmount) {

      // Use min/max as fixed price
      const vipMinPrice = parseFloat(currentUser.vip.min) || 20;
      const vipMaxPrice = parseFloat(currentUser.vip.max) || 50;
      const minPrice = Math.min(vipMinPrice, vipMaxPrice);
      const maxPrice = Math.max(vipMinPrice, vipMaxPrice);
      finalPrice = Math.random() * (maxPrice - minPrice) + minPrice;
    } else {

      // Use min/max as percentage of balance (existing logic)
      const vipMinPercentage = parseFloat(currentUser.vip.min) || 20;
      const vipMaxPercentage = parseFloat(currentUser.vip.max) || 50;
      const minPercent = Math.min(vipMinPercentage, vipMaxPercentage);
      const maxPercent = Math.max(vipMaxPercentage, vipMaxPercentage);
      const randomPercentage = Math.random() * (maxPercent - minPercent) + minPercent;
      finalPrice = (currentUser.balance * randomPercentage) / 100;
    }

    finalPrice = Math.round(finalPrice * 100) / 100;



    // Get random normal product
    let products = await Product(options.database)
      .find({ vip: currentVip, type: 'normal' })
      .populate("vip");
    console.log("🚀 ~ ProductRepository ~ grapOrders ~ products:", products)

    if (products.length === 0) {
      throw new Error400(options.language, "validation.noProductsAvailable");
    }

    const randomIndex = Math.floor(Math.random() * products.length);
    const selectedProduct = products[randomIndex];

    selectedProduct.amount = finalPrice.toString();
    selectedProduct.photo = await FileRepository.fillDownloadUrl(selectedProduct?.photo);

    return selectedProduct;
  }




}

export default ProductRepository;
