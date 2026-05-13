import { Test, TestingModule } from '@nestjs/testing';
import { SendAlerteBngrcController } from './send-alerte-bngrc.controller';
import { SendAlerteBngrcService } from './send-alerte-bngrc.service';

describe('SendAlerteBngrcController', () => {
  let controller: SendAlerteBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SendAlerteBngrcController],
      providers: [SendAlerteBngrcService],
    }).compile();

    controller = module.get<SendAlerteBngrcController>(SendAlerteBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
