import { Test, TestingModule } from '@nestjs/testing';
import { NotificationswebController } from './notificationsweb.controller';
import { NotificationswebService } from './notificationsweb.service';

describe('NotificationswebController', () => {
  let controller: NotificationswebController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [NotificationswebController],
      providers: [NotificationswebService],
    }).compile();

    controller = module.get<NotificationswebController>(NotificationswebController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
