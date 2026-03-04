import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  OnModuleInit,
} from '@nestjs/common';
import { readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import * as path from 'node:path';
import * as Handlebars from 'handlebars';
import * as nodemailer from 'nodemailer';
import { I18nContext, I18nService } from 'nestjs-i18n';

@Injectable()
export class MailerService implements OnModuleInit {
  // Logger centralizado para trazabilidad de envíos y fallos SMTP.
  private readonly logger = new Logger(MailerService.name);
  // Transporter de nodemailer reutilizable para todas las operaciones del servicio.
  private readonly transporter: nodemailer.Transporter;
  private readonly from = process.env.MAIL_FROM || 'no-reply@example.com';

  // Cache en memoria para evitar leer/compilar la misma plantilla en cada envío.
  private readonly templateCache = new Map<
    string,
    Handlebars.TemplateDelegate
  >();

  constructor(private readonly i18n: I18nService) {
    // Configuración SMTP desde variables de entorno.
    this.transporter = nodemailer.createTransport({
      host: process.env.MAIL_HOST,
      port: Number(process.env.MAIL_PORT || 587),
      secure: process.env.MAIL_SECURE === 'true',

      connectionTimeout: 10000,
      greetingTimeout: 10000,
      socketTimeout: 10000,

      tls:
        process.env.MAIL_REJECT_UNAUTHORIZED === 'false'
          ? { rejectUnauthorized: false }
          : undefined,

      auth: process.env.MAIL_USER
        ? {
            user: process.env.MAIL_USER,
            pass: process.env.MAIL_PASS,
          }
        : undefined,
    });
  }

  async onModuleInit(): Promise<void> {
    // Verifica conectividad SMTP al iniciar (se puede omitir en desarrollo con MAIL_SKIP_VERIFY=true).
    if (process.env.MAIL_SKIP_VERIFY === 'true') {
      this.logger.warn('MAIL_SKIP_VERIFY=true, SMTP verification skipped');
      return;
    }

    try {
      await this.transporter.verify();
      this.logger.log('SMTP connection verified successfully');
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown SMTP verify error';

      this.logger.error(`SMTP verification failed: ${message}`);
    }
  }

  async sendMail(
    to: string | string[],
    subject: string,
    html: string,
    text?: string,
  ): Promise<void> {
    // Punto único de envío de correo (HTML y opcionalmente texto plano).
    try {
      await this.transporter.sendMail({
        from: this.from,
        to,
        subject,
        html,
        text,
      });

      this.logger.log(
        `Email sent to ${Array.isArray(to) ? to.join(', ') : to}`,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : 'Unknown email send error';

      this.logger.error(
        `Failed to send email to ${
          Array.isArray(to) ? to.join(', ') : to
        }: ${message}`,
      );

      throw new InternalServerErrorException(
        this.i18n.t('general.MAIL_SEND_FAILED', {
          lang: this.getLang(),
          args: {},
        }),
      );
    }
  }

  async sendTemplate<T extends object>(
    to: string | string[],
    subject: string,
    templateName: string,
    context: T,
    text?: string,
  ): Promise<void> {
    // Renderiza plantilla + contexto y delega el envío real a sendMail.
    const html = await this.renderTemplate(templateName, context);

    await this.sendMail(to, subject, html, text);
  }

  private async renderTemplate<T extends object>(
    templateName: string,
    context: T,
  ): Promise<string> {
    // Validación temprana para evitar errores silenciosos por nombre vacío.
    if (!templateName?.trim()) {
      throw new BadRequestException(
        this.i18n.t('general.MAIL_TEMPLATE_NAME_REQUIRED', {
          lang: this.getLang(),
          args: {},
        }),
      );
    }

    let template = this.templateCache.get(templateName);

    if (!template) {
      // Prioriza templates compilados en dist y usa src como fallback para entorno dev.
      const distTemplatePath = path.join(
        process.cwd(),
        'dist',
        'templates',
        'email',
        `${templateName}.hbs`,
      );

      const srcTemplatePath = path.join(
        process.cwd(),
        'src',
        'templates',
        'email',
        `${templateName}.hbs`,
      );

      const templatePath = existsSync(distTemplatePath)
        ? distTemplatePath
        : srcTemplatePath;

      try {
        // Compila plantilla Handlebars una sola vez y la guarda en cache.
        const source = await readFile(templatePath, 'utf8');

        template = Handlebars.compile(source);

        this.templateCache.set(templateName, template);
      } catch (error) {
        const message =
          error instanceof Error ? error.message : 'Unknown template read error';

        this.logger.error(
          `Failed to load email template "${templateName}" from ${templatePath}: ${message}`,
        );

        throw new InternalServerErrorException(
          this.i18n.t('general.MAIL_TEMPLATE_LOAD_FAILED', {
            lang: this.getLang(),
            args: {},
          }),
        );
      }
    }

    return template(context);
  }

  private getLang(): string {
    // Respeta idioma del contexto i18n por request y usa fallback global.
    return I18nContext.current()?.lang ?? process?.env?.APP_LANG ?? 'es';
  }
}