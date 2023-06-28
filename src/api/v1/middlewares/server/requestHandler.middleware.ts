import logger from '../../../../logs/logger';
import { Request, Response, NextFunction } from 'express';

export default function RequestUtils(req: Request, res: Response, next: NextFunction) {
  function handleRequest() {
    const request = {
      type: req.method,
      url: req.originalUrl,
      ipv6: req.ip,
      ipv4: req.ips,
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
      responseTime: req.headers['response-time'],
      proxy: req.headers['x-forwarded-for'],
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
      statusCode: 100,
    };

    /**
     * Do not log requests made to the API Docs
     */
    if (req.originalUrl.startsWith(`/api/v1/docs`)) {
      next();
      return;
    }

    try {
      logger.info(`HTTP Request: \n ${JSON.stringify(request, null, 2)} \n`);
    } catch (error) {
      // Handle the error, e.g., log it or send an error response
    }

    next();
  }

  handleRequest();
}
