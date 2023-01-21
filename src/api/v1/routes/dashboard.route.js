import express from "express";
import path from "path";
import multer from "multer";
import DashboardController from "../controllers/dashboard.controller.js";




const router = express.Router();

router.route("/dashboard")
    .get(upload.single("file"), FilesController.create);


export default router;
