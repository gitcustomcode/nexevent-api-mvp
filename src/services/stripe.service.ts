import { Injectable } from '@nestjs/common';import { CredentialType } from '@prisma/client';
import { Request } from 'express';
import { CheckoutSessionEventParticipantDto } from 'src/dtos/stripe.dto';
import Stripe from 'stripe';
import { PrismaService } from './prisma.service';

@Injectable()
export class StripeService {
  stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  // whsec_28c01e1721b9c1f0241fb2796b1591f12d21e95f7a245bac1c07c559f6c10678
  constructor(private readonly prisma: PrismaService) {}

  async createProduct(name: string, amount: number, currency: string) {
    let newAmount = parseFloat((amount * 100).toFixed(2));
    console.log(newAmount);
    const product = await this.stripe.products.create({
      name,
      default_price_data: {
        currency: currency,
        unit_amount: newAmount,
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

    return {
      sessionUrl: session.url,
      value: session.amount_total,
    };
  }

  async checkoutSessionEventParticipant(
    lineItems: CheckoutSessionEventParticipantDto,
  ) {
    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: 'https://sistema-dev.nexevent.com.br/',
      cancel_url: 'https://sistema-dev.nexevent.com.br/',
      payment_method_types: ['card', 'boleto'],
    });

    return {
      value: session.amount_total,
      url: session.url,
      id: session.id,
    };
  }

  async webhook(req: Request) {
    if (req.body.type === 'checkout.session.completed') {
      const balanceHistoric = await this.prisma.balanceHistoric.findFirst({
        where: {
          paymentId: req.body.data.object.id,
        },
      });

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        req.body.data.object.payment_intent,
      );

      let fee = 0;

      if (paymentIntent.payment_method_types[0] === 'card') {
        fee = Number(balanceHistoric.value) * 0.0399 + 0.39;
      } else if (paymentIntent.payment_method_types[0] === 'pix') {
        fee = Number(balanceHistoric.value) * 0.0119;
      } else if (paymentIntent.payment_method_types[0] === 'boleto') {
        fee = 3.45;
      }

      await this.prisma.balanceHistoric.update({
        where: {
          id: balanceHistoric.id,
        },
        data: {
          fee: fee.toFixed(2),
          status:
            req.body.data.object.payment_status === 'paid'
              ? 'RECEIVED'
              : 'PENDING',
        },
      });
    }
  }
}
