import { Test, TestingModule } from '@nestjs/testing';
import { PacktypeService } from './packtype.service';

describe('PacktypeService', () => {
  let service: PacktypeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PacktypeService],
    }).compile();

    service = module.get<PacktypeService>(PacktypeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
