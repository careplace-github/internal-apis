import express from "express"
import CaregiversCtrl from "../controllers/caregivers.controller.js"
import ReviewsCtrl from "../controllers/reviews.controller.js"

const router = express.Router()

router.route("/").get(CaregiversCtrl.apiGetCaregivers)
router.route("/id/:id").get(CaregiversCtrl.apiGetCaregiverById)
// router.route("/proCaregiver").get(CaregiversCtrl.apiGetProCaregivers)

router 
    .route("/review")
    .post(ReviewsCtrl.apiPostReview)
    .put(ReviewsCtrl.apiUpdateReview)
    .delete(ReviewsCtrl.apiDeleteReview)

export default router