import { ExceptionFilter, ArgumentsHost, HttpException } from '@nestjs/common';
import { I18nService } from 'nestjs-i18n';
export declare class I18nExceptionFilter implements ExceptionFilter {
    private readonly i18n;
    constructor(i18n: I18nService);
    catch(exception: HttpException, host: ArgumentsHost): Promise<void>;
}
