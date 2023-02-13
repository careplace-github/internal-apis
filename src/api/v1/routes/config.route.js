import express from "express";

const router = express.Router();

router.route("/api/v1").get(function (req, res) {
  res.send("<html><h1> [DEVELOPMENT ENVIRONMENT] API V1.0.0 </h1></html>", 200);
});

export default router;
