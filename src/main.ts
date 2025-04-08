// Cargar polyfills primero
import '../polyfills';

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cors from 'cors';
import * as bodyParser from 'body-parser';
import * as cookieParser from 'cookie-parser';
import { Logger } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

// Verificar que crypto está disponible
if (typeof global.crypto === 'undefined') {
  console.error('❌ ERROR: global.crypto no está definido después de cargar el polyfill');
  process.exit(1);
} else {
  console.log('✅ global.crypto está correctamente definido');
}

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  console.log('🚀 Iniciando servidor...');
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Configurar CORS
  app.enableCors({
    origin: '*', // Permitir cualquier origen en producción
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
  });

  // Aumentar límite de tamaño de solicitud
  app.use(bodyParser.json({limit: '50mb'}));
  app.use(bodyParser.urlencoded({limit: '50mb', extended: true}));

  // Habilitar el middleware de cookies
  app.use(cookieParser());

  // Middleware para loguear todas las solicitudes (ayuda con la depuración)
  app.use((req, res, next) => {
    console.log(`[DEBUG] Recibida solicitud: ${req.method} ${req.url}`);
    next();
  });

  // Configurar WebSocket
  const ioAdapter = new IoAdapter(app);
  ioAdapter.createIOServer(3004, {
    cors: {
      origin: true,
      methods: ['GET', 'POST'],
      credentials: true,
    },
  });
  app.useWebSocketAdapter(ioAdapter);

  // Configurar validación global
  app.useGlobalPipes(new ValidationPipe());

  // Configurar prefijo global para la API
  app.setGlobalPrefix('api/v1');

  // Configurar Swagger
  const config = new DocumentBuilder()
    .setTitle('WorkExpress API')
    .setDescription('API documentation for WorkExpress Dashboard application')
    .setVersion('1.0')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document, {
    swaggerOptions: {
      persistAuthorization: true,
    },
  });

  // Agregar ruta para healthcheck SOLO en la ruta raíz exacta
  app.use((req, res, next) => {
    if (req.url === '/') {
      return res.status(200).json({ 
        status: 'ok', 
        message: 'API is running', 
        timestamp: new Date().toISOString() 
      });
    }
    next();
  });

  // Configurar archivos estáticos
  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');

  const port = process.env.PORT || 3000;
  // Escuchar en cualquier interfaz (0.0.0.0) en lugar de solo localhost
  
  try {
    await app.listen(port, '0.0.0.0');
    console.log(`✅ API REST corriendo en: http://0.0.0.0:${port}`);
    console.log(`📚 Documentación Swagger disponible en: http://0.0.0.0:${port}/api/docs`);
    console.log(`🔌 WebSocket listo en: ws://0.0.0.0:3004`);
    logger.log(`🚀 Aplicación iniciada en puerto ${port}`);
  } catch (error) {
    console.error('❌ Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

bootstrap();
