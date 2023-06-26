// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';

// db
import { CompaniesDAO, OrdersDAO, ReviewsDAO } from '@api/v1/db';
// helpers
import { AuthHelper } from '@api/v1/helpers';
// interfaces
import { IAPIResponse, IReview, IOrder, ICompany, IQueryListResponse } from '@api/v1/interfaces';
// utils
import { HTTPError } from '@api/v1/utils/errors/http';

/**
 * REST API controller class that provides methods to handle ```Reviews```.
 */
export default class ReviewsController {
  static ReviewsDAO = new ReviewsDAO();
  static CompaniesDAO = new CompaniesDAO();
  static OrdersDAO = new OrdersDAO();
  static AuthHelper = new AuthHelper();

  /**
   * Creates a new review for a company.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next function.
   * @returns {Promise<void>} - Returns a promise.
   * @throws {HTTPError._404} - If the company does not exist.
   * @throws {HTTPError._403} - If the user does not have any valid orders with the company.
   * @throws {HTTPError._403} - If the user has already created a review for the company.
   * @throws {HTTPError._400} - If the rating is not a natural integer between 1 and 5.
   * @throws {HTTPError._500} - If the review could not be created.
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: 100, // request received
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];
      const user = await ReviewsController.AuthHelper.getUserFromDB(accessToken);

      const companyId = req.params.id;
      let company: Partial<ICompany> = {};

      try {
        company = await ReviewsController.CompaniesDAO.retrieve(companyId);
      } catch (error: any) {
        throw new HTTPError._404('Company does not exist.');
      }

      let orders: IQueryListResponse<IOrder>;
      let filters: FilterQuery<IReview>;

      filters = {
        user: user._id,
        company: company._id,
        status: {
          $in: ['pending_payment', 'active', 'completed'],
        },
      };

      orders = await ReviewsController.OrdersDAO.queryList(filters);

      if (orders.data.length === 0) {
        throw new HTTPError._403('You do not have any valid orders with this company.');
      }

      try {
        const existingReview = await ReviewsController.ReviewsDAO.queryOne({
          company: companyId,
          user: user._id,
        });

        if (existingReview) {
          return next(
            new HTTPError._403(
              'You have already created a review for this company. Please update your existing review instead.'
            )
          );
        }
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            break;
        }
      }

      if (req.body.rating < 1 || req.body.rating > 5 || !Number.isInteger(req.body.rating)) {
        throw new HTTPError._400('Rating must be a natural integer between 1 and 5');
      }

      const review: Partial<IReview> = {
        comment: req.body.comment,
        rating: req.body.rating,
        user: user._id,
        company: new mongoose.Types.ObjectId(companyId),
      };

      const reviewCreated = await ReviewsController.ReviewsDAO.create(review);

      if (company && company.rating && review && review.rating !== undefined) {
        const ratingSum =
          (company.rating.average || 0) * (company.rating.count || 0) + review.rating!;
        company.rating.count = (company.rating.count || 0) + 1;
        company.rating.average = ratingSum / company.rating.count;
        company.rating.count_stars[review.rating] =
          (company.rating.count_stars[review.rating] || 0) + 1;
      }

      const session = await startSession();
      session.startTransaction();
      await ReviewsController.CompaniesDAO.update(company, session);
      await session.commitTransaction();
      session.endSession();

      response.statusCode = 201;
      response.data = reviewCreated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async retrieve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: 100,
        data: {},
      };

      const reviewId = req.params.id;

      let review: Partial<IReview> = {};

      try {
        review = await ReviewsController.ReviewsDAO.retrieve(reviewId);
      } catch (error: any) {
        throw new HTTPError._404('Review does not exist.');
      }

      response.statusCode = 200;
      response.data = review;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async update(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: 100,
        data: {},
      };

      const accessToken = req.headers['authorization']!.split(' ')[1];
      const reviewId = req.params.id;

      const user = await ReviewsController.AuthHelper.getUserFromDB(accessToken);

      let review: Partial<IReview> = {};

      try {
        review = await ReviewsController.ReviewsDAO.retrieve(reviewId);
      } catch (error: any) {
        throw new HTTPError._404('Review does not exist.');
      }

      const previousRating = review.rating;

      if (review?.user?.toString() !== user._id.toString()) {
        throw new HTTPError._403('You are not authorized to update this review.');
      }

      if (req.body.rating < 1 || req.body.rating > 5 || !Number.isInteger(req.body.rating)) {
        throw new HTTPError._400('Rating must be a natural integer between 1 and 5');
      }

      review.comment = req.body.comment;
      review.rating = req.body.rating;

      const reviewUpdated = await ReviewsController.ReviewsDAO.update(review);

      const company = await ReviewsController.CompaniesDAO.retrieve(review?.company?.toString()!);

      if (company && company.rating) {
        const ratingSum =
          (company.rating.average || 0) * (company.rating.count || 0) -
          previousRating! +
          review.rating!;
        company.rating.average = ratingSum / company.rating.count;
        company.rating.count_stars[previousRating!] =
          (company.rating.count_stars[previousRating!] || 0) - 1;
        company.rating.count_stars[review.rating!] =
          (company.rating.count_stars[review.rating!] || 0) + 1;
      }

      await ReviewsController.CompaniesDAO.update(company);

      response.statusCode = 200;
      response.data = reviewUpdated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }

  static async getCompanyReviews(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      let response: IAPIResponse = {
        statusCode: 100, // request received
        data: {},
      };
      const filters: FilterQuery<IReview> = {};
      const options: Record<string, any> = {};
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

      const companyId = req.params.id;

      filters.company = companyId;

      if (req.query.sortBy) {
        if (req.query.sortBy === 'date') {
          options.sort = {
            createdAt: req.query.sortOrder === 'desc' ? -1 : 1,
          };
        }
      } else {
        options.sort = {
          createdAt: req.query.sortOrder === 'desc' ? -1 : 1,
        };
      }

      options.select = '-order -__v';

      const reviews = await ReviewsController.ReviewsDAO.queryList(
        filters,
        options,
        page,
        documentsPerPage,
        [
          {
            path: 'user',
            model: 'marketplace_user',
            select: 'name profile_picture',
          },
        ]
      );

      response.data = reviews;

      if (reviews.data.length === 0) {
        response.statusCode = 204;
      } else {
        response.statusCode = 200;
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error) {
      // Pass to the next middleware to handle the error
      next(error);
    }
  }
}
