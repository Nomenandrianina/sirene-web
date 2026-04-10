import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionLogService } from './diffusion-log.service';

describe('DiffusionLogService', () => {
  let service: DiffusionLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffusionLogService],
    }).compile();

    service = module.get<DiffusionLogService>(DiffusionLogService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
