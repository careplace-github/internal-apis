import logger from "../../../../logs/logger.js";

export default function responseHandler(response, req, res, next) {
  async function handleRequest() {
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
    };

    let response_ = {
      request: request,
      response: response.data,
    };

    if (
      response.data === undefined ||
      response.data === null ||
      response.data === "" ||
      response.statusCode === undefined ||
      response.statusCode === null ||
      response.statusCode === ""
    ) {
      response_.data = {
        message: "No data returned from the server.",
      };
    }

    res.status(response.statusCode).json(response.data);

    logger.info(`HTTP Response: \n ${JSON.stringify(response_, null, 2)}\n`);

    return;
  }

  handleRequest();
}
