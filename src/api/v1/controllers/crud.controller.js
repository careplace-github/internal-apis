import logger from "../../../logs/logger.js";
import * as Error from "../utils/errors/http/index.js";
import usersDAO from "../db/crmUsers.dao.js";
import authUtils from "../utils/auth/auth.utils.js";

export default class CRUD_Methods {
  /**
   * Constructor
   */

  constructor(dao) {
    this.DAO = dao;
  }

  /**
   * Creates a new ``Document`` in the MongoDB database.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document created.
   */
  async create(req, res, next) {
    try {
      let response = {};

      let document = req.body;

      let documentAdded = await this.DAO.add(document);

      response.statusCode = 201;
      response.data = documentAdded;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   *  Retrieves a ``Document`` from the MongoDB database.
   * The ``document`` is fetched with the query ``{_id: {$eq: documentId}}`.
   * The documentId is passed in the request ``parameteres``.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document fetched.
   * @throws {Error._400} - If the document does not exist.
   */
  async retrieve(req, res, next) {
    try {
      let response = {};

      let documentId = req.params.id;

      let documentRetrieved;
      try {
        documentRetrieved = await this.DAO.retrieve(documentId);
      } catch (err) {
        console.log("AQUI 5" + err);
        if (err.type === "NOT_FOUND") {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }

      response.statusCode = 200;
      response.data = documentRetrieved;

      next(response);
    } catch (err) {
      console.log("ERO: " + err);

      next(err);
    }
  }

  /**
   * Updates a ``Document`` from the MongoDB database.
   * The documentId is passed in the request ``parameteres``.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document updated.
   * @throws {Error._400} - If the document does not exist.
   */
  async update(req, res, next) {
    try {
      let response = {};

      let documentId = req.params.id;
      let document = req.body;

      try {
        var documentExists = await this.DAO.retrieve(documentId);
      } catch (err) {
        if (err.type === "NOT_FOUND") {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }

      // Get the Event from the database and substitute the values that are in the request body.

      let updateDocument = {
        ...documentExists,
        ...document,
      };

      let updatedDocument = await this.DAO.update(updateDocument);

      response.statusCode = 200;
      response.data = updatedDocument;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Deletes a ``Document`` from the MongoDB database.
   * The documentId is passed in the request ``parameteres``.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document deleted.
   * @throws {Error._400} - If the document does not exist.
   */
  async delete(req, res, next) {
    try {
      let response = {};
      let documentId = req.params.id;
      let deletedDocument;
      try {
        deletedDocument = await this.DAO.delete(documentId);
      } catch (err) {
        if (err.type === "NOT_FOUND") {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }

      response.statusCode = 200;
      response.data = deletedDocument;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Creates a ``Document`` in the MongoDB database.
   * Before creating the document it will search for a user with the query ``{user: {$eq: userId}}`
   * The ``userId`` is extracted from the ``req.body``.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document that matches the query.
   * @throws {Error._400} - If the user does not exist.
   */
  async createByUserId(req, res, next) {
    try {
      let response = {};

      let document = req.body;

      /**
       * We already validate if there is a user in the request body in the Input Validation Middleware so we assume that req.body.user != null
       * We still need to check if the given id of the user exists in the database.
       */
      try {
        let userExists = await usersDAO.retrieve(document.user);
      } catch (err) {
        if (err.type === "NOT_FOUND") {
          throw new Error._400(
            "User does not exist. Need a valid User to create an event."
          );
        }
      }

      let documentAdded = await this.DAO.add(document);

      response.statusCode = 200;
      response.data = documentAdded;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   *  Updates a ``Document`` in the MongoDB database.
   *  The documentId is passed in the request parameters.
   *  Before updating the document it will check if the 'user' attribute was changed. If so, it will search for a user with the query ``{user: {$eq: userId}}``
   *  The ``userId`` is extracted from the ``req.body``.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @throws {Error._400} - If the user does not exist.
   */
  async updateByUserId(req, res, next) {
    try {
      let response = {};

      let UsersDAO = new usersDAO();

      let documentId = req.params.id;
      let documentExists;
      let document = req.body;

      try {
        documentExists = await this.DAO.retrieve(documentId);
      } catch (err) {
        if (err.type === "NOT_FOUND") {
          throw new Error._400(`${this.DAO.Type} does not exist.`);
        }
      }

      // Checks if there is a user in the document to be updated.
      if (document.user != null) {
        // Checks if the user is being changed.
        if (document.user != documentExists.user) {
        }
        try {
          // Checks if the new user exists.
          let userExists = await UsersDAO.retrieve(document.user);
        } catch (err) {
          // If the user does not exist, throw an error.
          if (err.type === "NOT_FOUND") {
            throw new Error._400(
              "User does not exist. Need a valid User to update an Event."
            );
          }
        }
      }

      // Get the Document from the database and substitute the values that are in the request body.
      let updateDocument = {
        ...documentExists,
        ...document,
      };

      let updatedDocument = await this.DAO.update(updateDocument);

      response.statusCode = 200;
      response.data = updatedDocument;

      next(response);
    } catch (err) {
      next(err);
    }
  }

  /**
   * Fetches all the ``Documents`` from the MongoDB database.
   *
   * The list is fetched with the query ``{user: {$eq: userId}}``.
   * The ``cognitoId`` is exctracted Rrom the ``Access Token`` in the ``Authorization`` header.
   * Then the ``cognitoId`` is used to search for a user with the query ``{cognitoId: {$eq: cognitoId}}``.
   * The ``userId`` is extracted from the user found.
   *
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document that matches the query.
   * @throws {Error._400} - If the it does not exist a user with the ``cognitoId``.
   * @throws {Error._402} - If the ``Authorization`` header is not found.
   */
  async listByUserId(req, res, next) {
    try {
      let response = {};
      let accessToken;
      let AuthUtils = new authUtils();
      let UsersDAO = new usersDAO();

      let user;
      let documents;

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._402("No Authorization header found.");
      }

      let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

      let cognitoId = decodedToken.sub;

      try {
        user = await UsersDAO.query_one({
          cognitoId: { $eq: cognitoId },
        });
      } catch (err) {
        console.log(`ERROR 4: ${err.message}`);
        switch (err.type) {
          case "NOT_FOUND":
            throw new Error._400("User does not exist.");

          case "INVALID_PARAMETER":
            throw new Error._400(err.message);

          default:
            throw new Error._500(err.message);
        }
      }

      console.log(`USER: ${user._id}`);

      try {
        documents = await this.DAO.query_list({
          user: { $eq: user._id },
        });
      } catch (err) {
        switch (err.type) {
          case "INVALID_PARAMETER":
            throw new Error._400(err.message);

          default:
            throw new Error._500(err.message);
        }
      }

      response.statusCode = 200;
      response.data = documents;

      next(response);
    } catch (err) {
      console.log(`EROOR: ${err}`);
      next(err);
    }
  }

  /**
   * Fetches all the ``Documents`` from the MongoDB database.
   * The list is fetched with the query ``{company: {$eq: companyId}}``.
   * The ``companyId`` is exctracted from the ``Access Token`` in the ``Authorization`` header.
   *
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next function middleware.
   * @returns {Promise<JSON>} - The document that matches the query.
   * @throws {Error._400} - If the it does not exist a user with the ``cognitoId``.
   * @throws {Error._402} - If the ``Authorization`` header is not found.
   */
  async listByCompanyId(req, res, next) {
    try {
      let response = {};
      let accessToken;

      let AuthUtils = new authUtils();

      if (req.headers.authorization) {
        accessToken = req.headers.authorization.split(" ")[1];
      } else {
        throw new Error._402("No Authorization header found.");
      }

      let decodedToken = await AuthUtils.decodeJwtToken(accessToken);

      let companyId = decodedToken["custom:company"];

      let documents = await this.DAO.query_list({
        company: { $eq: companyId },
      });

      response.statusCode = 200;
      response.data = documents;

      next(response);
    } catch (err) {
      next(err);
    }
  }
}
