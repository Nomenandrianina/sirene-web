import { Test, TestingModule } from '@nestjs/testing';
import { AlerteAudioController } from './alerte-audio.controller';
import { AlerteAudioService } from './alerte-audio.service';

describe('AlerteAudioController', () => {
  let controller: AlerteAudioController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlerteAudioController],
      providers: [AlerteAudioService],
    }).compile();

    controller = module.get<AlerteAudioController>(AlerteAudioController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
