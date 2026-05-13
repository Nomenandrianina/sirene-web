import { Test, TestingModule } from '@nestjs/testing';
import { AlerteBngrcService } from './alerte-bngrc.service';

describe('AlerteBngrcService', () => {
  let service: AlerteBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlerteBngrcService],
    }).compile();

    service = module.get<AlerteBngrcService>(AlerteBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
