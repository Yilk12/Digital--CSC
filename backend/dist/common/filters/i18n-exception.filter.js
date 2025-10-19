"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.I18nExceptionFilter = void 0;
const common_1 = require("@nestjs/common");
const nestjs_i18n_1 = require("nestjs-i18n");
let I18nExceptionFilter = class I18nExceptionFilter {
    constructor(i18n) {
        this.i18n = i18n;
    }
    async catch(exception, host) {
        var _a, _b;
        const ctx = host.switchToHttp();
        const response = ctx.getResponse();
        const request = ctx.getRequest();
        const status = exception.getStatus ? exception.getStatus() : common_1.HttpStatus.INTERNAL_SERVER_ERROR;
        const exceptionResponse = (_b = (_a = exception.getResponse) === null || _a === void 0 ? void 0 : _a.call(exception)) !== null && _b !== void 0 ? _b : {};
        let message = (exceptionResponse === null || exceptionResponse === void 0 ? void 0 : exceptionResponse.message) || exception.message;
        try {
            if (typeof message === 'string' && /\w+\./.test(message)) {
                const translated = await this.i18n.t(message);
                if (translated && translated !== message) {
                    message = translated;
                }
            }
        }
        catch (_) {
        }
        const payload = {
            statusCode: status,
            message,
            error: (exceptionResponse === null || exceptionResponse === void 0 ? void 0 : exceptionResponse.error) || common_1.HttpStatus[status],
            path: request.url,
            timestamp: new Date().toISOString(),
        };
        response.status(status).json(payload);
    }
};
exports.I18nExceptionFilter = I18nExceptionFilter;
exports.I18nExceptionFilter = I18nExceptionFilter = __decorate([
    (0, common_1.Catch)(common_1.HttpException),
    __metadata("design:paramtypes", [nestjs_i18n_1.I18nService])
], I18nExceptionFilter);
//# sourceMappingURL=i18n-exception.filter.js.map