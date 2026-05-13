import { Test, TestingModule } from '@nestjs/testing';
import { TypeAlerteBngrcService } from './type-alerte-bngrc.service';

describe('TypeAlerteBngrcService', () => {
  let service: TypeAlerteBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TypeAlerteBngrcService],
    }).compile();

    service = module.get<TypeAlerteBngrcService>(TypeAlerteBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
