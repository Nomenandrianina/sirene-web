import { Test, TestingModule } from '@nestjs/testing';
import { PacktypeController } from './packtype.controller';
import { PacktypeService } from './packtype.service';

describe('PacktypeController', () => {
  let controller: PacktypeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PacktypeController],
      providers: [PacktypeService],
    }).compile();

    controller = module.get<PacktypeController>(PacktypeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
