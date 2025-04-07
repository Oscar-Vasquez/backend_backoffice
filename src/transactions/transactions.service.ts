import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TransactionsService {
  constructor(private readonly prisma: PrismaService) {
    console.log('🚀 TransactionsService inicializado');
  }

  /**
   * Crea una nueva transacción
   */
  async createTransaction(data: {
    description: string;
    status: string;
    transactionType: string;
    entityType: string;
    entityId: string;
    referenceId?: string;
    paymentMethodId?: string;
    metadata?: Record<string, any>;
    amount?: number;
    categoryId?: string;
    transactionTypeId?: string;
  }) {
    try {
      console.log('🔄 Creando nueva transacción:', data);

      // Asegurarse de que el monto se almacene correctamente como Decimal en la base de datos
      const transaction = await this.prisma.transactions.create({
        data: {
          description: data.description,
          status: data.status,
          transaction_type: data.transactionType,
          entity_type: data.entityType,
          entity_id: data.entityId,
          reference_id: data.referenceId,
          payment_method_id: data.paymentMethodId,
          metadata: data.metadata || {},
          amount: data.amount !== undefined ? data.amount : null,
          category_id: data.categoryId,
          transaction_type_id: data.transactionTypeId,
          transaction_date: new Date()
        },
      });

      console.log('✅ Transacción creada:', transaction.id);
      
      // Devolver la transacción con el monto convertido a número
      return {
        ...transaction,
        amount: transaction.amount !== null ? Number(transaction.amount) : null
      };
    } catch (error) {
      console.error('❌ Error al crear transacción:', error);
      throw error;
    }
  }

  /**
   * Obtiene los tipos de transacción disponibles
   */
  async getTransactionTypes() {
    try {
      const types = await this.prisma.transaction_types.findMany({
        where: {
          is_active: true
        }
      });
      return types;
    } catch (error) {
      console.error('❌ Error al obtener tipos de transacción:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de una transacción
   */
  async updateTransactionStatus(transactionId: string, status: string) {
    try {
      const transaction = await this.prisma.transactions.update({
        where: { id: transactionId },
        data: { status }
      });
      return transaction;
    } catch (error) {
      console.error(`❌ Error al actualizar estado de transacción ${transactionId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene las transacciones relacionadas con una entidad
   */
  async getTransactionsByEntity(entityType: string, entityId: string) {
    try {
      const transactions = await this.prisma.transactions.findMany({
        where: {
          entity_type: entityType,
          entity_id: entityId
        },
        orderBy: {
          transaction_date: 'desc'
        },
        include: {
          payment_methods: true,
          transaction_categories: true,
          transaction_types: true,
        }
      });
      
      // Convertir Decimal a Number para evitar problemas de tipo
      return transactions.map(tx => ({
        ...tx,
        amount: tx.amount !== null ? Number(tx.amount) : null
      }));
    } catch (error) {
      console.error(`❌ Error al obtener transacciones para ${entityType} ${entityId}:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todas las transacciones del período actual del cierre de caja
   * usando la hora de corte personalizada (6:00 PM), usando la zona horaria de América/Panamá
   */
  async getTodayTransactions(params: {
    page?: number;
    limit?: number;
  } = {}) {
    try {
      console.log('🔍 Obteniendo transacciones del período actual del cierre');
      
      const page = params.page || 1;
      const limit = params.limit || 50;
      const skip = (page - 1) * limit;
      
      // Definir la hora de corte (6:00 PM)
      const CUTOFF_HOUR = 18; // 6:00 PM
      const CUTOFF_MINUTE = 0;
      const CUTOFF_SECOND = 0;
      const TIMEZONE = 'America/Panama';

      // Obtener la fecha/hora actual en UTC
      const nowUTC = new Date();
      console.log(`⏰ Hora actual en UTC: ${nowUTC.toISOString()}`);

      // Calcular el offset entre UTC y America/Panama (UTC-5)
      const panamaOffsetHours = -5;
      const panamaOffsetMs = panamaOffsetHours * 60 * 60 * 1000;
      
      // Convertir la hora actual a la zona horaria de Panamá
      const nowPanama = new Date(nowUTC.getTime() + panamaOffsetMs);
      console.log(`⏰ Hora actual en ${TIMEZONE} (aproximada): ${nowPanama.toISOString()}`);
      
      // Determinar si la hora actual en Panamá es antes o después de la hora de corte
      const currentHourPanama = nowPanama.getHours();
      const currentMinutePanama = nowPanama.getMinutes();
      
      const isAfterCutoff = currentHourPanama > CUTOFF_HOUR || 
        (currentHourPanama === CUTOFF_HOUR && currentMinutePanama >= CUTOFF_MINUTE);
      
      console.log(`🕒 La hora actual en ${TIMEZONE} es ${isAfterCutoff ? 'posterior' : 'anterior'} a la hora de corte (${CUTOFF_HOUR}:${CUTOFF_MINUTE})`);
      console.log(`🕒 Hora en Panamá: ${currentHourPanama}:${currentMinutePanama}`);
      
      // Crear fechas base en UTC para hoy, ayer y mañana (al inicio del día)
      const todayUTC = new Date(nowUTC);
      todayUTC.setUTCHours(0, 0, 0, 0);
      
      const yesterdayUTC = new Date(todayUTC);
      yesterdayUTC.setUTCDate(yesterdayUTC.getUTCDate() - 1);
      
      const tomorrowUTC = new Date(todayUTC);
      tomorrowUTC.setUTCDate(tomorrowUTC.getUTCDate() + 1);
      
      // Calcular la hora de corte en UTC para distintos días
      // La hora de corte 18:00 en Panamá (UTC-5) es 23:00 en UTC
      const cutoffTimeUTC = 23; // 18:00 en Panamá es 23:00 en UTC
      
      let startDateUTC: Date;
      let endDateUTC: Date;
      
      if (isAfterCutoff) {
        // Si estamos después de la hora de corte, el período va desde hoy a la hora de corte hasta mañana a la hora de corte
        startDateUTC = new Date(todayUTC);
        startDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
        
        endDateUTC = new Date(tomorrowUTC);
        endDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
      } else {
        // Si estamos antes de la hora de corte, el período va desde ayer a la hora de corte hasta hoy a la hora de corte
        startDateUTC = new Date(yesterdayUTC);
        startDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
        
        endDateUTC = new Date(todayUTC);
        endDateUTC.setUTCHours(cutoffTimeUTC, 0, 0, 0);
      }
      
      console.log(`🗓️ Buscando transacciones entre ${startDateUTC.toISOString()} y ${endDateUTC.toISOString()}`);
      console.log(`⏰ Hora de corte configurada: ${CUTOFF_HOUR}:${CUTOFF_MINUTE.toString().padStart(2, '0')} ${TIMEZONE}`);
      console.log(`⏰ Hora de corte en UTC: ${cutoffTimeUTC}:00`);
      
      // Verificar la transacción específica que mencionó el usuario
      const testTransaction = '2025-03-27T23:31:08.903Z'; // 18:31 hora de Panamá del día 27
      const testDate = new Date(testTransaction);
      console.log(`📅 Fecha de prueba (UTC): ${testDate.toISOString()}`);
      console.log(`📅 Fecha de prueba (${TIMEZONE} aprox): ${new Date(testDate.getTime() + panamaOffsetMs).toISOString()}`);
      console.log(`🔍 Fecha de prueba ${startDateUTC <= testDate && testDate < endDateUTC ? 'ESTÁ' : 'NO está'} en el rango actual`);
      
      // Contar total de transacciones en el período
      const total = await this.prisma.transactions.count({
        where: {
          transaction_date: {
            gte: startDateUTC,
            lt: endDateUTC
          }
        }
      });
      
      // Buscar transacciones con paginación
      const transactions = await this.prisma.transactions.findMany({
        where: {
          transaction_date: {
            gte: startDateUTC,
            lt: endDateUTC
          }
        },
        orderBy: {
          transaction_date: 'desc'
        },
        skip,
        take: limit,
        include: {
          payment_methods: true,
          transaction_categories: true,
          transaction_types: true,
        }
      });
      
      console.log(`✅ Encontradas ${transactions.length} transacciones en el período actual (total: ${total})`);
      
      // Si no encontramos transacciones o estamos debuggeando, buscar transacciones recientes
      if (transactions.length === 0 || true) { // Siempre buscar transacciones recientes para depuración
        console.log('🔍 Realizando búsqueda más amplia para depuración...');
        const allRecentTx = await this.prisma.transactions.findMany({
          where: {
            transaction_date: {
              gte: new Date(new Date().setDate(new Date().getDate() - 7)) // Últimos 7 días
            }
          },
          orderBy: {
            transaction_date: 'desc'
          },
          take: 5
        });
        
        if (allRecentTx.length > 0) {
          console.log('🔍 Encontradas algunas transacciones recientes:');
          allRecentTx.forEach(tx => {
            const txUTC = tx.transaction_date?.toISOString() || 'N/A';
            const txPanama = tx.transaction_date ? 
              new Date(tx.transaction_date.getTime() + panamaOffsetMs).toISOString() : 'N/A';
            
            // Formatear fecha para mejor legibilidad
            const formatDateLocale = (date: Date) => {
              return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()}, ${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}:${date.getUTCSeconds().toString().padStart(2, '0')}`;
            };
            
            const panamaTxDate = tx.transaction_date ? 
              formatDateLocale(new Date(tx.transaction_date.getTime() + panamaOffsetMs)) : 'N/A';
            
            console.log(`- ID: ${tx.id}, Fecha (UTC): ${txUTC}, Fecha (${TIMEZONE}): ${panamaTxDate}, Descripción: ${tx.description}`);
            console.log(`  ¿En rango de cierre?: ${startDateUTC <= tx.transaction_date && tx.transaction_date < endDateUTC ? 'SÍ' : 'NO'}`);
          });
        } else {
          console.log('❌ No se encontraron transacciones recientes');
        }
      }
      
      // Transformar los datos para el frontend
      const formattedTransactions = transactions.map(tx => {
        // Convertir a fecha de Panamá para mostrar en frontend
        const txDate = tx.transaction_date;
        const txDatePanama = new Date(txDate.getTime() + panamaOffsetMs);
        
        // Formato amigable para la fecha local
        const formatDateForDisplay = (date: Date) => {
          return `${date.getUTCMonth() + 1}/${date.getUTCDate()}/${date.getUTCFullYear()} ${date.getUTCHours()}:${date.getUTCMinutes().toString().padStart(2, '0')}`;
        };
        
        const txDateLocalFormatted = formatDateForDisplay(txDatePanama);
        
        return {
          id: tx.id,
          description: tx.description,
          status: tx.status,
          transactionDate: txDate,
          transactionDateLocal: txDateLocalFormatted,
          transactionType: tx.transaction_type,
          entityType: tx.entity_type,
          entityId: tx.entity_id,
          amount: tx.amount !== null ? Number(tx.amount) : undefined,
          paymentMethod: tx.payment_methods ? {
            id: tx.payment_methods.id,
            name: tx.payment_methods.name
          } : null,
          category: tx.transaction_categories ? {
            id: tx.transaction_categories.id,
            name: tx.transaction_categories.name
          } : null,
          transactionTypeDetails: tx.transaction_types ? {
            id: tx.transaction_types.id,
            name: tx.transaction_types.name,
            affectsBalance: tx.transaction_types.affects_balance
          } : null,
          metadata: tx.metadata
        };
      });
      
      // Calcular totales para el resumen
      const summary = {
        totalCredit: formattedTransactions
          .filter(tx => (tx.amount !== undefined && tx.amount > 0) || 
                  (tx.transactionTypeDetails && tx.transactionTypeDetails.affectsBalance === 'credit'))
          .reduce((sum, tx) => sum + (tx.amount !== undefined ? tx.amount : 0), 0),
        totalDebit: formattedTransactions
          .filter(tx => (tx.amount !== undefined && tx.amount < 0) || 
                  (tx.transactionTypeDetails && tx.transactionTypeDetails.affectsBalance === 'debit'))
          .reduce((sum, tx) => sum + (tx.amount !== undefined ? Math.abs(tx.amount) : 0), 0),
      };
      
      // Formatear el período para el frontend
      const formatPeriodDate = (date: Date) => {
        const localDate = new Date(date.getTime() + panamaOffsetMs);
        return `${localDate.getUTCMonth() + 1}/${localDate.getUTCDate()}/${localDate.getUTCFullYear()} ${localDate.getUTCHours()}:${localDate.getUTCMinutes().toString().padStart(2, '0')}`;
      };
      
      const startDateFormatted = formatPeriodDate(startDateUTC);
      const endDateFormatted = formatPeriodDate(endDateUTC);
      const periodLabel = `${startDateFormatted} - ${endDateFormatted}`;
      
      // Formatear la fecha actual para el frontend
      const today = new Date(nowUTC.getTime() + panamaOffsetMs);
      const formattedToday = `${today.getUTCFullYear()}-${(today.getUTCMonth() + 1).toString().padStart(2, '0')}-${today.getUTCDate().toString().padStart(2, '0')}`;
      
      return {
        data: formattedTransactions,
        meta: {
          total,
          page,
          limit,
          date: formattedToday,
          period: periodLabel,
          cutoffTime: `${CUTOFF_HOUR}:${CUTOFF_MINUTE.toString().padStart(2, '0')}`,
          timezone: TIMEZONE,
          summary
        }
      };
    } catch (error) {
      console.error('❌ Error al obtener transacciones del período:', error);
      throw error;
    }
  }

  /**
   * Obtiene las transacciones filtradas por categoría
   */
  async getTransactionsByCategory(categoryId: string, options: { 
    page?: number; 
    limit?: number;
    transactionType?: string;
  } = {}) {
    try {
      console.log(`🔍 Buscando transacciones con categoría: ${categoryId}`);
      
      const page = options.page || 1;
      const limit = options.limit || 50;
      const skip = (page - 1) * limit;
      
      // Construir el filtro básico
      const filter: any = {
        category_id: categoryId
      };
      
      // Si se proporciona un tipo de transacción, agregar al filtro
      if (options.transactionType) {
        filter.transaction_type = options.transactionType;
        console.log(`🔍 Filtrando por tipo de transacción: ${options.transactionType}`);
      }
      
      // Contar total de transacciones que cumplen el criterio
      const total = await this.prisma.transactions.count({
        where: filter
      });
      
      // Buscar transacciones con paginación
      const transactions = await this.prisma.transactions.findMany({
        where: filter,
        orderBy: {
          transaction_date: 'desc'
        },
        skip,
        take: limit,
        include: {
          payment_methods: true,
          transaction_categories: true,
          transaction_types: true,
        }
      });
      
      console.log(`✅ Encontradas ${transactions.length} transacciones con la categoría ${categoryId} (total: ${total})`);
      
      // Convertir Decimal a Number para evitar problemas de tipo
      const formattedTransactions = transactions.map(tx => ({
        ...tx,
        amount: tx.amount !== null ? Number(tx.amount) : null
      }));

      return {
        data: formattedTransactions,
        meta: {
          total,
          page,
          limit,
          category: transactions.length > 0 ? transactions[0].transaction_categories?.name || 'Desconocida' : 'Desconocida'
        }
      };
    } catch (error) {
      console.error(`❌ Error al obtener transacciones por categoría ${categoryId}:`, error);
      throw error;
    }
  }
} 