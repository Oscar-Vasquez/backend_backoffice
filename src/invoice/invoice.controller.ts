import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseInterceptors,
  UploadedFile,
  HttpException,
  HttpStatus
} from '@nestjs/common';
import { InvoiceService } from './invoice.service';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { FileInterceptor } from '@nestjs/platform-express';
import { EmailService } from '../email/email.service';

@Controller('invoices')
export class InvoiceController {
  constructor(
    private readonly invoiceService: InvoiceService,
    private readonly emailService: EmailService,
  ) {}

  @Post()
  async create(@Body() createInvoiceDto: CreateInvoiceDto) {
    console.log('🎯 POST /api/invoices');
    console.log('📦 Datos recibidos:', JSON.stringify(createInvoiceDto, null, 2));
    const result = await this.invoiceService.create(createInvoiceDto);
    console.log('✅ Factura creada con éxito:', JSON.stringify(result, null, 2));
    return result;
  }

  @Get()
  async findAll() {
    console.log('⚡ Intentando obtener todas las facturas');
    try {
      const result = await this.invoiceService.findAll();
      console.log('✅ Facturas obtenidas:', result.length);
      return result;
    } catch (error) {
      console.error('❌ Error al obtener facturas:', error);
      throw error;
    }
  }

  @Get(':id')
  async findOne(@Param('id', ParseIntPipe) id: number) {
    console.log(`🎯 GET /api/invoices/${id}`);
    const result = await this.invoiceService.findOne(id);
    console.log('✅ Factura encontrada:', JSON.stringify(result, null, 2));
    return result;
  }

  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body() updateData: { status: string }
  ) {
    try {
      console.log('📦 Actualizando estado:', id, updateData.status);
      const result = await this.invoiceService.updateStatus(id, updateData.status);
      console.log('✅ Estado actualizado:', result);
      return result;
    } catch (error) {
      console.error('❌ Error al actualizar estado:', error);
      throw new HttpException(
        error.message || 'Error al actualizar el estado',
        HttpStatus.BAD_REQUEST
      );
    }
  }

  @Delete(':id')
  async remove(@Param('id', ParseIntPipe) id: number) {
    console.log(`🎯 DELETE /api/invoices/${id}`);
    await this.invoiceService.remove(id);
    return { message: 'Factura eliminada correctamente' };
  }

  @Post(':id/send-email')
  @UseInterceptors(FileInterceptor('pdf'))
  async sendInvoiceEmail(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
    @Body('email') email: string,
  ) {
    console.log(`🎯 POST /api/invoices/${id}/send-email`);

    const invoice = await this.invoiceService.findOne(id);

    await this.emailService.sendInvoiceEmail(
      email,
      invoice.invoiceId,
      file.buffer
    );

    return { message: 'Email enviado exitosamente' };
  }
}
