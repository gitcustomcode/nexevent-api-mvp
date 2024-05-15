import { registerAs } from '@nestjs/config';
import * as dotenv from 'dotenv';

dotenv.config();

export default registerAs('app', () => ({
  jwtSecret: process.env.JWT_SECRET,

  awsAccessKeyId: process.env.AWS_ACCESS_KEY_ID,
  awsSecretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  awsRegion: process.env.AWS_REGION,
  awsS3BucketPhoto: process.env.AWS_S3_BUCKET_PHOTO,

  mailGunApiKey: process.env.MAILGUN_API_KEYS,
  mailGunDomain: process.env.MAILGUN_DOMAIN,
  mailGuFrom: process.env.MAILGUN_FROM,

  cryptoPassword: process.env.CRYPTO_PASSWORD,
  jwt: process.env.JWT_SECRET,

  clickSignApiKey: process.env.CLICK_SIGN_API_KEY,
  clickSignUrl: process.env.CLICK_SIGN_URL,

  asaasApiKey: process.env.ASAAS_API_KEY,
  asaasUrl: process.env.ASAAS_URL,
  asaasWalletId: process.env.ASAAS_WALLET_ID,
}));
