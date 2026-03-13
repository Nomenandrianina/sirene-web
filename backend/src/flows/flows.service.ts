import { Injectable } from '@nestjs/common';
import { CreateFlowDto } from './dto/create-flow.dto';
import { UpdateFlowDto } from './dto/update-flow.dto';

@Injectable()
export class FlowsService {
  create(createFlowDto: CreateFlowDto) {
    return 'This action adds a new flow';
  }

  findAll() {
    return `This action returns all flows`;
  }

  findOne(id: number) {
    return `This action returns a #${id} flow`;
  }

  update(id: number, updateFlowDto: UpdateFlowDto) {
    return `This action updates a #${id} flow`;
  }

  remove(id: number) {
    return `This action removes a #${id} flow`;
  }
}
