import { Test, TestingModule } from '@nestjs/testing';
import { AlerteBngrcController } from './alerte-bngrc.controller';
import { AlerteBngrcService } from './alerte-bngrc.service';

describe('AlerteBngrcController', () => {
  let controller: AlerteBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlerteBngrcController],
      providers: [AlerteBngrcService],
    }).compile();

    controller = module.get<AlerteBngrcController>(AlerteBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
