// Import the express module
import Router from "express"
import express from "express"

// Import middlewares
import validateAuth from "../middlewares/auth.middleware.js"
import validateRole from "../middlewares/role.middleware.js"
import validateAccess from "../middlewares/access.middleware.js"

// Import controllers
import FilesController from "../controllers/files.controller.js"


const router = express.Router()


router.route("/files")
    .get(validateAuth, validateRole(["admin"]), FilesController.getFiles)
    .post(validateAuth, FilesController.uploadFile )


// router to get user information by id
router.route("/files/:id")
    .get(validateAuth, validateAccess, FilesController.getFile)
    .delete(validateAuth, validateAccess, FilesController.deleteFile)
   





    


    
  


export default router