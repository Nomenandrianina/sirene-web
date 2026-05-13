import { Test, TestingModule } from '@nestjs/testing';
import { NotificationBngrcController } from './notification-bngrc.controller';
import { NotificationBngrcService } from './notification-bngrc.service';

describe('NotificationBngrcController', () => {
  let controller: NotificationBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationBngrcController],
      providers: [NotificationBngrcService],
    }).compile();

    controller = module.get<NotificationBngrcController>(NotificationBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
