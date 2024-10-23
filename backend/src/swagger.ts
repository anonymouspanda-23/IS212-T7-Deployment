import swaggerJSDoc from "swagger-jsdoc";

const swaggerDefinition = {
  openapi: "3.0.0",
  info: {
    title: "Koa API",
    version: "1.0.0",
    description: "API documentation",
  },
  servers: [
    {
      url: process.env.DOMAIN,
      description: "Development Server",
    },
  ],
};

const options = {
  swaggerDefinition,
  apis: ["./src/router/**/*.ts"],
};

const swaggerSpec = swaggerJSDoc(options);

export default swaggerSpec;
