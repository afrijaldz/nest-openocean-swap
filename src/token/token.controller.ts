import { Controller, Get, HttpException, HttpStatus } from '@nestjs/common';
import { TokenService } from './token.service';

@Controller('token')
export class TokenController {
  constructor(private readonly tokenService: TokenService) {}

  @Get('balance')
  async getBalance(): Promise<{
    usdt: string;
    idrx: string;
  }> {
    try {
      return await this.tokenService.getAccountBalance();
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get balance';
      throw new HttpException(errorMessage, HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}
