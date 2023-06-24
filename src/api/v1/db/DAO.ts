import logger from '../../../logs/logger';
import mongoose, {
  Document,
  Model,
  Query,
  PopulateOptions,
  FilterQuery,
  HydratedDocument,
  UnpackedIntersection,
} from 'mongoose';
import * as LayerError from '../utils/errors/layer/index';

export default abstract class DAO<T extends Document> {
  private readonly Model: Model<T>;
  protected readonly Collection: string;
  protected readonly Type: string;

  constructor(documentModel: Model<T>, documentCollection: string) {
    this.Model = documentModel;
    this.Collection = documentCollection;
    this.Type = documentCollection.charAt(0).toUpperCase() + documentCollection.slice(1, -1);
  }

  async create(document: Partial<T>): Promise<Partial<T>> {
    logger.info(
      `${this.Collection}DAO CREATE Request: \n ${JSON.stringify(document, null, 2)} \n}`
    );

    document._id = new mongoose.Types.ObjectId();

    try {
      const insertedDocument = await this.Model.create(document);
      const response = insertedDocument.toObject();

      delete response.__v;

      logger.info(
        `${this.Collection}DAO CREATE Response: \n ${JSON.stringify(response, null, 2)} \n`
      );

      return response as Partial<T>;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO CREATE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        case 'ValidationError':
          throw new LayerError.INVALID_PARAMETER(err.message);
        case 'MongoServerError':
          switch (err.code) {
            case 11000:
              throw new LayerError.INVALID_PARAMETER(
                `Duplicate key error: ${JSON.stringify(err.keyValue, null, 2)}`
              );
          }
      }
      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }

  async retrieve(
    documentId: string,
    populate?: PopulateOptions | PopulateOptions[]
  ): Promise<Partial<T>> {
    logger.info(`${this.Collection}DAO RETRIEVE Request: \n { \n _id: ${documentId} \n} \n`);

    try {
      let query: mongoose.Query<UnpackedIntersection<T, T> | null, UnpackedIntersection<T, T>, {}, UnpackedIntersection<T, T>>;

      query = this.Model.findById(documentId) as mongoose.Query<UnpackedIntersection<T, T> | null, UnpackedIntersection<T, T>, {}, UnpackedIntersection<T, T>>;
      if (populate) {
        query = query.populate(populate) as mongoose.Query<UnpackedIntersection<T, T> | null, UnpackedIntersection<T, T>, {}, UnpackedIntersection<T, T>>;
      }
      const document = await query.exec();

      if (!document) {
        throw new LayerError.NOT_FOUND(`No ${this.Type} found with id ${documentId}`);
      }

      const response = document;

      logger.info(
        `${this.Collection}DAO RETRIEVE Response: \n ${JSON.stringify(response, null, 2)}\n`
      );

      return response as Partial<T>;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO RETRIEVE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        case 'CastError':
          throw new LayerError.NOT_FOUND(err.message);
      }
      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }

  async update(document: Partial<T>): Promise<Partial<T>> {
    logger.info(
      `${this.Collection}DAO UPDATE Request: \n ${JSON.stringify(document, null, 2)} \n}`
    );

    try {
      const documentToBeUpdated = await this.Model.findById(document._id);
      if (!documentToBeUpdated) {
        throw new LayerError.NOT_FOUND(`No`);
      }

      Object.assign(documentToBeUpdated, document);
      await documentToBeUpdated.save();

      const response = documentToBeUpdated.toObject();

      delete response.__v;

      logger.info(
        `${this.Collection}DAO UPDATE Response: \n ${JSON.stringify(response, null, 2)}\n`
      );

      return response as Partial<T>;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO UPDATE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        case 'CastError':
          throw new LayerError.NOT_FOUND(err.message);
      }
      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }

