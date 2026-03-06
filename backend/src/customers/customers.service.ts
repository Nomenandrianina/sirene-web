import { ConflictException, ForbiddenException, Injectable, InternalServerErrorException, NotFoundException } from '@nestjs/common';
import { CreateCustomerDto } from './dto/create-customer.dto';
import { UpdateCustomerDto } from './dto/update-customer.dto';
import { Customer } from './entity/customer.entity';
import { Repository } from 'typeorm/repository/Repository';
import { InjectRepository } from '@nestjs/typeorm/dist/common/typeorm.decorators';

@Injectable()
export class CustomersService {
  constructor(
    @InjectRepository(Customer)
    private readonly customerRepo: Repository<Customer>,
  ) {}

  async create(createCustomerDto: CreateCustomerDto) {
    try {
      const customer = this.customerRepo.create(createCustomerDto);
      return await this.customerRepo.save(customer);
    } catch (error) {
      if (error.code === '23505' || error.code === 'ER_DUP_ENTRY') {
        throw new ConflictException('Customer already exists');
      }
      throw new InternalServerErrorException('Error while creating customer');
    }
  }

  /** Admin → tous les clients | User → son propre client uniquement */
  async findAll(currentUser: { sub: number; role?: { name: string } }): Promise<Customer[]> {
    const isAdmin = currentUser?.role?.name === 'superadmin';
    console.log('Current User:', currentUser);
    if (isAdmin) {
      // Admin : tous les clients avec relations
      const customers = await this.customerRepo.find({
        order: { id: 'DESC' },
      });
      if (!customers || customers.length === 0) {
        throw new NotFoundException('No customers found');
      }
      return customers;
    }

    // User normal : uniquement son customer lié
    const customer = await this.customerRepo.findOne({});

    if (!customer) {
      throw new NotFoundException('No customer profile found for this user');
    }

    return [customer]; // retourne un tableau pour uniformiser la réponse
  }

  async findOne(id: number, currentUser: { sub: number; role?: { name: string } }): Promise<Customer> {
    const isAdmin = currentUser?.role?.name === 'superadmin';

    const customer = await this.customerRepo.findOne({
      where: { id },
    });

    if (!customer) throw new NotFoundException(`Customer #${id} not found`);

    // Un non-admin ne peut voir que son propre customer
    if (!isAdmin ) {
      throw new ForbiddenException('Access denied');
    }

    return customer;
  }

  async update(
    id: number,
    updateCustomerDto: UpdateCustomerDto,
    currentUser: { sub: number; role?: { name: string } },
  ): Promise<Customer> {
    const isAdmin = currentUser?.role?.name === 'superadmin';

    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!customer) throw new NotFoundException(`Customer #${id} not found`);

    if (!isAdmin ) {
      throw new ForbiddenException('Access denied');
    }

    Object.assign(customer, updateCustomerDto);
    return await this.customerRepo.save(customer);
  }

  async remove(id: number, currentUser: { sub: number; role?: { name: string } }) {
    const isAdmin = currentUser?.role?.name === 'superadmin';

    if (!isAdmin) throw new ForbiddenException('Only admins can delete customers');

    const customer = await this.customerRepo.findOne({
      where: { id },
      relations: ['user'],
    });

    if (!customer) throw new NotFoundException(`Customer #${id} not found`);

    return await this.customerRepo.remove(customer);
  }
}