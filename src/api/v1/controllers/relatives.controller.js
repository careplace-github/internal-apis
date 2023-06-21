// Import logger
import logger from '../../../logs/logger';

import authHelper from '../helpers/auth/auth.helper';
import marketplaceUsersDAO from '../db/marketplaceUsers.dao';
import relativesDAO from '../db/relatives.dao';
import ordersDAO from '../db/orders.dao';
import CRUD from './crud.controller';

import * as Error from '../utils/errors/http/index';

export default class RelativesController {
  static async create(req, res, next) {
    try {
      let response = {};
      let relative = req.body;
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers['authorization'].split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      relative.user = user._id;

      let relativeCreated = await RelativesDAO.create(relative);

      response.statusCode = 200;
      response.data = relativeCreated;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async retrieve(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;
      let RelativesDAO = new relativesDAO();

      let accessToken = req.headers['authorization'].split(' ')[1];

      let AuthHelper = new authHelper();

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403('You are not allowed to access this resource');
      }

      response.statusCode = 200;
      response.data = relative;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async update(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;

      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers['authorization'].split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      let reqRelative = req.body;

      /**
       * Do not allow to update the user or the _id
       */
      delete reqRelative.user;
      delete reqRelative._id;

      relative = {
        ...relative,
        ...req.body,
      };

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403('You are not allowed to access this resource');
      }

      let relativeUpdated = await RelativesDAO.update(relative);

      response.statusCode = 200;
      response.data = relativeUpdated;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async delete(req, res, next) {
    try {
      let response = {};
      let relativeId = req.params.id;
      let RelativesDAO = new relativesDAO();
      let OrdersDAO = new ordersDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers['authorization'].split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relative = await RelativesDAO.retrieve(relativeId);

      if (relative.user.toString() !== user._id.toString()) {
        throw new Error._403('You are not allowed to access this resource');
      }

      let relativeOrders = (await OrdersDAO.query_list({
        relative: relativeId,
      })).data;

      if (relativeOrders.length > 0) {
        throw new Error._403('You can not delete a relative with orders associated');
      }

      let relativeDeleted = await RelativesDAO.delete(relativeId);

      response.statusCode = 200;
      response.data = relativeDeleted;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  static async listRelatives(req, res, next) {
    try {
      let response = {};
      let RelativesDAO = new relativesDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers['authorization'].split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      let relatives = await RelativesDAO.query_list({
        user: user._id,
      });

      response.statusCode = 200;
      response.data = relatives;

      next(response);
    } catch (error) {
      next(error);
    }
  }
}
