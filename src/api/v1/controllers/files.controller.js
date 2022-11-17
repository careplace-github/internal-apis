import BucketService from "../services/bucket.service.js";
import multer from "multer";

export default class FilesController {
  static async uploadFile(req, res, next) {
    try {
      const file = req.body;
      console.log("file: " + JSON.stringify(file));
      const bucketName = process.env.AWS_BUCKET_NAME;
      const uploadResponse = await BucketService.uploadFile(file, bucketName);
      res.status(200).json(uploadResponse);
    } catch (error) {
      next(error);
    }
  }

  static async deleteFile(req, res, next) {
    try {
      const key = req.params.key;
      const bucketName = process.env.AWS_BUCKET_NAME;
      const deleteResponse = await BucketService.deleteFile(key, bucketName);
      res.status(200).json(deleteResponse);
    } catch (error) {
      next(error);
    }
  }

  static async getFiles(req, res, next) {
    try {
      const bucketName = process.env.AWS_BUCKET_NAME;
      const getResponse = await BucketService.getFiles(bucketName);
      res.status(200).json(getResponse);
    } catch (error) {
      next(error);
    }
  }

  static async getFile(req, res, next) {
    try {
      const key = req.params.key;
      const bucketName = process.env.AWS_BUCKET_NAME;
      const getResponse = await BucketService.getFile(key, bucketName);
      res.status(200).json(getResponse);
    } catch (error) {
      next(error);
    }
  }
}
