// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, QueryOptions, startSession } from 'mongoose';

// @api
import { HealthUnitReviewsDAO, HomeCareOrdersDAO, HealthUnitsDAO } from 'src/packages/database';
import { AuthHelper } from '@packages/helpers';
import {
  IAPIResponse,
  IHealthUnitReview,
  IHomeCareOrder,
  IHealthUnit,
  IQueryListResponse,
  IHealthUnitDocument,
  IHealthUnitReviewDocument,
} from 'src/packages/interfaces';
import { HealthUnitReviewModel } from 'src/packages/models';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';

/**
 * REST API controller class that provides methods to handle ```Reviews```.
 */
export default class ReviewsController {
  // db
  static HealthUnitReviewsDAO = new HealthUnitReviewsDAO();

  static HealthUnitsDAO = new HealthUnitsDAO();

  static HomeCareOrdersDAO = new HomeCareOrdersDAO();

  // helpers
  static AuthHelper = AuthHelper;

  /**
   * Creates a new review for a healthUnit.
   *
   * @param {Request} req - Express request object.
   * @param {Response} res - Express response object.
   * @param {NextFunction} next - Express next function.
   * @returns {Promise<void>} - Returns a promise.
   * @throws {HTTPError._404} - If the healthUnit does not exist.
   * @throws {HTTPError._403} - If the user does not have any valid orders with the healthUnit.
   * @throws {HTTPError._409} - If the user has already created a review for the healthUnit.
   * @throws {HTTPError._400} - If the rating is not a natural integer between 1 and 5.
   * @throws {HTTPError._500} - If the review could not be created.
   */
  static async createHealthUnitReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    let session: mongoose.ClientSession | null = null;
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers.authorization!.split(' ')[1];

      const healthUnitId = req.params.healthUnit;
      let healthUnit: IHealthUnitDocument;

      try {
        healthUnit = await ReviewsController.HealthUnitsDAO.retrieve(healthUnitId);
      } catch (error: any) {
        throw new HTTPError._404('HealthUnit does not exist.');
      }

      if (req.body.rating < 1 || req.body.rating > 5 || !Number.isInteger(req.body.rating)) {
        throw new HTTPError._400('Rating must be a natural integer between 1 and 5');
      }

      const review: IHealthUnitReview = {
        _id: new mongoose.Types.ObjectId(),
        comment: req.body.comment,
        rating: req.body.rating,
        customer: req.body.customer,
        health_unit: new mongoose.Types.ObjectId(healthUnitId),
        type: 'mock',
      };

      const newReview = new HealthUnitReviewModel(review);

      const reviewCreated = await ReviewsController.HealthUnitReviewsDAO.create(newReview);

      if (healthUnit && healthUnit.rating && review && review.rating !== undefined) {
        const ratingSum =
          (healthUnit.rating.average || 0) * (healthUnit.rating.count || 0) + review.rating!;
        healthUnit.rating.count = (healthUnit.rating.count || 0) + 1;
        healthUnit.rating.average = ratingSum / healthUnit.rating.count;
        healthUnit.rating.count_stars[review.rating] =
          (healthUnit.rating.count_stars[review.rating] || 0) + 1;
      }

      session = await startSession();
      session.startTransaction();
      await ReviewsController.HealthUnitsDAO.update(healthUnit, session);
      await session.commitTransaction();
      session.endSession();

      response.statusCode = 201;
      response.data = reviewCreated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      if (session) {
        await session.abortTransaction();
        await session.endSession();
      }
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async retrieveHealthUnitReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const reviewId = req.params.id;

      let review: IHealthUnitReviewDocument;

      try {
        review = await ReviewsController.HealthUnitReviewsDAO.retrieve(reviewId, [
          {
            path: 'customer',
            model: 'Customer',
          },
        ]);
      } catch (error: any) {
        throw new HTTPError._404('Review does not exist.');
      }

      response.statusCode = 200;
      response.data = review;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async updateHealthUnitReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers.authorization!.split(' ')[1];
      const { reviewId } = req.params;

      let review: IHealthUnitReviewDocument;

      try {
        review = await ReviewsController.HealthUnitReviewsDAO.retrieve(reviewId);
      } catch (error: any) {
        return next(new HTTPError._404('Review does not exist.'));
      }

