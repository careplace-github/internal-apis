import mongoose, {
  Document,
  Model,
  Query,
  PopulateOptions,
  FilterQuery,
  HydratedDocument,
  UnpackedIntersection,
  Types,
} from 'mongoose';
import { LayerError } from '@utils';
import { IQueryListResponse } from 'src/packages/interfaces';
import logger from '@logger';

// T extends Document constrains T to be a Mongoose Document
export default abstract class DAO<T extends Document> {
  private readonly Model: Model<T>;

  protected readonly Collection: string;

  protected readonly Type: string;

  constructor(documentModel: Model<T>, documentCollection: string) {
    this.Model = documentModel;
    this.Collection = documentCollection;

    this.Type = documentCollection?.charAt(0)?.toUpperCase() + documentCollection?.slice(1, -1);
  }

  async create(document: T, session?: mongoose.ClientSession): Promise<T> {
    logger.info(
      `${this.Collection}DAO CREATE Request: \n ${JSON.stringify(document, null, 2)} \n}`
    );

    let createdDocument: T;
    try {
      document._id = new mongoose.Types.ObjectId();

      const newDocument = new this.Model(document);

      createdDocument = await newDocument.save({ session });
    } catch (err: any) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

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
    logger.info(
      `${this.Collection}DAO CREATE Response: \n ${JSON.stringify(createdDocument, null, 2)} \n`
    );

    return createdDocument;
  }

  async retrieve(
    documentId: string,
    populate?: PopulateOptions | PopulateOptions[],
    session?: mongoose.ClientSession
  ): Promise<T> {
    logger.info(`${this.Collection}DAO RETRIEVE Request: \n { \n _id: ${documentId} \n} \n`);

    let query = this.Model.findById(documentId) as mongoose.Query<T | null, T, {}>;

    if (populate) {
      query = query.populate(populate) as mongoose.Query<T | null, T, {}>;
    }
    if (session) {
      query = query.session(session); // Set the session for the query
    }

    let document: T | null;
    try {
      document = await query.exec();
    } catch (err: any) {
      logger.error(`${this.Collection}DAO RETRIEVE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      switch (err.name) {
        case 'CastError':
          throw new LayerError.NOT_FOUND(err.message);
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }

    if (!document) {
      throw new LayerError.NOT_FOUND(`${this.Type} not found.`);
    }

    logger.info(
      `${this.Collection}DAO RETRIEVE Response: \n ${JSON.stringify(document, null, 2)}\n`
    );

    return document;
  }

  async update(document: T, session?: mongoose.ClientSession): Promise<T> {
    logger.info(
      `${this.Collection}DAO UPDATE Request: \n ${JSON.stringify(document, null, 2)} \n}`
    );

    const documentToUpdate = new this.Model(document);

    let rawUpdatedDocument: T;
    let updatedDocument: T;

    try {
      rawUpdatedDocument = (await this.Model.findByIdAndUpdate(
        document._id,
        documentToUpdate.toObject(),
        { new: true, session }
      )) as T;
    } catch (err: any) {
      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }

    logger.info(
      `${this.Collection}DAO UPDATE Response: \n ${JSON.stringify(rawUpdatedDocument, null, 2)}\n`
    );

    return rawUpdatedDocument;
  }

  async delete(documentId: string | Types.ObjectId, session?: mongoose.ClientSession): Promise<T> {
    logger.info(`${this.Collection}DAO DELETE Request: \n { \n _id: ${documentId} \n}`);

    let deletedDocument: T | null;

    try {
      let query = this.Model.findByIdAndDelete(documentId);

      if (session) {
        query = query.session(session);
      }

      deletedDocument = await query.exec();

      if (!deletedDocument) {
        throw new LayerError.NOT_FOUND(`${this.Type} not found.`);
      }
    } catch (err: any) {
      logger.error(`${this.Collection}DAO DELETE Error: \n ${JSON.stringify(err, null, 2)} \n`);

      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }

    logger.info(
      `${this.Collection}DAO DELETE Response: \n ${JSON.stringify(deletedDocument, null, 2)}\n`
    );

    return deletedDocument;
  }

  async queryList(
    filters: FilterQuery<T>,
    options?: Record<string, any>,
    page = 1,
    documentsPerPage = 10,
    populate?: PopulateOptions | PopulateOptions[],
    select?: string,
    session?: mongoose.ClientSession
  ): Promise<IQueryListResponse<T>> {
    logger.info(
      `${this.Collection}DAO QUERY_LIST Request: \n ${JSON.stringify(
        { filters, options, page, documentsPerPage, populate },
        null,
        2
      )} \n}`
    );

    let response: IQueryListResponse<T>;

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

      if (session) {
        query.session(session);
      }

      const [data, totalDocuments] = await Promise.all([
        query.exec(),
        this.Model.countDocuments(filters).exec(),
      ]);

      console.log('DATA HERE ->', data);

      const totalPages = Math.ceil(totalDocuments / documentsPerPage);

      response = {
        data,
        page: page > 0 ? page : 1,
        documentsPerPage: documentsPerPage > 0 ? documentsPerPage : totalDocuments,
        totalPages: totalPages > 0 ? totalPages : 1,
        totalDocuments: totalDocuments >= 0 ? totalDocuments : 1,
      };
    } catch (err: any) {
      logger.error(
        `${this.Collection}DAO QUERY_LIST Error: \n ${JSON.stringify(err.stack, null, 2)} \n`
      );

      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      switch (err.name) {
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }

    logger.info(
      `${this.Collection}DAO QUERY_LIST Response: \n ${JSON.stringify(response, null, 2)} \n}`
    );

    return response;
  }

  async queryOne(
    filters: FilterQuery<T>,
    populate?: PopulateOptions | PopulateOptions[],
    session?: mongoose.ClientSession
  ): Promise<T> {
    logger.info(
      `${this.Collection}DAO QUERY_ONE Request: \n ${JSON.stringify(
        { filters, populate },
        null,
        2
      )} \n}`
    );

    let document: T | null;

    try {
      let query = this.Model.findOne(filters);

      if (populate) {
        query = query.populate(populate) as Query<
          HydratedDocument<T, {}, {}> | null,
          HydratedDocument<T, {}, {}>,
          {},
          T
        >;
      }

      if (session) {
        query = query.session(session);
      }

      document = (await query.exec()) as T;

      logger.info(`DOCUMENT : ${document}`);
    } catch (err: any) {
      logger.error(`${this.Collection}DAO QUERY_ONE Error: ${err.stack}`);

      if (session) {
        await session.abortTransaction();
        session.endSession();
      }

      switch (err.name) {
        case 'CastError':
          throw new LayerError.INVALID_PARAMETER(err.message);
        default:
          throw new LayerError.INTERNAL_ERROR(err.message);
      }
    }

    logger.info(
      `${this.Collection}DAO QUERY_ONE Response: \n ${JSON.stringify(document, null, 2)} \n}`
    );

    if (!document) {
      throw new LayerError.NOT_FOUND(`No ${this.Collection} found.`);
    }

    return document;
  }
}
