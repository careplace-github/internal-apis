import logger from '../../../logs/logger';
import { Request, Response, NextFunction, response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import httpContext from 'express-http-context';

export default function RequestHandlerMiddleware(req: Request, res: Response, next: NextFunction) {
  const requestId = uuidv4();
  const startTime = process.hrtime();

  function handleRequest() {
    httpContext.set('requestId', requestId);
    httpContext.set('startTime', startTime);

    // 102 Processing (WebDAV; RFC 2518)
    res.status(102);

    const request = {
      id: requestId,
      type: req.method,
      url: req.originalUrl,
      ipv6: req.ip,
      ipv4: req.ips,
      contentLength: req.headers['content-length'],
      contentType: req.headers['content-type'],
      responseTime: startTime,
      proxy: req.headers['x-forwarded-for'],
      headers: req.headers,
      params: req.params,
      query: req.query,
      body: req.body,
      statusCode: res.statusCode,
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
