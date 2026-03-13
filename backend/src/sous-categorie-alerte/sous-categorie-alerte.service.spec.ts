import { Test, TestingModule } from '@nestjs/testing';
import { SousCategorieAlerteService } from './sous-categorie-alerte.service';

describe('SousCategorieAlerteService', () => {
  let service: SousCategorieAlerteService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SousCategorieAlerteService],
    }).compile();

    service = module.get<SousCategorieAlerteService>(SousCategorieAlerteService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
