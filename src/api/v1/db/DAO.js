// Import logger
import logger from "../../../logs/logger.js";
import mongoose from "mongoose";

import * as Schemas from "../models/index.js";

import deletedDocumentSchema from "../models/_deletion_/deletion.model.js";
import { MONGODB_db_deletes_uri } from "../../../config/constants/index.js";

import * as Error from "../middlewares/errors/index.js";

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

  async get_list(filters, options, page, documentsPerPage, populate) {
    logger.info(
      `${this.Collection}DAO GET_LIST Request: \n ${JSON.stringify(
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

    let query = {};

    // Check if there is any attribute to filter by that does not exist in the document schema.
    if (filters) {
      for (const [key, value] of Object.entries(filters)) {
        if (!this.Document.schema.obj[key]) {
          throw new Error._400(
            `The attribute '${key}' does not exist in the ${this.Type} schema.`
          );
        }
      }
    }

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

    // If there is only one document, return the document instead of an array with one document.
    if (documents.length === 1) {
      documents = documents[0];
    }

    logger.info(
      `${this.Collection}DAO GET_LIST Response: \n ${JSON.stringify(
        documents,
        null,
        2
      )} \n}`
    );

    return documents;
  }

  async add(document) {
    logger.info(
      `${this.Collection}DAO ADD Request: \n ${JSON.stringify(
        document,
        null,
        2
      )} \n}`
    );

    document._id = new mongoose.Types.ObjectId();

    try {
      var insertedDocument = await this.Document.create(document);
    } catch (error) {
      // Check if the error is due to a missing required attribute.
      if (error.name === "ValidationError") {
        let missingAttributes = [];
        for (let attribute in error.errors) {
          // Wrap the attribute in single quotes
          let attributeWithQuotes = `'${attribute}'`;

          // Add a space at the beggining of the attribute with exception of the first attribute.
          let attributeWithSpaces =
            missingAttributes.length > 0
              ? ` ${attributeWithQuotes}`
              : attributeWithQuotes;

          missingAttributes.push(attributeWithSpaces);
        }

        throw new Error._400(
          `${this.Type} validation failed. Missing attributes: ${missingAttributes}.`
        );
      }
    }

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

  async get_one(document_id, populate) {
    let test = Schemas.userSchema;

    logger.info(
      `${this.Collection}DAO GET_ONE Request: \n { \n _id: ${document_id} \n} \n`
    );

    let document = await this.Document.findById(document_id).populate(populate);

    if (!document) {
      throw new Error._404(
        `${this.Type} not found with the id: ${document_id}`
      );
    }

    // Convert the document to a JSON object.
    let response = await document.toObject();

    // Remove the fields that are not needed in the response.
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;

    logger.info(
      `${this.Collection}DAO GET_ONE Response: \n ${JSON.stringify(
        response,
        null,
        2
      )}\n`
    );

    return response;
  }

  async set(document) {
    logger.info(
      `${this.Collection}DAO SET Request: \n ${JSON.stringify(
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
      throw new Error._400(
        `${this.Type} not found with the id: ${document._id}`
      );
    }

    // Convert the document to a JSON object.
    let response = await updatedDocument.toObject();

    // Remove the fields that are not needed in the response.
    delete response.__v;
    delete response.createdAt;
    delete response.updatedAt;

    logger.info(
      `${this.Collection}DAO SET Response: \n ${JSON.stringify(
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

    if (!document_exists) {
      throw new Error._400(
        `${this.Type} not found with the id: ${document_id}`
      );
    }

    let db_connection_deletes = await mongoose.createConnection(
      MONGODB_db_deletes_uri
    );
    let DeletedDocument = await db_connection_deletes.model(
      this.Collection,

      deletedDocumentSchema
    );

    let documentToDelete = await DeletedDocument.create({
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
}
