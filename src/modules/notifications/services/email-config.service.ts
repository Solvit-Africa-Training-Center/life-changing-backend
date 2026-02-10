// src/modules/notifications/services/email-config.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class EmailConfigService {
    private readonly logger = new Logger(EmailConfigService.name);

    constructor(private configService: ConfigService) { }

    getSendGridApiKey(): string | undefined {
        return this.configService.get('config.sendgrid.apiKey');
    }

    isSendGridEnabled(): boolean {
        const apiKey = this.getSendGridApiKey();
        return !!apiKey && apiKey.startsWith('SG.');
    }

    getFromEmail(): string {
        return this.configService.get('config.sendgrid.fromEmail') || 'noreply@lceo.org';
    }

    getFromName(): string {
        return this.configService.get('config.sendgrid.fromName') || 'LCEO';
    }

    getFrontendUrl(): string {
        const url = this.configService.get<string>('config.frontendUrl');
        if (!url) {
            throw new Error('frontendUrl is not configured in the application');
        }
        return url;
    }

    getAdminEmail(): string | undefined {
        return this.configService.get('config.sendgrid.adminEmail');
    }

    logWarning(message: string): void {
        this.logger.warn(message);
    }

    logInfo(message: string): void {
        this.logger.log(message);
    }

    logError(message: string, error?: any): void {
        this.logger.error(message, error?.message);
    }
}