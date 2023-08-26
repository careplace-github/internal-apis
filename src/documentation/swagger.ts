import Express from 'express';
import swaggerJsdoc from 'swagger-jsdoc';
import swaggerUi from 'swagger-ui-express';
import logger from '@logger';

import YAML from 'yamljs';

let swaggerSpec;

if (process.env.NODE_ENV === 'production') {
  swaggerSpec = YAML.load('./src/documentation/swagger.prod.yaml');
} else if (process.env.NODE_ENV === 'staging') {
  swaggerSpec = YAML.load('./src/documentation/swagger.stag.yaml');
} else if (process.env.NODE_ENV === 'development') {
  swaggerSpec = YAML.load('./src/documentation/swagger.dev.yaml');
} else {
  swaggerSpec = YAML.load('./src/documentation/swagger.dev.yaml');
}

function swaggerDocs(app, port) {
  // Swagger page
  app.use('/api/v1/docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

  app.get('docson', (req, res) => {
    res.setHeader('Content-Type', 'application/json');
    res.send(swaggerSpec);
  });

  logger.info(`Swagger docs available at http://localhost:${port}/api/v1/docs \n`);
}

export default swaggerDocs;
