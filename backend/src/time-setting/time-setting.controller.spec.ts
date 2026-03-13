import { Test, TestingModule } from '@nestjs/testing';
import { TimeSettingController } from './time-setting.controller';
import { TimeSettingService } from './time-setting.service';

describe('TimeSettingController', () => {
  let controller: TimeSettingController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TimeSettingController],
      providers: [TimeSettingService],
    }).compile();

    controller = module.get<TimeSettingController>(TimeSettingController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
