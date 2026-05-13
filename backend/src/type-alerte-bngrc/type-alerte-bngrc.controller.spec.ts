import { Test, TestingModule } from '@nestjs/testing';
import { TypeAlerteBngrcController } from './type-alerte-bngrc.controller';
import { TypeAlerteBngrcService } from './type-alerte-bngrc.service';

describe('TypeAlerteBngrcController', () => {
  let controller: TypeAlerteBngrcController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [TypeAlerteBngrcController],
      providers: [TypeAlerteBngrcService],
    }).compile();

    controller = module.get<TypeAlerteBngrcController>(TypeAlerteBngrcController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
