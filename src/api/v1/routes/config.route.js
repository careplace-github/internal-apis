import express from "express";

const router = express.Router();

import  { ENV } from "../../../config/constants/index.js";

router.route("/v1").get(function (req, res) {
  res.send(
    `<html><h1> [${ENV.toUpperCase()} ENVIRONMENT] API V1.0.0 </h1></html>`,200
  );
});


export default router;
