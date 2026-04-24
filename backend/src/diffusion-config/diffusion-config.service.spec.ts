import { Test, TestingModule } from '@nestjs/testing';
import { DiffusionConfigService } from './diffusion-config.service';

describe('DiffusionConfigService', () => {
  let service: DiffusionConfigService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [DiffusionConfigService],
    }).compile();

    service = module.get<DiffusionConfigService>(DiffusionConfigService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
