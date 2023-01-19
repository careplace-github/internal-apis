// Import logger
import logger from "../../../logs/logger.js";
import mongoose from "mongoose";

import * as Schemas from "../models/index.js";

import deletedDocumentSchema from "../models/_deletion_/deletion.model.js";
import { MONGODB_DB_DELETES_URI } from "../../../config/constants/index.js";

import * as LayerError from "../utils/errors/layer/index.js";

/**
 * Data Access Object Methods
 *
 * @see https://mongoosejs.com/docs/models.html#constructing-documents
 */
export default class DAO {
  constructor(document_model, document_collection) {
    this.Document = document_model;
    this.Collection = document_collection;
    // Get the type of the document from the collection name by removing the last letter and capitalizing the first letter.
    this.Type =
      document_collection.charAt(0).toUpperCase() +
      document_collection.slice(1, -1);
  }

  async create(document) {
    logger.info(
      `${this.Collection}DAO ADD Request: \n ${JSON.stringify(
        document,
        null,
        2
      )} \n}`
    );

    document._id = new mongoose.Types.ObjectId();

    var insertedDocument = await this.Document.create(document);

    // Convert the inserted document to a JSON object.
    let response = await insertedDocument.toObject();

    // Remove the fields that are not needed in the response.
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;

    logger.info(
      `${this.Collection}DAO ADD Response: \n ${JSON.stringify(
        insertedDocument,
        null,
        2
      )}\n`
    );

    return response;
  }

  async retrieve(document_id, populate) {
    logger.info(
      `${this.Collection}DAO RETRIEVE Request: \n { \n _id: ${document_id} \n} \n`
    );

    let document;

    /**
     * @todo Check if it has something to do with the populate parameter.
     */

    try {
      if (populate) {
        document = await this.Document.findById(document_id).populate(populate);
      } else {
        document = await this.Document.findById(document_id);
      }
    } catch (err) {}

    if (document == null) {
      throw new LayerError.NOT_FOUND();
    }

    // Convert the document to a JSON object.
    let response = await document.toObject();

    // Remove the fields that are not needed in the response.
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;

    logger.info(
      `${this.Collection}DAO RETRIEVE Response: \n ${JSON.stringify(
        response,
        null,
        2
      )}\n`
    );

    return response;
  }

  async update(document) {
    logger.info(
      `${this.Collection}DAO UPDATE Request: \n ${JSON.stringify(
        document,
        null,
        2
      )} \n}`
    );

    /**
     * The document passed as a parameter is a JSON object and not a mongoose document.
     * Therefore, it is necessary to convert it to a mongoose document in order to use its methods.
     */
    let documentToBeUpdated = await new this.Document(document);

    // Check if the document fulfills the model requirements.
    await documentToBeUpdated.verifyModel;

    // Update the document.
    let updatedDocument = await this.Document.findByIdAndUpdate(
      document._id,
      document,
      { new: true }
    );

    if (!updatedDocument) {
      throw new LayerError.NOT_FOUND();
    }

    // Convert the document to a JSON object.
    let response = await updatedDocument.toObject();

    // Remove the fields that are not needed in the response.
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;

    logger.info(
      `${this.Collection}DAO SET UPDATE: \n ${JSON.stringify(
        response,
        null,
        2
      )}\n`
    );

    return response;
  }

  async delete(document_id) {
    logger.info(
      `${this.Collection}DAO DELETE Request: \n { \n _id: ${document_id} \n}`
    );

    let document_exists = await this.Document.findById(document_id);

    if (document_exists === null) {
      throw new LayerError.NOT_FOUND();
    }

    let db_connection_deletes = await mongoose.createConnection(
      MONGODB_DB_DELETES_URI
    );
    let deletedDocument = await db_connection_deletes.model(
      this.Collection,

      deletedDocumentSchema
    );

    let documentToDelete = await deletedDocument.create({
      _id: new mongoose.Types.ObjectId(),

      document_type: document_exists.type,

      // Collection name from the model
      document_collection: document_exists.collection.collectionName,

      document_deleted: document_exists,
    });

    await document_exists.deleteOne();

    logger.info(
      `${this.Collection}DAO DELETE Deleted Document: \n ${JSON.stringify(
        documentToDelete,
        null,
        2
      )}\n`
    );

    // Convert the deleted document to a JSON object.
    let auxResponse = documentToDelete.toObject();
    let response = auxResponse.document_deleted;

    // Remove the fields that are not needed in the response.
    delete response.createdAt;
    delete response.updatedAt;
    delete response.__v;

    logger.info(
      `${this.Collection}DAO DELETE Response: \n ${JSON.stringify(
        response,
        null,
        2
      )}\n`
    );

    return response;
  }

