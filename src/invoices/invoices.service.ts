import { Injectable, BadRequestException, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { CreateInvoiceDto } from './dto/create-invoice.dto';
import { NotificationsService } from '../notifications/notifications.service';
import { ActivitiesService } from '../modules/activities/activities.service';
import { ActivityAction, ActivityStatus } from '../modules/activities/interfaces/operator-activity.interface';
import { PackagesService } from '../packages/packages.service';
import { PrismaService } from '../prisma/prisma.service';

// Importamos los tipos de Prisma
import { invoice_status_enum, package_status_enum } from '@prisma/client';
import { Decimal } from '@prisma/client/runtime/library';

export interface Invoice {
  id: string;
  invoice_number: string;
  customer?: {
    name: string;
    email?: string;
    photo?: string;
  };
  issue_date: string;
  due_date: string;
  total_amount: number;
  status: string;
  price_plan?: number;
  shipping_insurance?: boolean;
}

export interface InvoiceCreateResult {
  id: string;
  invoice_number: string;
  issue_date: Date;
  due_date: Date;
  status: invoice_status_enum;
  total_amount: Decimal;
  price_plan?: number;
  shipping_insurance?: boolean;
  items: {
    name: string;
    description: string;
    quantity: number;
    price: number;
    totalPrice: number;
    trackingNumber: string;
    weight: number;
    rate: number;
  }[];
  customer: {
    id: string;
    name: string;
    email: string;
  };
  packageIds: string[];
  notifications?: {
    sent: number;
    total: number;
    error?: string;
  };
  invoiceNotification?: {
    sent: boolean;
    method?: string;
    fallback?: boolean;
    simulated?: boolean;
    error?: string;
  };
}

@Injectable()
export class InvoicesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly notificationsService: NotificationsService,
    private readonly activitiesService: ActivitiesService,
    private readonly packagesService: PackagesService
  ) {}

  /**
   * Verifica si un paquete ya está facturado
   * @param trackingNumber Número de tracking del paquete
   */
  private async isPackageAlreadyInvoiced(trackingNumber: string): Promise<{ isInvoiced: boolean; invoiceDetails?: any }> {
    try {
      console.log('🔍 Verificando si el paquete está facturado:', trackingNumber);
      
      // Buscar el paquete por número de tracking
      const pkg = await this.prisma.packages.findFirst({
        where: {
          tracking_number: trackingNumber
        }
      });
      
      if (!pkg) {
        console.log('⚠️ Paquete no encontrado:', trackingNumber);
        return { isInvoiced: false };
      }
      
      // Verificar si el paquete está asociado a alguna factura
      const invoicePackage = await this.prisma.invoice_packages.findFirst({
        where: {
          package_id: pkg.id
        },
        include: {
          invoices: true
        }
      });
      
      if (!invoicePackage) {
        console.log('✅ Paquete no facturado:', trackingNumber);
        return { isInvoiced: false };
      }

      console.log('🧾 Paquete ya facturado:', trackingNumber, 'Factura:', invoicePackage.invoice_id);
          
          return {
            isInvoiced: true,
            invoiceDetails: {
          invoice_id: invoicePackage.invoice_id,
          invoice_number: invoicePackage.invoices.invoice_number,
          issue_date: invoicePackage.invoices.issue_date,
          status: invoicePackage.invoices.status
        }
      };
    } catch (error) {
      console.error('❌ Error al verificar paquete facturado:', error);
      return { isInvoiced: false };
    }
  }

  /**
   * Verifica si un paquete ya está facturado - Endpoint público
   * @param trackingNumber Número de tracking del paquete
   */
  async verifyPackageStatus(trackingNumber: string): Promise<{ isInvoiced: boolean; invoiceDetails?: any }> {
    return this.isPackageAlreadyInvoiced(trackingNumber);
  }

  /**
   * Crea una nueva factura y los registros relacionados en la base de datos
   * @param createInvoiceDto Datos de la factura a crear
   * @param operatorData Datos del operador que crea la factura
   * @returns Resultado de la creación de la factura
   */
  async createInvoice(createInvoiceDto: CreateInvoiceDto, operatorData: { id: string; email: string }): Promise<InvoiceCreateResult> {
    try {
      console.log('📝 Creando nueva factura...', {
        items: createInvoiceDto.invoice_items,
        total: createInvoiceDto.total_amount
      });

      // Validar que exista el operador
      const operator = await this.prisma.operators.findUnique({
        where: { id: operatorData.id }
      });

      if (!operator) {
        throw new BadRequestException('Operador no encontrado');
      }

      // Validar que exista el cliente
      let user = await this.prisma.users.findUnique({
        where: { id: createInvoiceDto.customer_id },
        include: {
          branches: true
        }
      });

      // Si no se encuentra el usuario, intentar formatear el ID como UUID
      if (!user && createInvoiceDto.customer_id.length === 32) {
        try {
          console.log('⚠️ Usuario no encontrado con ID alfanumérico, intentando convertir a formato UUID...');
          
          // Transformar ID sin guiones a formato UUID
          const formattedUuid = `${createInvoiceDto.customer_id.slice(0, 8)}-${createInvoiceDto.customer_id.slice(8, 12)}-${createInvoiceDto.customer_id.slice(12, 16)}-${createInvoiceDto.customer_id.slice(16, 20)}-${createInvoiceDto.customer_id.slice(20)}`;
          
          console.log('🔄 ID convertido a formato UUID:', formattedUuid);
          
          // Intentar buscar el usuario nuevamente con el ID formateado
          user = await this.prisma.users.findUnique({
            where: { id: formattedUuid },
            include: {
              branches: true
            }
          });
          
          if (user) {
            console.log('✅ Usuario encontrado con ID formateado a UUID:', user.id);
          } else {
            console.log('❌ Usuario no encontrado ni con ID original ni con ID formateado');
          }
        } catch (formatError) {
          console.error('❌ Error al formatear ID como UUID:', formatError);
        }
      }

      if (!user) {
        throw new BadRequestException('Cliente no encontrado');
      }

      // Generar prefijo para el número de factura
      let prefix = 'INV';
      if (user.branch_id && user.branches) {
        if (user.branches.prefix) {
          prefix = user.branches.prefix;
        }
      }

      // Generar número de factura único con prefijo y 10 dígitos aleatorios
      let invoice_number = '';
      let isInvoiceNumberUnique = false;
      let attempts = 0;
      const maxAttempts = 5;

      // Siempre generamos un nuevo número de factura, ignorando el que pudiera venir en el DTO
      while (!isInvoiceNumberUnique && attempts < maxAttempts) {
        attempts++;
        const randomDigits = Math.floor(1000000000 + Math.random() * 9000000000); // Genera un número de 10 dígitos
        invoice_number = `${prefix}-${randomDigits}`;
        
        // Verificar si el número de factura ya existe
        const existingInvoice = await this.prisma.invoices.findUnique({
          where: { 
            invoice_number 
          }
        });
        
        if (!existingInvoice) {
          isInvoiceNumberUnique = true;
          console.log(`📄 Generando número de factura único: ${invoice_number} (Prefijo: ${prefix}, Intento: ${attempts})`);
        } else {
          console.log(`⚠️ Número de factura ${invoice_number} ya existe, intentando nuevamente...`);
        }
      }
      
      if (!isInvoiceNumberUnique) {
        console.warn(`❌ No se pudo generar un número de factura único después de ${maxAttempts} intentos`);
        // Fallback usando timestamp para garantizar unicidad
      const timestamp = Date.now();
        invoice_number = `${prefix}-${timestamp}-${Math.random().toString(36).substring(2, 7)}`;
        console.log(`📄 Usando número de factura con timestamp: ${invoice_number}`);
      }

      // Procesar los items para extraer información del tracking
      const processedItems = createInvoiceDto.invoice_items.map(item => {
        // Extraer tracking number del nombre del item (formato "Package - WEX12345")
        const trackingNumber = item.name.split(' - ')[1]?.trim();
        
        // Extraer peso y tarifa de la descripción usando regex
        const weightMatch = item.description.match(/Weight: ([\d.]+)lb/i);
        const weight = weightMatch ? parseFloat(weightMatch[1]) : 0;
        
        const rateMatch = item.description.match(/Rate: \$([\d.]+)/i);
        const rate = rateMatch ? parseFloat(rateMatch[1]) : 0;

        return {
          name: item.name,
          description: item.description,
          quantity: item.quantity,
          price: parseFloat(item.price.toFixed(2)),
          totalPrice: parseFloat((item.quantity * item.price).toFixed(2)),
          trackingNumber,
          weight,
          rate
        };
      });

      // Obtener el tracking_number del primer paquete para la factura
      const firstTrackingNumber = processedItems[0]?.trackingNumber || '';
      
      // Calcular el total de la factura desde los items
      const totalAmount = processedItems.reduce((sum, item) => sum + item.totalPrice, 0);

      // Convertir el status a un valor válido del enum invoice_status_enum
      let invoiceStatus: invoice_status_enum;
      const statusUpper = createInvoiceDto.status.toUpperCase();
      
      // Validar el status contra los valores válidos del enum
      switch (statusUpper) {
        case 'DRAFT':
          invoiceStatus = 'draft';
          break;
        case 'SENT':
          invoiceStatus = 'sent';
          break;
        case 'PAID':
          invoiceStatus = 'paid';
          break;
        case 'PARTIAL':
          invoiceStatus = 'partial';
          break;
        case 'OVERDUE':
          invoiceStatus = 'overdue';
          break;
        case 'CANCELLED':
        case 'CANCELED':
          invoiceStatus = 'cancelled';
          break;
        default:
          // Por defecto usar 'sent'
          invoiceStatus = 'sent';
          break;
      }

      // Procesar los valores de price_plan y shipping_insurance
      // Añadir más logs para diagnóstico
      console.log('📌 Valores originales de los campos:', {
        price_plan_raw: createInvoiceDto.price_plan,
        price_plan_type: typeof createInvoiceDto.price_plan,
        shipping_insurance_raw: createInvoiceDto.shipping_insurance,
        shipping_insurance_type: typeof createInvoiceDto.shipping_insurance
      });
      
      // Convertir price_plan a número, con mejor manejo de casos edge
      let pricePlan = 0;
      if (createInvoiceDto.price_plan !== undefined && createInvoiceDto.price_plan !== null) {
        try {
          const numValue = Number(createInvoiceDto.price_plan);
          pricePlan = !isNaN(numValue) ? numValue : 0;
        } catch (error) {
          console.warn('⚠️ Error al convertir price_plan a número:', error);
          pricePlan = 0;
        }
      }
      
      // Convertir shipping_insurance a booleano, con manejo más explícito
      const hasShippingInsurance = createInvoiceDto.shipping_insurance === true;
      
      console.log('📊 Valores procesados para guardado:', {
        price_plan_raw: createInvoiceDto.price_plan,
        price_plan_processed: pricePlan, 
        shipping_insurance_raw: createInvoiceDto.shipping_insurance,
        shipping_insurance_processed: hasShippingInsurance
      });

      // Crear la factura en la base de datos usando Prisma
      const newInvoice = await this.prisma.$transaction(async (prisma) => {
        // 1. Crear la factura principal
        const invoice = await prisma.invoices.create({
          data: {
            invoice_number,
            issue_date: new Date(createInvoiceDto.issue_date),
            due_date: new Date(createInvoiceDto.due_date),
            status: invoiceStatus,
            is_paid: invoiceStatus === 'paid',
            total_amount: new Decimal(totalAmount),
            user_id: user.id,
            branch_id: user.branch_id,
            operator_id: operatorData.id,
            notes: `Factura creada automáticamente para ${processedItems.length} paquete(s)`,
            tracking_number: firstTrackingNumber,
            invoice_type: 'package',
            // Asegurarse de que price_plan sea siempre un Decimal para Prisma
            price_plan: new Decimal(pricePlan),
            // Asegurarse de que shipping_insurance sea un booleano explícito
            shipping_insurance: hasShippingInsurance
          }
        });

        console.log('💾 Factura creada con datos adicionales:', {
          price_plan: invoice.price_plan,
          shipping_insurance: invoice.shipping_insurance
        });

        // 2. Relacionar los paquetes con la factura (sin crear invoice_items)
        const invoicePackages = await Promise.all(
          processedItems.map(async (item) => {
            if (item.trackingNumber) {
              // Buscar el paquete por número de tracking
              const pkg = await prisma.packages.findFirst({
                where: { tracking_number: item.trackingNumber }
              });

              if (pkg) {
                // Crear el registro en invoice_packages
                const invoicePackage = await prisma.invoice_packages.create({
                  data: {
                    invoice_id: invoice.id,
                    package_id: pkg.id
                  }
                });

                // Actualizar el estado del paquete
                // Usamos un valor válido del enum package_status_enum
                await prisma.packages.update({
                  where: { id: pkg.id },
                  data: { package_status: 'delivered' }
                });
                
                return invoicePackage;
              }
            }
            return null;
          })
        );

        return { invoice, invoicePackages: invoicePackages.filter(Boolean) };
      });

      // Registrar la actividad del operador
      await this.activitiesService.createActivity({
        operatorId: operatorData.id,
        operatorName: `${operator.first_name || ''} ${operator.last_name || ''}`.trim(),
        action: ActivityAction.INVOICE_CREATED,
        description: `Factura ${invoice_number} creada para el cliente ${user.first_name} ${user.last_name}`,
        entityType: 'invoice',
        entityId: newInvoice.invoice.id,
        metadata: {
          invoiceId: newInvoice.invoice.id,
          invoiceNumber: invoice_number,
          customerId: user.id,
          customerName: `${user.first_name} ${user.last_name}`,
          totalAmount: totalAmount.toFixed(2),
          itemsCount: processedItems.length,
          items: processedItems.map(item => ({
            tracking: item.trackingNumber,
            price: item.price,
            total: item.totalPrice
          }))
        },
        status: ActivityStatus.COMPLETED,
        timestamp: new Date().toISOString()
      });

      // Notificar al cliente sobre la factura
      try {
        if (user.email) {
          await this.notificationsService.sendNotification(
            user.id,
            {
              type: 'invoice_created',
              title: `Nueva factura #${invoice_number} generada`,
              message: `Se ha generado una nueva factura por ${totalAmount.toFixed(2)} USD`,
              data: {
                invoiceId: newInvoice.invoice.id,
                invoiceNumber: invoice_number,
                amount: totalAmount.toFixed(2),
                dueDate: createInvoiceDto.due_date
              }
            }
          );
        }
      } catch (notifyError) {
        console.error('⚠️ Error al notificar al cliente:', notifyError);
        // No interrumpir el proceso por error en notificación
      }

      // Devolver los datos de la factura creada
      return {
        id: newInvoice.invoice.id,
        invoice_number: newInvoice.invoice.invoice_number,
        issue_date: newInvoice.invoice.issue_date,
        due_date: newInvoice.invoice.due_date,
        status: newInvoice.invoice.status,
        total_amount: newInvoice.invoice.total_amount,
        price_plan: newInvoice.invoice.price_plan ? Number(newInvoice.invoice.price_plan) : undefined,
        shipping_insurance: newInvoice.invoice.shipping_insurance || false,
        items: processedItems,
        customer: {
          id: user.id,
          name: `${user.first_name} ${user.last_name}`,
          email: user.email
        },
        packageIds: newInvoice.invoicePackages.map(ip => ip.package_id),
        invoiceNotification: { sent: false }
      };
    } catch (error) {
      console.error('❌ Error al crear la factura:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Error al crear la factura: ${error.message}`);
    }
  }

  /**
   * Obtiene todas las facturas de la base de datos
   */
  async findAll() {
    try {
      const invoices = await this.prisma.invoices.findMany({
        include: {
          users: {
            select: {
              id: true,
              first_name: true,
              last_name: true,
              email: true,
              photo_url: true
            }
          },
          invoice_packages: {
            include: {
              packages: {
                select: {
                  id: true,
                  tracking_number: true,
                  package_status: true,
                  weight: true
                }
              }
            }
          }
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      return invoices.map(invoice => ({
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        issue_date: invoice.issue_date,
        due_date: invoice.due_date,
        status: invoice.status,
        total_amount: invoice.total_amount,
        is_paid: invoice.is_paid,
        price_plan: invoice.price_plan,
        shipping_insurance: invoice.shipping_insurance,
        customer: invoice.users ? {
          id: invoice.users.id,
          name: `${invoice.users.first_name} ${invoice.users.last_name}`,
          email: invoice.users.email,
          photo: invoice.users.photo_url
        } : null,
        packages: invoice.invoice_packages.map(ip => ({
          id: ip.packages.id,
          tracking_number: ip.packages.tracking_number,
          status: ip.packages.package_status,
          weight: ip.packages.weight
        }))
      }));
    } catch (error) {
      console.error('❌ Error al obtener facturas:', error);
      throw new InternalServerErrorException(`Error al obtener facturas: ${error.message}`);
    }
  }

  /**
   * Actualiza el estado de una factura
   * @param invoiceId ID de la factura
   * @param newStatus Nuevo estado
   */
  async updateStatus(invoiceId: string, newStatus: string) {
    try {
      const validStatuses: invoice_status_enum[] = ['draft', 'sent', 'paid', 'partial', 'overdue', 'cancelled'];
      let status: invoice_status_enum;
      
      // Convertir el status recibido a un valor válido del enum
      switch (newStatus.toUpperCase()) {
        case 'DRAFT':
          status = 'draft';
          break;
        case 'SENT':
          status = 'sent';
          break;
        case 'PAID':
          status = 'paid';
          break;
        case 'PARTIAL':
          status = 'partial';
          break;
        case 'OVERDUE':
          status = 'overdue';
          break;
        case 'CANCELLED':
        case 'CANCELED':
          status = 'cancelled';
          break;
        default:
          // Por defecto usar 'draft'
          status = 'draft';
          break;
      }
      
      if (!validStatuses.includes(status)) {
        throw new BadRequestException(`Estado inválido. Valores permitidos: ${validStatuses.join(', ')}`);
      }
      
      const invoice = await this.prisma.invoices.findUnique({
        where: { id: invoiceId }
      });
      
      if (!invoice) {
        throw new NotFoundException(`Factura con ID ${invoiceId} no encontrada`);
      }
      
      // Si el estado es PAID, actualizar is_paid también
      const updateData: any = {
        status,
        updated_at: new Date()
      };
      
      if (status === 'paid') {
        updateData.is_paid = true;
      } else if (status === 'cancelled' || status === 'draft') {
        updateData.is_paid = false;
      }
      
      const updatedInvoice = await this.prisma.invoices.update({
        where: { id: invoiceId },
        data: updateData
      });

      return {
        id: updatedInvoice.id,
        status: updatedInvoice.status,
        is_paid: updatedInvoice.is_paid,
        updated_at: updatedInvoice.updated_at
      };
      
    } catch (error) {
      console.error('❌ Error al actualizar estado de factura:', error);
      
      if (error instanceof BadRequestException || error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Error al actualizar estado: ${error.message}`);
    }
  }

  /**
   * Busca una factura por su ID
   * @param id ID de la factura
   */
  async findById(id: string): Promise<Invoice> {
    try {
      const invoice = await this.prisma.invoices.findUnique({
        where: { id },
        include: {
          users: {
            select: {
              first_name: true,
              last_name: true,
              email: true,
              photo_url: true
            }
          },
          invoice_packages: {
            include: {
              packages: true
            }
          }
        }
      });
      
      if (!invoice) {
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
      }
      
      return {
        id: invoice.id,
        invoice_number: invoice.invoice_number,
        customer: invoice.users ? {
          name: `${invoice.users.first_name} ${invoice.users.last_name}`,
          email: invoice.users.email,
          photo: invoice.users.photo_url
        } : undefined,
        issue_date: invoice.issue_date.toISOString(),
        due_date: invoice.due_date.toISOString(),
        total_amount: Number(invoice.total_amount),
        status: invoice.status,
        price_plan: invoice.price_plan ? Number(invoice.price_plan) : undefined,
        shipping_insurance: invoice.shipping_insurance || false
      };
    } catch (error) {
      console.error('❌ Error al buscar factura por ID:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Error al buscar factura: ${error.message}`);
    }
  }

  /**
   * Busca una factura por su ID y devuelve sus detalles completos
   * @param id ID de la factura
   * @returns Factura con detalles de cliente y paquetes
   */
  async findInvoiceWithDetails(id: string): Promise<any> {
    try {
      console.log(`🔍 Buscando factura con detalles para ID: ${id}`);
      
      // Intentar buscar primero en la tabla de facturas de Prisma
      const invoice = await this.prisma.invoices.findUnique({
        where: { id },
        include: {
          invoice_items: true,
          invoice_packages: {
            include: {
              packages: true
            }
          },
          users: true
        }
      });
      
      if (invoice) {
        console.log('✅ Factura encontrada en Prisma');
        
        // Transformar datos a un formato estandarizado
        return {
          id: invoice.id,
          invoiceNumber: invoice.invoice_number,
          amount: parseFloat(invoice.total_amount.toString()),
          status: invoice.status,
          date: invoice.issue_date.toISOString(),
          dueDate: invoice.due_date?.toISOString(),
          totalPackages: invoice.invoice_packages.length,
          packages: invoice.invoice_packages.map(ip => ({
            id: ip.packages.id,
            trackingNumber: ip.packages.tracking_number,
            status: ip.packages.package_status,
            weight: parseFloat(ip.packages.weight?.toString() || '0')
          })),
          customer: {
            id: invoice.users.id,
            firstName: invoice.users.first_name,
            lastName: invoice.users.last_name,
            email: invoice.users.email,
            photo: invoice.users.photo_url
          }
        };
      }
      
      // Si no se encuentra en Prisma, buscar en otra fuente de datos si es necesario
      // Por ejemplo, si tienes un repositorio adicional o una API externa
      
      throw new NotFoundException(`Factura con ID ${id} no encontrada`);
    } catch (error) {
      console.error('❌ Error al buscar factura con detalles:', error);
      
      if (error instanceof NotFoundException) {
        throw error;
      }
      
      throw new InternalServerErrorException(`Error al buscar factura: ${error.message}`);
    }
  }

  /**
   * Registra en la base de datos que se ha enviado un recordatorio para una factura
   * @param invoiceId ID de la factura
   * @param operatorId ID del operador que envió el recordatorio
   * @param success Si el envío fue exitoso
   */
  async logReminderSent(invoiceId: string, operatorId: string, success: boolean): Promise<void> {
    try {
      console.log(`📝 Registrando envío de recordatorio para factura ${invoiceId} por operador ${operatorId}`);
      
      // Usar un tipo de actividad válido de los disponibles en el enum
      const action = ActivityAction.INVOICE_CREATED; // Usamos un valor que sabemos que existe
      
      // Registrar la actividad del operador
      await this.activitiesService.createActivity({
        operatorId,
        operatorName: 'Operador', // Idealmente buscar el nombre del operador
        action,
        description: `Recordatorio de factura ${invoiceId} enviado al cliente`,
        entityType: 'invoice',
        entityId: invoiceId,
        metadata: {
          invoiceId,
          sentAt: new Date().toISOString(),
          success
        },
        status: success ? ActivityStatus.COMPLETED : ActivityStatus.FAILED,
        timestamp: new Date().toISOString()
      });
      
      // Eliminar la actualización de la factura para no causar errores con prisma
      console.log('✅ Recordatorio registrado correctamente');
    } catch (error) {
      console.error('❌ Error al registrar recordatorio:', error);
      // No lanzamos el error para no interrumpir el flujo principal
    }
  }
} 

