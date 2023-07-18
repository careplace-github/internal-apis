// aws
import AWS, { S3 } from 'aws-sdk';
// fs
import fs from 'fs';

// @api
import { LayerError } from '@utils';

// @logger
import logger from '@logger';
// @constants
import {
  AWS_S3_BUCKET_NAME,
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
} from '@constants';

/**
 * Creates a new S3 instance
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */

/**
 * Class to manage the AWS S3 Service
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */

// FIXME Use custom LayerError error handling
// FIXME Check the Stripe Error Api Response and update the error handling accordingly
// TODO Add request logging
// TODO Add response logging
export default class S3Manager {
  static S3 = new AWS.S3({
    accessKeyId: AWS_ACCESS_KEY_ID,
    secretAccessKey: AWS_SECRET_ACESS_KEY,
    region: AWS_S3_REGION,
  });

  /**
   * Uploads a file to the S3 bucket
   *
   * @param {fs.PathLike} file File to upload.
   * @param {string} ACL Access Control List (optional).
   * @returns {Promise<AWS.S3.ManagedUpload.SendData>} Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
   */
  static async uploadFile(file: fs.PathLike, ACL?: string): Promise<AWS.S3.ManagedUpload.SendData> {
    if (!file) {
      throw new LayerError.NOT_FOUND('No file found.');
    }

    // Read content from the file
    const fileStream = fs.createReadStream(file);

    const pattern = /png|jpeg|jpg|gif/gi;

    // Remove every white space from the file path and replace it with an underscore
    // Remove the "uploads/" part of the file path
    // Remove special characters from the file path
    // Remove file extension from the file path
    const fileKey = file
      .toString()
      .split('uploads/')[1]
      .replace(/\s/g, '_')
      .replace(/[^a-zA-Z0-9_]/g, '')
      .replace(pattern, '');

    const params: AWS.S3.PutObjectRequest = {
      Bucket: AWS_S3_BUCKET_NAME,
      Body: fileStream,
      Key: fileKey,

      /**
       * ACL stands for Access Control List and is a list of permissions
       */
      ACL: ACL ? ACL : 'private',
    };

    try {
      const response = await this.S3.upload(params).promise();
      logger.info('File uploaded successfully to S3');
      return response;
    } catch (error: any) {
      logger.error(`Failed to upload file to S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Returns a file from the S3 bucket.
   *
   * @param {string} key Key of the file to get.
   * @returns {Promise<AWS.S3.GetObjectOutput>} Promise that resolves to the file.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
   */
  static async getFile(key: string): Promise<AWS.S3.GetObjectOutput> {
    const params: AWS.S3.GetObjectRequest = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    };
    try {
      const response = await this.S3.getObject(params).promise();
      logger.info('File retrieved successfully from S3');
      return response;
    } catch (error: any) {
      throw new LayerError.NOT_FOUND('File not found.');
      /**
       *  throw error;
             return;
      console.log(error);
      logger.error(`Failed to retrieve file from S3: ${error}`);
       *  */
    }
  }

  /**
   * Deletes a file from the S3 bucket.
   *
   * @param {string} key Key of the file to delete.
   * @returns {Promise<AWS.S3.DeleteObjectOutput>} Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
   */
  static async deleteFile(key: string): Promise<AWS.S3.DeleteObjectOutput> {
    const params: AWS.S3.DeleteObjectRequest = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    };
    try {
      const response = await this.S3.deleteObject(params).promise();
      logger.info('File deleted successfully from S3');
      return response;
    } catch (error: any) {
      logger.error(`Failed to delete file from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lists all the files in the S3 bucket
   *
   * @returns {Promise<AWS.S3.ListObjectsV2Output>} Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property
   */
  static async getFiles(): Promise<AWS.S3.ListObjectsV2Output> {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: AWS_S3_BUCKET_NAME,
    };
    try {
      const response = await this.S3.listObjectsV2(params).promise();
      logger.info('Files retrieved successfully from S3');
      return response;
    } catch (error: any) {
      logger.error(`Failed to retrieve files from S3: ${error.message}`);
      throw error;
    }
  }

  /**
   * Lists all the files in the S3 bucket that match the query
   *
   * @param {string} query Query to match the files.
   * @returns {Promise<AWS.S3.ListObjectsV2Output>} Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property
   */
  static async getFilesByQuery(query: string): Promise<AWS.S3.ListObjectsV2Output> {
    const params: AWS.S3.ListObjectsV2Request = {
      Bucket: AWS_S3_BUCKET_NAME,
      Prefix: query,
    };
    try {
      const response = await this.S3.listObjectsV2(params).promise();
      logger.info('Files retrieved successfully from S3 using query');
      return response;
    } catch (error: any) {
      logger.error(`Failed to retrieve files from S3 using query: ${error.message}`);
      throw error;
    }
  }
}
