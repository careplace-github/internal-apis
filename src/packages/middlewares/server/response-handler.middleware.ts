import { Request, Response, NextFunction } from 'express';
import httpContext from 'express-http-context';
import logger from '../../../logs/logger';

// TODO Move to TS folder
interface HttpRequest {
  id: string;
  type: string;
  url: string;
  ipv6: string;
  ipv4: string[];
  contentLength?: string;
  contentType?: string;
  responseTime?: string;
  proxy?: string;
  headers: Record<string, string | string[] | undefined>;
  params: Record<string, string>;
  query: Record<string, string | string[]>;
  body: Record<string, any>;
}

// TODO Move to TS folder
interface HttpResponse {
  data?: Record<string, any> | null;
  statusCode?: number;
}

export default function responseHandler(
  response: HttpResponse,
  req: Request,
  res: Response,
  next: NextFunction
) {
  async function handleRequest() {
    const startTime = httpContext.get('startTime');
    const elapsed = process.hrtime(startTime);
    const elapsedMs = (elapsed[0] * 1000 + elapsed[1] / 1e6).toFixed(2);

    const request: HttpRequest = {
      id: httpContext.get('requestId'),
      type: req.method,
      url: req.originalUrl,
      ipv6: req.ip,
      ipv4: req.ips,
      contentLength: req.headers['content-length'] as string,
      contentType: req.headers['content-type'] as string,
      responseTime: elapsedMs,
      proxy: req.headers['x-forwarded-for'] as string | undefined,
      headers: req.headers,
      params: req.params,
      query: req.query as Record<string, string | string[]>,
      body: req.body,
    };

    const logResponse = {
      request,
      response: {
        headers: res.getHeaders(),
        body: response.data,
        statusCode: response.statusCode,
      },
    };

    if (!response.data || response.statusCode === undefined || response.statusCode === null) {
      response.data = {
        message: 'No data returned from the server.',
      };
    }

    const statusCode = response.statusCode ? response.statusCode : 500;

    // Add Access Token to the response headers
    if (response.data?.accessToken) {
      res.setHeader('Authorization', `Bearer ${response.data.accessToken}`);
    }

    res.status(statusCode).json(response.data);

    logger.info(`HTTP Response: \n ${JSON.stringify(logResponse, null, 2)}\n`);

    next();
  }

  handleRequest().catch(next);
}
