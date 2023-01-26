import logger from "../../../../logs/logger.js";

export default function RequestUtils(req, res, next) {
  function handleRequest() {
    const request = {
      type: req.method,
      url: req.originalUrl,
      ipv6: req.ip,
      ipv4: req.ips,
      contentLength: req.headers["content-length"],
      contentType: req.headers["content-type"],
      responseTime: req.headers["response-time"],

      proxy: req.headers["x-forwarded-for"],
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,

      statusCode: 100,
    };

    /**
     * Do not log requests made to the API Docs
     */
    if(req.originalUrl.startsWith(`/api/v1/docs`)) {
      next()
      return;
    }

    logger.info(`HTTP Request: \n ${JSON.stringify(request, null, 2)} \n`);

    next();
  }

  handleRequest();
}
