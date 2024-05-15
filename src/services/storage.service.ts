import { ConflictException, Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { ConfigService } from '@nestjs/config';

export enum StorageServiceType {
  S3 = 'S3',
}

@Injectable()
export class StorageService {
  private s3: AWS.S3;

  constructor(private configService: ConfigService) {
    this.s3 = new AWS.S3({
      accessKeyId: this.configService.get<string>('app.awsAccessKeyId'),
      secretAccessKey: this.configService.get<string>('app.awsSecretAccessKey'),
      region: this.configService.get<string>('app.awsRegion'),
    });
  }

  async uploadFile(
    provider: StorageServiceType,
    key: string,
    body: Buffer,
  ): Promise<void> {
    try {
      switch (provider) {
        case StorageServiceType.S3:
          await this.uploadToS3(
            this.configService.get<string>('app.awsS3BucketPhoto'),
            key,
            body,
          );
          break;
        default:
          throw new Error('Invalid storage provider');
      }
    } catch (error) {
      console.log(`Error: ${error}`);
      throw new ConflictException(`Error: ${error}`);
    }
  }

  async getFile(provider: StorageServiceType, key: string): Promise<Buffer> {
    switch (provider) {
      case StorageServiceType.S3:
        const fileBuffer = await this.getToS3(
          this.configService.get<string>('app.awsS3BucketPhoto'),
          key,
        );
        return fileBuffer;
      default:
        throw new Error('Invalid storage provider');
    }
  }

  private async getToS3(bucket: string, key: string): Promise<Buffer> {
    const getParams = {
      Bucket: bucket,
      Key: key,
    };
    const { Body } = await this.s3.getObject(getParams).promise();

    const imgBuffer = Body as Buffer;

    return imgBuffer;
  }

  private async uploadToS3(
    bucket: string,
    key: string,
    body: Buffer,
  ): Promise<void> {
    try {
      const uploadParams: AWS.S3.PutObjectRequest = {
        Bucket: bucket,
        Key: key,
        Body: body,
        ACL: 'public-read',
      };

      await this.s3.putObject(uploadParams).promise();
    } catch (error) {
      console.log(`Error: ${error}`);
      throw new ConflictException(`Error: ${error}`);
    }
  }
}
