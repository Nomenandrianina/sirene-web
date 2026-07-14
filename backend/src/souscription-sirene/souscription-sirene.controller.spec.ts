import { Test, TestingModule } from '@nestjs/testing';
import { SouscriptionSireneController } from './souscription-sirene.controller';
import { SouscriptionSireneService } from './souscription-sirene.service';

describe('SouscriptionSireneController', () => {
  let controller: SouscriptionSireneController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SouscriptionSireneController],
      providers: [SouscriptionSireneService],
    }).compile();

    controller = module.get<SouscriptionSireneController>(SouscriptionSireneController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
