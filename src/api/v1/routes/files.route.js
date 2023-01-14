// Import the express module
import Router from "express"
import express from "express"

import multer from "multer"
const upload = multer({ dest: "src/api/v1/uploads/" })


// Import controllers
import FilesController from "../controllers/files.controller.js"


const router = express.Router()


router.route("/files")
    .get(FilesController.index)
    .post(  upload.single('file'), FilesController.create )


// router to get user information by id
router.route("/files/:id")
    .get( FilesController.show)
   





    


    
  


export default router