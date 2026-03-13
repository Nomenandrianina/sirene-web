import { Test, TestingModule } from '@nestjs/testing';
import { AlerteTypeService } from './alerte-type.service';

describe('AlerteTypeService', () => {
  let service: AlerteTypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AlerteTypeService],
    }).compile();

    service = module.get<AlerteTypeService>(AlerteTypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
