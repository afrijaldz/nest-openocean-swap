import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { TransactionResult } from 'src/common/types';
import { BurnService } from './burn.service';

interface BurnRequest {
  idrxAmount: string;
}

@Controller('burn')
export class BurnController {
  constructor(private readonly burnService: BurnService) {}

  @Post('burn-idrx')
  async burnIdrx(@Body() body: BurnRequest): Promise<TransactionResult> {
    try {
      const { idrxAmount } = body;

      if (!idrxAmount || isNaN(parseFloat(idrxAmount))) {
        throw new HttpException(
          'Invalid IDRX amount provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (parseFloat(idrxAmount) <= 0) {
        throw new HttpException(
          'IDRX amount must be greater than 0',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.burnService.burnIdrx(idrxAmount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to burn IDRX tokens';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
