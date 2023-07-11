import express, { Request, Response, NextFunction } from 'express';
import path from 'path';
import multer from 'multer';
import FilesController from '../../controllers/files.controller';
import AuthenticationGuard from '../../middlewares/guards/authenticationGuard.middleware';
import { HTTPError } from '@utils';
import fs from 'fs';
const storage = multer.diskStorage({
  destination: function (req: Request, file, cb) {
    cb(null, 'src/uploads');
  },
  filename: function (req: Request, file, cb) {
    /**
     * Change the file name to the current date and time to avoid duplicate file names
     */
    cb(null, `careplace_${Date.now()}_${file.originalname}`);
  },
});

/**
 * Multer is a middleware that handles multipart/form-data, which is primarily used for uploading files.
 * It adds a body object and a file or files object to the request object.
 * The body object contains the values of the text fields of the form, the file or files object contains the files uploaded via the form.
 *
 * @see https://www.npmjs.com/package/multer
 */
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // Maximum file size (10MB)
  },
});

const router = express.Router();

router.route('/files').post(
  AuthenticationGuard,
  (req, res, next) => {
    // Check if the directory exists, if not, create it
    if (!fs.existsSync('src/uploads')) {
      fs.mkdirSync('src/uploads');
    }
    next();
  },

  (req, res, next) => {
    upload.single('file')(req, res, (err) => {
      if (err) {
        // Handle Multer errors
        if (err instanceof multer.MulterError) {
          switch (err.code) {
            case 'LIMIT_FILE_SIZE':
              return next(new HTTPError._400('File size is too large. Max limit is 10MB.'));

            case 'LIMIT_UNEXPECTED_FILE':
              return next(new HTTPError._400('Unexpected field. Expected `file`.'));

            case 'LIMIT_FILE_COUNT':
              return next(new HTTPError._400('Too many files to upload.'));

            default:
              return next(new HTTPError._400('File upload failed.'));
          }
        } else {
          // Handle other errors
          return res.status(500).json({ error: 'Internal server error' });
        }
      } else {
        // Proceed with further processing
        next();
      }
    });
  },

  FilesController.create
);

router
  .route('/files/:key')
  .delete(AuthenticationGuard, FilesController.delete);

export default router;
