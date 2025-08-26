import { Module } from '@nestjs/common';
import { BurnService } from './burn.service';
import { BurnController } from './burn.controller';

@Module({
  providers: [BurnService],
  controllers: [BurnController],
})
export class BurnModule {}
