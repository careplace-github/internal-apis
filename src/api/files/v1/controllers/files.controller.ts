// express
import { Request, Response, NextFunction } from 'express';
// mongoose
import mongoose, { FilterQuery, startSession } from 'mongoose';
// fs
import fs, { createReadStream } from 'fs';

// @api
import { HealthUnitsDAO, HomeCareOrdersDAO, HealthUnitReviewsDAO } from 'src/packages/database';
import {
  IAPIResponse,
  IHealthUnitReview,
  IOrder,
  IHealthUnit,
  IQueryListResponse,
} from 'src/packages/interfaces';
import { CognitoService, StripeService, BucketService } from 'src/packages/services';
import { HTTPError } from '@utils';
// @logger
import logger from '@logger';
import { S3 } from 'aws-sdk';

/**
 * Files Controller Class to manage the ``/files`` endpoints of the API.
 */
export default class FilesController {
  // services

  static BucketService = BucketService;

  /**
   * Creates a new file in the S3 bucket.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async create(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { file } = req;

      if (!file) {
        return next(new HTTPError._400('Missing required file.'));
      }

      const filePath = file.path;

      const fileUpload = await FilesController.BucketService.uploadFile(filePath);

      response.statusCode = 201;
      response.data = {
        key: fileUpload.Key,
        url: fileUpload.Location,
      };

      // Pass to the next middleware to handle the response
      next(response);

      /**
       * Delete the file from the "uploads" folder
       */
      fs.unlink(filePath, (err) => {
        if (err) {
          logger.warn(
            'Internal Server Error.',
            `Error removing file from uploads folder. \n ${err.stack} \n`
          );
        }
      });
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * Retrieves a file from the S3 bucket by its key.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async retrieve(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const { key } = req.params;

      if (!key) {
        next(new HTTPError._400('Missing required key.'));
      }

      let file: S3.GetObjectOutput;
      try {
        file = await FilesController.BucketService.getFile(key);
      } catch (error: any) {
        return next(new HTTPError._404('File not found.'));
      }

      response.statusCode = 200;
      response.data = {
        url: file.Body,
      };

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }

  /**
   * Deletes a file from the S3 bucket by its key.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async delete(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const response: IAPIResponse = {
        statusCode: res.statusCode,
        data: {},
      };

      const bucketService = new BucketService();
      const { key } = req.params;

      const deletedFile = await FilesController.BucketService.deleteFile(key);

      response.statusCode = 200;
      response.data = deletedFile;

      // Pass to the next middleware to handle the response
      next(response);
    } catch (error: any) {
      // Pass to the next middleware to handle the error
      return next(new HTTPError._500(error.message));
    }
  }
}
