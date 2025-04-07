import { Injectable, Inject, forwardRef, Logger } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import { EmailCampaign, EmailSendResult, EmailTemplate } from '../types/email-template';
import { PrismaService } from '../prisma/prisma.service';
import { EmailElement } from '../types/email-template';

@Injectable()
export class EmailService {
  private transporter;
  private readonly logger = new Logger(EmailService.name);

  constructor(
    private readonly prisma: PrismaService
  ) {
    console.log('📧 Configuración SMTP:', {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      secure: process.env.SMTP_SECURE,
      user: process.env.SMTP_USER ? '***' : undefined,
      pass: process.env.SMTP_PASS ? '***' : undefined,
    });

    if (!process.env.SMTP_HOST || !process.env.SMTP_PORT || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
      throw new Error('Faltan variables de entorno SMTP requeridas');
    }

    try {
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      console.log('✅ Transporter SMTP configurado correctamente');
    } catch (error) {
      console.error('❌ Error al configurar el transporter SMTP:', error);
      throw new Error('Error al configurar el servicio de correo');
    }
  }

  async sendInvoiceEmail(to: string, invoiceNumber: string, pdfBuffer: Buffer) {
    const mailOptions = {
      from: process.env.SMTP_FROM,
      to,
      subject: `Factura #${invoiceNumber}`,
      text: `Adjunto encontrará su factura #${invoiceNumber}`,
      attachments: [
        {
          filename: `factura-${invoiceNumber}.pdf`,
          content: pdfBuffer,
        },
      ],
    };

    return this.transporter.sendMail(mailOptions);
  }

  async sendCampaign(campaign: EmailCampaign): Promise<EmailSendResult[]> {
    try {
      this.logger.log('📧 Iniciando envío de campaña:', {
        name: campaign.name,
        templateId: campaign.templateId,
        recipientsCount: campaign.recipients?.length || 0,
        subject: campaign.subject
      });

      // Validar que existan recipients
      if (!campaign.recipients || !Array.isArray(campaign.recipients) || campaign.recipients.length === 0) {
        throw new Error('No se proporcionaron destinatarios válidos');
      }

      // Crear la campaña en la base de datos
      const campaignData = {
        name: campaign.name,
        subject: campaign.subject,
        status: 'sending',
        recipients: campaign.recipients,
        send_to_all: false,
        template_id: campaign.templateId,
        user_id: campaign.userId || 'user-test', // TODO: Obtener el ID del usuario actual
      };

      // Guardar la campaña en la base de datos mediante Prisma
      const createdCampaign = await this.prisma.email_campaigns.create({
        data: campaignData
      });
      
      campaign.id = createdCampaign.id;
      this.logger.log('✅ Campaña guardada con ID:', campaign.id);

      // Obtener la plantilla
      const template = await this.prisma.email_templates.findUnique({
        where: { id: campaign.templateId }
      });
      
      this.logger.log('📝 Plantilla:', template?.name);
      
      if (!template) {
        throw new Error('Plantilla no encontrada');
      }

      // Convertir template de Prisma al formato esperado por el generador HTML
      const emailTemplate: EmailTemplate = {
        id: template.id,
        name: template.name,
        elements: template.elements as unknown as EmailElement[],
        editorSettings: template.editor_settings as any,
        createdAt: template.created_at,
        updatedAt: template.updated_at,
        userId: template.operator_id,
        category: template.category,
        thumbnail: template.thumbnail
      };

      // Enviar a cada destinatario
      const results: EmailSendResult[] = [];
      this.logger.log(`📨 Iniciando envío a ${campaign.recipients.length} destinatarios`);
      
      for (const recipient of campaign.recipients) {
        try {
          if (!recipient.email) {
            throw new Error('Email de destinatario no válido');
          }

          this.logger.log(`🎯 Preparando envío a ${recipient.email}`);
          
          // Generar HTML personalizado para cada destinatario con su propio tracking
          const personalizedHtml = this.generateTemplateHtml(emailTemplate, campaign.id, recipient.id);
          
          // Configurar el correo
          const mailOptions = {
            from: process.env.SMTP_FROM,
            to: recipient.email,
            subject: campaign.subject,
            html: personalizedHtml
          };

          // Enviar el correo
          this.logger.log(`📤 Enviando a ${recipient.email}...`);
          const info = await this.transporter.sendMail(mailOptions);
          
          results.push({
            success: true,
            recipientId: recipient.id,
            messageId: info.messageId,
            sentAt: new Date()
          });

          this.logger.log(`✅ Correo enviado a ${recipient.email} (ID: ${info.messageId})`);
        } catch (error) {
          this.logger.error(`❌ Error al enviar a ${recipient.email}:`, error);
          
          results.push({
            success: false,
            recipientId: recipient.id,
            error: error.message,
            sentAt: new Date()
          });
        }
      }

      // Actualizar estadísticas de la campaña
      const stats = {
        total: campaign.recipients.length,
        sent: results.length,
        delivered: results.filter(r => r.success).length,
        failed: results.filter(r => !r.success).length,
        opened: 0,
        clicked: 0
      };

      this.logger.log('📊 Estadísticas de la campaña:', stats);

      // Actualizar estado y estadísticas en la base de datos
      await this.prisma.email_campaigns.update({
        where: { id: campaign.id },
        data: {
          status: 'completed',
          stats: stats as any
        }
      });
      
      this.logger.log('✅ Estadísticas actualizadas en la base de datos');

      return results;
    } catch (error) {
      this.logger.error('❌ Error en sendCampaign:', error);
      
      // Si hay un ID de campaña, actualizar el estado a fallido
      if (campaign.id) {
        await this.prisma.email_campaigns.update({
          where: { id: campaign.id },
          data: { status: 'failed' }
        });
      }
      
      throw error;
    }
  }

