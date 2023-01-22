import express from "express";

import DashboardController from "../controllers/dashboard.controller.js";




const router = express.Router();

router.route("/dashboard")
    .get(DashboardController.getDashboard);


export default router;
