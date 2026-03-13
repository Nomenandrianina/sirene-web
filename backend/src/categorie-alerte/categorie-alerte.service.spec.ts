import { Test, TestingModule } from '@nestjs/testing';
import { CategorieAlerteService } from './categorie-alerte.service';

describe('CategorieAlerteService', () => {
  let service: CategorieAlerteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [CategorieAlerteService],
    }).compile();

    service = module.get<CategorieAlerteService>(CategorieAlerteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
