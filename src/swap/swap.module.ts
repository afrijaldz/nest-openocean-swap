import { Module } from '@nestjs/common';
import { SwapController } from './swap.controller';
import { HttpModule } from '@nestjs/axios';
import { SwapService } from './swap.service';
import { TokenService } from 'src/token/token.service';
import { BurnService } from 'src/burn/burn.service';

@Module({
  imports: [HttpModule],
  controllers: [SwapController],
  providers: [SwapService, TokenService, BurnService],
})
export class SwapModule {}
