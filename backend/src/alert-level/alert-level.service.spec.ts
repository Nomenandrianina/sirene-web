import { Test, TestingModule } from '@nestjs/testing';
import { AlertLevelService } from './alert-level.service';

describe('AlertLevelService', () => {
  let service: AlertLevelService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlertLevelService],
    }).compile();

    service = module.get<AlertLevelService>(AlertLevelService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
