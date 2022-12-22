import BucketService from "../services/bucket.service.js";

// Import logger
import logger from "../../../logs/logger.js";
import requestUtils from "../utils/request.utils.js";
import filesDAO from "../db/filesDAO.js";


export default class FilesController {
  static async create(req, res, next) {
    let response;

    try {

      var request = requestUtils(req)

      const file = req.file;

      console.log("file: ", file);

      response = await BucketService.uploadFile(file);

      console.log("sucsess response: ", response);

      // If there is no error, the file has been uploaded successfully

      return res.status(200).json({
        message: "File uploaded successfully",
        data: response,
      });
    } catch (error) {
      // If there is an error, the file has not been uploaded successfully
      console.log("error response: ", response);
      return res.status(500).json({
        message: "File upload failed",
        data: response,
      });

      next(error);
    }
  }

  static async show(req, res, next) {
    try {
      const key = req.params.key;
      
      const getResponse = await BucketService.getFile(key, bucketName);
      res.status(200).json(getResponse);
    } catch (error) {
      next(error);
    }
  }

  static async destroy(req, res, next) {
    try {
      const key = req.params.key;
      const bucketName = BUCKET_NAME;
      const deleteResponse = await BucketService.deleteFile(key, bucketName);
      res.status(200).json(deleteResponse);
    } catch (error) {
      next(error);
    }
  }

  static async index(req, res, next) {
    try {
      
      let files = filesDAO.get_list();
      const getResponse = await BucketService.getFiles();
      res.status(200).json(getResponse);
    } catch (error) {
      next(error);
    }
  }

  
}
