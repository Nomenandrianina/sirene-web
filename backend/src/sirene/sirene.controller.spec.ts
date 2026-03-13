import { Test, TestingModule } from '@nestjs/testing';
import { SireneController } from './sirene.controller';
import { SireneService } from './sirene.service';

describe('SireneController', () => {
  let controller: SireneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SireneController],
      providers: [SireneService],
    }).compile();

    controller = module.get<SireneController>(SireneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
