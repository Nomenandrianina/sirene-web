import { Test, TestingModule } from '@nestjs/testing';
import { AlertLevelController } from './alert-level.controller';
import { AlertLevelService } from './alert-level.service';

describe('AlertLevelController', () => {
  let controller: AlertLevelController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlertLevelController],
      providers: [AlertLevelService],
    }).compile();

    controller = module.get<AlertLevelController>(AlertLevelController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
