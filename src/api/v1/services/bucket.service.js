import AWS from 'aws-sdk';
import fs from 'fs';
import * as Error from '../utils/errors/http/index';

import {
  AWS_S3_BUCKET_NAME,
  AWS_S3_REGION,
  AWS_ACCESS_KEY_ID,
  AWS_SECRET_ACESS_KEY,
} from '../../../config/constants/index';

/**
 * Creates a new S3 instance
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */
const s3 = new AWS.S3({
  accessKeyId: AWS_ACCESS_KEY_ID,
  secretAccessKey: AWS_SECRET_ACESS_KEY,
  region: AWS_S3_REGION,
});

/**
 * Class to manage the AWS S3 Service
 *
 * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html
 */
export default class S3 {
  /**
   * Constructor
   */
  constructor() {
    this.s3 = s3;
  }

  /**
   * Uploads a file to the S3 bucket
   *
   * @param {File} file - File to upload.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#upload-property
   */
  async uploadFile(file, ACL) {
    // New promise that catches the error

    if (!file) {
      throw new Error._400('No file found.');
    }

    // Read content from the file
    const fileStream = fs.createReadStream(file.path);

    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Body: fileStream,
      Key: file.filename,

      /**
       * ACL stands for Access Control List and is a list of permissions
       */
      ACL: ACL ? ACL : 'private',
    };

    const response = await this.s3.upload(params).promise();

    return response;
  }

  /**
   * Returns a file from the S3 bucket.
   *
   * @param {String} key - Key of the file to get.
   * @returns {Promise<File>} - Promise that resolves to the file.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#getObject-property
   */
  async getFile(key) {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    };
    return this.s3.getObject(params).promise();
  }

  /**
   * Deletes a file from the S3 bucket.
   *
   * @param {String} key - Key of the file to delete.
   * @returns {Promise<JSON>} - Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#deleteObject-property
   */
  async deleteFile(key) {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Key: key,
    };
    return this.s3.deleteObject(params).promise();
  }

  /**
   * Lists all the files in the S3 bucket
   *
   * @returns {Promise<JSON>} - Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property
   */
  async getFiles() {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
    };
    return this.s3.listObjectsV2(params).promise();
  }

  /**
   * Lists all the files in the S3 bucket that match the query
   *
   * @param {JSON} query - Query to match the files
   * @returns {Promise<JSON>} - Promise that resolves to the response from the S3 bucket.
   *
   * @see https://docs.aws.amazon.com/AWSJavaScriptSDK/latest/AWS/S3.html#listObjectsV2-property
   */
  async getFilesByQuery(query) {
    const params = {
      Bucket: AWS_S3_BUCKET_NAME,
      Prefix: query,
    };
    return this.s3.listObjectsV2(params).promise();
  }
}
