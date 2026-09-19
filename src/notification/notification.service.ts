import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import {
  NotificationChannel,
  NotificationEvent,
  NotificationTemplate,
  NotificationLog,
} from './notification.entity';

@Injectable()
export class NotificationService implements OnModuleInit {
  private readonly logger = new Logger(NotificationService.name);

  constructor(
    @InjectRepository(NotificationChannel)
    private readonly channelRepo: Repository<NotificationChannel>,
    @InjectRepository(NotificationEvent)
    private readonly eventRepo: Repository<NotificationEvent>,
    @InjectRepository(NotificationTemplate)
    private readonly templateRepo: Repository<NotificationTemplate>,
    @InjectRepository(NotificationLog)
    private readonly logRepo: Repository<NotificationLog>,
    private readonly configService: ConfigService,
  ) {}

  async onModuleInit() {
    try {
      await this.ensureSeedData();
    } catch (err: any) {
      this.logger.error('Failed to initialize notification seed data:', err.message || err);
    }
  }

  // ── 1. Dispatch Event (Main SMS Dispatcher) ──────────────────────────────────
  async dispatchEvent(
    eventCode: string,
    phoneNumber: string | null | undefined,
    variables: Record<string, string>,
    options?: { orderId?: number; customerId?: number },
  ): Promise<boolean> {
    if (!phoneNumber) {
      this.logger.warn(`Skip SMS for event [${eventCode}]: missing phone number`);
      return false;
    }

    try {
      const template = await this.getTemplateByEventCode(eventCode);
      let bodyTemplate = template?.body_template;
      if (!template) {
        const defaultMap = this.getDefaultTemplatesMap();
        bodyTemplate = defaultMap[eventCode] || 'Dear {customerName}, update regarding order #{orderNumber}, serial {serialNumber}: {status}. - {shopName}';
        this.logger.log(`No database template found for [${eventCode}]. Using fallback default template.`);
      } else if (!eventCode.startsWith('otp.') && (!template.is_active || !template.event?.is_active || !template.channel?.is_active)) {
        this.logger.log(`SMS skipped for event [${eventCode}]: deactivated`);
        await this.logRepo.save({
          event_code: eventCode,
          phone: phoneNumber,
          message: 'N/A',
          status: 'skipped',
          error: 'Template/Event/Channel inactive',
          order_id: options?.orderId,
          customer_id: options?.customerId,
        });
        return false;
      }

      const shopName = this.configService.get<string>('SMS_SHOP_NAME') || 'Bombai Achar';
      const mergedVariables = { shopName, ...variables };
      const message = this.renderTemplate(bodyTemplate, mergedVariables);

      const sent = await this.sendSms(phoneNumber, message);
      await this.logRepo.save({
        event_code: eventCode,
        phone: phoneNumber,
        message,
        status: sent.success ? 'sent' : 'failed',
        error: sent.error || null,
        order_id: options?.orderId,
        customer_id: options?.customerId,
      });
      return sent.success;
    } catch (err: any) {
      this.logger.error(`Error dispatching SMS event [${eventCode}]:`, err.message || err);
      return false;
    }
  }

  // ── 2. Send SMS via BulkSMSBD API ───────────────────────────────────────────
  async sendSms(rawPhone: string, message: string): Promise<{ success: boolean; error?: string }> {
    let number = rawPhone.trim().replace(/\s+/g, '');
    if (number.startsWith('01')) {
      number = '88' + number;
    } else if (number.startsWith('+8801')) {
      number = number.replace('+', '');
    }

    const apiKey = this.configService.get<string>('BULKSMS_API_KEY');
    const senderId = this.configService.get<string>('BULKSMS_SENDER_ID');

    if (!apiKey || !senderId) {
      const err = 'BulkSMSBD API Key or Sender ID missing in environment variables';
      this.logger.error(err);
      return { success: false, error: err };
    }

    try {
      const isUnicode = /[^\x00-\x7F]/.test(message);
      const params = new URLSearchParams({
        api_key: apiKey,
        type: isUnicode ? 'unicode' : 'text',
        number,
        senderid: senderId,
        message,
      });

      const res = await fetch(`https://bulksmsbd.net/api/smsapi?${params.toString()}`, {
        method: 'POST',
      });
      const data = await res.json().catch(() => ({}));
      this.logger.log(`BulkSMSBD Response for ${number}:`, data);

      if (data.response_code === 202) {
        return { success: true };
      } else {
        const errStr = data.error_message || `BulkSMSBD Error Code: ${data.response_code}`;
        this.logger.error(`BulkSMSBD SMS failed for ${number}: ${errStr}`);
        return { success: false, error: errStr };
      }
    } catch (err: any) {
      const errorMsg = err.message || err;
      this.logger.error(`Failed to send SMS to ${number}:`, errorMsg);
      return { success: false, error: String(errorMsg) };
    }
  }

