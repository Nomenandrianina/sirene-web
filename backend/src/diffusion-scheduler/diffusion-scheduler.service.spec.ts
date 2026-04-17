import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionSchedulerService } from './diffusion-scheduler.service';

describe('DiffusionSchedulerService', () => {
  let service: DiffusionSchedulerService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffusionSchedulerService],
    }).compile();

    service = module.get<DiffusionSchedulerService>(DiffusionSchedulerService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
