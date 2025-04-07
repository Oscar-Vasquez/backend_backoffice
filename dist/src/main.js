"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
const platform_socket_io_1 = require("@nestjs/platform-socket.io");
const path_1 = require("path");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const common_2 = require("@nestjs/common");
const swagger_1 = require("@nestjs/swagger");
async function bootstrap() {
    const logger = new common_2.Logger('Bootstrap');
    console.log('🚀 Iniciando servidor...');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: process.env.FRONTEND_URL || 'http://localhost:3000',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
        credentials: true,
        allowedHeaders: ['Content-Type', 'Accept', 'Authorization'],
    });
    app.use(bodyParser.json({ limit: '50mb' }));
    app.use(bodyParser.urlencoded({ limit: '50mb', extended: true }));
    app.use(cookieParser());
    const ioAdapter = new platform_socket_io_1.IoAdapter(app);
    ioAdapter.createIOServer(3004, {
        cors: {
            origin: true,
            methods: ['GET', 'POST'],
            credentials: true,
        },
    });
    app.useWebSocketAdapter(ioAdapter);
    app.useGlobalPipes(new common_1.ValidationPipe());
    app.setGlobalPrefix('api/v1');
    const config = new swagger_1.DocumentBuilder()
        .setTitle('WorkExpress API')
        .setDescription('API documentation for WorkExpress Dashboard application')
        .setVersion('1.0')
        .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'Authorization',
        description: 'Enter JWT token',
        in: 'header',
    }, 'JWT-auth')
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup('api/docs', app, document, {
        swaggerOptions: {
            persistAuthorization: true,
        },
    });
    app.useStaticAssets((0, path_1.join)(__dirname, '..', 'public'));
    app.setBaseViewsDir((0, path_1.join)(__dirname, '..', 'views'));
    app.setViewEngine('hbs');
    const port = process.env.PORT || 3001;
    const host = 'localhost';
    try {
        await app.listen(port, host);
        console.log(`✅ API REST corriendo en: http://${host}:${port}`);
        console.log(`📚 Documentación Swagger disponible en: http://${host}:${port}/api/docs`);
        console.log(`🔌 WebSocket listo en: ws://${host}:3003`);
        logger.log(`🚀 Aplicación iniciada en puerto ${port}`);
    }
    catch (error) {
        console.error('❌ Error al iniciar el servidor:', error);
        process.exit(1);
    }
}
bootstrap();
//# sourceMappingURL=main.js.map