      const previousRating = review.rating;

      if (req.body.rating < 1 || req.body.rating > 5 || !Number.isInteger(req.body.rating)) {
        return next(new HTTPError._400('Rating must be a natural integer between 1 and 5'));
      }

      review.comment = req.body.comment;
      review.rating = req.body.rating;

      const updateReview = new HealthUnitReviewModel(review);

      const reviewUpdated = await ReviewsController.HealthUnitReviewsDAO.update(updateReview);

      const healthUnit = await ReviewsController.HealthUnitsDAO.retrieve(
        review?.health_unit?.toString()!
      );

      if (healthUnit && healthUnit.rating) {
        const ratingSum =
          (healthUnit.rating.average || 0) * (healthUnit.rating.count || 0) -
          previousRating! +
          review.rating!;
        healthUnit.rating.average = ratingSum / healthUnit.rating.count;
        healthUnit.rating.count_stars[previousRating!] =
          (healthUnit.rating.count_stars[previousRating!] || 0) - 1;
        healthUnit.rating.count_stars[review.rating!] =
          (healthUnit.rating.count_stars[review.rating!] || 0) + 1;
      }

      await ReviewsController.HealthUnitsDAO.update(healthUnit);

      response.statusCode = 200;
      response.data = reviewUpdated;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async deleteHealthUnitReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    return next(new HTTPError._500('Not implemented'));
  }

  static async getHealthUnitReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };
      const filters: FilterQuery<IHealthUnitReview> = {};
      const options: QueryOptions<IHealthUnit> = {};
      const page = typeof req.query.page === 'string' ? parseInt(req.query.page) : 1;
      const documentsPerPage =
        typeof req.query.documentsPerPage === 'string' ? parseInt(req.query.documentsPerPage) : 10;

      const healthUnitId = req.params.healthUnit;

      filters.health_unit = healthUnitId;

      if (req.query.sortBy) {
        if (req.query.sortBy === 'date') {
          options.sort = {
            updatedAt: req.query.sortOrder === 'desc' ? -1 : 1,
          };
        }
        if (req.query.sortBy === 'relevance') {
          options.sort = {
            rating: -1,
          };
        }
      } else {
        options.sort = {
          updatedAt: req.query.sortOrder === 'desc' ? -1 : 1,
        };
      }

      options.select = '-order -__v';

      const reviews = await ReviewsController.HealthUnitReviewsDAO.queryList(
        filters,
        options,
        page,
        documentsPerPage,
        [
          {
            path: 'customer',
            model: 'Customer',
          },
        ]
      );

      logger.info(`reviews!: ${reviews}`);

      response.data = reviews;

      if (reviews.data.length === 0) {
        response.statusCode = 204;
      } else {
        response.statusCode = 200;
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async getCustomerHealthUnitReviewReviews(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers.authorization!.split(' ')[1];

      const user = await ReviewsController.AuthHelper.getUserFromDB(accessToken);

      const userId = user._id;

      const filters: FilterQuery<IHealthUnitReview> = {
        customer: userId,
      };

      const reviews = await ReviewsController.HealthUnitReviewsDAO.queryList(filters);

      response.data = reviews.data;

      if (reviews.data.length === 0) {
        response.statusCode = 204;
      } else {
        response.statusCode = 200;
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  static async getCustomerHealthUnitReview(
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const accessToken = req.headers.authorization!.split(' ')[1];

      const healthUnitId = req.params.healthUnit;

      if (!healthUnitId) {
        throw new HTTPError._400('HealthUnit ID is required.');
      }

      const user = await ReviewsController.AuthHelper.getUserFromDB(accessToken);

      const userId = user._id;

      const filters: FilterQuery<IHealthUnitReview> = {
        customer: userId,
        health_unit: healthUnitId,
      };

      try {
        const review = await ReviewsController.HealthUnitReviewsDAO.queryOne(filters, {
          path: 'customer',
          model: 'Customer',
          select: 'name profile_picture -_id',
        });
        response.data = review;
        response.statusCode = 200;
      } catch (error: any) {
        switch (error.type) {
          case 'NOT_FOUND':
            response.statusCode = 204;
            break;
          default:
            throw new HTTPError._500(error.message);
        }
      }

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
