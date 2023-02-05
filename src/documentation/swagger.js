import Express from "express";
import swaggerJsdoc from "swagger-jsdoc";
import swaggerUi from "swagger-ui-express";
//import { version } from "../../package.json" assert { type: "json" };
import { API_VERSION} from "../config/constants/index.js"
import logger from "../logs/logger.js";

import YAML from "yamljs";


const swaggerSpec = YAML.load("./src/documentation/swagger-stag.yaml");

function swaggerDocs(app, port) {
  // Swagger page
  app.use("/api/v1/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  

  app.get("docs.json", (req, res) => {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
  });



  
  

  logger.info(`Swagger docs available at http://localhost:${port}/api/v1/docs \n`);
}

export default swaggerDocs;
