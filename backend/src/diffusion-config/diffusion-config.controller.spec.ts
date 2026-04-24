import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionConfigController } from './diffusion-config.controller';
import { DiffusionConfigService } from './diffusion-config.service';

describe('DiffusionConfigController', () => {
  let controller: DiffusionConfigController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiffusionConfigController],
      providers: [DiffusionConfigService],
    }).compile();

    controller = module.get<DiffusionConfigController>(DiffusionConfigController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