  // ── 3. Render Template ──────────────────────────────────────────────────────
  renderTemplate(template: string, variables: Record<string, string>): string {
    return template.replace(/\{(\w+)\}/g, (match, key) => {
      return variables[key] !== undefined ? variables[key] : match;
    });
  }

  // ── 4. Admin CRUD Operations ────────────────────────────────────────────────
  async getAllTemplates() {
    return this.templateRepo.find({
      relations: ['event', 'channel'],
      order: { event: { category: 'ASC', id: 'ASC' } },
    });
  }

  async getTemplateById(id: number) {
    return this.templateRepo.findOne({
      where: { id },
      relations: ['event', 'channel'],
    });
  }

  async getTemplateByEventCode(eventCode: string) {
    return this.templateRepo.findOne({
      where: { event: { event_code: eventCode }, channel: { code: 'sms' } },
      relations: ['event', 'channel'],
    });
  }

  async updateTemplate(id: number, dto: { body_template?: string; is_active?: boolean; title?: string }) {
    const template = await this.getTemplateById(id);
    if (!template) throw new Error('Template not found');

    if (dto.body_template !== undefined) template.body_template = dto.body_template;
    if (dto.is_active !== undefined) template.is_active = dto.is_active;
    if (dto.title !== undefined) template.title = dto.title;

    return this.templateRepo.save(template);
  }

  async resetTemplateToDefault(id: number) {
    const template = await this.getTemplateById(id);
    if (!template) throw new Error('Template not found');

    const defaultMap = this.getDefaultTemplatesMap();
    const defaultBody = defaultMap[template.event.event_code];
    if (defaultBody) {
      template.body_template = defaultBody;
      template.is_active = true;
      return this.templateRepo.save(template);
    }
    return template;
  }

  async getAllEvents() {
    return this.eventRepo.find({ order: { category: 'ASC', id: 'ASC' } });
  }

  async getLogs(page = 1, limit = 50) {
    const [data, total] = await this.logRepo.findAndCount({
      order: { id: 'DESC' },
      take: limit,
      skip: (page - 1) * limit,
    });
    return { data, total, page, limit };
  }

  // ── 5. Default Seed Data Helper ─────────────────────────────────────────────
  private async ensureSeedData() {
    let smsChannel = await this.channelRepo.findOne({ where: { code: 'sms' } });
    if (!smsChannel) {
      smsChannel = await this.channelRepo.save(
        this.channelRepo.create({
          code: 'sms',
          name: 'Bulk SMS (BulkSMSBD)',
          is_active: true,
        }),
      );
    }

    const eventsList = [
      { code: 'otp.password_reset', desc: 'OTP for password reset', cat: 'otp' },
    ];

    // Clean up all non-OTP and obsolete notification events & templates
    const obsoleteEvents = await this.eventRepo
      .createQueryBuilder('event')
      .where("event.event_code != 'otp.password_reset'")
      .getMany();

    for (const obsoleteEvt of obsoleteEvents) {
      await this.templateRepo.delete({ event_id: obsoleteEvt.id });
      await this.eventRepo.delete({ id: obsoleteEvt.id });
    }

    const defaults = this.getDefaultTemplatesMap();

    for (const item of eventsList) {
      let event = await this.eventRepo.findOne({ where: { event_code: item.code } });
      if (!event) {
        event = await this.eventRepo.save(
          this.eventRepo.create({
            event_code: item.code,
            description: item.desc,
            category: item.cat,
            is_active: true,
          }),
        );
      }

      const existingTpl = await this.templateRepo.findOne({
        where: { event_id: event.id, channel_id: smsChannel.id, language: 'en' },
      });

      if (!existingTpl) {
        await this.templateRepo.save(
          this.templateRepo.create({
            event_id: event.id,
            channel_id: smsChannel.id,
            language: 'en',
            title: `${item.code} - Default`,
            body_template: defaults[item.code] || 'Dear {customerName}, update regarding order #{orderNumber}, serial {serialNumber}: {status}. - {shopName}',
            is_active: true,
          }),
        );
      }
    }
  }

  private getDefaultTemplatesMap(): Record<string, string> {
    return {
      'otp.password_reset': 'Your {shopName} OTP is {otp}',
    };
  }
}
