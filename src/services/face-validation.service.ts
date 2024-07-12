import { Injectable } from '@nestjs/common';import { ConfigService } from '@nestjs/config';
import { PrismaService } from './prisma.service';
import { StorageService, StorageServiceType } from './storage.service';

@Injectable()
export class FaceValidationService {
  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
    private readonly storageService: StorageService,
  ) {}

  async validateWithFacial(userPhoto: Express.Multer.File) {
    try {
      const usersFacials = await this.prisma.userFacial.findMany({
        include: {
          user: true,
        },
      });

      const validationPromises = usersFacials.map(async (user) => {
        const photo = await this.storageService.getFile(
          StorageServiceType.S3,
          user.path,
        );

        if (!userPhoto.buffer || !photo) {
          console.error(
            'Uma das imagens está vazia ou não foi carregada corretamente.',
          );
          return false;
        }

        try {
          const valid = await this.storageService.validateFacial(
            userPhoto.buffer,
            photo,
          );

          if (valid !== false && valid > 95) {
            return {
              id: user.user.id,
              email: user.user.email,
              expirationDate: user.expirationDate,
            };
          } else {
            return false;
          }
        } catch (err) {
          return false;
        }
      });

      const results = await Promise.all(validationPromises);

      // Filtrar resultados válidos
      const validResults = results.filter((result) => result !== false);

      return validResults[0];
    } catch (error) {
      console.error('Erro no login facial:', error.message);
      throw error;
    }
  }
}
