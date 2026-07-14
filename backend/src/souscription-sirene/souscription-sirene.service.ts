import { Injectable } from '@nestjs/common';
import { CreateSouscriptionSireneDto } from './dto/create-souscription-sirene.dto';
import { UpdateSouscriptionSireneDto } from './dto/update-souscription-sirene.dto';

@Injectable()
export class SouscriptionSireneService {
  create(createSouscriptionSireneDto: CreateSouscriptionSireneDto) {
    return 'This action adds a new souscriptionSirene';
  }

  findAll() {
    return `This action returns all souscriptionSirene`;
  }

  findOne(id: number) {
    return `This action returns a #${id} souscriptionSirene`;
  }

  update(id: number, updateSouscriptionSireneDto: UpdateSouscriptionSireneDto) {
    return `This action updates a #${id} souscriptionSirene`;
  }

  remove(id: number) {
    return `This action removes a #${id} souscriptionSirene`;
  }
}
