import { Controller, Get, Post, Body, Put, Param, Delete } from '@nestjs/common';
import { CustomerService } from './customer.service';
import { CreateCustomerDto } from './dto/create-customer.dto';

@Controller('customers')
export class CustomerController {
  constructor(private readonly customerService: CustomerService) {}

  @Post()
  create(@Body() createCustomerDto: CreateCustomerDto) {
    console.log('🎯 POST /api/customers');
    console.log('📦 Datos recibidos:', JSON.stringify(createCustomerDto, null, 2));
    return this.customerService.create(createCustomerDto);
  }

  @Get()
  findAll() {
    console.log('🎯 GET /api/customers');
    return this.customerService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    console.log(`🎯 GET /api/customers/${id}`);
    return this.customerService.findOne(id);
  }

  @Put(':id')
  update(
    @Param('id') id: string,
    @Body() updateCustomerDto: Partial<CreateCustomerDto>,
  ) {
    console.log(`🎯 PUT /api/customers/${id}`);
    console.log('📦 Datos actualizados:', JSON.stringify(updateCustomerDto, null, 2));
    return this.customerService.update(id, updateCustomerDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    console.log(`🎯 DELETE /api/customers/${id}`);
    return this.customerService.remove(id);
  }
}
