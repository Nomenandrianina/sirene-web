import { Test, TestingModule } from '@nestjs/testing';
import { PlanningGeneratorService } from './planning-generator.service';

describe('PlanningGeneratorService', () => {
  let service: PlanningGeneratorService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [PlanningGeneratorService],
    }).compile();

    service = module.get<PlanningGeneratorService>(PlanningGeneratorService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
