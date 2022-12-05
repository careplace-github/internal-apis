/**
 * @class
 * @classdesc - This class contains all the utility functions to help log the request
 */

 
 export default function requestUtils(req, res, next) {
    const request = {
        request: {
            type: req.method,
            ipv6: req.ip,
            proxy: req.headers['x-forwarded-for'],
            url: req.originalUrl,
            headers: req.headers,
            body: req.body,
        },
        statusCode: 100,
    };
    return request;
 }