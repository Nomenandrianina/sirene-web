import { Test, TestingModule } from '@nestjs/testing';
import { AlerteAudioService } from './alerte-audio.service';

describe('AlerteAudioService', () => {
  let service: AlerteAudioService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlerteAudioService],
    }).compile();

    service = module.get<AlerteAudioService>(AlerteAudioService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
