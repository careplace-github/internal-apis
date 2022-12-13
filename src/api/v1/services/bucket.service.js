import AWS from "aws-sdk";

import fs from "fs";

import {
  AWS_s3_bucket_name,
  AWS_s3_region,
  AWS_access_key_id,
  AWS_secret_access_key,
} from "../../../config/constants/index.js";

const s3 = new AWS.S3({
  accessKeyId: AWS_access_key_id,
  secretAccessKey: AWS_secret_access_key,
  region: AWS_s3_region,
});
export default class S3 {

  
  // Function to upload a file to S3
  static async uploadFile(file) {
    // New promise that catches the error
    try {
      // Read content from the file
      const fileStream = fs.createReadStream(file.path);

      console.log("BUCKET_NAME: ", AWS_s3_bucket_name);
      console.log("region: ", AWS_s3_region);

      const params = {
        Bucket: AWS_s3_bucket_name,
        Body: fileStream,
        Key: file.originalname,

        // ACL: "public-read",
      };

      const response = await s3.upload(params).promise();

      // Delete the file from the uploads folder
      fs.unlink(file.path, (err) => {
        if (err) {
          console.log(err);
        }
      });

      return response;
    } catch (error) {
      console.log(error);
      return error;
    }
  }

  static async getFile(key) {
    const params = {
      Bucket: AWS_s3_bucket_name,
      Key: key,
    };
    return s3.getObject(params).promise();
  }

  static async deleteFile(key) {
    const params = {
      Bucket: AWS_s3_bucket_name,
      Key: key,
    };
    return s3.deleteObject(params).promise();
  }

  static async getFiles() {
    const params = {
      Bucket: AWS_s3_bucket_name,
    };
    return s3.listObjectsV2(params).promise();
  }
}
