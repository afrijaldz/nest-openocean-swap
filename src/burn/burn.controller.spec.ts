import { Test, TestingModule } from '@nestjs/testing';
import { BurnController } from './burn.controller';

describe('BurnController', () => {
  let controller: BurnController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [BurnController],
    }).compile();

    controller = module.get<BurnController>(BurnController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
