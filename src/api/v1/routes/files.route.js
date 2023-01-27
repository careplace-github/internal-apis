import express from "express";
import path from "path";
import multer from "multer";
import FilesController from "../controllers/files.controller.js";
import * as Error from "../utils/errors/http/index.js";
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "./src/uploads");
  },
  filename: function (req, file, cb) {
    /**
     * Change the file name to the current date and time to avoid duplicate file names
     */
    cb(null, Date.now() + path.extname(file.originalname));
  },
});


/**
 * Multer is a middleware that handles multipart/form-data, which is primarily used for uploading files.
 * It adds a body object and a file or files object to the request object.
 * The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form.
 *
 * @see https://www.npmjs.com/package/multer
 */
const upload = multer({ storage: storage });

const router = express.Router();

router
  .route("/files")
  .post(upload.single("file"), FilesController.create);

router
  .route("/files/:key")
  .get(FilesController.retrieve)
  .delete(FilesController.delete);

export default router;
