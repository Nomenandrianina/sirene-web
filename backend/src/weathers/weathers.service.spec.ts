import { Test, TestingModule } from '@nestjs/testing';
import { WeathersService } from './weathers.service';

describe('WeathersService', () => {
  let service: WeathersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [WeathersService],
    }).compile();

    service = module.get<WeathersService>(WeathersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
