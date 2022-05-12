import { Module } from '@nestjs/common';
import { Client } from 'whatsapp-web.js';
import * as qrcode from 'qrcode-terminal';

export const WHATSAPP_CLIENT = 'whatsapp_client';

@Module({
  providers: [
    {
      provide: WHATSAPP_CLIENT,
      useFactory: () => {
        const client = new Client({});

        client.once('qr', (qr) => {
          // Generate and scan this code with your phone
          qrcode.generate(qr, { small: true });
        });

        client.on('ready', () => {
          console.log('Client is ready!');
        });

        client.initialize();

        return client;
      },
    },
  ],
  exports: [WHATSAPP_CLIENT],
})
export class WhatsappModule {}
