import {
  Body,
  Controller,
  HttpException,
  HttpStatus,
  Post,
} from '@nestjs/common';
import { type SwapRequest } from './swap';
import { SwapService } from './swap.service';
import { TransactionResult } from 'src/common/types';

@Controller('swap')
export class SwapController {
  constructor(private readonly swapService: SwapService) {}

  @Post('usdt-to-idrx')
  async swapUsdtToIdrx(@Body() body: SwapRequest): Promise<TransactionResult> {
    try {
      const { usdtAmount } = body;

      if (!usdtAmount || isNaN(parseFloat(usdtAmount))) {
        throw new HttpException(
          'Invalid USDT amount provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.swapService.swapUsdtToIdrx(usdtAmount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to execute swap';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }

  @Post('usdt-to-idrx-then-burn-idrx')
  async swapUsdtToIdrxThenBurnIdrx(
    @Body() body: SwapRequest,
  ): Promise<{ swap: TransactionResult }> {
    try {
      const { usdtAmount } = body;

      if (!usdtAmount || isNaN(parseFloat(usdtAmount))) {
        throw new HttpException(
          'Invalid USDT amount provided',
          HttpStatus.BAD_REQUEST,
        );
      }

      return await this.swapService.swapUsdtToIdrxThenBurnIdrx(usdtAmount);
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to execute swap';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
