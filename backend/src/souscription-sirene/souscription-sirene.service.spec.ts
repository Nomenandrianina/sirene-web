import { Test, TestingModule } from '@nestjs/testing';
import { SouscriptionSireneService } from './souscription-sirene.service';

describe('SouscriptionSireneService', () => {
  let service: SouscriptionSireneService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [SouscriptionSireneService],
    }).compile();

    service = module.get<SouscriptionSireneService>(SouscriptionSireneService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
