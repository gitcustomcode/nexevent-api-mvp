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
      success_url: process.env.STRIPE_SUCCESS_PRODUCTOR_URL,
      cancel_url: process.env.STRIPE_CANCEL_PRODUCTOR_URL,
    });

    return {
      sessionUrl: session.url,
      value: session.amount_total,
      id: session.id,
    };
  }

  async checkoutSessionEventParticipant(
    lineItems: CheckoutSessionEventParticipantDto,
    onlyReal: boolean,
    partId?: string,
  ) {
    const paymentMethod: Stripe.Checkout.SessionCreateParams.PaymentMethodType[] =
      ['card'];

    if (onlyReal) {
      paymentMethod.push('boleto');
    }

    const session = await this.stripe.checkout.sessions.create({
      line_items: lineItems,
      mode: 'payment',
      success_url: `${process.env.STRIPE_SUCCESS_PARTICIPANT_URL}${partId ? partId : ''}`,
      cancel_url: process.env.STRIPE_CANCEL_PARTICIPANT_URL,
      payment_method_types: paymentMethod,
      allow_promotion_codes: true,
    });

    return {
      value: session.amount_total,
      url: session.url,
      id: session.id,
    };
  }

  async createCupom(
    percentOff: number,
    appliesTo: string[],
    code: string,
    expireAt: Date,
  ) {
    const products = [];

    await Promise.all(
      appliesTo.map(async (priceId) => {
        const product = await this.stripe.prices.retrieve(priceId);

        products.push(product.product);
      }),
    );

    const cupom = await this.stripe.coupons.create({
      percent_off: percentOff,
      applies_to: { products: products },
      duration: 'repeating',
      duration_in_months: 3,
    });

    const promotionCode = await this.stripe.promotionCodes.create({
      coupon: cupom.id,
      code,
      expires_at: Math.floor(expireAt.getTime() / 1000),
    });

    return promotionCode;
  }

  async webhook(req: Request) {
    console.log('REQ', req);
    if (req.body.type === 'checkout.session.completed') {
      const balanceHistorics = await this.prisma.balanceHistoric.findMany({
        where: {
          paymentId: req.body.data.object.id,
        },
      });

      if (balanceHistorics.length <= 0) {
        return;
      }

      const paymentIntent = await this.stripe.paymentIntents.retrieve(
        req.body.data.object.payment_intent,
      );

      await Promise.all(
        balanceHistorics.map(async (balanceHistoric) => {
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

          if (balanceHistoric.eventParticipantId) {
            await this.prisma.eventParticipant.update({
              where: {
                id: balanceHistoric.eventParticipantId,
              },
              data: {
                status: 'COMPLETE',
              },
            });
          }
        }),
      );
    }
  }
}
