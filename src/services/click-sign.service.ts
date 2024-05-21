import { Injectable } from '@nestjs/common';
import axios from 'axios';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ClickSignApiService {
  private readonly apiUrl: string;
  private readonly accessToken: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get<string>('app.clickSignUrl');
    this.accessToken = this.configService.get<string>('app.clickSignApiKey');
  }

  async createSigner(
    email: string,
    phone_number: string,
    name: string,
    documentation: string,
    birthday: string,
  ) {
    const signer = {
      signer: {
        email: email,
        phone_number: phone_number,
        auths: ['email'],
        name: name,
        documentation: documentation,
        birthday: birthday,
        has_documentation: true,
        selfie_enabled: false,
        handwritten_enabled: false,
        location_required_enabled: false,
        official_document_enabled: false,
        liveness_enabled: false,
        facial_biometrics_enabled: false,
      },
    };

    try {
      const resposta = await axios.post(
        `${this.apiUrl}/v1/signers?access_token=${this.accessToken}`,
        signer,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );
      return resposta.data; // ou faça algo com os dados da resposta
    } catch (erro) {
      console.error('Erro na chamada da API:', erro);
      throw erro; // ou manipule o erro conforme necessário
    }
  }

  async postDocument(
    documentPath: string,
    contentBase64: string,
  ): Promise<any> {
    const headers = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    const data = {
      document: {
        path: documentPath,
        content_base64: contentBase64,
      },
    };

    console.log(this.accessToken);
    console.log(this.apiUrl);

    try {
      const response = await axios.post(
        `${this.apiUrl}/v1/documents?access_token=${this.accessToken}`,
        data,
        { headers },
      );
      return response.data;
    } catch (error) {
      throw error.response.data;
    }
  }

  async addSignerDocument(document_key: string, signer_key: string) {
    const addSignerDocument = {
      list: {
        document_key: document_key,
        signer_key: signer_key,
        sign_as: 'sign',
        refusable: false,
        message: 'Por favor, assine o documento.',
      },
    };

    try {
      const resposta = await axios.post(
        `${this.apiUrl}/v1/lists?access_token=${this.accessToken}`,
        addSignerDocument,
        {
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
          },
        },
      );

      console.log('Resposta da API:', resposta.data);
      return resposta.data; // ou faça algo com os dados da resposta
    } catch (erro) {
      console.error('Erro na chamada da API:', erro);
      throw erro; // ou manipule o erro conforme necessário
    }
  }

  async sendEmail(key: string) {
    const apiToken: string =
      '1afe3ab0-d4ae-4910-8868-e9da668cd2a726896b9e-b5c3-40ca-9bfd-560f8132f799';
  }
}
