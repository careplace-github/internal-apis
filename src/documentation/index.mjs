"use strict";

// Error require() of ES Module
// Instead change the require of authentication.controller.js in /Volumes/External Drive/05_GitHub/03_Work/Careplace/backend/node_modules/oas3-tools/dist/middleware/swagger.router.js to a dynamic import() which is available in all CommonJS modules.
// How to fix this error?
//

import path from "path";
import {fileURLToPath} from "url";

// SyntaxError: The requested module 'http' does not provide an export named 'http'
import http from "http";

import oas3Tools from "oas3-tools";
var serverPort = 5001;
var __filename = fileURLToPath(import.meta.url);
 var __dirname = path.dirname(__filename);

// swaggerRouter configuration
var options = {
  routing: {
  
    // What does this do? controllers: path.join(__dirname, "../controllers")
    // 
   controllers: path.join(__dirname, "../controllers")

  },
};

var expressAppConfig = oas3Tools.expressAppConfig(

  path.join(__dirname, "openapi.yaml"),
  options
);
var app = expressAppConfig.getApp();

// Initialize the Swagger middleware
http.createServer(app).listen(serverPort, function () {
  console.log(
    "Your server is listening on port %d (http://localhost:%d)",
    serverPort,
    serverPort
  );
  console.log(
    "Swagger-ui is available on http://localhost:%d/docs",
    serverPort
  );
});
