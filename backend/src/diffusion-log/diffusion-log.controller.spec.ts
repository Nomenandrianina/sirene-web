import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionLogController } from './diffusion-log.controller';
import { DiffusionLogService } from './diffusion-log.service';

describe('DiffusionLogController', () => {
  let controller: DiffusionLogController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiffusionLogController],
      providers: [DiffusionLogService],
    }).compile();

    controller = module.get<DiffusionLogController>(DiffusionLogController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
