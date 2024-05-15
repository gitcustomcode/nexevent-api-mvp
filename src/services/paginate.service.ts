import { Injectable } from '@nestjs/common';
import { PaginationParamns, PaginationResponse } from 'src/dtos/pagination.dto';
@Injectable()
export class PaginationService {
  constructor() {}

  async paginate(
    paginationParamns: PaginationParamns,
  ): Promise<PaginationResponse> {
    const { totalItems, page, perPage } = paginationParamns;

    const totalPages = Math.ceil(totalItems / perPage);
    const remainingPages = totalPages - page;
    const nextPage = remainingPages > 0 ? page + 1 : null;
    const prevPage = page > 1 ? page - 1 : null;

    const response: PaginationResponse = {
      totalItems,
      totalPages,
      remainingPages,
      nextPage,
      prevPage,
    };

    return response;
  }
}
