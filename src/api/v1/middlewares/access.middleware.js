import AWS from "aws-sdk"
import jwt_decode from "jwt-decode"
import AmazonCognitoIdentity from "amazon-cognito-identity-js"
import cognitoExpress from "cognito-express"

import CognitoService from "../services/cognito.service.js"

import { AWS_user_pool_id } from "../../../config/constants/index.js"
import { AWS_client_id } from "../../../config/constants/index.js"
import { AWS_region } from "../../../config/constants/index.js"
import { AWS_identity_pool_id } from "../../../config/constants/index.js"

import AuthHelper from "../helpers/auth.helper.js"


let cognitoAttributeList = [];



/**
 * Middleware that only allows a user to change information about themselves
 * The user's id is passed in the request parameters
 * The user's id is extracted from the token
 * If the user's id in the token matches the user's id in the request parameters, the request is passed to the next middleware
 * If the user's id in the token does not match the user's id in the request parameters, a 403 Forbidden is returned
 * @param {*} req
 * @param {*} res
 * @param {*} next
 * @returns
 */
export default function validateAccess(req, res, next) {


    // Async function to handle the request
    async function handleRequest() {


        try {


            // Check that the request contains a token
            if (req.headers.authorization && req.headers.authorization.split(" ")[0] === "Bearer") {

                const token = req.headers.authorization.split(" ")[1]



                // Token provided
                if (token) {

                    const requestedUserId = req.params.id
                    const requestedUser = await AuthHelper.getUserById(requestedUserId)


                    const user = await AuthHelper.getUser(token, 'cognito')
                    const userId = await AuthHelper.getUserId(token, 'cognito')

                    console.log("requestedUserId: " + requestedUserId)
                    console.log("userId: " + userId)


                    if (userId == requestedUserId) {
                        // The user's id in the token matches the user's id in the request parameters
                        // Pass the request to the next middleware

                        next()

                    } else {
                        // The user role 'user' is the only role that is not associated with a company

                        // Checks if the user is associated with a company
                        if (user.company && requestedUser.company ) {

                            // User is an admin, company owner or company board member of the company that the user in the request parameters belongs to
                            if ((user.company._id == requestedUser.company._id) && (user.role == 'admin' || user.role == 'companyOwner' || user.role == 'companyBoard')) {

                                next()
                            }
                        }
                        else {
                            // User is not associated with a company
                            // User is not allowed to access the requested user's information
                            res.status(403).send("Forbidden" )

                        }

                    }
                }
            }
            else {
                // Request does not contain a token
                // Return a 401 Unauthorized
                res.status(401).send("No token provided.")
            }


        }


        catch (error) {
            console.log(error)
            res.status(500).send("Internal server error")

        }

    }
    // Call the async function
    handleRequest()
}