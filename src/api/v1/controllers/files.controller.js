import BucketService from '../services/bucket.service';
import fs from 'fs';
import logger from '../../../logs/logger';
import { HTTPError } from '@api/v1/utils/errors/http';

/**
 * Files Controller Class to manage the ``/files`` endpoints of the API.
 */
export default class FilesController {
  /**
   * Creates a new file in the S3 bucket.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async create(req, res, next) {
    try {
      let response = {};
      let Bucket = new BucketService();

      const file = req.file;

      if (file == null || file == undefined) {
        throw new HTTPError._400('Missing required file.');
      }

      let fileUpload = await Bucket.uploadFile(file);

      response.data = {
        key: fileUpload.Key,
        url: fileUpload.Location,
        version: fileUpload.VersionId,
      };

      response.statusCode = 200;

      /**
       * Delete the file from the "uploads" folder
       */
      fs.unlink(file.path, (err) => {
        if (err) {
          logger.warn(
            'Internal Server Error.',
            `Error removing file from uploads folder. \n ${err.stack} \n`
          );
        }
      });

      next(response);
    } catch (error) {
      // If there is an error, the file has not been uploaded successfully
      next(error);
    }
  }

  /**
   * Retrieves a file from the S3 bucket by its key.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async retrieve(req, res, next) {
    try {
      let response = {};
      let Bucket = new BucketService();

      const key = req.params.key;

      const file = await Bucket.getFile(key);

      response.data = file;

      response.statusCode = 200;

      next(response);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Deletes a file from the S3 bucket by its key.
   *
   * @param {*} req - Request object.
   * @param {*} res - Response object.
   * @param {*} next - Next middleware function.
   */
  static async delete(req, res, next) {
    try {
      let response = {};
      let Bucket = new BucketService();

      const key = req.params.key;

      const deletedFile = await Bucket.deleteFile(key);

      response.data = deletedFile;

      response.statusCode = 200;

      next(response);
    } catch (error) {
      next(error);
    }
  }
}
