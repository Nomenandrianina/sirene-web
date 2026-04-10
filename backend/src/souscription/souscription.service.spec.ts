import { Test, TestingModule } from '@nestjs/testing';
import { SouscriptionService } from './souscription.service';

describe('SouscriptionService', () => {
  let service: SouscriptionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SouscriptionService],
    }).compile();

    service = module.get<SouscriptionService>(SouscriptionService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
