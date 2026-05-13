import { Test, TestingModule } from '@nestjs/testing';
import { AudioAlerteBngrcService } from './audio-alerte-bngrc.service';

describe('AudioAlerteBngrcService', () => {
  let service: AudioAlerteBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AudioAlerteBngrcService],
    }).compile();

    service = module.get<AudioAlerteBngrcService>(AudioAlerteBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
