import { Express } from 'express'
import swaggerUi from 'swagger-ui-express'
import swaggerJSDoc from 'swagger-jsdoc'
import fs from 'fs'
import path from 'path'

export const setupSwagger = (app: Express) => {
  const swaggerOptions = {
    definition: {
      openapi: '3.0.0',
      info: {
        title: 'Telemedicine Rwanda API',
        version: '1.0.0',
        description: 'API documentation for the Telemedicine backend service.',
        contact: {
          name: 'API Support',
          email: 'support@telemed.rw',
        },
      },
      servers: [
        {
          url: `http://localhost:${process.env.PORT || 5000}`,
          description: 'Development Server',
        },
      ],
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
            bearerFormat: 'JWT',
            description: 'Enter your JWT in the format: Bearer {token}',
          },
        },
      },
      security: [{ bearerAuth: [] }],
    },
    // Path to the API docs files
    apis: ['./src/api/**/routes.ts'],
  }

  const swaggerSpec = swaggerJSDoc(swaggerOptions)

  // ✅ Write swagger.json to project root (or /docs folder)
  const outputPath = path.resolve('./swagger.json')
  fs.writeFileSync(outputPath, JSON.stringify(swaggerSpec, null, 2))
  console.log(`✅ Swagger JSON generated at: ${outputPath}`)

  // ✅ Serve Swagger UI
  app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec))
}
