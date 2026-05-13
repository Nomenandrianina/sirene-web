import { Test, TestingModule } from '@nestjs/testing';
import { SendAlerteBngrcService } from './send-alerte-bngrc.service';

describe('SendAlerteBngrcService', () => {
  let service: SendAlerteBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SendAlerteBngrcService],
    }).compile();

    service = module.get<SendAlerteBngrcService>(SendAlerteBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
