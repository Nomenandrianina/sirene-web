import { Test, TestingModule } from '@nestjs/testing';
import { ColorCodeController } from './color-code.controller';
import { ColorCodeService } from './color-code.service';

describe('ColorCodeController', () => {
  let controller: ColorCodeController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ColorCodeController],
      providers: [ColorCodeService],
    }).compile();

    controller = module.get<ColorCodeController>(ColorCodeController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
