import { Test, TestingModule } from '@nestjs/testing';
import { CommuneController } from './commune.controller';
import { CommuneService } from './commune.service';

describe('CommuneController', () => {
  let controller: CommuneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CommuneController],
      providers: [CommuneService],
    }).compile();

    controller = module.get<CommuneController>(CommuneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
