import { Test, TestingModule } from '@nestjs/testing';
import { NotificationBngrcService } from './notification-bngrc.service';

describe('NotificationBngrcService', () => {
  let service: NotificationBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [NotificationBngrcService],
    }).compile();

    service = module.get<NotificationBngrcService>(NotificationBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
