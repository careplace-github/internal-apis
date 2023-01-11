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
    
  }

  static async destroy(req, res, next) {
    
  }

  static async index(req, res, next) {
   
  }

  
}
