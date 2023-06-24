import { Request, Response, NextFunction } from 'express';
import logger from '../../../../logs/logger';

interface HttpRequest {
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
    const request: HttpRequest = {
      type: req.method,
      url: req.originalUrl,
      ipv6: req.ip,
      ipv4: req.ips,
      contentLength: req.headers['content-length'] as string,
      contentType: req.headers['content-type'] as string,
      responseTime: req.headers['response-time'] as string,
      proxy: req.headers['x-forwarded-for'] as string | undefined,
      headers: req.headers,
      params: req.params,
      query: req.query as Record<string, string | string[]>,
      body: req.body,
    };

    let logResponse = {
      request: request,
      response: response.data,
    };

    if (!response.data || response.statusCode === undefined || response.statusCode === null) {
      response.data = {
        message: 'No data returned from the server.',
      };
    }

    let statusCode = response.statusCode ? response.statusCode : 500;

    // Add Access Token to the response headers
    if (response.data?.accessToken) {
      // res.setHeader('x-access-token', response.data.accessToken as string);
      res.setHeader('Authorization', `Bearer ${response.data.accessToken}`);
    }

    if (response.data?.refreshToken) {
      res.setHeader('x-refresh-token', response.data.refreshToken as string);
    }

    res.status(statusCode).json(response.data);

    logger.info(`HTTP Response: \n ${JSON.stringify(logResponse, null, 2)}\n`);

    next();
  }

  handleRequest().catch(next);
}
