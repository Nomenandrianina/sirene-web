import { Test, TestingModule } from '@nestjs/testing';
import { CategorieAlerteController } from './categorie-alerte.controller';
import { CategorieAlerteService } from './categorie-alerte.service';

describe('CategorieAlerteController', () => {
  let controller: CategorieAlerteController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategorieAlerteController],
      providers: [CategorieAlerteService],
    }).compile();

    controller = module.get<CategorieAlerteController>(CategorieAlerteController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
