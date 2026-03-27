import { Test, TestingModule } from '@nestjs/testing';
import { FokontanyController } from './fokontany.controller';
import { FokontanyService } from './fokontany.service';

describe('FokontanyController', () => {
  let controller: FokontanyController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [FokontanyController],
      providers: [FokontanyService],
    }).compile();

    controller = module.get<FokontanyController>(FokontanyController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
