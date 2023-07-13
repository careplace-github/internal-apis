# [1.0.0](https://github.com/CarelyPT/crm-backend/compare/v0.3.0-alpha...v1.0.0) (2023-07-12)


### Bug Fixes

* **auth:** add missing secret has on signin ([d943495](https://github.com/CarelyPT/crm-backend/commit/d9434959cdf28e39dfb4cfe737869a4436889d2e))
* **auth:** update user signin ([46aa088](https://github.com/CarelyPT/crm-backend/commit/46aa0886ae294fe783259dfb6d92d6d15600d2fa))
* **errors:** handle internal server error message in ErrorHandler middleware ([6f9c46c](https://github.com/CarelyPT/crm-backend/commit/6f9c46cac0ae27918f46af14aa88c64440ffdb7e))
* **orders:** remove mandatory billing_details field when creating home care order ([f9c682c](https://github.com/CarelyPT/crm-backend/commit/f9c682cd4feb19f82efbf430f83c4f3789e2f7a4))
* **orders:** remove mandatory billing_details field when creating home care order ([80f2160](https://github.com/CarelyPT/crm-backend/commit/80f21605668eeb228d85d23ceebd55c25c22564c))
* **payments): fix(payments:** prevent user from deleting payment method used in active orders ([1328b79](https://github.com/CarelyPT/crm-backend/commit/1328b794daf3974ddc16b319cbd69a7e4b398c78))
* **payments:** handle failed payments in checkout ([66792bd](https://github.com/CarelyPT/crm-backend/commit/66792bd455dc39d88439ffab03edd0f3237533ea))
* **payments:** remove tax id from checkout validator ([58c8f90](https://github.com/CarelyPT/crm-backend/commit/58c8f902e7fe7016af14dbc2ddb66f00682ed76b))
* **reviews:** handle error in getUserReviews endpoint ([affd3a6](https://github.com/CarelyPT/crm-backend/commit/affd3a6a79eee39d0713e520e386818024d13d79))
* update environment variables ([41b1b4b](https://github.com/CarelyPT/crm-backend/commit/41b1b4b937c0525e7cf0575c7ebcb2f4387b9d26))


### Features

* **auth:** add endpoints to verify user email and phone ([2eb7661](https://github.com/CarelyPT/crm-backend/commit/2eb7661f2a3f762e3eaff08d9021381a736c9007))
* **auth:** add endpoints to verify user email and phone ([8f2e378](https://github.com/CarelyPT/crm-backend/commit/8f2e378d527ae6f2b01f21e07ae5abba170e84d8))
* **logger:** only write logs to file in development environment ([db3a3df](https://github.com/CarelyPT/crm-backend/commit/db3a3dff55921a04ef86650717db94dcb2f09312))
* **middlewares:** add general error handling in ErrorHandler middleware ([39ba0a1](https://github.com/CarelyPT/crm-backend/commit/39ba0a182bb929f46137fef4ae42244d5cc02fc0))
* **middlewares:** add HTTP status codes to HTTP Error Handler Middleware ([fdbc816](https://github.com/CarelyPT/crm-backend/commit/fdbc816766a803b40ea5e2c2230147088d7744ed))
* **payments:** add validator for checkout endpoint ([008dcba](https://github.com/CarelyPT/crm-backend/commit/008dcba70f4e4f0c81b3c19e2c6b12662c2ad416))
* **reviews:** add create review eligibility check endpoint ([de42e06](https://github.com/CarelyPT/crm-backend/commit/de42e063ec05054945ef24e66effd347a0610ce3))
* **reviews:** add endpoint to fetch user's review for a specific company ([fce83df](https://github.com/CarelyPT/crm-backend/commit/fce83df655d17cb08cb29827e54bf9b6399e0b81))
* **reviews:** add endpoint to retrieve user reviews ([5070e14](https://github.com/CarelyPT/crm-backend/commit/5070e144ccb95c273172073ba282d4da842fc703))
* **reviews:** add relevance sort by to reviews GET request ([d34ffa2](https://github.com/CarelyPT/crm-backend/commit/d34ffa21b220b7bd380030c665fc877a6e1457b7))
* **reviews:** change review eligibility endpoint from POST to GET ([095aa76](https://github.com/CarelyPT/crm-backend/commit/095aa76fcb5e51e293abbc947bc9c523f54b4051))
* **reviews:** change reviews sort by date attribute ([e26f156](https://github.com/CarelyPT/crm-backend/commit/e26f156f941c71b232a862f41be488504d1eda19))



