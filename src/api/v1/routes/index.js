import express from "express"
import swaggerJsDoc from "swagger-jsdoc"
import swaggerUi from "swagger-ui-express"

const app = express()
const port = 5001

const swaggerOptions = {
    swaggerDefinition: {
        info:{
            title: 'CRM API',
            description: 'Carely CRM Backend API Documentation',
            version: '1.0.0',
            contact:"",
                email:'contact@carely.pt',
          
            license:"",
                name: "Copyright © 2022 Carely - All Rights Reserved",
                url:"https://www.carely.pt",
            host: ["localhost:5001"],
            

        },
        basePath: "/api/v1",
        host: "localhost:5000",
        schemes: 
        - "http",    
                
    },
    basePath: "./src",
    apis: ["./src/api/v1/routes/*.js"],
    definitions: {
       User: {
         type: "object",
         properties: {
            unsername: {
                type: "string",
            },
         },
         xml:{
           name: "User"
        },
       },
    },
    definitions: {
        User: {
          type: "object",
          properties: {
             unsername: {
                 type: "string",
             },
          },
          xml:{
            name: "User"
         },
        },
    },

   
}

const swaggerDocs = swaggerJsDoc(swaggerOptions)

app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs))

app.listen(port, () => {
    console.log(`API documentation server started on http://localhost:5001/api-docs`)
})