  async getCampaigns(): Promise<EmailCampaign[]> {
    try {
      this.logger.log('🔍 Obteniendo campañas de correo');
      
      const dbCampaigns = await this.prisma.email_campaigns.findMany({
        where: {
          user_id: 'user-test' // TODO: Obtener el ID del usuario actual
        },
        orderBy: {
          created_at: 'desc'
        },
        include: {
          email_templates: true
        }
      });
      
      // Convertir de formato DB a formato de aplicación
      const campaigns: EmailCampaign[] = dbCampaigns.map(dbCampaign => ({
        id: dbCampaign.id,
        name: dbCampaign.name,
        subject: dbCampaign.subject,
        templateId: dbCampaign.template_id,
        status: dbCampaign.status as any,
        recipients: dbCampaign.recipients as any || [],
        metrics: dbCampaign.stats as any,
        createdAt: dbCampaign.created_at,
        updatedAt: dbCampaign.updated_at,
        userId: dbCampaign.user_id
      }));
      
      this.logger.log('✅ Campañas obtenidas:', campaigns.length);
      return campaigns;
    } catch (error) {
      this.logger.error('❌ Error al obtener campañas:', error);
      throw error;
    }
  }

  generateTemplateHtml(
    template: EmailTemplate, 
    campaignId?: string, 
    recipientId?: string
  ): string {
    if (!process.env.API_BASE_URL) {
      console.warn('⚠️ API_BASE_URL no está configurada. Usando localhost como fallback.');
    }
    const trackingBaseUrl = process.env.API_BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
    
    // Generar URL de tracking
    const trackingUrl = `${trackingBaseUrl}/api/v1/email/track/open/${campaignId}-${recipientId}`;
    this.logger.log('🔍 URL de tracking:', trackingUrl);

    // Generar pixel de tracking
    const trackingPixel = `<img src="${trackingUrl}" alt="" width="1" height="1" style="display:block !important; width:1px !important; height:1px !important; border:0 !important; margin:0 !important; padding:0 !important;" />`;
    this.logger.log('🎨 Pixel de tracking generado');

    // Función para envolver URLs con tracking de clics
    const wrapUrlWithTracking = (url: string): string => {
      if (!url || url === '#') return url;
      const encodedUrl = encodeURIComponent(url);
      return `${trackingBaseUrl}/api/v1/email/track/click/${campaignId}/${recipientId}?url=${encodedUrl}`;
    };

    const generateElementHtml = (element: EmailElement): string => {
      const formatPadding = (padding: any) => {
        if (!padding) return '0';
        if (typeof padding === 'object') {
          return `${padding.top || 0}px ${padding.right || 0}px ${padding.bottom || 0}px ${padding.left || 0}px`;
        }
        return padding;
      };

      switch (element.type) {
        case 'text':
          return `
            <div style="
              font-family: ${element.options?.fontName || 'Arial'}, sans-serif;
              line-height: 1.6;
              color: ${element.options?.color || '#333333'};
              padding: ${formatPadding(element.options?.padding)};
              font-size: ${element.options?.fontSize || 16}px;
              text-align: ${element.options?.alignment || 'left'};
              ${element.options?.isBold ? 'font-weight: bold;' : ''}
              ${element.options?.isItalic ? 'font-style: italic;' : ''}
              ${element.options?.isUnderline ? 'text-decoration: underline;' : ''}
              background-color: ${element.backgroundColor || 'transparent'};
            ">
              ${element.content}
            </div>
          `;
        
        case 'image':
          const imageUrl = element.options?.imageUrl || element.content || '';
          
          return `
            <div style="
              text-align: ${element.options?.alignment || 'center'};
              padding: ${formatPadding(element.options?.padding)};
              background-color: ${element.backgroundColor || 'transparent'};
            ">
              <img 
                src="${imageUrl}"
                alt="${element.options?.alt || ''}"
                style="
                  max-width: 100%;
                  width: ${element.options?.width || 'auto'};
                  height: ${element.options?.height || 'auto'};
                  display: block;
                  margin: 0 auto;
                  border-radius: ${element.options?.borderRadius || '0'}px;
                "
              />
            </div>
          `;
        
        case 'button':
          const trackingUrl = wrapUrlWithTracking(element.options?.href || '#');
          return `
            <div style="
              text-align: ${element.options?.buttonAlignment || 'center'};
              padding: ${formatPadding(element.options?.padding)};
              background-color: ${element.backgroundColor || 'transparent'};
            ">
              <a 
                href="${trackingUrl}"
                target="_blank"
                style="
                  display: inline-block;
                  padding: 15px 30px;
                  background-color: ${element.options?.backgroundColor || '#EE3A3B'};
                  color: ${element.options?.color || '#ffffff'};
                  text-decoration: none;
                  border-radius: ${element.options?.borderRadius || '8'}px;
                  font-family: ${element.options?.fontName || 'Arial'}, sans-serif;
                  font-size: ${element.options?.fontSize || 16}px;
                  font-weight: bold;
                  text-align: center;
                  width: ${element.options?.width || '300px'};
                  height: ${element.options?.height || '50px'};
                  line-height: ${element.options?.height || '50px'};
                  ${element.options?.hoverEffect ? 'transition: all 0.3s ease;' : ''}
                "
              >
                ${element.content}
              </a>
            </div>
          `;

        case 'divider':
          return `
            <div style="
              padding: ${formatPadding(element.options?.padding)};
              text-align: center;
              background-color: ${element.backgroundColor || 'transparent'};
            ">
              <hr style="
                border: none;
                height: ${element.options?.dividerHeight || 1}px;
                background-color: ${element.options?.dividerColor || '#E5E7EB'};
                width: ${element.options?.dividerWidth || 100}%;
                margin: 0 auto;
              "/>
            </div>
          `;

        case 'footer':
          const companyInfo = element.options?.companyInfo || {};
          const socialLinks = element.options?.socialLinks || {};
          
          return `
            <div style="
              background-color: ${element.backgroundColor || '#f5f5f5'};
              padding: ${formatPadding(element.options?.padding)};
              text-align: center;
              font-family: Arial, sans-serif;
            ">
              <div style="max-width: 600px; margin: 0 auto;">
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 20px; color: #333333; font-size: 20px;">${companyInfo.name || 'WorkExpress'}</h3>
                  <p style="margin: 0; color: #666666;">
                    <a href="mailto:${companyInfo.email}" style="color: #666666; text-decoration: none;">${companyInfo.email}</a>
                  </p>
                  <p style="margin: 10px 0; color: #666666;">${companyInfo.phone}</p>
                  <p style="margin: 0; color: #666666;">${companyInfo.address}</p>
                </div>
                
                <div style="margin-bottom: 30px;">
                  <h3 style="margin: 0 0 20px; color: #333333; font-size: 20px;">Síguenos</h3>
                  <div style="
                    display: flex;
                    justify-content: center;
                    gap: 20px;
                    flex-wrap: wrap;
                  ">
                    ${Object.entries(socialLinks).map(([network, url]) => `
                      <a href="${wrapUrlWithTracking(url as string)}" 
                        target="_blank" 
                        style="
                          color: #666666;
                          text-decoration: none;
                          margin: 0 10px;
                          display: inline-block;
                        "
                      >${network.charAt(0).toUpperCase() + network.slice(1)}</a>
                    `).join('')}
                  </div>
                </div>

                ${element.options?.footerDisclaimer ? `
                  <div style="margin-top: 20px; color: #666666; font-size: 12px;">
                    ${element.options.footerDisclaimer}
                  </div>
                ` : ''}

                ${element.options?.unsubscribeLink ? `
                  <div style="margin-top: 20px;">
                    <a href="${wrapUrlWithTracking(element.options.unsubscribeLink)}" 
                      style="color: #666666; text-decoration: underline; font-size: 12px;"
                    >Cancelar suscripción</a>
                  </div>
                ` : ''}
              </div>
            </div>
          `;
        
        default:
          return element.content || '';
      }
    };

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${template.name}</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            body {
              margin: 0;
              padding: 0;
              position: relative;
              -webkit-font-smoothing: antialiased;
              -moz-osx-font-smoothing: grayscale;
              font-family: Arial, sans-serif;
            }
            img {
              max-width: 100%;
              display: block;
              border: 0;
              outline: none;
              text-decoration: none;
              -ms-interpolation-mode: bicubic;
            }
            table {
              border-collapse: collapse;
              mso-table-lspace: 0pt;
              mso-table-rspace: 0pt;
            }
            a {
              color: inherit;
              text-decoration: none;
            }
            .social-links {
              display: flex;
              justify-content: center;
              gap: 20px;
              flex-wrap: wrap;
            }
            .social-link {
              margin: 0 10px;
              display: inline-block;
              color: #666666;
              text-decoration: none;
            }
          </style>
        </head>
        <body style="
          margin: 0;
          padding: 0;
          position: relative;
          background-color: ${template.editorSettings?.backgroundColor || '#ffffff'};
        ">
          ${trackingPixel}
          <!-- Contenedor principal -->
          <table width="100%" cellpadding="0" cellspacing="0" border="0">
            <tr>
              <td align="center" valign="top" style="padding: 20px;">
                <table style="
                  width: 100%;
                  max-width: ${template.editorSettings?.maxWidth || '600px'};
                  margin: 0 auto;
                  background-color: ${template.editorSettings?.contentBackground || '#ffffff'};
                  border-radius: ${template.editorSettings?.contentBorderRadius || 8}px;
                  overflow: hidden;
                  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
                ">
                  <tr>
                    <td style="padding: ${template.editorSettings?.contentPadding || 0}px;">
                      ${template.elements.map(element => {
                        return generateElementHtml(element);
                      }).join('')}
                    </td>
                  </tr>
                </table>
              </td>
            </tr>
          </table>
        </body>
      </html>
    `;
  }

  private personalizeContent(html: string, recipient: any): string {
    // Reemplazar variables personalizadas
    return html
      .replace(/{{firstName}}/g, recipient.firstName || '')
      .replace(/{{lastName}}/g, recipient.lastName || '')
      .replace(/{{email}}/g, recipient.email || '');
  }

  async trackEmailOpen(trackingId: string, trackingInfo?: { userAgent?: string; ipAddress?: string }): Promise<void> {
    try {
      this.logger.log('📊 Registrando apertura de email:', trackingId);
      
      // Extraer campaign_id y recipient_id del tracking ID
      const [campaignId, recipientId] = trackingId.split('-');
      
      if (!campaignId) {
        throw new Error('ID de campaña no válido');
      }
      
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
      stats.opened = (stats.opened || 0) + 1;
      stats.uniqueOpens = stats.uniqueOpens || [];
      
      // Solo registrar apertura única si no se ha registrado antes
      if (recipientId && !stats.uniqueOpens.includes(recipientId)) {
        stats.uniqueOpens.push(recipientId);
      }
      
      // Actualizar en la base de datos
      await this.prisma.email_campaigns.update({
        where: { id: campaignId },
        data: { 
          stats: stats as any,
          updated_at: new Date()
        }
      });
      
      this.logger.log('✅ Apertura registrada correctamente');
    } catch (error) {
      this.logger.error('❌ Error al registrar apertura:', error);
      throw error;
    }
  }

  /**
   * Envía una notificación por correo electrónico al usuario informando que su paquete ha llegado
   * @param to Email del destinatario
   * @param userData Datos del usuario
   * @param packageData Datos del paquete
   * @returns Resultado del envío
   */
  async sendPackageArrivalNotification(
    to: string, 
    userData: { 
      firstName: string; 
      lastName?: string 
    }, 
    packageData: { 
      trackingNumber: string; 
      weight?: number; 
      price: number;
      packageStatus?: string;
      estimatedDeliveryDate?: string;
    }
  ) {
    try {
      this.logger.log('📧 Preparando notificación de llegada de paquete:', {
        to,
        user: userData.firstName,
        tracking: packageData.trackingNumber,
        price: packageData.price
      });

      // Formatear el precio con dos decimales
      const formattedPrice = packageData.price.toFixed(2);
      
      // Formatear el peso si está disponible
      const weightInfo = packageData.weight 
        ? `<li>Peso: <strong>${packageData.weight.toFixed(2)} lb</strong></li>` 
        : '';
      
      // Formatear la fecha estimada de entrega si está disponible
      const deliveryDateInfo = packageData.estimatedDeliveryDate 
        ? `<li>Fecha estimada de entrega: <strong>${packageData.estimatedDeliveryDate}</strong></li>` 
        : '';

      // Crear contenido HTML del correo
      const htmlContent = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e8e8e8; border-radius: 5px;">
          <div style="background-color: #2563eb; padding: 15px; text-align: center; border-radius: 5px 5px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">¡Tu paquete ha llegado! 📦</h1>
          </div>
          
          <div style="padding: 20px;">
            <p>Hola <strong>${userData.firstName} ${userData.lastName || ''}</strong>,</p>
            
            <p>Nos complace informarte que tu paquete con número de seguimiento <strong>${packageData.trackingNumber}</strong> ha llegado a nuestras instalaciones.</p>
            
            <div style="background-color: #f8f9fa; padding: 15px; border-radius: 5px; margin: 15px 0;">
              <h3 style="margin-top: 0; color: #2563eb;">Detalles del paquete:</h3>
              <ul style="padding-left: 20px;">
                <li>Número de seguimiento: <strong>${packageData.trackingNumber}</strong></li>
                ${weightInfo}
                <li>Precio: <strong>$${formattedPrice} USD</strong></li>
                <li>Estado: <strong>${packageData.packageStatus || 'Recibido'}</strong></li>
                ${deliveryDateInfo}
              </ul>
            </div>
            
            <p>Puedes recoger tu paquete en nuestra oficina durante el horario de atención o coordinar un envío adicional si lo prefieres.</p>
            
            <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
            
            <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e8e8e8;">
              <p style="margin-bottom: 5px;"><strong>¡Gracias por confiar en nosotros!</strong></p>
              <p style="margin-top: 0;">El equipo de WorkExpress</p>
            </div>
          </div>
          
          <div style="background-color: #f8f9fa; padding: 15px; text-align: center; font-size: 12px; color: #666; border-radius: 0 0 5px 5px;">
            <p>Este es un correo automático, por favor no respondas a este mensaje.</p>
            <p>&copy; ${new Date().getFullYear()} WorkExpress. Todos los derechos reservados.</p>
          </div>
        </div>
      `;

      // Configurar opciones del correo
      const mailOptions = {
        from: process.env.SMTP_FROM || 'notificaciones@workexpress.com',
        to,
        subject: `¡Tu paquete ${packageData.trackingNumber} ha llegado! - WorkExpress`,
        html: htmlContent,
        text: `Hola ${userData.firstName} ${userData.lastName || ''},
        
Nos complace informarte que tu paquete con número de seguimiento ${packageData.trackingNumber} ha llegado a nuestras instalaciones.

Detalles del paquete:
- Número de seguimiento: ${packageData.trackingNumber}
${packageData.weight ? `- Peso: ${packageData.weight.toFixed(2)} lb\n` : ''}
- Precio: $${formattedPrice} USD
- Estado: ${packageData.packageStatus || 'Recibido'}
${packageData.estimatedDeliveryDate ? `- Fecha estimada de entrega: ${packageData.estimatedDeliveryDate}\n` : ''}

Puedes recoger tu paquete en nuestra oficina durante el horario de atención o coordinar un envío adicional si lo prefieres.

Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.

¡Gracias por confiar en nosotros!
El equipo de WorkExpress

Este es un correo automático, por favor no respondas a este mensaje.
© ${new Date().getFullYear()} WorkExpress. Todos los derechos reservados.`,
      };

      // Enviar el correo
      const result = await this.transporter.sendMail(mailOptions);
      this.logger.log('✅ Notificación de llegada de paquete enviada:', {
        messageId: result.messageId,
        to
      });
      
      // Registrar actividad de notificación en la base de datos
      await this.prisma.$transaction(async (prisma) => {
        // Si necesitas registrar la notificación, puedes hacerlo aquí
      });
      
      return {
        success: true,
        messageId: result.messageId,
        sentTo: to
      };
    } catch (error) {
      this.logger.error('❌ Error al enviar notificación de llegada de paquete:', error);
      
      return {
        success: false,
        error: error.message,
        sentTo: to
      };
    }
  }
}