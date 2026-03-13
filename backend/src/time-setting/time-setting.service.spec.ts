import { Test, TestingModule } from '@nestjs/testing';
import { TimeSettingService } from './time-setting.service';

describe('TimeSettingService', () => {
  let service: TimeSettingService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [TimeSettingService],
    }).compile();

    service = module.get<TimeSettingService>(TimeSettingService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
