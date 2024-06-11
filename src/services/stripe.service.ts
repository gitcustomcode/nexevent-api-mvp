import { Injectable } from '@nestjs/common';
import { CredentialType } from '@prisma/client';
import { CheckoutSessionEventParticipantDto } from 'src/dtos/stripe.dto';
import Stripe from 'stripe';

@Injectable()
export class StripeService {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  constructor() {}

  async createProduct(name: string, amount: number) {
    const product = await this.stripe.products.create({
      name,
      default_price_data: {
        currency: 'BRL',
        unit_amount: amount * 100,
      },
    });

    return {
      id: product.default_price,
    };
  }

  async listPrices(productId: string) {
    const prices = await this.stripe.products.retrieve(productId);

    console.log(prices);

    return prices;
  }

  async checkoutSessionEventProducer(
    qtd: number,
    printAutomatic: boolean,
    credential: CredentialType,
  ) {
    const lineItems = [];

    if (printAutomatic) {
      lineItems.push({
        price: process.env.STRIPE_PRICE_ID_PRINT_AUTOMATIC,
        quantity: qtd,
      });
    }

    switch (credential) {
      case 'QRCODE':
        lineItems.push({
          price: process.env.STRIPE_PRICE_ID_ACCREDITATION_QRCODE,
          quantity: qtd,
        });
        break;
      case 'FACIAL_IN_SITE':
        lineItems.push({
          price: process.env.STRIPE_PRICE_ID_ACCREDITATION_FACIAL_IN_SITE,
          quantity: qtd,
        });
        break;
      case 'FACIAL':
        lineItems.push({
          price: process.env.STRIPE_PRICE_ID_ACCREDITATION_FACIAL_EXTERNAL,
          quantity: qtd,
        });
        break;
      default:
        break;
    }

    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://sistema-dev.nexevent.com.br/events/my-events',
      cancel_url: 'https://sistema-dev.nexevent.com.br/events/new-event',
    });

    return session.url;
  }

  async checkoutSessionEventParticipant(
    lineItems: CheckoutSessionEventParticipantDto,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://sistema-dev.nexevent.com.br/',
      cancel_url: 'https://sistema-dev.nexevent.com.br/',
    });

    return {
      value: session.amount_total,
      url: session.url,
      id: session.id,
    };
  }
}
