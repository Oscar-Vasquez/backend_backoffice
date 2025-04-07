import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TransactionsService } from '../transactions/transactions.service';

@Injectable()
export class CashClosuresService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly transactionsService: TransactionsService
  ) {
    console.log('🚀 CashClosuresService inicializado');
  }

  /**
   * Obtiene el cierre de caja actual (abierto)
   */
  async getCurrentCashClosure() {
    try {
      console.log('🔍 Obteniendo cierre de caja actual');
      
      // Buscar el cierre más reciente con estado abierto
      const currentClosure = await this.prisma.cash_closures.findFirst({
        where: {
          status: 'OPEN'
        },
        orderBy: {
          created_at: 'desc'
        }
      });

      // Si hay un cierre abierto, devolverlo con sus métodos de pago
      if (currentClosure) {
        // Obtener los métodos de pago para este cierre
        const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
        
        // Calcular totales
        const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
        const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
        const totalAmount = totalCredit - totalDebit;

        // Formatear respuesta
        return {
          id: currentClosure.id,
          createdAt: currentClosure.created_at.toISOString(),
          status: currentClosure.status.toLowerCase(),
          paymentMethods,
          totalAmount,
          totalCredit,
          totalDebit
        };
      }

      // Si no hay un cierre abierto, verificar la fecha del último cierre
      const lastClosure = await this.prisma.cash_closures.findFirst({
        orderBy: {
          cash_closures: 'desc'
        }
      });

      // Obtener la fecha y hora actuales (América/Panama)
      const now = new Date();
      const currentHour = now.getHours();
      const cutoffHour = 18; // 6:00 PM
      
      // Verificar si estamos antes o después de la hora de corte
      const isBeforeCutoff = currentHour < cutoffHour;

      // Si existe un cierre anterior, verificar si fue cerrado hoy
      if (lastClosure) {
        const lastClosureDate = lastClosure.cash_closures;
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const lastClosureDay = new Date(lastClosureDate);
        lastClosureDay.setHours(0, 0, 0, 0);
        
        // Si el último cierre fue hoy
        if (lastClosureDay.getTime() === today.getTime()) {
          console.log('⚠️ Ya existe un cierre de caja para hoy. No se creará uno nuevo hasta mañana.');
          
          // Obtener los métodos de pago para este cierre cerrado
          const paymentMethods = await this.getPaymentMethodsForClosure(lastClosure.id);
          
          // Calcular totales
          const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
          const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
          const totalAmount = totalCredit - totalDebit;
          
          // Devolver el último cierre cerrado con notas adicionales
          return {
            id: lastClosure.id,
            createdAt: lastClosure.created_at.toISOString(),
            closedAt: lastClosure.cash_closures.toISOString(),
            status: 'closed',
            paymentMethods,
            totalAmount,
            totalCredit,
            totalDebit,
            message: 'No se puede abrir una nueva caja hoy. La última caja ya fue cerrada.'
          };
        }
        
        // Si el último cierre fue ayer pero estamos antes de la hora de corte
        const yesterday = new Date(today);
        yesterday.setDate(yesterday.getDate() - 1);
        
        if (lastClosureDay.getTime() === yesterday.getTime() && isBeforeCutoff) {
          console.log('⚠️ Estamos antes de la hora de corte. La caja de ayer sigue vigente.');
          
          // Obtener los métodos de pago para este cierre cerrado
          const paymentMethods = await this.getPaymentMethodsForClosure(lastClosure.id);
          
          // Calcular totales
          const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
          const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
          const totalAmount = totalCredit - totalDebit;
          
          // Devolver el último cierre cerrado con notas adicionales
          return {
            id: lastClosure.id,
            createdAt: lastClosure.created_at.toISOString(),
            closedAt: lastClosure.cash_closures.toISOString(),
            status: 'closed',
            paymentMethods,
            totalAmount,
            totalCredit,
            totalDebit,
            message: 'Estamos antes de la hora de corte. La caja de ayer sigue vigente.'
          };
        }
      }

      // Si llegamos aquí, podemos crear una nueva caja
      console.log('🆕 No hay cierre abierto, creando uno nuevo');
      return this.createNewCashClosure();
    } catch (error) {
      console.error('❌ Error al obtener cierre de caja actual:', error);
      throw error;
    }
  }

  /**
   * Crea un nuevo cierre de caja
   */
  private async createNewCashClosure() {
    try {
      // 1. Crear un nuevo registro de cierre de caja
      const newClosure = await this.prisma.cash_closures.create({
        data: {
          status: 'OPEN',
          cash_closures: new Date(),
          total_cash: 0,
          total_yappy: 0,
          total_card: 0,
          total_bank_transfer: 0,
          total_digital_wallet: 0,
          total_internal_wallet: 0, 
          total_credits: 0,
          total_debits: 0,
          final_balance: 0
        }
      });

      // 2. Devolver el nuevo cierre con estructura estándar
      return {
        id: newClosure.id,
        createdAt: newClosure.created_at.toISOString(),
        status: 'open',
        paymentMethods: [],
        totalAmount: 0,
        totalCredit: 0,
        totalDebit: 0
      };
    } catch (error) {
      console.error('❌ Error al crear nuevo cierre de caja:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cierres de caja
   */
  async getCashClosureHistory(params: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
  }) {
    try {
      console.log('🔍 Obteniendo historial de cierres de caja:', params);
      
      const page = params.page || 1;
      const limit = params.limit || 10;
      const skip = (page - 1) * limit;
      
      // Construir condiciones de filtrado
      const where: any = {};
      
      // Filtro por rango de fechas
      if (params.startDate || params.endDate) {
        where.created_at = {};
        
        if (params.startDate) {
          where.created_at.gte = new Date(params.startDate);
        }
        
        if (params.endDate) {
          const endDate = new Date(params.endDate);
          endDate.setHours(23, 59, 59, 999); // Final del día
          where.created_at.lte = endDate;
        }
      }
      
      // Filtro por estado
      if (params.status) {
        where.status = params.status.toUpperCase();
      }
      
      // Contar total de registros para paginación
      const total = await this.prisma.cash_closures.count({ where });
      
      // Obtener los cierres de caja
      const closures = await this.prisma.cash_closures.findMany({
        where,
        orderBy: {
          created_at: 'desc'
        },
        skip,
        take: limit
      });
      
      // Obtener los detalles de métodos de pago para cada cierre
      const closureHistory = await Promise.all(
        closures.map(async (closure) => {
          // Construir los detalles de métodos de pago a partir de los campos de la base de datos
          let paymentMethodDetails = [
            // Solo incluir métodos con valores mayores que 0
            ...(closure.total_cash > 0 || closure.total_debits > 0 ? [{
              id: 'efectivo',
              name: 'Efectivo',
              credit: closure.total_cash > 0 ? closure.total_cash : 0,
              // Asignamos todos los débitos al efectivo como aproximación
              debit: closure.total_debits > 0 ? closure.total_debits : 0,
              total: (closure.total_cash || 0) - (closure.total_debits || 0)
            }] : []),
            ...(closure.total_yappy > 0 ? [{
              id: 'yappy',
              name: 'Yappy',
              credit: closure.total_yappy > 0 ? closure.total_yappy : 0,
              debit: 0,
              total: closure.total_yappy > 0 ? closure.total_yappy : 0
            }] : []),
            ...(closure.total_card > 0 ? [{
              id: 'tarjeta',
              name: 'Tarjeta',
              credit: closure.total_card > 0 ? closure.total_card : 0,
              debit: 0,
              total: closure.total_card > 0 ? closure.total_card : 0
            }] : []),
            ...(closure.total_bank_transfer > 0 ? [{
              id: 'transferencia',
              name: 'Transferencia Bancaria',
              credit: closure.total_bank_transfer > 0 ? closure.total_bank_transfer : 0,
              debit: 0,
              total: closure.total_bank_transfer > 0 ? closure.total_bank_transfer : 0
            }] : []),
            ...(closure.total_digital_wallet > 0 ? [{
              id: 'billetera-digital',
              name: 'Billetera Digital',
              credit: closure.total_digital_wallet > 0 ? closure.total_digital_wallet : 0,
              debit: 0,
              total: closure.total_digital_wallet > 0 ? closure.total_digital_wallet : 0
            }] : []),
            ...(closure.total_internal_wallet > 0 ? [{
              id: 'billetera-interna',
              name: 'Billetera Interna',
              credit: closure.total_internal_wallet > 0 ? closure.total_internal_wallet : 0,
              debit: 0,
              total: closure.total_internal_wallet > 0 ? closure.total_internal_wallet : 0
            }] : [])
          ];
          
          return {
            id: closure.id,
            createdAt: closure.created_at.toISOString(),
            closedAt: closure.cash_closures.toISOString(),
            totalAmount: closure.final_balance || 0,
            totalCredit: closure.total_credits || 0,
            totalDebit: closure.total_debits || 0,
            paymentMethodDetails,
            closedBy: null
          };
        })
      );
      
      return {
        data: closureHistory,
        meta: {
          total,
          page,
          limit
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener historial de cierres de caja:', error);
      throw error;
    }
  }

  /**
   * Cierra la caja actual
   */
  async closeCashClosure(userId: string) {
    try {
      console.log('🔒 Cerrando caja actual, usuario:', userId);
      
      // 1. Obtener el cierre de caja actual (abierto)
      const currentClosure = await this.prisma.cash_closures.findFirst({
        where: {
          status: 'OPEN'
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      if (!currentClosure) {
        throw new Error('No hay un cierre de caja abierto para cerrar');
      }
      
      // 2. Obtener y calcular los métodos de pago para este cierre
      const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
      
      // Calcular totales
      const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
      const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
      const totalAmount = totalCredit - totalDebit;
      
      // 3. Actualizar el estado del cierre a CLOSED
      const closedClosure = await this.prisma.cash_closures.update({
        where: {
          id: currentClosure.id
        },
        data: {
          status: 'CLOSED',
          cash_closures: new Date(),
          total_credits: totalCredit,
          total_debits: totalDebit,
          final_balance: totalAmount
        }
      });
      
      // 4. Marcar las transacciones como asociadas a este cierre
      console.log('⚠️ No se pueden asociar transacciones al cierre de caja (se requiere migración)');
      
      // No creamos automáticamente un nuevo cierre - se creará bajo demanda cuando sea apropiado
      // Eliminamos: await this.createNewCashClosure();
      
      // 5. Devolver el cierre cerrado con estructura estándar
      return {
        id: closedClosure.id,
        createdAt: closedClosure.created_at.toISOString(),
        closedAt: closedClosure.cash_closures.toISOString(),
        status: 'closed',
        paymentMethods,
        totalAmount,
        totalCredit,
        totalDebit,
        closedBy: null
      };
    } catch (error) {
      console.error('❌ Error al cerrar la caja actual:', error);
      throw error;
    }
  }

  /**
   * Cierra la caja actual de forma automática (programada)
   */
  async automaticCloseCashClosure() {
    try {
      console.log('🔄 Ejecutando cierre automático de caja');
      
      // 1. Obtener el cierre de caja actual (abierto)
      const currentClosure = await this.prisma.cash_closures.findFirst({
        where: {
          status: 'OPEN'
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      if (!currentClosure) {
        console.log('ℹ️ No hay un cierre de caja abierto para cerrar automáticamente');
        return null;
      }
      
      // 2. Obtener y calcular los métodos de pago para este cierre
      const paymentMethods = await this.getPaymentMethodsForClosure(currentClosure.id);
      
      // Calcular totales
      const totalCredit = paymentMethods.reduce((sum, method) => sum + (method?.credit || 0), 0);
      const totalDebit = paymentMethods.reduce((sum, method) => sum + (method?.debit || 0), 0);
      const totalAmount = totalCredit - totalDebit;
      
      // 3. Actualizar el estado del cierre a CLOSED
      const closedClosure = await this.prisma.cash_closures.update({
        where: {
          id: currentClosure.id
        },
        data: {
          status: 'CLOSED',
          cash_closures: new Date(),
          total_credits: totalCredit,
          total_debits: totalDebit,
          final_balance: totalAmount
        }
      });
      
      console.log(`✅ Cierre automático completado. ID: ${closedClosure.id}`);
      
      return {
        id: closedClosure.id,
        createdAt: closedClosure.created_at.toISOString(),
        closedAt: closedClosure.cash_closures.toISOString(),
        status: 'closed',
        paymentMethods,
        totalAmount,
        totalCredit,
        totalDebit,
        closedBy: null
      };
    } catch (error) {
      console.error('❌ Error en cierre automático de caja:', error);
      return null;
    }
  }

  /**
   * Abre una nueva caja de forma automática (programada)
   */
  async automaticOpenCashClosure() {
    try {
      console.log('🔄 Ejecutando apertura automática de caja');
      
      // Verificar si ya existe una caja abierta
      const openClosure = await this.prisma.cash_closures.findFirst({
        where: {
          status: 'OPEN'
        },
        orderBy: {
          created_at: 'desc'
        }
      });
      
      if (openClosure) {
        console.log('ℹ️ Ya existe una caja abierta. No se creará una nueva.');
        return null;
      }
      
      // Crear una nueva caja
      const newClosure = await this.createNewCashClosure();
      console.log(`✅ Apertura automática completada. ID: ${newClosure.id}`);
      
      return newClosure;
    } catch (error) {
      console.error('❌ Error en apertura automática de caja:', error);
      return null;
    }
  }

  /**
   * Método para verificar y gestionar cierres automáticos (llamado por programador de tareas)
   */
  async checkAndProcessAutomaticCashClosure() {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      
      // Comprobación para cierre automático (6:00 PM)
      if (currentHour === 18 && currentMinute >= 0 && currentMinute < 5) {
        console.log('⏰ Hora de cierre automático (6:00 PM)');
        await this.automaticCloseCashClosure();
        return { action: 'close', time: now.toISOString() };
      }
      
      // Comprobación para apertura automática (9:00 AM)
      if (currentHour === 9 && currentMinute >= 0 && currentMinute < 5) {
        console.log('⏰ Hora de apertura automática (9:00 AM)');
        await this.automaticOpenCashClosure();
        return { action: 'open', time: now.toISOString() };
      }
      
      return { action: 'none', time: now.toISOString() };
    } catch (error) {
      console.error('❌ Error en verificación de cierres automáticos:', error);
      return { action: 'error', time: new Date().toISOString(), error: error.message };
    }
  }

  /**
   * Obtiene las transacciones asociadas a un cierre de caja
   */
  async getTransactionsForCashClosure(cashClosureId: string, page = 1, limit = 20) {
    try {
      console.log(`🔍 Obteniendo transacciones para cierre: ${cashClosureId}`);
      
      console.log('⚠️ No se pueden obtener transacciones (se requiere migración)');
      
      return {
        data: [],
        meta: {
          total: 0,
          page,
          limit
        }
      };
    } catch (error) {
      console.error(`❌ Error al obtener transacciones para cierre ${cashClosureId}:`, error);
      throw error;
    }
  }

  /**
   * Método auxiliar para obtener los métodos de pago para un cierre específico
   */
  private async getPaymentMethodsForClosure(cashClosureId: string) {
    try {
      console.log(`🔍 Obteniendo métodos de pago para cierre: ${cashClosureId}`);
      
      // Si estamos consultando el cierre actual, usamos directamente el servicio de transacciones
      const closure = cashClosureId 
        ? await this.prisma.cash_closures.findUnique({ where: { id: cashClosureId } })
        : null;
        
      // Si el cierre está abierto o no se especificó un ID, obtenemos las transacciones del día usando el servicio optimizado
      if (!closure || closure.status === 'OPEN') {
        console.log('📦 Usando servicio de transacciones para obtener datos del período actual');
        
        // Usar el servicio de transacciones para obtener las transacciones del período actual
        const result = await this.transactionsService.getTodayTransactions({
          page: 1,
          limit: 1000 // Un límite alto para obtener todas las transacciones
        });
        
        // Obtener todos los métodos de pago activos
        const paymentMethods = await this.prisma.payment_methods.findMany({
          where: {
            is_active: true
          }
        });
        
        // Inicializar un mapa para agrupar transacciones por método de pago
        const methodsMap = new Map();
        
        // Inicializar todos los métodos de pago con valores cero
        paymentMethods.forEach(method => {
          methodsMap.set(method.id, {
            id: method.id,
            name: method.name,
            credit: 0,
            debit: 0,
            total: 0
          });
        });
        
        // Sección para las transacciones del período actual desde el servicio de transacciones
        // Procesar cada transacción del resultado del servicio y agrupar por método de pago
        result.data.forEach(tx => {
          // Obtener o crear el método de pago en el mapa
          let methodId = 'efectivo'; // ID por defecto
          let methodName = 'Efectivo'; // Nombre por defecto
          let nameFromMetadata = false; // Flag para saber si el nombre viene de los metadatos
          
          // 1. Primera prioridad: metadatos.paymentMethod
          if (tx.metadata && typeof tx.metadata === 'object') {
            // Si hay un paymentMethod en los metadatos, usarlo SIEMPRE como prioridad absoluta
            if ('paymentMethod' in tx.metadata && typeof tx.metadata.paymentMethod === 'string') {
              nameFromMetadata = true; // Marcar que el nombre viene de los metadatos
              
              // Formatear para que sea presentable
              const metaMethodName = tx.metadata.paymentMethod.toString().toLowerCase();
              if (metaMethodName === 'efectivo') {
                // Para efectivo, siempre usar un ID y nombre estándar, ignorando cualquier otro valor
                methodId = 'efectivo';
                methodName = 'Efectivo';
              } else if (metaMethodName === 'tarjeta' || metaMethodName === 'tarjeta-credito' || metaMethodName === 'tarjeta-de-credito') {
                methodName = 'Tarjeta de Crédito';
              } else if (metaMethodName === 'tarjeta-debito' || metaMethodName === 'tarjeta-de-debito') {
                methodName = 'Tarjeta de Débito';
              } else if (metaMethodName === 'transferencia' || metaMethodName === 'transferencia-bancaria') {
                methodName = 'Transferencia Bancaria';
              } else {
                // Capitalizar primera letra de cada palabra
                methodName = metaMethodName.split(' ')
                  .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                  .join(' ');
              }
            }
            
            // Si hay un paymentMethodId en los metadatos, usarlo SOLO si no es efectivo
            if ('paymentMethodId' in tx.metadata && tx.metadata.paymentMethodId && methodId !== 'efectivo') {
              methodId = tx.metadata.paymentMethodId.toString();
            }
          }
          
          // 2. Segunda prioridad: objeto paymentMethod, solo usar si no tenemos datos de metadatos
          if (tx.paymentMethod) {
            // Si el paymentMethod.name es "Pago en Tienda", considerarlo como efectivo
            if (tx.paymentMethod.name === "Pago en Tienda") {
              methodId = 'efectivo';
              methodName = 'Efectivo';
            }
            // Si no teníamos un ID desde los metadatos y NO es efectivo, usar el del objeto
            else if (methodId !== 'efectivo' && tx.paymentMethod.id) {
              methodId = tx.paymentMethod.id;
            }
            
            // Solo sobreescribir el nombre si NO lo obtuvimos de los metadatos y NO es efectivo
            if (!nameFromMetadata && methodId !== 'efectivo' && methodName !== 'Efectivo' && tx.paymentMethod.name) {
              methodName = tx.paymentMethod.name;
            }
          }
          
          // Crear un ID único si no tenemos uno
          if (methodId === 'efectivo' && methodName !== 'Efectivo') {
            methodId = `other-${methodName.toLowerCase().replace(/\s+/g, '-')}`;
          }
          
          // Determinar si es ingreso o egreso usando los detalles del tipo de transacción
          let isCredit = false;
          
          // 1. Primero verificar por el campo affectsBalance (criterio prioritario)
          if (tx.transactionTypeDetails?.affectsBalance) {
            isCredit = tx.transactionTypeDetails.affectsBalance === 'credit';
          } 
          // 2. Si no está disponible, intentar inferir por la categoría
          else if (tx.category?.name) {
            const categoryName = tx.category.name.toLowerCase();
            if (categoryName.includes('gasto') || categoryName.includes('egreso')) {
              isCredit = false;
            } else if (categoryName.includes('ingreso')) {
              isCredit = true;
            } else {
              // 3. Si no podemos inferir por categoría, usar el monto
              isCredit = (tx.amount !== null && Number(tx.amount) > 0);
            }
          } 
          // 4. Como último recurso, usar el monto
          else {
            isCredit = (tx.amount !== null && Number(tx.amount) > 0);
          }
                              
          // Obtener el monto (siempre positivo para los cálculos)
          const amount = tx.amount !== null ? Math.abs(Number(tx.amount)) : 0;
          
          // Actualizar los montos para este método de pago
          const methodData = methodsMap.get(methodId);
          if (methodData) {
            if (isCredit) {
              methodData.credit += amount;
            } else {
              methodData.debit += amount;
            }
            methodData.total = methodData.credit - methodData.debit;
          } else {
            // Si no existe el método en el mapa, crearlo con valores iniciales
            const newMethodData = {
              id: methodId,
              name: methodName,
              credit: isCredit ? amount : 0,
              debit: isCredit ? 0 : amount,
              total: isCredit ? amount : -amount
            };
            methodsMap.set(methodId, newMethodData);
          }
        });
        
        // Convertir el mapa en un array y filtrar solo métodos con actividad
        const methodTotals = Array.from(methodsMap.values())
          .filter(method => method.credit > 0 || method.debit > 0);
          
        console.log(`✅ Resumen de métodos de pago generado: ${methodTotals.length} métodos con actividad`);
        return methodTotals;
      } 
      
      // Para cierres históricos cerrados, usamos la lógica existente
      // Obtener el cierre de caja para determinar el período
      const now = new Date();
      const CUTOFF_HOUR = 18; // 6:00 PM
      const cutoffTimeUTC = 23; // 18:00 en Panamá es 23:00 en UTC
      
      // Crear fechas base para determinar el rango
      const todayUTC = new Date(now);
      todayUTC.setUTCHours(0, 0, 0, 0);
      
      const yesterdayUTC = new Date(todayUTC);
      yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
      
      // Si hay un cierre específico, usar su rango de fechas
      let startDateUTC = closure.created_at;
      let endDateUTC = closure.cash_closures || now;
      
      console.log(`🗓️ Buscando transacciones entre ${startDateUTC.toISOString()} y ${endDateUTC.toISOString()}`);
      
      // Obtener todas las transacciones en este período
      const transactions = await this.prisma.transactions.findMany({
        where: {
          transaction_date: {
            gte: startDateUTC,
            lt: endDateUTC
          }
        },
        include: {
          payment_methods: true,
          transaction_types: true
        }
      });
      
      console.log(`🧾 Encontradas ${transactions.length} transacciones en el período`);
      
      // Obtener todos los métodos de pago activos
      const paymentMethods = await this.prisma.payment_methods.findMany({
        where: {
          is_active: true
        }
      });
      
      // Inicializar un mapa para agrupar transacciones por método de pago
      const methodsMap = new Map();
      
      // Inicializar todos los métodos de pago con valores cero
      paymentMethods.forEach(method => {
        methodsMap.set(method.id, {
          id: method.id,
          name: method.name,
          credit: 0,
          debit: 0,
          total: 0
        });
      });
      
      // Sección para transacciones históricas de Prisma
      // Procesar cada transacción y agrupar por método de pago
      transactions.forEach(tx => {
        // Obtener o crear el método de pago en el mapa
        let methodId = 'efectivo'; // ID por defecto
        let methodName = 'Efectivo'; // Nombre por defecto
        let nameFromMetadata = false; // Flag para saber si el nombre viene de los metadatos
        
        // 1. Primera prioridad: metadatos.paymentMethod
        if (tx.metadata && typeof tx.metadata === 'object') {
          // Si hay un paymentMethod en los metadatos, usarlo SIEMPRE como prioridad absoluta
          if ('paymentMethod' in tx.metadata && typeof tx.metadata.paymentMethod === 'string') {
            nameFromMetadata = true; // Marcar que el nombre viene de los metadatos
            
            // Formatear para que sea presentable
            const metaMethodName = tx.metadata.paymentMethod.toString().toLowerCase();
            if (metaMethodName === 'efectivo') {
              // Para efectivo, siempre usar un ID y nombre estándar, ignorando cualquier otro valor
              methodId = 'efectivo';
              methodName = 'Efectivo';
            } else if (metaMethodName === 'tarjeta' || metaMethodName === 'tarjeta-credito' || metaMethodName === 'tarjeta-de-credito') {
              methodName = 'Tarjeta de Crédito';
            } else if (metaMethodName === 'tarjeta-debito' || metaMethodName === 'tarjeta-de-debito') {
              methodName = 'Tarjeta de Débito';
            } else if (metaMethodName === 'transferencia' || metaMethodName === 'transferencia-bancaria') {
              methodName = 'Transferencia Bancaria';
            } else {
              // Capitalizar primera letra de cada palabra
              methodName = metaMethodName.split(' ')
                .map(word => word.charAt(0).toUpperCase() + word.slice(1))
                .join(' ');
            }
          }
          
          // Si hay un paymentMethodId en los metadatos, usarlo SOLO si no es efectivo
          if ('paymentMethodId' in tx.metadata && tx.metadata.paymentMethodId && methodId !== 'efectivo') {
            methodId = tx.metadata.paymentMethodId.toString();
          }
        }
        
        // 2. Segunda prioridad: objeto payment_methods desde Prisma
        if (tx.payment_methods) {
          // Si el payment_methods.name es "Pago en Tienda", considerarlo como efectivo
          if (tx.payment_methods.name === "Pago en Tienda") {
            methodId = 'efectivo';
            methodName = 'Efectivo';
          }
          // Si no teníamos un ID desde los metadatos y NO es efectivo, usar el del objeto
          else if (methodId !== 'efectivo' && tx.payment_methods.id) {
            methodId = tx.payment_methods.id;
          }
          
          // Solo sobreescribir el nombre si NO lo obtuvimos de los metadatos y NO es efectivo
          if (!nameFromMetadata && methodId !== 'efectivo' && methodName !== 'Efectivo' && tx.payment_methods.name) {
            methodName = tx.payment_methods.name;
          }
        }
        
        // Crear un ID único si no tenemos uno
        if (methodId === 'efectivo' && methodName !== 'Efectivo') {
          methodId = `other-${methodName.toLowerCase().replace(/\s+/g, '-')}`;
        }
        
        // Determinar si es ingreso o egreso usando los detalles del tipo de transacción
        let isCredit = false;
        
        // 1. Primero verificar por el campo affects_balance (criterio prioritario)
        if (tx.transaction_types?.affects_balance) {
          isCredit = tx.transaction_types.affects_balance === 'credit';
        } 
        // 2. Si no está disponible, buscar en los metadatos
        else if (tx.metadata && typeof tx.metadata === 'object') {
          // Intentar buscar alguna indicación en los metadatos
          if ('transactionType' in tx.metadata && typeof tx.metadata.transactionType === 'string') {
            const txType = tx.metadata.transactionType.toLowerCase();
            if (txType.includes('ingreso') || txType.includes('credit')) {
              isCredit = true;
            } else if (txType.includes('egreso') || txType.includes('debit') || txType.includes('gasto')) {
              isCredit = false;
            } else {
              // Si no encontramos indicación clara, usar el monto
              isCredit = (tx.amount !== null && Number(tx.amount) > 0);
            }
          } else {
            // Si no hay información de tipo, usar el monto
            isCredit = (tx.amount !== null && Number(tx.amount) > 0);
          }
        } 
        // 3. Como último recurso, usar el monto
        else {
          isCredit = (tx.amount !== null && Number(tx.amount) > 0);
        }
                              
        // Obtener el monto (siempre positivo para los cálculos)
        const amount = tx.amount !== null ? Math.abs(Number(tx.amount)) : 0;
        
        // Actualizar los montos para este método de pago
        const methodData = methodsMap.get(methodId);
        if (methodData) {
          if (isCredit) {
            methodData.credit += amount;
          } else {
            methodData.debit += amount;
          }
          methodData.total = methodData.credit - methodData.debit;
        } else {
          // Si no existe el método en el mapa, crearlo con valores iniciales
          const newMethodData = {
            id: methodId,
            name: methodName,
            credit: isCredit ? amount : 0,
            debit: isCredit ? 0 : amount,
            total: isCredit ? amount : -amount
          };
          methodsMap.set(methodId, newMethodData);
        }
      });
      
      // Convertir el mapa en un array y filtrar solo métodos con actividad
      const methodTotals = Array.from(methodsMap.values())
        .filter(method => method.credit > 0 || method.debit > 0);
      
      return methodTotals;
    } catch (error) {
      console.error('❌ Error al obtener métodos de pago para cierre:', error);
      // En caso de error, devolver una lista vacía para evitar fallos
      return [];
    }
  }
} 