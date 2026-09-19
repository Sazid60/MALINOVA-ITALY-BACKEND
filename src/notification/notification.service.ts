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
      { code: 'order.placed', desc: 'Sent when customer places an order', cat: 'order' },
      { code: 'order.confirmed', desc: 'Sent when admin confirms the order', cat: 'order' },
      { code: 'order.processing', desc: 'Sent when admin starts processing', cat: 'order' },
      { code: 'order.dispatched', desc: 'Sent when order is dispatched for delivery', cat: 'order' },
      { code: 'order.delivered', desc: 'Sent when order is delivered', cat: 'order' },
      { code: 'order.cancelled', desc: 'Sent when admin cancels the order', cat: 'order' },
      { code: 'cancel_request.submitted', desc: 'Sent when client submits cancel request', cat: 'cancel' },
      { code: 'cancel_request.approved', desc: 'Sent when admin approves cancel request', cat: 'cancel' },
      { code: 'cancel_request.rejected', desc: 'Sent when admin rejects cancel request', cat: 'cancel' },
      { code: 'return_request.submitted', desc: 'Sent when client submits return request', cat: 'return' },
      { code: 'return_request.approved', desc: 'Sent when admin approves return request', cat: 'return' },
      { code: 'return_request.rejected', desc: 'Sent when admin rejects return request', cat: 'return' },
      { code: 'delivery.in_transit', desc: 'Sent when Pathao picks up order', cat: 'delivery' },
      { code: 'delivery.out_for_delivery', desc: 'Sent when rider is on the way', cat: 'delivery' },
      { code: 'delivery.failed', desc: 'Sent when delivery attempt fails', cat: 'delivery' },
      { code: 'payment.confirmed', desc: 'Sent when SSLCommerz payment is confirmed', cat: 'payment' },
      { code: 'emi.reminder', desc: 'EMI installment due reminder sent to customer', cat: 'emi' },
      { code: 'emi.overdue', desc: 'EMI installment overdue notice sent to customer', cat: 'emi' },
      { code: 'emi.paid', desc: 'EMI installment collected — payment receipt sent to customer', cat: 'emi' },
      { code: 'otp.password_reset', desc: 'OTP for password reset', cat: 'otp' },
      { code: 'servicing.quote_ready', desc: 'Service quote ready for customer approval', cat: 'servicing' },
      { code: 'servicing.ready', desc: 'Repaired device ready for pickup', cat: 'servicing' },
      { code: 'servicing.returned', desc: 'Device returned to customer without repair', cat: 'servicing' },
      { code: 'servicing.cancelled', desc: 'Service claim cancelled', cat: 'servicing' },
    ];

    // Clean up obsolete servicing events
    const obsoleteCodes = [
      'servicing.job_created',
      'servicing.approved',
      'servicing.delivered',
      'servicing.otp_collect',
      'warranty.claim_status',
    ];
    for (const code of obsoleteCodes) {
      const obsoleteEvt = await this.eventRepo.findOne({ where: { event_code: code } });
      if (obsoleteEvt) {
        await this.templateRepo.delete({ event_id: obsoleteEvt.id });
        await this.eventRepo.delete({ id: obsoleteEvt.id });
      }
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
      'order.placed': "Dear {customerName}, thank you for your order #{orderNumber}! Total: BDT {totalAmount}. We'll notify you when shipped. - {shopName}",
      'order.confirmed': 'Hi {customerName}, your order #{orderNumber} has been confirmed and is being prepared. - {shopName}',
      'order.processing': 'Hi {customerName}, your order #{orderNumber} is now being processed. - {shopName}',
      'order.dispatched': 'Great news {customerName}! Your order #{orderNumber} is on the way. Track: {trackingCode} - {shopName}',
      'order.delivered': 'Dear {customerName}, your order #{orderNumber} has been delivered. Total: BDT {totalAmount}. Thank you! - {shopName}',
      'order.cancelled': 'Dear {customerName}, your order #{orderNumber} has been cancelled. Reason: {reason}. - {shopName}',
      'cancel_request.submitted': 'Dear {customerName}, your cancel request for order #{orderNumber} has been submitted and is pending approval. - {shopName}',
      'cancel_request.approved': 'Dear {customerName}, your cancel request for order #{orderNumber} has been approved. - {shopName}',
      'cancel_request.rejected': 'Dear {customerName}, your cancel request for order #{orderNumber} was not approved. Reason: {reason}. - {shopName}',
      'return_request.submitted': 'Dear {customerName}, your return request for order #{orderNumber} has been submitted and is pending review. - {shopName}',
      'return_request.approved': 'Dear {customerName}, your return request for order #{orderNumber} has been approved. Refund: BDT {refundAmount}. - {shopName}',
      'return_request.rejected': 'Dear {customerName}, your return request for order #{orderNumber} was not approved. Reason: {reason}. - {shopName}',
      'delivery.in_transit': 'Dear {customerName}, your order #{orderNumber} has been picked up and is on its way! - {shopName}',
      'delivery.out_for_delivery': 'Dear {customerName}, your order #{orderNumber} is out for delivery and will arrive soon! - {shopName}',
      'delivery.failed': 'Dear {customerName}, delivery attempt for order #{orderNumber} was unsuccessful. Reason: {reason}. Please contact us. - {shopName}',
      'payment.confirmed': 'Dear {customerName}, payment of BDT {totalAmount} for order #{orderNumber} confirmed via {paymentMethod}. Thank you! - {shopName}',
      'emi.reminder': 'Dear {customerName}, reminder: EMI installment #{installmentNo} of BDT {amount} for order #{orderNumber} is due on {dueDate} ({daysLeft} days left). Please pay on time. - {shopName}',
      'emi.overdue': 'Dear {customerName}, your EMI installment #{installmentNo} of BDT {amount} for order #{orderNumber} was due on {dueDate} and is now OVERDUE. Please pay immediately. - {shopName}',
      'emi.paid': 'Dear {customerName}, payment received! EMI installment #{installmentNo} of BDT {amount} for order #{orderNumber} has been collected successfully. Thank you! - {shopName}',
      'servicing.quote_ready': 'Dear {customerName}, the repair quote for your {productName} (Job: {jobCode}) is ready. Estimated cost: BDT {quoteAmount}. Please respond to approve. - {shopName}',
      'servicing.ready': 'Dear {customerName}, your {productName} (Job: {jobCode}) is repaired and ready for pickup. Total payable: BDT {payableAmount}. Please visit our outlet. - {shopName}',
      'servicing.returned': 'Dear {customerName}, on inspection your {productName} (Job: {jobCode}) could not be repaired and has been returned to you as-is. Visit us anytime if we can help. - {shopName}',
      'servicing.cancelled': 'Dear {customerName}, your service claim (Job: {jobCode}) has been cancelled. Reason: {reason}. - {shopName}',
      'otp.password_reset': 'Your {shopName} OTP is {otp}',
    };
  }
}
