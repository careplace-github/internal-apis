// Import logger
import logger from "../../../logs/logger.js";
import mongoose from "mongoose";

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
    this.Type = this.Collection.slice(0, -1);
  }

  async add(document) {
    logger.info(`${this.Collection} DAO`);
    logger.info(
      `Attempting to add document to MongoDB: ${JSON.stringify(
        document,
        null,
        2
      )}\n`
    );

    // Add every attribute from the document to the documentToAdd object.
    let documentToAdd = {};
    for (let attribute in document) {
      documentToAdd[attribute] = document[attribute];
    }

    documentToAdd._id = new mongoose.Types.ObjectId();

    console.log("documentToAdd: " + JSON.stringify(documentToAdd, null, 2));

    let insertedDocument = await new this.Document(documentToAdd);

    logger.info(
      `Successfully added document to MongoDB: ${JSON.stringify(
        insertedDocument,
        null,
        2
      )}\n`
    );

    return insertedDocument;
  }

  async get_one(document_id) {
    logger.info(`${this.Collection} DAO`);
    logger.info(
      `Attempting to get document from MongoDB with the _id: ${JSON.stringify(
        document_id,
        null,
        2
      )}\n`
    );

    let document = await this.Document.findById(document_id);

    if (!document) {
      logger.info(
        `No document found in MongoDB with the id_: ${JSON.stringify(
          document_id,
          null,
          2
        )}\n`
      );

      throw new not_found(
        `Unable to find document with the id: ${document_id} in MongoDB.`
      );
    }

    logger.info(
      `Successfully got document from MongoDB: ${JSON.stringify(
        document,
        null,
        2
      )}\n`
    );

    return document;
  }

  async set(document) {}

  async delete(document_id) {
    logger.info(
      `${this.Collection}DAO DELETE Method: \n { \n _id: ${document_id} \n} \n`
    );

    let document_exists = await this.Document.findById(document_id);

    if (!document_exists) {
      throw new Error._400(`${this.Type} not found with the id: ${document_id}`);
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

    // Remove the fields createdAt, updatedAt and __v from the documentToDelete object.
    documentToDelete = await documentToDelete.save();

    await document_exists.deleteOne();

    logger.info(
      `Successfully deleted document from MongoDB: ${JSON.stringify(
        documentToDelete,
        null,
        2
      )}\n`
    );

    return documentToDelete;
  }
}
