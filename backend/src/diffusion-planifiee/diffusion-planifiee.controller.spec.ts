import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionPlanifieeController } from './diffusion-planifiee.controller';
import { DiffusionPlanifieeService } from './diffusion-planifiee.service';

describe('DiffusionPlanifieeController', () => {
  let controller: DiffusionPlanifieeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [DiffusionPlanifieeController],
      providers: [DiffusionPlanifieeService],
    }).compile();

    controller = module.get<DiffusionPlanifieeController>(DiffusionPlanifieeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
