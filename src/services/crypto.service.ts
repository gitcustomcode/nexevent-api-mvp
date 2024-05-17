import { Injectable } from '@nestjs/common';
import * as CryptoJs from 'crypto-js';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CryptoPassword {
  private PASSWORD: string;

  constructor(private configService: ConfigService) {
    this.PASSWORD = this.configService.get<string>('app.cryptoPassword');
  }

  async encode(string: string) {
    const password = this.PASSWORD;
    const hash = CryptoJs.AES.encrypt(string, password).toString();

    return hash;
  }

  async decode(string: string) {
    const password = this.PASSWORD;
    const bytes = CryptoJs.AES.decrypt(string, password);
    const originalText = JSON.parse(bytes.toString(CryptoJs.enc.Utf8));

    return originalText;
  }
}
