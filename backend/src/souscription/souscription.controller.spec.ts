import { Test, TestingModule } from '@nestjs/testing';
import { SouscriptionController } from './souscription.controller';
import { SouscriptionService } from './souscription.service';

describe('SouscriptionController', () => {
  let controller: SouscriptionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [SouscriptionController],
      providers: [SouscriptionService],
    }).compile();

    controller = module.get<SouscriptionController>(SouscriptionController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
