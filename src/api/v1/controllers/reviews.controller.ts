import { Request, Response, NextFunction } from 'express';
import mongoose, { Types, PopulateOptions, FilterQuery } from 'mongoose';

import authHelper from '../helpers/auth/auth.helper';
import reviewsDAO from '../db/reviews.dao';
import ordersDAO from '../db/orders.dao';
import companiesDAO from '../db/companies.dao';

import * as HttpError from '../utils/errors/http/index';

import { IApiResponse, IReview, IOrder } from '../interfaces';
import logger from '../../../logs/logger';
import { ReviewModel } from '../models';

export default class ReviewsController {
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IApiResponse = {
        statusCode: 100, // request received
        data: {},
      };
      let ReviewsDAO = new reviewsDAO();
      let OrdersDAO = new ordersDAO();

      let AuthHelper = new authHelper();

      let accessToken = req.headers['authorization']!.split(' ')[1];

      let user = await AuthHelper.getUserFromDB(accessToken);

      let orderId = req.params.id;
      let order: Partial<IOrder> = {};

      try {
        order = await OrdersDAO.retrieve(orderId);
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            return next(new HttpError._404('Order not found'));
        }
      }

      logger.info('Order user: ' + order?.user?.toString());
      logger.info('User id: ' + user._id.toString());

      if (order?.user?.toString() !== user._id.toString()) {
        return next(new HttpError._403('You are not allowed to create a review for this order'));
      }

      if (order?.company?.toString() !== req.body.company) {
        return next(
          new HttpError._403(
            'You are not allowed to create a review for a company that is not associated with your order'
          )
        );
      }

      if (
        order?.status === 'new' ||
        order?.status === 'declined' ||
        order?.status === 'cancelled'
      ) {
        return next(new HttpError._403('You are not allowed to create a review for this order'));
      }

      // Check if the user has already created a review for this order
      try {
        let existingReview = await ReviewsDAO.queryOne({
          order: orderId,
          user: user._id,
        });

        if (existingReview) {
          return next(new HttpError._403('You have already created a review for this order.'));
        }
      } catch (error: any) {
        switch (error.type) {
          // If the error is a NOT_FOUND error, it means that the user has not created a review for this order
          case 'NOT_FOUND':
            // Do nothing
            break;
        }
      }

      // Check if the rating is between 1 and 5 (inclusive) and is a natural integer (1, 2, 3, 4, 5)
      if (req.body.rating < 1 || req.body.rating > 5 || !Number.isInteger(req.body.rating)) {
        return next(new HttpError._400('Rating must be a natural integer between 1 and 5'));
      }

      let review = new ReviewModel({
        comment: req.body.comment,
        rating: req.body.rating,
        user: user._id,
        company: req.body.company,
        order: order._id,
      });

      logger.info('REVIEW TO BE CREATED: ' + JSON.stringify(review));

      // Validate input
      if (!review.comment || !review.rating || !review.company) {
        return next(new HttpError._400('Both comment and rating are required'));
      }

      let reviewCreated = await ReviewsDAO.create(review);

      response.statusCode = 201; // Use 201 for created resources
      response.data = reviewCreated;

      res.status(response.statusCode).json(response.data);
    } catch (error) {
      next(error);
    }
  }

  static async listCompanyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    let filters: FilterQuery<IReview>;
    let options: Record<string, any> = {};
    let page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
    let documentsPerPage =
      typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

    let companyId = req.params.id;

    filters = {
      company: companyId,
    };

    // If the sortBy query parameter is not null, then we will sort the results by the sortBy query parameter.
    if (req.query.sortBy) {
      if (req.query.sortBy === 'date') {
        // sort by company.rating.average
        options.sort = {
          createdAt: req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
        };
      }
    } else {
      // If the sortBy query parameter is not provided, then we will sort the results by rhw name in an ascending order.
      options.sort = {
        createdAt: req.query.sortOrder === 'desc' ? -1 : 1, // 1 = ascending, -1 = descending
      };
    }

    let ReviewsDAO = new reviewsDAO();

    let populateOptions: PopulateOptions[] = [
      {
        path: 'user',
        model: 'marketplace_user',
        select: 'name profile_picture ',
      },
    ];

    // Exclude fields from the query results
    options.select = '-order -__v';

    let reviews = await ReviewsDAO.queryList(
      filters,
      options,
      page,
      documentsPerPage,
      populateOptions
    );

    let response = {
      data: reviews,
      statusCode: 200,
    };

    next(response);
  }
}
