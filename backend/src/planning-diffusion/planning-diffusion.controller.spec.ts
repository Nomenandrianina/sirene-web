import { Test, TestingModule } from '@nestjs/testing';
import { PlanningDiffusionController } from './planning-diffusion.controller';

describe('PlanningDiffusionController', () => {
  let controller: PlanningDiffusionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlanningDiffusionController],
    }).compile();

    controller = module.get<PlanningDiffusionController>(PlanningDiffusionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
