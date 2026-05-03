import { Test, TestingModule } from '@nestjs/testing';
import { NotificationswebService } from './notificationsweb.service';

describe('NotificationswebService', () => {
  let service: NotificationswebService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationswebService],
    }).compile();

    service = module.get<NotificationswebService>(NotificationswebService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
