import { Test, TestingModule } from '@nestjs/testing';
import { AlerteTypeController } from './alerte-type.controller';
import { AlerteTypeService } from './alerte-type.service';

describe('AlerteTypeController', () => {
  let controller: AlerteTypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AlerteTypeController],
      providers: [AlerteTypeService],
    }).compile();

    controller = module.get<AlerteTypeController>(AlerteTypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
