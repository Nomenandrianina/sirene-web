import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionPlanifieeService } from './diffusion-planifiee.service';

describe('DiffusionPlanifieeService', () => {
  let service: DiffusionPlanifieeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffusionPlanifieeService],
    }).compile();

    service = module.get<DiffusionPlanifieeService>(DiffusionPlanifieeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
