import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { SwapModule } from './swap/swap.module';
import { TokenModule } from './token/token.module';
import { ConfigModule } from '@nestjs/config';
import { BurnModule } from './burn/burn.module';

@Module({
  imports: [
    SwapModule,
    TokenModule,
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    BurnModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
