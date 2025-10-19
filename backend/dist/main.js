"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const swagger_1 = require("@nestjs/swagger");
const app_module_1 = require("./app.module");
const nestjs_i18n_1 = require("nestjs-i18n");
const i18n_exception_filter_1 = require("./common/filters/i18n-exception.filter");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.getHttpAdapter().getInstance().get('/', (req, res) => {
        res.json({ message: 'ECSC Helpdesk API is running', status: 'ok' });
    });
    app.enableCors({
        origin: [
            "http://localhost:3000",
            "http://localhost:3001",
            "https://your-frontend-domain.com",
        ],
        credentials: true,
        methods: ["GET", "HEAD", "PUT", "PATCH", "POST", "DELETE", "OPTIONS"],
        allowedHeaders: ["Content-Type", "Authorization"],
        exposedHeaders: ["Content-Type", "Authorization"],
    });
    app.setGlobalPrefix("api/v1");
    app.useGlobalPipes(new nestjs_i18n_1.I18nValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
    }));
    const i18nService = app.get(nestjs_i18n_1.I18nService);
    app.useGlobalFilters(new nestjs_i18n_1.I18nValidationExceptionFilter(), new i18n_exception_filter_1.I18nExceptionFilter(i18nService));
    const config = new swagger_1.DocumentBuilder()
        .setTitle("Ethiopian Civil Service Commission Helpdesk API")
        .setDescription("API for helpdesk and knowledge base system")
        .setVersion("1.0")
        .addBearerAuth()
        .build();
    const document = swagger_1.SwaggerModule.createDocument(app, config);
    swagger_1.SwaggerModule.setup("api/docs", app, document);
    const port = process.env.PORT || 3005;
    await app.listen(port);
    console.log(`🚀 Application is running on: http://localhost:${port}`);
    console.log(`📚 API Documentation: http://localhost:${port}/api/docs`);
}
bootstrap();
//# sourceMappingURL=main.js.map