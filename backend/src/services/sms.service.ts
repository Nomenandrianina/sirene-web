import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SmsService {
  private readonly clientId:     string;
  private readonly clientSecret: string;
  private readonly senderName:   string;
  private readonly senderPhone = 'tel:+261326080002';
  private readonly apiBase     = 'https://api.orange.com';

  constructor(private readonly config: ConfigService) {
    this.clientId     = this.config.get<string>('CLIENT_ID_ORANGE', '');
    this.clientSecret = this.config.get<string>('CLIENT_SECRET_ORANGE', '');
    this.senderName   = this.config.get<string>('ORANGE_SENDERNAME', 'Mitao');
  }

  // ── 1. Obtenir le token OAuth2 ─────────────────────────────────────────
  async getToken(): Promise<string> {
    const credentials = Buffer.from(
      `${this.clientId}:${this.clientSecret}`,
    ).toString('base64');

    const res = await fetch(`${this.apiBase}/oauth/v3/token`, {
      method:  'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type':  'application/x-www-form-urlencoded',
        'Accept':        'application/json',
      },
      body: 'grant_type=client_credentials',
    });

    const data = await res.json() as any;

    if (!res.ok || !data.access_token) {
      throw new InternalServerErrorException(
        `Impossible d'obtenir le jeton Orange : ${data.error ?? res.status}`,
      );
    }

    return data.access_token;
  }

  // ── 2. Envoyer un SMS ──────────────────────────────────────────────────
  async sendSms(receiverPhoneNumber: string, message: string): Promise<any> {
    const token = await this.getToken();

    // Normaliser le numéro : ajouter tel: si absent
    const to = receiverPhoneNumber.startsWith('tel:')
      ? receiverPhoneNumber
      : `tel:${receiverPhoneNumber}`;

    const body = {
      outboundSMSMessageRequest: {
        address:               to,
        senderAddress:         this.senderPhone,
        outboundSMSTextMessage: { message },
        senderName:            this.senderName,
      },
    };

    const res = await fetch(
      `${this.apiBase}/smsmessaging/v1/outbound/${encodeURIComponent(this.senderPhone)}/requests`,
      {
        method:  'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type':  'application/json',
          'Accept':        'application/json',
        },
        body: JSON.stringify(body),
      },
    );

    const data = await res.json() as any;

    if (!res.ok) {
      throw new InternalServerErrorException(
        data.requestError?.serviceException?.text ??
        data.error ??
        `Erreur SMS Orange : ${res.status}`,
      );
    }

    return data;
  }

  // ── 3. Contrats admin (quota SMS) ─────────────────────────────────────
  async getAdminContracts(): Promise<any> {
    const token = await this.getToken();

    const res = await fetch(
      `${this.apiBase}/sms/admin/v1/contracts`,
      {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Accept':        'application/json',
        },
      },
    );

    const data = await res.json() as any;

    if (!res.ok) {
      throw new InternalServerErrorException(
        data.error ?? `Erreur contrats Orange : ${res.status}`,
      );
    }

    return data;
  }
}