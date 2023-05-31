import express from 'express';

const router = express.Router();

router.route('/v1').get(function (req, res) {
  res.status(200).send('<html><h1> [DEVELOPMENT ENVIRONMENT] API V1.0.0 </h1></html>');
});

export default router;
