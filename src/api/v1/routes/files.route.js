// Import the express module
import Router from "express"
import express from "express"

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js"
import validateRole from "../middlewares/role.middleware.js"
import validateAccess from "../middlewares/access.middleware.js"
import multer from "multer"
const upload = multer({ dest: "src/api/v1/uploads/" })


// Import controllers
import FilesController from "../controllers/files.controller.js"


const router = express.Router()


router.route("/files")
    .get(FilesController.index)
    .post(validateAuth,  upload.single('file'), FilesController.create )


// router to get user information by id
router.route("/files/:id")
    .get(validateAuth, validateAccess, FilesController.show)
   





    


    
  


export default router