  async delete(documentId: string): Promise<Partial<T>> {
    logger.info(`${this.Collection}DAO DELETE Request: \n { \n _id: ${documentId} \n}`);

    try {
      const documentToDelete = await this.Model.findByIdAndDelete(documentId);

      if (!documentToDelete) {
        throw new LayerError.NOT_FOUND(`No`);
      }

      const response = documentToDelete.toObject();

      delete response.__v;

      logger.info(
        `${this.Collection}DAO DELETE Response: \n ${JSON.stringify(response, null, 2)}\n`
      );

      return response as Partial<T>;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO DELETE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      switch (err.name) {
        case 'CastError':
          throw new LayerError.NOT_FOUND(err.message);
      }
      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }

  async queryList(
    filters: FilterQuery<T>,
    options: Record<string, any>,
    page: number,
    documentsPerPage: number,
    populate?: PopulateOptions | PopulateOptions[],
    select?: string
  ): Promise<QueryListResponse<T>> {
    logger.info(
      `${this.Collection}DAO QUERY_LIST Request: \n ${JSON.stringify(
        { filters, options, page, documentsPerPage, populate },
        null,
        2
      )} \n}`
    );

    const sort = options?.sort || '-createdAt';

    try {
      const query = this.Model.find(filters)
        .select(select)
        .skip(page > 0 ? (page - 1) * documentsPerPage : 0)
        .limit(documentsPerPage > 0 ? documentsPerPage : 0)
        .sort(sort);

      if (populate) {
        query.populate(populate);
      }

      const [data, totalDocuments] = await Promise.all([
        query.exec(),
        this.Model.countDocuments(filters).exec(),
      ]);

      const totalPages = Math.ceil(totalDocuments / documentsPerPage);

      const response: QueryListResponse<T> = {
        data,
        page: page > 0 ? page : 1,
        documentsPerPage: documentsPerPage > 0 ? documentsPerPage : totalDocuments,
        totalPages: totalPages > 0 ? totalPages : 1,
        totalDocuments: totalDocuments >= 0 ? totalDocuments : 1,
      };

      logger.info(
        `${this.Collection}DAO QUERY_LIST Response: \n ${JSON.stringify(response, null, 2)} \n}`
      );

      return response;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO QUERY_LIST Error: \n ${JSON.stringify(err, null, 2)} \n`);

      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }

  async queryOne(
    filters: FilterQuery<T>,
    populate?: PopulateOptions | PopulateOptions[]
  ): Promise<HydratedDocument<T>> {
    logger.info(
      `${this.Collection}DAO QUERY_ONE Request: \n ${JSON.stringify(
        { filters, populate },
        null,
        2
      )} \n}`
    );

    try {
      let query = this.Model.findOne(filters);

      logger.info(`QUERY : ` + query);

      if (populate) {
        query = query.populate(populate) as Query<
          HydratedDocument<T, {}, {}> | null,
          HydratedDocument<T, {}, {}>,
          {},
          T
        >;
      }

      const document = await query.exec();

      logger.info(`DOCUMENT : ${document}`);

      if (!document) {
        throw new LayerError.NOT_FOUND(`No ${this.Collection} found.`);
      }

      logger.info(
        `${this.Collection}DAO QUERY_ONE Response: \n ${JSON.stringify(document, null, 2)} \n}`
      );

      return document;
    } catch (err: any) {
      logger.error(`${this.Collection}DAO QUERY_ONE Error: ` + err.stack);

      switch (err.name) {
        case 'CastError':
          throw new LayerError.INVALID_PARAMETER(err.message);
      }
      throw new LayerError.INTERNAL_ERROR(err.message);
    }
  }
}

// --------------------------------------------------------------------------------------------- //

interface QueryListResponse<T> {
  data: T[];
  page: number;
  documentsPerPage: number;
  totalPages: number;
  totalDocuments: number;
}

type HydratedQuery<T> = Query<
  HydratedDocument<T, {}, {}> | UnpackedIntersection<HydratedDocument<T, {}, {}>, T> | null,
  HydratedDocument<T, {}, {}> | UnpackedIntersection<HydratedDocument<T, {}, {}>, T>,
  {},
  T
>;


// --------------------------------------------------------------------------------------------- //
