
/**
 * Utils for HTTP requests
 */
 export default async function RequestUtils(req, res, next) {
    const request = {
        request: {
            type: req.method,
            url: req.originalUrl,
            ipv6: req.ip,
            proxy: req.headers['x-forwarded-for'],
            headers: req.headers,
            params: req.params,
            query: req.query,
            body: req.body,
        },
        statusCode: 100,
    };
    return request;
 }