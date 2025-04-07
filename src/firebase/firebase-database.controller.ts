import { Controller, Post, Body, Delete, Get, Param, UseGuards, UploadedFile, UseInterceptors, Put } from '@nestjs/common';
import { FirebaseDatabaseService } from './firebase-database.service';
import { EmailTemplateDto } from './dto/template.dto';
import { AuthGuard } from '@nestjs/passport';
import { Req } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { FirebaseService } from './firebase.service';

@Controller('firebase/database')
export class FirebaseDatabaseController {
  constructor(
    private readonly firebaseDbService: FirebaseDatabaseService,
    private readonly firebaseService: FirebaseService
  ) {}

  @Post('init')
  async initializeDatabase(@Body() data: any) {
    console.log('🎯 POST /api/firebase/database/init');
    console.log('📦 Inicializando base de datos...');
    await this.firebaseDbService.initializeDatabase(data);
    return { message: 'Base de datos inicializada correctamente' };
  }

  @Delete()
  async deleteDatabase() {
    console.log('🎯 DELETE /api/firebase/database');
    console.log('🗑️ Eliminando base de datos...');
    await this.firebaseDbService.deleteDatabase();
    return { message: 'Base de datos eliminada correctamente' };
  }

  @Post('reset')
  async resetDatabase(@Body() newData: any) {
    console.log('🎯 POST /api/firebase/database/reset');
    console.log('🔄 Reiniciando base de datos...');
    await this.firebaseDbService.resetDatabase(newData);
    return { message: 'Base de datos reiniciada correctamente' };
  }

  @Get('status')
  async getDatabaseStatus() {
    console.log('🎯 GET /api/firebase/database/status');
    console.log('📊 Verificando estado de la base de datos...');
    return await this.firebaseDbService.verifyDatabase();
  }

  @Post('templates')
  async createTemplate(@Body() template: EmailTemplateDto): Promise<EmailTemplateDto> {
    console.log('Guardando plantilla:', template);
    return this.firebaseDbService.saveEmailTemplate(template);
  }

  @Get('templates')
  async getTemplates(): Promise<EmailTemplateDto[]> {
    console.log('Obteniendo plantillas');
    // Temporalmente usar un ID de usuario fijo para pruebas
    const userId = 'user-test';
    return this.firebaseDbService.getEmailTemplates(userId);
  }

  @Get('templates/:id')
  async getTemplateById(@Param('id') id: string): Promise<EmailTemplateDto> {
    return this.firebaseDbService.getEmailTemplateById(id);
  }

  @Delete('templates/:id')
  async deleteTemplate(@Param('id') id: string): Promise<void> {
    return this.firebaseDbService.deleteEmailTemplate(id);
  }

  @Put('templates/:id')
  async updateTemplate(
    @Param('id') id: string,
    @Body() template: EmailTemplateDto
  ): Promise<EmailTemplateDto> {
    console.log('Actualizando plantilla:', id);
    return this.firebaseDbService.updateEmailTemplate(id, template);
  }

  @Post('upload-image')
  @UseInterceptors(FileInterceptor('file'))
  async uploadImage(@UploadedFile() file: Express.Multer.File) {
    try {
      console.log('📤 Subiendo imagen a Firebase Storage...');
      
      if (!file) {
        throw new Error('No se ha proporcionado ningún archivo');
      }

      const timestamp = Date.now();
      const fileName = `${timestamp}-${file.originalname}`;
      const path = `templates/images/${fileName}`;

      const imageUrl = await this.firebaseService.uploadImage(file.buffer, path);
      console.log('✅ Imagen subida exitosamente:', imageUrl);

      return {
        success: true,
        data: {
          url: imageUrl,
          path: path,
          fileName: fileName
        }
      };
    } catch (error) {
      console.error('❌ Error al subir la imagen:', error);
      throw new Error('Error al subir la imagen');
    }
  }
} 