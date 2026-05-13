import { Test, TestingModule } from '@nestjs/testing';
import { CategorieAlerteBngrcService } from './categorie-alerte-bngrc.service';

describe('CategorieAlerteBngrcService', () => {
  let service: CategorieAlerteBngrcService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategorieAlerteBngrcService],
    }).compile();

    service = module.get<CategorieAlerteBngrcService>(CategorieAlerteBngrcService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
