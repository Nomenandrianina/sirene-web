import { Test, TestingModule } from '@nestjs/testing';
import { ColorCodeService } from './color-code.service';

describe('ColorCodeService', () => {
  let service: ColorCodeService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ColorCodeService],
    }).compile();

    service = module.get<ColorCodeService>(ColorCodeService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
