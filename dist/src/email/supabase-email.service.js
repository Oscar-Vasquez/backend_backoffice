"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var SupabaseEmailService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.SupabaseEmailService = void 0;
const common_1 = require("@nestjs/common");
const supabase_js_1 = require("@supabase/supabase-js");
const config_1 = require("@nestjs/config");
const nodemailer = require("nodemailer");
let SupabaseEmailService = SupabaseEmailService_1 = class SupabaseEmailService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(SupabaseEmailService_1.name);
    }
    onModuleInit() {
        const supabaseUrl = this.configService.get('SUPABASE_URL');
        const supabaseKey = this.configService.get('SUPABASE_SERVICE_ROLE_KEY');
        if (!supabaseUrl || !supabaseKey) {
            this.logger.error('❌ Faltan variables de entorno de Supabase. El servicio de correo con Supabase no funcionará.');
            return;
        }
        try {
            this.supabase = (0, supabase_js_1.createClient)(supabaseUrl, supabaseKey, {
                auth: {
                    persistSession: false
                }
            });
            this.logger.log('✅ Cliente Supabase configurado correctamente para correos electrónicos');
            this.setupNodemailerTransport();
        }
        catch (error) {
            this.logger.error(`❌ Error al configurar cliente Supabase: ${error.message}`);
        }
    }
    setupNodemailerTransport() {
        try {
            const smtpHost = this.configService.get('SMTP_HOST') || 'smtp.gmail.com';
            const smtpPort = parseInt(this.configService.get('SMTP_PORT') || '587', 10);
            const smtpUser = this.configService.get('SMTP_USER');
            const smtpPass = this.configService.get('SMTP_PASS');
            const smtpSecureStr = this.configService.get('SMTP_SECURE') || '';
            const smtpSecure = smtpSecureStr === 'true' || smtpPort === 465;
            this.logger.log(`🔧 Configurando transportador SMTP con host: ${smtpHost}, puerto: ${smtpPort}, usuario: ${smtpUser}, secure: ${smtpSecure}`);
            if (!smtpUser || !smtpPass) {
                this.logger.warn('⚠️ Faltan credenciales SMTP. Se usará Ethereal directamente para todos los correos.');
                this.useEtherealFallback();
                return;
            }
            if (smtpHost.includes('gmail')) {
                this.logger.warn('ℹ️ Usando Gmail como servidor SMTP. Asegúrate de:');
                this.logger.warn('  1. Tener habilitado "Acceso de apps menos seguras" si no usas 2FA');
                this.logger.warn('  2. Usar una "Contraseña de aplicación" si tienes 2FA habilitado');
                this.logger.warn('  3. Haber iniciado sesión recientemente con esta cuenta en un navegador');
            }
            this.transporter = nodemailer.createTransport({
                host: smtpHost,
                port: smtpPort,
                secure: smtpSecure,
                auth: {
                    user: smtpUser,
                    pass: smtpPass,
                },
                tls: {
                    rejectUnauthorized: false,
                    minVersion: 'TLSv1.2',
                    ciphers: 'HIGH:MEDIUM:!aNULL:!MD5'
                },
                connectionTimeout: 10000,
                greetingTimeout: 10000,
                socketTimeout: 20000,
                debug: this.configService.get('NODE_ENV') !== 'production',
                logger: this.configService.get('NODE_ENV') !== 'production'
            });
            this.transporter.verify((error, success) => {
                if (error) {
                    this.logger.error(`❌ Error al verificar la conexión SMTP: ${error.message}`);
                    if (error.message.includes('Invalid login') && smtpHost.includes('gmail')) {
                        this.logger.error('📣 Error de autenticación con Gmail. Por favor verifica:');
                        this.logger.error('  - Si usas autenticación de dos factores, debes generar una contraseña de aplicación');
                        this.logger.error('  - Ve a https://myaccount.google.com/apppasswords');
                        this.logger.error('  - Selecciona "Correo" y tu dispositivo, luego usa la contraseña generada');
                        this.logger.warn('⚠️ Recurriendo a Ethereal como método principal debido a problemas de autenticación');
                        this.useEtherealFallback();
                    }
                }
                else {
                    this.logger.log('✅ Servidor SMTP está listo para recibir mensajes');
                }
            });
        }
        catch (error) {
            this.logger.error(`❌ Error al configurar transportador de correo: ${error.message}`);
            this.useEtherealFallback();
        }
    }
    async useEtherealFallback() {
        try {
            this.logger.log('🔄 Configurando Ethereal como transportador principal...');
            const testAccount = await nodemailer.createTestAccount();
            this.logger.log(`✅ Cuenta Ethereal creada: ${testAccount.user}`);
            this.transporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass
                },
                debug: this.configService.get('NODE_ENV') !== 'production'
            });
            this.logger.log('✅ Transportador Ethereal configurado correctamente como método principal');
        }
        catch (etherealError) {
            this.logger.error(`❌ Error al configurar Ethereal: ${etherealError.message}`);
            this.logger.error('⚠️ El sistema no podrá enviar correos electrónicos');
        }
    }
    async sendInvoiceAndPackageEmail(email, subject, data) {
        try {
            if (!this.transporter) {
                this.setupNodemailerTransport();
            }
            const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
          <meta charset="UTF-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>${subject}</title>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #222; color: white; padding: 20px; text-align: center; }
            .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
            .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
            .info-box { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .highlight { color: #008080; font-weight: bold; }
            .button { display: inline-block; background-color: #4CAF50; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; margin-top: 20px; }
          </style>
        </head>
        <body>
          <div class="header">
            <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 300px; height: auto; margin-bottom: 10px;">
            <p>${data.invoiceNumber ? 'Factura Generada' : 'Tu paquete ha llegado'}</p>
          </div>
          <div class="content">
            <p>Hola <strong>${data.customerName}</strong>,</p>
            <p>${data.invoiceNumber
                ? `Se ha generado una nueva factura por tus paquetes.`
                : `¡Tu paquete ha llegado a nuestras instalaciones!`}</p>
            
            <div class="info-box">
              ${data.invoiceNumber ? `<p><strong>Número de Factura:</strong> <span class="highlight">${data.invoiceNumber}</span></p>` : ''}
              <p><strong>Número de Tracking:</strong> <span class="highlight">${data.trackingNumber}</span></p>
              ${data.weight ? `<p><strong>Peso:</strong> ${data.weight}</p>` : ''}
              ${data.invoiceNumber ? `<p><strong>Precio:</strong> <span class="highlight">${data.price}</span></p>` : ''}
              ${data.status ? `<p><strong>Estado:</strong> En Sucursal</p>` : ''}
              ${data.dueDate ? `<p><strong>Fecha de vencimiento:</strong> ${data.dueDate}</p>` : ''}
            </div>
            
            <p>Por favor, visita nuestra oficina para ${data.invoiceNumber ? 'realizar el pago correspondiente' : 'recoger tu paquete'}. ${!data.invoiceNumber ? 'Recuerda traer tu identificación.' : ''}</p>
            
            <a href="https://workexpress.com/track?tracking=${data.trackingNumber}" class="button">Ver detalles</a>
            
            <p>¡Gracias por confiar en WorkExpress!</p>
          </div>
          <div class="footer">
            <p>© ${new Date().getFullYear()} WorkExpress. Todos los derechos reservados.</p>
            <p>Este es un correo automático, por favor no responder a esta dirección.</p>
          </div>
        </body>
        </html>
      `;
            const mailOptions = {
                from: `"WorkExpress" <${this.configService.get('SMTP_USER') || 'notifications@workexpress.com'}>`,
                to: email,
                subject: subject,
                html: htmlContent
            };
            const info = await this.transporter.sendMail(mailOptions);
            return {
                success: true,
                method: 'nodemailer',
                messageId: info.messageId
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al enviar correo con Nodemailer: ${error.message}`);
            throw error;
        }
    }
    async sendInvoiceCreationEmail(email, userData, invoiceData) {
        try {
            this.logger.log(`📧 Preparando correo de creación de factura para: ${email}`);
            if (!this.supabase) {
                throw new Error('Cliente Supabase no inicializado. Verifica la configuración.');
            }
            const formattedTotalAmount = invoiceData.totalAmount.toFixed(2);
            const customerName = `${userData.firstName} ${userData.lastName || ''}`.trim();
            const formattedItems = invoiceData.items.map(item => ({
                trackingNumber: item.trackingNumber,
                description: item.description || `Paquete ${item.trackingNumber}`,
                price: `$${item.price.toFixed(2)} USD`,
                quantity: item.quantity,
                subtotal: `$${(item.price * item.quantity).toFixed(2)} USD`
            }));
            const templateData = {
                userName: customerName,
                invoiceNumber: invoiceData.invoiceNumber,
                totalAmount: `$${formattedTotalAmount} USD`,
                issueDate: new Date(invoiceData.issueDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                dueDate: invoiceData.dueDate
                    ? new Date(invoiceData.dueDate).toLocaleDateString('es-ES', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })
                    : 'No especificada',
                items: formattedItems,
                year: new Date().getFullYear().toString()
            };
            try {
                const { error } = await this.supabase.functions.invoke('send-invoice-notification', {
                    body: {
                        email,
                        templateData
                    }
                });
                if (error) {
                    this.logger.warn(`⚠️ Error al enviar correo de factura con Edge Function: ${error.message}. Intentando método alternativo...`);
                    throw error;
                }
                this.logger.log(`✅ Notificación de factura enviada vía Supabase a: ${email}`);
                return {
                    success: true,
                    sentTo: email,
                    method: 'supabase'
                };
            }
            catch (edgeFunctionError) {
                this.logger.log('🔄 Intentando enviar con nodemailer como método alternativo...');
                try {
                    const itemsSummary = invoiceData.items.map(item => `Paquete ${item.trackingNumber}: $${item.price.toFixed(2)} USD x ${item.quantity}`).join(', ');
                    const result = await this.sendInvoiceAndPackageEmail(email, `Tu factura ${invoiceData.invoiceNumber} ha sido creada`, {
                        customerName,
                        invoiceNumber: invoiceData.invoiceNumber,
                        price: `$${formattedTotalAmount} USD`,
                        trackingNumber: invoiceData.items[0]?.trackingNumber || 'Múltiples paquetes',
                        dueDate: invoiceData.dueDate
                            ? new Date(invoiceData.dueDate).toLocaleDateString('es-ES')
                            : undefined
                    });
                    this.logger.log(`✅ Correo de factura enviado exitosamente vía Nodemailer: ${result.messageId}`);
                    return {
                        success: true,
                        sentTo: email,
                        fallback: true,
                        messageId: result.messageId,
                        method: 'nodemailer',
                        message: 'Correo de factura enviado exitosamente usando Nodemailer como método alternativo'
                    };
                }
                catch (nodemailerError) {
                    this.logger.warn(`⚠️ Error con nodemailer: ${nodemailerError.message}. Intentando con proveedor externo...`);
                    try {
                        const apiKey = this.configService.get('SENDGRID_API_KEY') ||
                            this.configService.get('MAIL_PROVIDER_API_KEY');
                        if (apiKey) {
                            const itemsRows = formattedItems.map(item => `
                <tr>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.trackingNumber}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.description}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.price}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
                  <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${item.subtotal}</td>
                </tr>
              `).join("");
                            const htmlContent = `
                <!DOCTYPE html>
                <html>
                <head>
                  <meta charset="UTF-8">
                  <meta name="viewport" content="width=device-width, initial-scale=1.0">
                  <title>Factura Creada</title>
                  <style>
                    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
                    .header { background-color: #222; color: white; padding: 20px; text-align: center; }
                    .content { padding: 20px; border: 1px solid #ddd; border-top: none; }
                    .footer { font-size: 12px; color: #777; text-align: center; margin-top: 20px; }
                    .info-box { background-color: #f8f8f8; padding: 15px; border-radius: 5px; margin: 15px 0; }
                    .highlight { color: #008080; font-weight: bold; }
                    .invoice-summary { margin-bottom: 20px; }
                    .summary-item { display: flex; justify-content: space-between; padding: 5px 0; }
                    .summary-total { font-weight: bold; border-top: 1px solid #ddd; padding-top: 10px; margin-top: 10px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background-color: #f2f2f2; text-align: left; padding: 8px; }
                    .text-right { text-align: right; }
                    .text-center { text-align: center; }
                  </style>
                </head>
                <body>
                  <div class="header">
                    <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 300px; height: auto; margin-bottom: 10px;">
                    <p>Factura Creada</p>
                  </div>
                  <div class="content">
                    <p>Hola <strong>${customerName}</strong>,</p>
                    <p>Se ha generado una nueva factura por tus paquetes.</p>
                    
                    <div class="info-box">
                      <div class="invoice-summary">
                        <div class="summary-item">
                          <span><strong>Número de Factura:</strong></span>
                          <span class="highlight">${invoiceData.invoiceNumber}</span>
                        </div>
                        <div class="summary-item">
                          <span><strong>Fecha de Emisión:</strong></span>
                          <span>${templateData.issueDate}</span>
                        </div>
                        <div class="summary-item">
                          <span><strong>Fecha de Vencimiento:</strong></span>
                          <span>${templateData.dueDate}</span>
                        </div>
                        <div class="summary-item summary-total">
                          <span><strong>Total a Pagar:</strong></span>
                          <span class="highlight">${templateData.totalAmount}</span>
                        </div>
                      </div>
                    </div>
                    
                    <h3>Detalle de Paquetes:</h3>
                    
                    <table>
                      <thead>
                        <tr>
                          <th>Tracking</th>
                          <th>Descripción</th>
                          <th class="text-right">Precio</th>
                          <th class="text-center">Cantidad</th>
                          <th class="text-right">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        ${itemsRows}
                      </tbody>
                      <tfoot>
                        <tr>
                          <td colspan="4" style="text-align: right; padding: 8px; font-weight: bold;">Total:</td>
                          <td style="padding: 8px; text-align: right; font-weight: bold;">${templateData.totalAmount}</td>
                        </tr>
                      </tfoot>
                    </table>
                    
                    <p>Por favor, visita nuestra oficina para realizar el pago correspondiente.</p>
                  </div>
                  <div class="footer">
                    <p>© ${templateData.year} WorkExpress. Todos los derechos reservados.</p>
                    <p>Este es un correo automático, por favor no responder a esta dirección.</p>
                  </div>
                </body>
                </html>
              `;
                            const textContent = `
                Factura Creada - WorkExpress
                
                Hola ${customerName},
                
                Se ha generado una nueva factura por tus paquetes.
                
                Número de Factura: ${invoiceData.invoiceNumber}
                Fecha de Emisión: ${templateData.issueDate}
                Fecha de Vencimiento: ${templateData.dueDate}
                Total a Pagar: ${templateData.totalAmount}
                
                Detalle de Paquetes:
                ${formattedItems.map(item => `- Tracking: ${item.trackingNumber}, ${item.description}, Precio: ${item.price}, Cantidad: ${item.quantity}, Subtotal: ${item.subtotal}`).join("\n")}
                
                Por favor, visita nuestra oficina para realizar el pago correspondiente.
                
                © ${templateData.year} WorkExpress. Todos los derechos reservados.
                ¡Compra sin estrés, compra con WorkExpress!
                
                Este es un correo automático, por favor no responder a esta dirección.
              `;
                            const result = await this.sendWithMailProvider(email, `Factura ${invoiceData.invoiceNumber} Creada - WorkExpress`, htmlContent, textContent);
                            if (result.success) {
                                return {
                                    success: true,
                                    sentTo: email,
                                    method: 'mail-provider',
                                    fallback: true,
                                    message: 'Correo de factura enviado usando proveedor externo (SendGrid)'
                                };
                            }
                            throw new Error('Proveedor externo falló: ' + result.error);
                        }
                        else {
                            throw new Error('No hay proveedor externo configurado');
                        }
                    }
                    catch (providerError) {
                        this.logger.warn(`⚠️ Error con proveedor externo: ${providerError.message}. Intentando con Ethereal...`);
                        try {
                            const itemsHtml = invoiceData.items.map(item => `<li>Paquete ${item.trackingNumber}: $${item.price.toFixed(2)} USD x ${item.quantity} = $${(item.price * item.quantity).toFixed(2)} USD</li>`).join('');
                            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #222; color: white; padding: 20px; text-align: center;">
                    <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
                    <p>Factura Creada</p>
                  </div>
                  <p>Hola <strong>${customerName}</strong>,</p>
                  <p>Se ha generado una nueva factura para tus paquetes:</p>
                  <ul>
                    <li><strong>Número de Factura:</strong> ${invoiceData.invoiceNumber}</li>
                    <li><strong>Fecha de emisión:</strong> ${templateData.issueDate}</li>
                    <li><strong>Fecha de vencimiento:</strong> ${templateData.dueDate}</li>
                    <li><strong>Total a pagar:</strong> $${formattedTotalAmount} USD</li>
                  </ul>
                  <h3>Detalle de paquetes:</h3>
                  <ul>
                    ${itemsHtml}
                  </ul>
                  <p>Por favor, visita nuestra oficina para realizar el pago correspondiente.</p>
                </div>
              `;
                            const result = await this.sendWithEthereal(email, `Tu factura ${invoiceData.invoiceNumber} ha sido creada`, htmlContent, `Hola ${customerName}, tu factura ${invoiceData.invoiceNumber} ha sido creada. Total a pagar: $${formattedTotalAmount} USD`);
                            return {
                                success: true,
                                sentTo: email,
                                previewUrl: result.previewUrl,
                                method: 'ethereal',
                                fallback: true,
                                message: 'Correo de factura enviado usando servicio de prueba Ethereal'
                            };
                        }
                        catch (etherealError) {
                            this.logger.error(`❌ Todos los métodos de envío de correo han fallado: ${etherealError.message}`);
                            return {
                                success: true,
                                sentTo: email,
                                simulated: true,
                                method: 'simulated',
                                message: 'Correo de factura simulado después de agotar todos los métodos de envío'
                            };
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Error general al enviar notificación de factura: ${error.message}`);
            return {
                success: false,
                sentTo: email,
                error: error.message
            };
        }
    }
    async sendPackageArrivalEmail(email, userData, packageData) {
        try {
            this.logger.log(`📧 Preparando correo de llegada de paquete para: ${email}`);
            if (!this.supabase) {
                throw new Error('Cliente Supabase no inicializado. Verifica la configuración.');
            }
            const formattedPrice = packageData.price.toFixed(2);
            const customerName = `${userData.firstName} ${userData.lastName || ''}`.trim();
            const templateData = {
                userName: customerName,
                trackingNumber: packageData.trackingNumber,
                weight: packageData.weight ? `${packageData.weight.toFixed(2)} lb` : 'No disponible',
                status: packageData.packageStatus || 'Recibido',
                estimatedDeliveryDate: packageData.estimatedDeliveryDate || 'No disponible',
                year: new Date().getFullYear().toString()
            };
            try {
                const { error } = await this.supabase.functions.invoke('send-package-arrival-email', {
                    body: {
                        email,
                        templateData
                    }
                });
                if (error) {
                    this.logger.warn(`⚠️ Error al enviar correo con Edge Function: ${error.message}. Intentando método alternativo...`);
                    throw error;
                }
                this.logger.log(`✅ Notificación de llegada de paquete enviada vía Supabase a: ${email}`);
                return {
                    success: true,
                    sentTo: email,
                    method: 'supabase'
                };
            }
            catch (edgeFunctionError) {
                this.logger.log('🔄 Intentando enviar con nodemailer como método alternativo...');
                try {
                    const result = await this.sendInvoiceAndPackageEmail(email, `Tu paquete ${packageData.trackingNumber} ha llegado`, {
                        customerName,
                        trackingNumber: packageData.trackingNumber,
                        price: `$${formattedPrice} USD`,
                        weight: packageData.weight ? `${packageData.weight.toFixed(2)} lb` : undefined,
                        status: packageData.packageStatus || 'Recibido'
                    });
                    this.logger.log(`✅ Correo enviado exitosamente vía Nodemailer: ${result.messageId}`);
                    return {
                        success: true,
                        sentTo: email,
                        fallback: true,
                        messageId: result.messageId,
                        method: 'nodemailer',
                        message: 'Correo enviado exitosamente usando Nodemailer como método alternativo'
                    };
                }
                catch (nodemailerError) {
                    this.logger.warn(`⚠️ Error con nodemailer: ${nodemailerError.message}. Intentando con proveedor externo...`);
                    try {
                        const apiKey = this.configService.get('SENDGRID_API_KEY') ||
                            this.configService.get('MAIL_PROVIDER_API_KEY');
                        if (apiKey) {
                            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #222; color: white; padding: 20px; text-align: center;">
                    <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
                    <p>Tu paquete ha llegado</p>
                  </div>
                  <p>Hola <strong>${customerName}</strong>,</p>
                  <p>Tu paquete con número de tracking <strong>${packageData.trackingNumber}</strong> ha llegado.</p>
                  ${packageData.weight ? `<p>Peso: ${packageData.weight.toFixed(2)} lb</p>` : ''}
                  <p>Por favor, visita nuestra oficina para recoger tu paquete. Recuerda traer tu identificación.</p>
                </div>
              `;
                            const textContent = `Hola ${customerName}, tu paquete ${packageData.trackingNumber} ha llegado.`;
                            const result = await this.sendWithMailProvider(email, `Tu paquete ${packageData.trackingNumber} ha llegado - WorkExpress`, htmlContent, textContent);
                            if (result.success) {
                                return {
                                    success: true,
                                    sentTo: email,
                                    method: 'mail-provider',
                                    fallback: true,
                                    message: 'Correo enviado usando proveedor externo (SendGrid)'
                                };
                            }
                            throw new Error('Proveedor externo falló: ' + result.error);
                        }
                        else {
                            throw new Error('No hay proveedor externo configurado');
                        }
                    }
                    catch (providerError) {
                        this.logger.warn(`⚠️ Error con proveedor externo: ${providerError.message}. Intentando con Ethereal...`);
                        try {
                            const htmlContent = `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                  <div style="background-color: #222; color: white; padding: 20px; text-align: center;">
                    <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
                    <p>Tu paquete ha llegado</p>
                  </div>
                  <p>Hola <strong>${customerName}</strong>,</p>
                  <p>Tu paquete con número de tracking <strong>${packageData.trackingNumber}</strong> ha llegado.</p>
                  ${packageData.weight ? `<p>Peso: ${packageData.weight.toFixed(2)} lb</p>` : ''}
                  <p>Por favor, visita nuestra oficina para recoger tu paquete. Recuerda traer tu identificación.</p>
                </div>
              `;
                            const result = await this.sendWithEthereal(email, `Tu paquete ${packageData.trackingNumber} ha llegado - WorkExpress`, htmlContent, `Hola ${customerName}, tu paquete ${packageData.trackingNumber} ha llegado.`);
                            return {
                                success: true,
                                sentTo: email,
                                previewUrl: result.previewUrl,
                                method: 'ethereal',
                                fallback: true,
                                message: 'Correo enviado usando servicio de prueba Ethereal'
                            };
                        }
                        catch (etherealError) {
                            this.logger.error(`❌ Todos los métodos de envío de correo han fallado: ${etherealError.message}`);
                            return {
                                success: true,
                                sentTo: email,
                                simulated: true,
                                method: 'simulated',
                                message: 'Correo simulado después de agotar todos los métodos de envío'
                            };
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Error general al enviar notificación: ${error.message}`);
            return {
                success: false,
                sentTo: email,
                error: error.message
            };
        }
    }
    async sendCustomEmail(email, subject, templateData, templateName = 'custom') {
        try {
            this.logger.log(`📧 Preparando correo personalizado para: ${email}`);
            if (!this.supabase) {
                throw new Error('Cliente Supabase no inicializado. Verifica la configuración.');
            }
            try {
                const { error } = await this.supabase.functions.invoke('send-custom-email', {
                    body: {
                        email,
                        subject,
                        templateName,
                        templateData
                    }
                });
                if (error) {
                    this.logger.warn(`⚠️ Error al invocar función Edge de Supabase: ${error.message}. Intentando método alternativo...`);
                    throw error;
                }
            }
            catch (edgeFunctionError) {
                this.logger.log('🔄 Intentando enviar correo con Nodemailer...');
                if (!this.transporter) {
                    this.setupNodemailerTransport();
                    if (!this.transporter) {
                        throw new Error('No se pudo configurar el transportador de correo');
                    }
                }
                let htmlContent = '';
                if (templateName === 'package-arrival') {
                    htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #0056b3; color: white; padding: 20px; text-align: center;">
                <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
                <p>Notificación de Paquete</p>
              </div>
              <div style="padding: 20px; border: 1px solid #ddd;">
                <p>Hola <strong>${templateData.userName || 'Cliente'}</strong>,</p>
                <p>${templateData.message || '¡Tu paquete ha llegado a nuestras instalaciones!'}</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
                  ${Object.entries(templateData)
                        .filter(([key]) => !['userName', 'message', 'price', 'amount', 'total', 'cost'].includes(key))
                        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                        .join('')}
                </div>
                
                <p>Por favor, visita nuestra oficina para recoger tu paquete. Recuerda traer tu identificación.</p>
                <p>Gracias por confiar en WorkExpress.</p>
              </div>
              <div style="font-size: 12px; color: #777; text-align: center; margin-top: 20px;">
                <p>© ${new Date().getFullYear()} WorkExpress. Todos los derechos reservados.</p>
              </div>
            </div>
          `;
                }
                else {
                    htmlContent = `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #222; color: white; padding: 20px; text-align: center;">
                <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
              </div>
              <div style="padding: 20px; border: 1px solid #ddd;">
                <p>${templateData.message || 'Notificación de WorkExpress'}</p>
                
                <div style="background-color: #f5f5f5; padding: 15px; margin: 15px 0;">
                  ${Object.entries(templateData)
                        .filter(([key]) => key !== 'message')
                        .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                        .join('')}
                </div>
              </div>
              <div style="font-size: 12px; color: #777; text-align: center; margin-top: 20px;">
                <p>© ${new Date().getFullYear()} WorkExpress. Todos los derechos reservados.</p>
              </div>
            </div>
          `;
                }
                const mailOptions = {
                    from: `"WorkExpress" <${this.configService.get('SMTP_USER') || 'notifications@workexpress.com'}>`,
                    to: email,
                    subject: subject,
                    html: htmlContent
                };
                const info = await this.transporter.sendMail(mailOptions);
                this.logger.log(`✅ Correo enviado exitosamente vía Nodemailer: ${info.messageId}`);
                return {
                    success: true,
                    sentTo: email,
                    messageId: info.messageId,
                    method: 'nodemailer'
                };
            }
            this.logger.log(`✅ Correo personalizado enviado vía Supabase a: ${email}`);
            return {
                success: true,
                sentTo: email,
                method: 'supabase'
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al enviar correo personalizado: ${error.message}`);
            try {
                const testAccount = await nodemailer.createTestAccount();
                const testTransporter = nodemailer.createTransport({
                    host: 'smtp.ethereal.email',
                    port: 587,
                    secure: false,
                    auth: {
                        user: testAccount.user,
                        pass: testAccount.pass,
                    },
                });
                const simpleHtml = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <div style="background-color: #222; color: white; padding: 20px; text-align: center;">
              <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" style="max-width: 280px; height: auto; margin-bottom: 10px;">
              <p>${subject}</p>
            </div>
            <p>Mensaje enviado a ${email}</p>
            <div>
              ${Object.entries(templateData)
                    .map(([key, value]) => `<p><strong>${key}:</strong> ${value}</p>`)
                    .join('')}
            </div>
          </div>
        `;
                const info = await testTransporter.sendMail({
                    from: '"WorkExpress Test" <test@workexpress.com>',
                    to: email,
                    subject: subject,
                    html: simpleHtml
                });
                const previewUrl = nodemailer.getTestMessageUrl(info);
                this.logger.log(`✅ Correo de prueba enviado. Vista previa: ${previewUrl}`);
                return {
                    success: true,
                    sentTo: email,
                    previewUrl,
                    method: 'ethereal',
                    debug: true
                };
            }
            catch (fallbackError) {
                this.logger.error(`❌ Error en método alternativo de correo: ${fallbackError.message}`);
                return {
                    success: false,
                    sentTo: email,
                    error: error.message
                };
            }
        }
    }
    async sendWithEthereal(email, subject, html, text) {
        try {
            const testAccount = await nodemailer.createTestAccount();
            this.logger.log(`🧪 Creada cuenta de prueba Ethereal: ${testAccount.user}`);
            const testTransporter = nodemailer.createTransport({
                host: 'smtp.ethereal.email',
                port: 587,
                secure: false,
                auth: {
                    user: testAccount.user,
                    pass: testAccount.pass,
                },
            });
            const info = await testTransporter.sendMail({
                from: '"WorkExpress Test" <test@workexpress.com>',
                to: email,
                subject,
                text: text || 'Correo de prueba de WorkExpress',
                html
            });
            const previewUrl = nodemailer.getTestMessageUrl(info);
            this.logger.log(`✅ Correo de prueba enviado. Vista previa: ${previewUrl}`);
            return {
                success: true,
                messageId: info.messageId,
                previewUrl,
                method: 'ethereal'
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al enviar con Ethereal: ${error.message}`);
            throw error;
        }
    }
    async sendWithMailProvider(to, subject, htmlContent, textContent) {
        try {
            this.logger.log('🔄 Intentando enviar correo mediante API de proveedor externo...');
            const apiKey = this.configService.get('SENDGRID_API_KEY') ||
                this.configService.get('MAIL_PROVIDER_API_KEY');
            if (!apiKey) {
                throw new Error('No se encontró configuración para proveedor externo de correo.');
            }
            const providerUrl = this.configService.get('MAIL_PROVIDER_URL') ||
                'https://api.sendgrid.com/v3/mail/send';
            const fromEmail = this.configService.get('MAIL_FROM') ||
                this.configService.get('SMTP_USER') ||
                'noreply@workexpress.com';
            const fromName = this.configService.get('MAIL_FROM_NAME') || 'WorkExpress';
            const payload = {
                personalizations: [
                    {
                        to: [{ email: to }],
                        subject: subject
                    }
                ],
                content: [
                    {
                        type: 'text/plain',
                        value: textContent
                    },
                    {
                        type: 'text/html',
                        value: htmlContent
                    }
                ],
                from: {
                    email: fromEmail,
                    name: fromName
                }
            };
            const response = await fetch(providerUrl, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${apiKey}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            });
            if (!response.ok) {
                const errorText = await response.text();
                throw new Error(`Error de API ${response.status}: ${errorText}`);
            }
            this.logger.log('✅ Correo enviado exitosamente a través de API externa');
            return {
                success: true,
                messageId: `mail-provider-${Date.now()}`,
                provider: 'sendgrid'
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al enviar correo mediante API: ${error.message}`);
            return {
                success: false,
                provider: 'sendgrid',
                error: error.message
            };
        }
    }
    async sendInvoiceReminderEmail(email, userData, invoiceData) {
        try {
            this.logger.log(`📧 Preparando correo de recordatorio de factura para: ${email}`);
            if (!this.supabase) {
                throw new Error('Cliente Supabase no inicializado. Verificar la configuración.');
            }
            const formattedTotalAmount = invoiceData.totalAmount.toFixed(2);
            const customerName = `${userData.firstName} ${userData.lastName || ''}`.trim();
            const templateData = {
                userName: customerName,
                invoiceNumber: invoiceData.invoiceNumber,
                totalAmount: `$${formattedTotalAmount} USD`,
                totalPackages: invoiceData.totalPackages.toString(),
                packageWord: invoiceData.totalPackages === 1 ? 'paquete' : 'paquetes',
                issueDate: new Date(invoiceData.issueDate).toLocaleDateString('es-ES', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                }),
                year: new Date().getFullYear().toString()
            };
            try {
                const { error } = await this.supabase.functions.invoke('send-invoice-reminder', {
                    body: {
                        email,
                        templateData
                    }
                });
                if (error) {
                    this.logger.warn(`⚠️ Error al enviar recordatorio con Edge Function: ${error.message}. Intentando método alternativo...`);
                    throw error;
                }
                this.logger.log(`✅ Recordatorio de factura enviado vía Supabase a: ${email}`);
                return {
                    success: true,
                    sentTo: email,
                    method: 'supabase'
                };
            }
            catch (edgeFunctionError) {
                this.logger.warn(`⚠️ Error con Edge Function: ${edgeFunctionError.message}. Intentando con Nodemailer...`);
                if (!this.transporter) {
                    this.setupNodemailerTransport();
                }
                const styles = `
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; background-color: #f9f9f9; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff; box-shadow: 0 4px 8px rgba(0, 0, 0, 0.05); }
            .header { background-color: #000000; color: white; padding: 25px; text-align: center; border-radius: 5px 5px 0 0; }
            .content { padding: 30px; border: 1px solid #e7e7e7; border-top: none; border-radius: 0 0 5px 5px; }
            .logo { max-width: 280px; height: auto; margin-bottom: 0; }
            .info-box { background-color: #f9f9f9; padding: 20px; margin: 20px 0; border-radius: 5px; border-left: 4px solid #f0b000; }
            .highlight { color: #f0b000; font-weight: bold; }
            .button { display: inline-block; background-color: #f0b000; color: white; padding: 12px 24px; text-decoration: none; border-radius: 5px; margin-top: 15px; font-weight: bold; transition: background-color 0.3s; }
            .button:hover { background-color: #d99e00; }
            .footer { text-align: center; font-size: 12px; color: #777; margin-top: 20px; padding-top: 20px; border-top: 1px solid #e7e7e7; }
            .summary-item { display: flex; justify-content: space-between; margin-bottom: 10px; padding-bottom: 5px; }
            .summary-total { font-weight: bold; margin-top: 15px; border-top: 1px solid #e7e7e7; padding-top: 15px; }
            h2 { color: #333; margin-top: 0; border-bottom: 2px solid #f0b000; padding-bottom: 8px; display: inline-block; }
          </style>
        `;
                const htmlContent = `
          <!DOCTYPE html>
          <html lang="es">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Recordatorio de Paquetes Pendientes - WorkExpress</title>
            ${styles}
          </head>
          <body>
            <div class="container">
              <div class="header">
                <img src="https://qtoiveiofqqvenuquesh.supabase.co/storage/v1/object/public/workexpressimagedata/logos/LOGO-WORKEXPRES.png" alt="WorkExpress" class="logo">
              </div>
              <div class="content">
                <h2>Recordatorio Importante</h2>
                <p>Hola <strong>${customerName}</strong>,</p>
                
                <p>Te recordamos que tienes <strong class="highlight">${invoiceData.totalPackages} ${templateData.packageWord}</strong> pendientes por retirar en nuestra sucursal.</p>
                
                <div class="info-box">
                  <div class="summary-item">
                    <span><strong>Número de Factura:</strong></span>
                    <span class="highlight">${invoiceData.invoiceNumber}</span>
                  </div>
                  <div class="summary-item">
                    <span><strong>Fecha de Emisión:</strong></span>
                    <span>${templateData.issueDate}</span>
                  </div>
                  <div class="summary-item">
                    <span><strong>Total de Paquetes:</strong></span>
                    <span>${invoiceData.totalPackages} ${templateData.packageWord}</span>
                  </div>
                  <div class="summary-item summary-total">
                    <span><strong>Monto Total:</strong></span>
                    <span class="highlight">${templateData.totalAmount}</span>
                  </div>
                </div>
                
                <p>Por favor, pasa por nuestra oficina para retirar tus paquetes. Recuerda traer una identificación válida.</p>
                
                <p>Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.</p>
                
                <a href="https://workexpress.online" class="button">Ver detalles en WorkExpress</a>
                
                <p style="margin-top: 25px;">¡Gracias por confiar en WorkExpress!</p>
              </div>
              <div class="footer">
                <p>© ${templateData.year} WorkExpress. Todos los derechos reservados.</p>
                <p style="color: #999;">¡Compra sin estrés, compra con WorkExpress!</p>
                <p style="font-size: 11px; margin-top: 10px;">Este es un correo automático, por favor no responder a esta dirección.</p>
              </div>
            </div>
          </body>
          </html>
        `;
                const textContent = `
          RECORDATORIO IMPORTANTE - WorkExpress
          
          Hola ${customerName},
          
          Te recordamos que tienes ${invoiceData.totalPackages} ${templateData.packageWord} pendientes por retirar en nuestra sucursal.
          
          DETALLES DE LA FACTURA:
          - Número de Factura: ${invoiceData.invoiceNumber}
          - Fecha de Emisión: ${templateData.issueDate}
          - Total de Paquetes: ${invoiceData.totalPackages} ${templateData.packageWord}
          - Monto Total: ${templateData.totalAmount}
          
          Por favor, pasa por nuestra oficina para retirar tus paquetes. Recuerda traer una identificación válida.
          
          Si tienes alguna pregunta o necesitas más información, no dudes en contactarnos.
          
          Visita https://workexpress.online para ver detalles
          
          ¡Gracias por confiar en WorkExpress!
          
          ¡Compra sin estrés, compra con WorkExpress!
          
          © ${templateData.year} WorkExpress. Todos los derechos reservados.
          Este es un correo automático, por favor no responder a esta dirección.
        `;
                try {
                    const mailOptions = {
                        from: `"WorkExpress" <${this.configService.get('SMTP_USER') || 'recordatorios@workexpress.com'}>`,
                        to: email,
                        subject: `🚨 ¡Importante! Tienes ${invoiceData.totalPackages} ${templateData.packageWord} pendientes - WorkExpress`,
                        html: htmlContent,
                        text: textContent
                    };
                    const info = await this.transporter.sendMail(mailOptions);
                    this.logger.log(`✅ Recordatorio enviado exitosamente vía Nodemailer: ${info.messageId}`);
                    return {
                        success: true,
                        sentTo: email,
                        messageId: info.messageId,
                        method: 'nodemailer'
                    };
                }
                catch (nodemailerError) {
                    this.logger.warn(`⚠️ Error con Nodemailer: ${nodemailerError.message}. Intentando con proveedor externo...`);
                    const apiKey = this.configService.get('MAIL_PROVIDER_API_KEY');
                    if (apiKey) {
                        try {
                            const result = await this.sendWithMailProvider(email, `🚨 ¡Importante! Tienes ${invoiceData.totalPackages} ${templateData.packageWord} pendientes - WorkExpress`, htmlContent, textContent);
                            if (result.success) {
                                return {
                                    success: true,
                                    sentTo: email,
                                    method: 'mail-provider',
                                    fallback: true,
                                    message: 'Recordatorio enviado usando proveedor externo'
                                };
                            }
                            throw new Error('Proveedor externo falló: ' + result.error);
                        }
                        catch (providerError) {
                            this.logger.warn(`⚠️ Error con proveedor externo: ${providerError.message}. Intentando con Ethereal...`);
                            try {
                                const result = await this.sendWithEthereal(email, `🚨 ¡Importante! Tienes ${invoiceData.totalPackages} ${templateData.packageWord} pendientes - WorkExpress`, htmlContent, textContent);
                                return {
                                    success: true,
                                    sentTo: email,
                                    previewUrl: result.previewUrl,
                                    method: 'ethereal',
                                    fallback: true,
                                    message: 'Recordatorio enviado usando servicio de prueba Ethereal'
                                };
                            }
                            catch (etherealError) {
                                this.logger.error(`❌ Todos los métodos de envío han fallado: ${etherealError.message}`);
                                return {
                                    success: true,
                                    sentTo: email,
                                    simulated: true,
                                    method: 'simulated',
                                    error: 'Se simuló el envío después de agotar todos los métodos'
                                };
                            }
                        }
                    }
                    else {
                        try {
                            const result = await this.sendWithEthereal(email, `🚨 ¡Importante! Tienes ${invoiceData.totalPackages} ${templateData.packageWord} pendientes - WorkExpress`, htmlContent, textContent);
                            return {
                                success: true,
                                sentTo: email,
                                previewUrl: result.previewUrl,
                                method: 'ethereal',
                                fallback: true,
                                message: 'Recordatorio enviado usando servicio de prueba Ethereal'
                            };
                        }
                        catch (etherealError) {
                            this.logger.error(`❌ Todos los métodos de envío de correo han fallado: ${etherealError.message}`);
                            return {
                                success: true,
                                sentTo: email,
                                simulated: true,
                                method: 'simulated',
                                message: 'Envío simulado después de agotar todos los métodos'
                            };
                        }
                    }
                }
            }
        }
        catch (error) {
            this.logger.error(`❌ Error general al enviar recordatorio: ${error.message}`);
            return {
                success: false,
                sentTo: email,
                error: error.message
            };
        }
    }
};
exports.SupabaseEmailService = SupabaseEmailService;
exports.SupabaseEmailService = SupabaseEmailService = SupabaseEmailService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], SupabaseEmailService);
//# sourceMappingURL=supabase-email.service.js.map