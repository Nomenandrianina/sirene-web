import { Test, TestingModule } from '@nestjs/testing';
import { AudioAlerteBngrcController } from './audio-alerte-bngrc.controller';
import { AudioAlerteBngrcService } from './audio-alerte-bngrc.service';

describe('AudioAlerteBngrcController', () => {
  let controller: AudioAlerteBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AudioAlerteBngrcController],
      providers: [AudioAlerteBngrcService],
    }).compile();

    controller = module.get<AudioAlerteBngrcController>(AudioAlerteBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
