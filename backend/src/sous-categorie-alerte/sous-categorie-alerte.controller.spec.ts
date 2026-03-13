import { Test, TestingModule } from '@nestjs/testing';
import { SousCategorieAlerteController } from './sous-categorie-alerte.controller';
import { SousCategorieAlerteService } from './sous-categorie-alerte.service';

describe('SousCategorieAlerteController', () => {
  let controller: SousCategorieAlerteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SousCategorieAlerteController],
      providers: [SousCategorieAlerteService],
    }).compile();

    controller = module.get<SousCategorieAlerteController>(SousCategorieAlerteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