  async query_list(filters, options, page, documentsPerPage, populate) {
    try {
      logger.info(
        `${this.Collection}DAO QUERY_LIST Request: \n ${JSON.stringify(
          {
            filters: filters,
            options: options,
            page: page,
            documentsPerPage: documentsPerPage,
            populate: populate,
          },
          null,
          2
        )} \n}`
      );

      if (options) {
        if (options.sort) {
          options.sort = { [options.sort]: 1 };
        }
      }

      try {
        /**
         * @see https://mongoosejs.com/docs/api.html#model_Model-find
         */
        var documents = await this.Document.find(filters, null, options)
          .skip(page * documentsPerPage)
          .limit(documentsPerPage)
          .populate(populate)
          .exec();
      } catch (error) {
        throw new Error._500(error);
      }

      if (documents === null) {
        throw new LayerError.NOT_FOUND(`Unable to find any ${this.Type}`);
      }

      // If there is only one document, return the document instead of an array with one document.
      if (documents.length === 1) {
        documents = documents[0];
      }

      // Convert each document of the array 'documents' to a JSON object.
      for (let i = 0; i < documents.length; i++) {
        documents[i] = await documents[i].toObject();

        // Remove the fields that are not needed in the response.
        delete documents[i].__v;
        delete documents[i].createdAt;
        delete documents[i].updatedAt;
      }

      logger.info(
        `${this.Collection}DAO QUERY_LIST Response: \n ${JSON.stringify(
          documents,
          null,
          2
        )} \n}`
      );

      return documents;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(error.message);
    }
  }

  async query_one(filters, populate) {
    try {
      logger.info(
        `${this.Collection}DAO QUERY_ONE Request: \n ${JSON.stringify(
          {
            filters: filters,
            populate: populate,
          },
          null,
          2
        )} \n}`
      );

      let document;

      /**
       * @see https://mongoosejs.com/docs/api.html#model_Model-find
       */

      try {
        document = await this.Document.findOne(filters)
          .populate(populate)
          .exec();
      } catch (error) {
        switch (error.name) {
          case "CastError":
            throw new LayerError.INVALID_PARAMETER(error.message);

          default:
            throw new LayerError.INTERNAL_ERROR(error.message);
        }
      }

      if (document === null) {
        throw new LayerError.NOT_FOUND(`Unable to find any ${this.Type}`);
      }

      logger.info(
        `${this.Collection}DAO QUERY_ONE Response: \n ${JSON.stringify(
          document,
          null,
          2
        )} \n}`
      );

      return document;
    } catch (error) {
      throw new LayerError.INTERNAL_ERROR(error.message);
    }
  }

  async retrieveModel(document_id) {
    logger.info(
      `${this.Collection}DAO RETRIEVE_MODEL Request: \n { \n _id: ${document_id} \n} \n`
    );

    let model;

    /**
     * @todo Check if it has something to do with the populate parameter.
     */

    try {
      if (populate) {
        model = await this.Document.findById(document_id).populate(populate);
      } else {
        model = await this.Document.findById(document_id);
        console.log(`Model: ${model}`)
      }
    } catch (err) {}

    if (model === null) {
      throw new LayerError.NOT_FOUND();
    }

    logger.info(
      `${this.Collection}DAO RETRIEVE Response: \n ${JSON.stringify(
        model,
        null,
        2
      )}\n`
    );

    return model;
  }
}
