import { Controller, Post, Body, Get, Param, Delete, Query, HttpException, HttpStatus, Res, Req, Logger } from '@nestjs/common';
import { Response, Request } from 'express';
import { EmailService } from './email.service';
import { EmailCampaign, EmailSendResult } from '../types/email-template';
import { PrismaService } from '../prisma/prisma.service';

@Controller('email')
export class EmailController {
  private readonly logger = new Logger(EmailController.name);

  constructor(
    private readonly emailService: EmailService,
    private readonly prisma: PrismaService
  ) {}

  @Post('send')
  async sendCampaign(@Body() campaign: EmailCampaign): Promise<EmailSendResult[]> {
    try {
      this.logger.log('📧 Recibida solicitud de envío de campaña:', {
        name: campaign.name,
        templateId: campaign.templateId,
        recipientsCount: campaign.recipients?.length || 0
      });

      if (!campaign.templateId) {
        throw new HttpException('ID de plantilla no proporcionado', HttpStatus.BAD_REQUEST);
      }

      if (!campaign.recipients || campaign.recipients.length === 0) {
        throw new HttpException('No se proporcionaron destinatarios', HttpStatus.BAD_REQUEST);
      }

      if (!campaign.subject) {
        throw new HttpException('Asunto del correo no proporcionado', HttpStatus.BAD_REQUEST);
      }

      const results = await this.emailService.sendCampaign(campaign);
      this.logger.log('✅ Campaña enviada exitosamente');
      return results;
    } catch (error) {
      this.logger.error('❌ Error al enviar campaña:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        error.message || 'Error al enviar la campaña de correo',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('campaigns')
  async getCampaigns() {
    try {
      this.logger.log('🔍 Obteniendo campañas de correo');
      const campaigns = await this.emailService.getCampaigns();
      this.logger.log('✅ Campañas obtenidas:', campaigns.length);
      return campaigns;
    } catch (error) {
      this.logger.error('❌ Error al obtener campañas:', error);
      throw new HttpException(
        error.message || 'Error al obtener las campañas',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('campaigns/:id')
  async getCampaignById(@Param('id') id: string): Promise<EmailCampaign> {
    try {
      this.logger.log('🔍 Obteniendo campaña:', id);
      
      const campaign = await this.prisma.email_campaigns.findUnique({
        where: { id },
        include: { email_templates: true }
      });
      
      if (!campaign) {
        throw new HttpException('Campaña no encontrada', HttpStatus.NOT_FOUND);
      }
      
      // Convertir el formato de la base de datos al formato de la aplicación
      return {
        id: campaign.id,
        name: campaign.name,
        subject: campaign.subject,
        templateId: campaign.template_id,
        status: campaign.status as any,
        recipients: campaign.recipients as any || [],
        metrics: campaign.stats as any,
        createdAt: campaign.created_at,
        updatedAt: campaign.updated_at,
        userId: campaign.user_id
      };
    } catch (error) {
      this.logger.error('❌ Error al obtener campaña por ID:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Error al obtener la campaña',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Delete('campaigns/:id')
  async deleteCampaign(@Param('id') id: string): Promise<void> {
    try {
      this.logger.log('🗑️ Eliminando campaña:', id);
      
      // Verificar si la campaña existe
      const campaign = await this.prisma.email_campaigns.findUnique({
        where: { id }
      });
      
      if (!campaign) {
        throw new HttpException('Campaña no encontrada', HttpStatus.NOT_FOUND);
      }
      
      // Eliminar la campaña
      await this.prisma.email_campaigns.delete({
        where: { id }
      });
      
      this.logger.log('✅ Campaña eliminada correctamente');
    } catch (error) {
      this.logger.error('❌ Error al eliminar campaña:', error);
      
      if (error instanceof HttpException) {
        throw error;
      }
      
      throw new HttpException(
        error.message || 'Error al eliminar la campaña',
        HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  @Get('track/open/:trackingId')
  async trackEmailOpen(
    @Param('trackingId') trackingId: string,
    @Req() req: Request,
    @Res() res: Response
  ) {
    try {
      this.logger.log('📊 Tracking email open:', trackingId);
      
      // Generar pixel de tracking
      const trackingPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      
      // Configurar headers
      res.setHeader('Content-Type', 'image/gif');
      res.setHeader('Content-Length', trackingPixel.length);
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');
      
      // Registrar evento de apertura con información del dispositivo
      await this.emailService.trackEmailOpen(trackingId, {
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip
      });
      
      // Enviar pixel
      res.send(trackingPixel);
    } catch (error) {
      this.logger.error('❌ Error al registrar apertura de email:', error);
      // Aún así enviamos el pixel para no mostrar error al usuario
      const fallbackPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
      res.send(fallbackPixel);
    }
  }

  @Get('track/click/:campaignId/:recipientId')
  async trackEmailClick(
    @Param('campaignId') campaignId: string,
    @Param('recipientId') recipientId: string,
    @Query('url') targetUrl: string,
    @Res() res: Response
  ) {
    try {
      this.logger.log('🔗 Rastreando clic en enlace:', { campaignId, recipientId, targetUrl });
      
      // Obtener estadísticas actuales
      const campaign = await this.prisma.email_campaigns.findUnique({
        where: { id: campaignId },
        select: { stats: true }
      });
      
      if (!campaign) {
        throw new Error('Campaña no encontrada');
      }
      
      // Actualizar estadísticas
      const stats = campaign.stats as any || {};
      stats.clicked = (stats.clicked || 0) + 1;
      stats.clickedLinks = stats.clickedLinks || [];
      
      // Registrar información del clic
      stats.clickedLinks.push({
        recipientId,
        url: targetUrl,
        clickedAt: new Date()
      });
      
      // Actualizar en la base de datos
      await this.prisma.email_campaigns.update({
        where: { id: campaignId },
        data: { 
          stats: stats as any,
          updated_at: new Date()
        }
      });
      
      // Redirigir al usuario a la URL original
      res.redirect(targetUrl);
    } catch (error) {
      this.logger.error('❌ Error al rastrear clic:', error);
      res.redirect(targetUrl); // Redirigir incluso si hay error
    }
  }
} 