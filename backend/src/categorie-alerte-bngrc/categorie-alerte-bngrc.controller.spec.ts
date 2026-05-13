import { Test, TestingModule } from '@nestjs/testing';
import { CategorieAlerteBngrcController } from './categorie-alerte-bngrc.controller';
import { CategorieAlerteBngrcService } from './categorie-alerte-bngrc.service';

describe('CategorieAlerteBngrcController', () => {
  let controller: CategorieAlerteBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CategorieAlerteBngrcController],
      providers: [CategorieAlerteBngrcService],
    }).compile();

    controller = module.get<CategorieAlerteBngrcController>(CategorieAlerteBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
