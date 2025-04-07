import { Injectable, NotFoundException, ConflictException, Logger, InternalServerErrorException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { OperatorsCacheService } from './operators-cache.service';
import * as bcrypt from 'bcrypt';
import { CreateOperatorDto } from './dto/create-operator.dto';
import { UpdateOperatorDto } from './dto/update-operator.dto';
import { Operator, EmergencyContact } from './types';
import { v4 as uuidv4 } from 'uuid';
import { ActivityType, ActivityStatus, OperatorActivityDto, ActivityAction } from './dto/operator-activity.dto';
import { operators, activities, activity_type_enum, activity_status_enum, operator_role_enum, operator_status_enum, Prisma } from '@prisma/client';

@Injectable()
export class OperatorsService {
  private readonly logger = new Logger(OperatorsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly cache: OperatorsCacheService
  ) {}

  private mapOperatorData(operator: operators & { branches?: any, operator_types?: any }): Operator {
    return {
      operatorId: operator.id,
      email: operator.email,
      firstName: operator.first_name,
      lastName: operator.last_name,
      phone: operator.phone || '',
      role: operator.role,
      status: operator.status,
      photo: operator.photo || null,
      branchReference: operator.branch_id || null,
      branchName: operator.branches?.name || null,
      branchAddress: operator.branches?.address || null,
      branchProvince: operator.branches?.province || null,
      branchCity: operator.branches?.city || null,
      type_operator_id: operator.type_operator_id || null,
      typeOperatorName: operator.operator_types?.name || null,
      createdAt: operator.created_at,
      updatedAt: operator.updated_at || null,
      lastLoginAt: operator.last_login_at || null,
      hire_date: operator.hire_date || null,
      birth_date: operator.birth_date || null,
      emergency_contact: this.parseEmergencyContact(operator.emergency_contact),
      skills: operator.skills || [],
      personal_id: operator.personal_id || null,
      address: operator.address || null
    };
  }

  private parseEmergencyContact(contact: any): EmergencyContact | null {
    if (!contact) return null;
    
    try {
      // Si ya es un objeto con la estructura correcta
      if (typeof contact === 'object' && contact.name && contact.phone) {
        return contact as EmergencyContact;
      }
      
      // Si es una cadena JSON, intentar parsearla
      if (typeof contact === 'string') {
        const parsed = JSON.parse(contact);
        if (parsed && typeof parsed === 'object' && parsed.name && parsed.phone) {
          return parsed as EmergencyContact;
        }
      }
      
      // Si llegamos aquí, el formato no es el esperado
      this.logger.warn(`Formato inesperado de emergency_contact: ${JSON.stringify(contact)}`);
      return null;
    } catch (error) {
      this.logger.error(`Error al parsear emergency_contact: ${error.message}`, error.stack);
      return null;
    }
  }

  async findAll(page = 1, limit = 20, filters?: { status?: string, role?: string, branchId?: string, search?: string }): Promise<{ operators: Operator[], total: number }> {
    // Generar clave de caché basada en los parámetros
    const cacheKey = this.cache.getOperatorsListCacheKey(page, limit, filters);
    
    // Verificar si los resultados están en caché
    const cachedResult = this.cache.get<{ operators: Operator[], total: number }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Construir condiciones de búsqueda
      const where: any = {};
      
      if (filters) {
        if (filters.status) {
          where.status = filters.status;
        }
        
        if (filters.role) {
          where.role = filters.role;
        }
        
        if (filters.branchId) {
          where.branch_id = filters.branchId;
        }
        
        // Optimizar búsqueda de texto - Usar índices de texto si están disponibles
        if (filters.search && filters.search.trim()) {
          const search = filters.search.trim();
          
          // Usar SQL nativo para búsquedas de texto para mejor rendimiento
          if (search.length > 3) {
            // Para búsquedas más largas, usar SQL nativo con índices de texto
            const searchResults = await this.prisma.$queryRaw`
              SELECT o.id 
              FROM operators o
              WHERE o.first_name ILIKE ${`%${search}%`} 
                 OR o.last_name ILIKE ${`%${search}%`}
                 OR o.email ILIKE ${`%${search}%`}
              LIMIT 100
            `;
            
            // Extraer IDs de los resultados
            const ids = (searchResults as any[]).map(r => r.id);
            
            if (ids.length > 0) {
              where.id = { in: ids };
            } else {
              // Si no hay resultados, devolver rápidamente
              const result = { operators: [], total: 0 };
              this.cache.set(cacheKey, result);
              return result;
            }
          } else {
            // Para búsquedas cortas, usar Prisma
            where.OR = [
              { first_name: { contains: search, mode: 'insensitive' } },
              { last_name: { contains: search, mode: 'insensitive' } },
              { email: { contains: search, mode: 'insensitive' } }
            ];
          }
        }
      }
      
      // Optimización: Si no hay filtros, intentar usar una lista precargada
      if (!filters || Object.keys(filters).length === 0) {
        const allOperatorsKey = this.cache.getOperatorsListCacheKey(1, 1000, {});
        const allCachedOperators = this.cache.get<{ operators: Operator[], total: number }>(allOperatorsKey);
        
        if (allCachedOperators) {
          // Aplicar paginación en memoria
          const start = (page - 1) * limit;
          const end = start + limit;
          const paginatedOperators = allCachedOperators.operators.slice(start, end);
          
          const result = { 
            operators: paginatedOperators, 
            total: allCachedOperators.total 
          };
          
          // Guardar en caché para esta consulta específica
          this.cache.set(cacheKey, result);
          
          return result;
        }
      }
      
      // Ejecutar consultas en paralelo para mejorar rendimiento
      const [total, operators] = await Promise.all([
        // Consulta de conteo
        this.prisma.operators.count({ where }),
        
        // Consulta principal (optimizada usando select en lugar de include)
        this.prisma.operators.findMany({
          where,
          select: {
            id: true,
            email: true,
            first_name: true,
            last_name: true,
            phone: true,
            role: true,
            status: true,
            photo: true,
            branch_id: true,
            type_operator_id: true,
            created_at: true,
            updated_at: true,
            last_login_at: true,
            branches: {
              select: {
                id: true,
                name: true,
                address: true,
                province: true,
                city: true
              }
            }
          },
          orderBy: {
            created_at: 'desc'
          },
          skip: (page - 1) * limit,
          take: limit
        })
      ]);
      
      // Si no hay resultados, devolver rápidamente
      if (total === 0) {
        const result = { operators: [], total: 0 };
        this.cache.set(cacheKey, result);
        return result;
      }
      
      // Mapear resultados al formato esperado
      const mappedOperators = operators.map(operator => this.mapOperatorData(operator as any));
      
      const result = { operators: mappedOperators, total };
      
      // Guardar en caché para futuras consultas - TTL más largo para resultados frecuentes
      const isCommonQuery = !filters || Object.keys(filters).length === 0 || 
                           (filters.status === 'active' && !filters.search);
      
      this.cache.set(cacheKey, result, isCommonQuery ? 60 * 60 * 1000 : undefined); // 1 hora para consultas comunes
      
      return result;
    } catch (error) {
      this.logger.error(`Error al buscar operadores: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al buscar operadores');
    }
  }

  async findOne(operatorId: string, forceRefresh: boolean = false): Promise<Operator> {
    // Verificar si el operador está en caché
    const cacheKey = this.cache.getOperatorCacheKey(operatorId);
    const cachedOperator = forceRefresh ? null : this.cache.get<Operator>(cacheKey);
    
    if (cachedOperator) {
      this.logger.debug(`Operador ${operatorId} obtenido desde caché`);
      return cachedOperator;
    }
    
    try {
      this.logger.debug(`Buscando operador con ID: ${operatorId}`);
      const startTime = Date.now();
      
      // Consulta optimizada usando select en lugar de include
      const operator = await this.prisma.operators.findUnique({
        where: { id: operatorId },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          status: true,
          photo: true,
          branch_id: true,
          type_operator_id: true,
          hire_date: true,
          birth_date: true,
          emergency_contact: true,
          skills: true,
          personal_id: true,
          address: true,
          created_at: true,
          updated_at: true,
          last_login_at: true,
          branches: {
            select: {
              id: true,
              name: true,
              address: true,
              province: true,
              city: true
            }
          }
        }
      });
      
      if (!operator) {
        this.logger.warn(`Operador no encontrado: ${operatorId}`);
        throw new NotFoundException(`Operador con ID ${operatorId} no encontrado`);
      }
      
      // Mapear operador al formato esperado
      const mappedOperator = this.mapOperatorData(operator as any);
      
      // Imprimir datos para depuración - enfocado en emergency_contact
      this.logger.debug(`Datos de emergency_contact: ${JSON.stringify(operator.emergency_contact)}`);
      this.logger.debug(`Tipo de emergency_contact: ${typeof operator.emergency_contact}`);
      
      // Guardar en caché para futuras consultas
      this.cache.set(cacheKey, mappedOperator);
      
      const queryTime = Date.now() - startTime;
      this.logger.debug(`Operador obtenido en ${queryTime}ms`);
      
      return mappedOperator;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al buscar operador ${operatorId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al buscar el operador');
    }
  }

  async create(createOperatorDto: CreateOperatorDto): Promise<Operator> {
    try {
      this.logger.debug(`Creando nuevo operador: ${createOperatorDto.email}`);
      const startTime = Date.now();
      
      // Verificar si ya existe un operador con el mismo email
      const existingOperator = await this.prisma.operators.findUnique({
        where: { email: createOperatorDto.email },
        select: { id: true }
      });
      
      if (existingOperator) {
        throw new ConflictException(`Ya existe un operador con el email ${createOperatorDto.email}`);
      }
      
      // Generar hash de la contraseña
      const hashedPassword = await bcrypt.hash(createOperatorDto.password, 10);
      
      // Crear operador en la base de datos
      const newOperator = await this.prisma.operators.create({
        data: {
          email: createOperatorDto.email,
          password: hashedPassword,
          first_name: createOperatorDto.firstName,
          last_name: createOperatorDto.lastName,
          phone: createOperatorDto.phone,
          role: createOperatorDto.role as any,
          status: createOperatorDto.status as any || 'active',
          photo: createOperatorDto.photo || '',
          branch_id: createOperatorDto.branch_id,
          type_operator_id: createOperatorDto.type_operator_id,
          birth_date: createOperatorDto.birth_date ? new Date(createOperatorDto.birth_date) : null,
          hire_date: createOperatorDto.hire_date ? new Date(createOperatorDto.hire_date) : null,
          personal_id: createOperatorDto.personal_id,
          address: createOperatorDto.address,
          emergency_contact: createOperatorDto.emergency_contact ? createOperatorDto.emergency_contact as any : null,
          skills: createOperatorDto.skills || []
        },
        select: {
          id: true,
          email: true,
          first_name: true,
          last_name: true,
          phone: true,
          role: true,
          status: true,
          photo: true,
          branch_id: true,
          type_operator_id: true,
          created_at: true,
          updated_at: true,
          birth_date: true,
          personal_id: true,
          emergency_contact: true,
          address: true,
          last_login_at: true,
          branches: {
            select: {
              id: true,
              name: true,
              address: true,
              province: true,
              city: true
            }
          }
        }
      });
      
      // Mapear operador al formato esperado
      const mappedOperator = this.mapOperatorData(newOperator as any);
      
      // Guardar en caché
      const cacheKey = this.cache.getOperatorCacheKey(newOperator.id);
      this.cache.set(cacheKey, mappedOperator);
      
      // Invalidar caché de listas
      this.cache.invalidatePattern('operators:list:*');
      
      const createTime = Date.now() - startTime;
      this.logger.debug(`Operador creado en ${createTime}ms: ${newOperator.id}`);
      
      return mappedOperator;
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(`Error al crear operador: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al crear el operador');
    }
  }

  async update(operatorId: string, updateOperatorDto: UpdateOperatorDto): Promise<Operator> {
    try {
      this.logger.log(`Intentando actualizar operador ${operatorId} con datos:`, updateOperatorDto);
      
      // Verificar si hay una entrada en caché y renovarla si es necesario
      this.cache.verifyAndRenewOperatorCache(operatorId);
      
      return await this.prisma.$transaction(async (prisma) => {
        const existingOperator = await prisma.operators.findUnique({
          where: { id: operatorId },
          select: { 
            id: true, 
            role: true, 
            status: true, 
            photo: true,
            birth_date: true,
            personal_id: true,
            emergency_contact: true,
            address: true
          }
        });
        
        if (!existingOperator) {
          throw new NotFoundException('Operador no encontrado');
        }
        
        this.logger.log(`Operador existente:`, existingOperator);

        // Verificar si la foto es idéntica a la existente
        if (updateOperatorDto.photo && existingOperator.photo && 
            (updateOperatorDto.photo === existingOperator.photo || 
             updateOperatorDto.photo.split('?')[0] === existingOperator.photo)) {
          this.logger.log(`La URL de la foto no ha cambiado, manteniendo la original: "${existingOperator.photo}"`);
          // Usar la foto existente para evitar transformaciones innecesarias
          updateOperatorDto.photo = existingOperator.photo;
        }

        // Si se está actualizando la sucursal, verificar que exista
        if (updateOperatorDto.branch_id) {
          const branch = await prisma.branches.findUnique({
            where: { id: updateOperatorDto.branch_id },
            select: { id: true }
          });

          if (!branch) {
            throw new NotFoundException(`La sucursal con ID ${updateOperatorDto.branch_id} no existe`);
          }
        }
        
        // Si se está actualizando el tipo de operador, verificar que exista
        if (updateOperatorDto.type_operator_id) {
          const typeOperator = await prisma.operator_types.findUnique({
            where: { id: updateOperatorDto.type_operator_id },
            select: { id: true }
          });
          
          if (!typeOperator) {
            throw new NotFoundException(`El tipo de operador con ID ${updateOperatorDto.type_operator_id} no existe`);
          }
        }
        
        // Verificar y limpiar el rol si está presente
        if (updateOperatorDto.role) {
          this.logger.log(`Valor de rol recibido: "${updateOperatorDto.role}"`);
          try {
            // Comprobar si el rol es válido según la enumeración
            const validRoles = Object.values(operator_role_enum);
            if (!validRoles.includes(updateOperatorDto.role as any)) {
              this.logger.warn(`⚠️ Rol "${updateOperatorDto.role}" no válido. Roles permitidos: ${validRoles.join(', ')}`);
              // Usar el rol existente o un valor predeterminado seguro
              updateOperatorDto.role = existingOperator.role || 'staff';
              this.logger.log(`Rol corregido a "${updateOperatorDto.role}"`);
            } else {
              this.logger.log(`✅ Rol "${updateOperatorDto.role}" es válido`);
            }
          } catch (error) {
            this.logger.error(`Error validando rol: ${error.message}`);
            updateOperatorDto.role = existingOperator.role;
          }
        } else {
          // Si no se especificó un rol, usar el existente
          updateOperatorDto.role = existingOperator.role;
          this.logger.log(`No se especificó rol, usando existente: "${updateOperatorDto.role}"`);
        }

        // Verificar y limpiar la URL de la foto si está presente
        if (updateOperatorDto.photo && updateOperatorDto.photo !== existingOperator.photo) {
          this.logger.log(`URL de foto recibida: "${updateOperatorDto.photo}"`);
          try {
            // Validar formato URL básico
            new URL(updateOperatorDto.photo);
            
            // Convertir URL de Supabase con '/sign/' a '/public/'
            if (updateOperatorDto.photo.includes('/sign/')) {
              const publicUrl = updateOperatorDto.photo.replace('/sign/', '/public/');
              this.logger.log(`URL de foto convertida de '/sign/' a '/public/': "${publicUrl}"`);
              updateOperatorDto.photo = publicUrl;
            }
            
            // Eliminar tokens de firma si existen
            if (updateOperatorDto.photo.includes('?')) {
              const cleanUrl = updateOperatorDto.photo.split('?')[0];
              this.logger.log(`URL de foto limpiada (sin token): "${cleanUrl}"`);
              updateOperatorDto.photo = cleanUrl;
            }
            
            this.logger.log(`✅ URL de foto final: "${updateOperatorDto.photo}"`);
          } catch (urlError) {
            this.logger.error(`❌ URL de foto inválida: ${urlError.message}`);
            // No actualizar la foto si la URL es inválida
            delete updateOperatorDto.photo;
            this.logger.log(`Campo de foto removido para evitar errores de validación`);
          }
        }

        const updateData: any = {
          first_name: updateOperatorDto.firstName,
          last_name: updateOperatorDto.lastName,
          phone: updateOperatorDto.phone,
          role: updateOperatorDto.role, // Asegurar que el rol siempre se incluya
          status: updateOperatorDto.status,
          branch_id: updateOperatorDto.branch_id,
          type_operator_id: updateOperatorDto.type_operator_id,
          photo: updateOperatorDto.photo,
          updated_at: new Date()
        };
        
        // Log para depuración
        this.logger.log(`Datos de actualización preparados (base):`, updateData);
        
        // PROCESAMIENTO DE CAMPOS CRÍTICOS: SIEMPRE INCLUIR ESTOS CAMPOS
        
        // Procesar birth_date - SIEMPRE PROCESAR independientemente de si está en el DTO
        if ('birth_date' in updateOperatorDto) {
          this.logger.log(`✅ Campo birth_date encontrado en el DTO:`, updateOperatorDto.birth_date);
          
          if (updateOperatorDto.birth_date) {
            // Parsear la fecha si es un string
            try {
              updateData.birth_date = new Date(updateOperatorDto.birth_date);
              this.logger.log(`✅ Fecha de nacimiento convertida a objeto Date:`, updateData.birth_date);
            } catch (error) {
              this.logger.error(`Error al convertir birth_date a Date:`, error);
              // Si hay error en la conversión, usar el valor original
              updateData.birth_date = updateOperatorDto.birth_date;
            }
          } else {
            // Si es null o vacío, establecer explícitamente como null
            updateData.birth_date = null;
            this.logger.log(`✅ Fecha de nacimiento establecida a null`);
          }
        } else {
          // Si no está en el DTO, mantener el valor existente
          updateData.birth_date = existingOperator.birth_date;
          this.logger.log(`✅ Usando birth_date existente:`, updateData.birth_date);
        }
        
        // Procesar personal_id - SIEMPRE PROCESAR
        if ('personal_id' in updateOperatorDto) {
          this.logger.log(`✅ Campo personal_id encontrado en el DTO:`, updateOperatorDto.personal_id);
          updateData.personal_id = updateOperatorDto.personal_id || null;
          this.logger.log(`✅ personal_id final para DB:`, updateData.personal_id);
        } else {
          // Si no está en el DTO, mantener el valor existente
          updateData.personal_id = existingOperator.personal_id;
          this.logger.log(`✅ Usando personal_id existente:`, updateData.personal_id);
        }
        
        // Procesar emergency_contact - SIEMPRE PROCESAR
        if ('emergency_contact' in updateOperatorDto) {
          this.logger.log(`✅ Campo emergency_contact encontrado en el DTO:`, updateOperatorDto.emergency_contact);
          
          if (updateOperatorDto.emergency_contact) {
            // Si es un objeto, mantenerlo como objeto para la base de datos
            if (typeof updateOperatorDto.emergency_contact === 'object') {
              updateData.emergency_contact = updateOperatorDto.emergency_contact;
              this.logger.log(`✅ emergency_contact procesado como objeto:`, updateData.emergency_contact);
            } else if (typeof updateOperatorDto.emergency_contact === 'string') {
              // Si es string (posiblemente JSON), intentar parsearlo
              try {
                updateData.emergency_contact = JSON.parse(updateOperatorDto.emergency_contact);
                this.logger.log(`✅ emergency_contact parseado desde string:`, updateData.emergency_contact);
              } catch (error) {
                this.logger.error(`Error al parsear emergency_contact:`, error);
                updateData.emergency_contact = null;
              }
            }
          } else {
            // Si es null o vacío, establecer explícitamente como null
            updateData.emergency_contact = null;
            this.logger.log(`✅ emergency_contact establecido a null`);
          }
        } else {
          // Si no está en el DTO, mantener el valor existente
          updateData.emergency_contact = existingOperator.emergency_contact;
          this.logger.log(`✅ Usando emergency_contact existente:`, updateData.emergency_contact);
        }
        
        // Procesar address - SIEMPRE PROCESAR
        if ('address' in updateOperatorDto) {
          this.logger.log(`✅ Campo address encontrado en el DTO:`, updateOperatorDto.address);
          updateData.address = updateOperatorDto.address || null;
          this.logger.log(`✅ address final para DB:`, updateData.address);
        } else {
          // Si no está en el DTO, mantener el valor existente
          updateData.address = existingOperator.address;
          this.logger.log(`✅ Usando address existente:`, updateData.address);
        }
        
        // Solo incluir campos que no sean undefined para los campos base
        Object.keys(updateData).forEach(key => 
          updateData[key] === undefined && delete updateData[key]
        );
        
        // Log después de filtrar undefined
        this.logger.log(`Datos de actualización filtrados:`, updateData);

        if (updateOperatorDto.password) {
          updateData.password = await bcrypt.hash(updateOperatorDto.password, 10);
        }

        // CRÍTICO: Verificar EXACTAMENTE lo que se enviará a la base de datos
        this.logger.log(`⚠️ OBJETO FINAL A ENVIAR A LA BASE DE DATOS:`, JSON.stringify(updateData, null, 2));
        
        // Verificar estructura de birth_date
        if ('birth_date' in updateData) {
          this.logger.log(`⚠️ Tipo de birth_date: ${typeof updateData.birth_date}`);
          this.logger.log(`⚠️ Valor de birth_date: ${JSON.stringify(updateData.birth_date)}`);
          
          // Si es una cadena, convertirla a Date
          if (typeof updateData.birth_date === 'string') {
            try {
              updateData.birth_date = new Date(updateData.birth_date);
              this.logger.log(`⚠️ birth_date convertido a Date: ${updateData.birth_date}`);
            } catch (error) {
              this.logger.error(`⚠️ Error al convertir birth_date a Date: ${error.message}`);
            }
          }
        }
        
        // Verificar estructura de emergency_contact
        if ('emergency_contact' in updateData) {
          this.logger.log(`⚠️ Tipo de emergency_contact: ${typeof updateData.emergency_contact}`);
          this.logger.log(`⚠️ Valor de emergency_contact: ${JSON.stringify(updateData.emergency_contact)}`);
        }

        const updatedOperator = await prisma.operators.update({
          where: { id: operatorId },
          data: updateData,
          include: {
            branches: {
              select: {
                id: true,
                name: true
              }
            },
            operator_types: {
              select: {
                id: true,
                name: true
              }
            }
          }
        });
        
        // Verificar los datos recibidos después de la actualización
        this.logger.log(`⚠️ DATOS DEVUELTOS POR LA BASE DE DATOS:`, JSON.stringify(updatedOperator, null, 2));
        this.logger.log(`⚠️ birth_date en la respuesta: ${updatedOperator.birth_date}`);
        this.logger.log(`⚠️ personal_id en la respuesta: ${updatedOperator.personal_id}`);
        this.logger.log(`⚠️ emergency_contact en la respuesta: ${JSON.stringify(updatedOperator.emergency_contact)}`);
        this.logger.log(`⚠️ address en la respuesta: ${updatedOperator.address}`);
        
        this.logger.log(`Operador actualizado en la base de datos:`, updatedOperator);
        
        const mappedOperator = this.mapOperatorData(updatedOperator);
        
        // Actualizar caché del operador
        const cacheKey = this.cache.getOperatorCacheKey(operatorId);
        this.logger.log(`Actualizando caché para el operador con clave: ${cacheKey}`);
        this.cache.set(cacheKey, mappedOperator);
        
        // Invalidar caché de listados de manera más agresiva
        this.logger.log('Invalidando todas las entradas de caché de listados de operadores');
        this.cache.invalidatePattern('^operators:list:');
        
        // Invalidar cualquier otra caché relacionada con el operador
        this.logger.log(`Invalidando todas las entradas relacionadas con el operador ${operatorId}`);
        this.cache.invalidatePattern(`^operator:${operatorId}:`);
        
        return mappedOperator;
      });
    } catch (error) {
      this.logger.error(`Error al actualizar operador ${operatorId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al actualizar el operador');
    }
  }

  async remove(operatorId: string): Promise<void> {
    try {
      return await this.prisma.$transaction(async (prisma) => {
        const operator = await prisma.operators.findUnique({
          where: { id: operatorId },
          select: { id: true }
        });
        
        if (!operator) {
          throw new NotFoundException('Operador no encontrado');
        }

        await prisma.operators.delete({
          where: { id: operatorId }
        });
        
        // Invalidar caché del operador
        const cacheKey = this.cache.getOperatorCacheKey(operatorId);
        this.cache.invalidate(cacheKey);
        
        // Invalidar caché de actividades del operador
        this.cache.invalidatePattern(`^operator:${operatorId}:activities:`);
        
        // Invalidar caché de listados
        this.cache.invalidatePattern('^operators:list:');
      });
    } catch (error) {
      this.logger.error(`Error al eliminar operador ${operatorId}:`, error);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new InternalServerErrorException('Error al eliminar el operador');
    }
  }

  async logActivity(
    operatorId: string,
    type: ActivityType,
    action: ActivityAction,
    description: string,
    details?: any,
    status: ActivityStatus = ActivityStatus.COMPLETED,
    branchId?: string,
    req?: any
  ): Promise<void> {
    try {
      // Preparar los datos para la actividad
      const activityData = {
        id: uuidv4(),
        operator_id: operatorId,
        type: this.mapActivityTypeToPrisma(type),
        action: action.toString(),
        description: description,
        status: this.mapActivityStatusToPrisma(status),
        branch_id: branchId,
        metadata: details ? JSON.stringify(details) : null,
        ip_address: req?.ip,
        user_agent: req?.headers?.['user-agent'],
        created_at: new Date()
      };

      // Crear la actividad sin esperar a que termine (no bloqueante)
      this.prisma.activities.create({ data: activityData })
        .then(() => {
          this.logger.log(`✅ Actividad registrada: ${description}`);
          // Invalidar caché de actividades del operador
          this.cache.invalidatePattern(`^operator:${operatorId}:activities:`);
        })
        .catch(error => this.logger.error(`❌ Error al registrar actividad: ${error.message}`));
      
    } catch (error) {
      // Solo registrar el error, pero no propagarlo para no bloquear la operación principal
      this.logger.error(`❌ Error al preparar registro de actividad: ${error.message}`);
    }
  }

  async getOperatorActivities(operatorId: string, page = 1, limit = 20): Promise<{ activities: OperatorActivityDto[], total: number }> {
    // Generar clave de caché
    const cacheKey = this.cache.getOperatorActivitiesCacheKey(operatorId, page, limit);
    
    // Verificar si los resultados están en caché
    const cachedResult = this.cache.get<{ activities: OperatorActivityDto[], total: number }>(cacheKey);
    if (cachedResult) {
      return cachedResult;
    }
    
    try {
      // Optimización: Verificar si el operador existe usando caché
      try {
        await this.findOne(operatorId, false);
      } catch (error) {
        if (error instanceof NotFoundException) {
          throw error;
        }
        // Si hay otro error, continuar con la consulta
      }
      
      // Optimización: Usar SQL nativo para mejor rendimiento
      const countQuery = `
        SELECT COUNT(*) as total
        FROM activities
        WHERE operator_id = $1
      `;
      
      const activitiesQuery = `
        SELECT 
          id, operator_id, type, action, description, 
          metadata, status, created_at, branch_id, 
          ip_address, user_agent
        FROM activities
        WHERE operator_id = $1
        ORDER BY created_at DESC
        LIMIT $2 OFFSET $3
      `;
      
      // Ejecutar consultas en paralelo para mejorar rendimiento
      const [countResult, activitiesResult] = await Promise.all([
        this.prisma.$queryRawUnsafe(countQuery, operatorId),
        this.prisma.$queryRawUnsafe(activitiesQuery, operatorId, limit, (page - 1) * limit)
      ]);
      
      const total = parseInt((countResult as any)[0].total);
      
      // Si no hay resultados, devolver rápidamente
      if (total === 0) {
        const result = { activities: [], total: 0 };
        this.cache.set(cacheKey, result);
        return result;
      }
      
      // Mapear actividades al formato DTO
      const mappedActivities = (activitiesResult as any[]).map(activity => ({
        id: activity.id,
        operatorId: activity.operator_id,
        type: this.mapPrismaActivityType(activity.type),
        action: activity.action as ActivityAction,
        description: activity.description,
        timestamp: activity.created_at,
        status: this.mapPrismaActivityStatus(activity.status),
        branchId: activity.branch_id,
        details: activity.metadata ? JSON.parse(activity.metadata as string) : null,
        ipAddress: activity.ip_address,
        userAgent: activity.user_agent
      }));
      
      const result = { activities: mappedActivities, total };
      
      // Guardar en caché para futuras consultas - TTL más largo para resultados históricos
      // Las actividades más antiguas cambian con menos frecuencia
      const isHistoricalData = page > 1;
      this.cache.set(cacheKey, result, isHistoricalData ? 2 * 60 * 60 * 1000 : undefined); // 2 horas para datos históricos
      
      return result;
    } catch (error) {
      this.logger.error(`Error al obtener actividades del operador ${operatorId}: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Error al obtener las actividades del operador');
    }
  }

  private mapActivityTypeToPrisma(type: ActivityType): activity_type_enum {
    const typeMap: Record<ActivityType, activity_type_enum> = {
      [ActivityType.LOGIN]: 'login',
      [ActivityType.LOGOUT]: 'logout',
      [ActivityType.CREATE]: 'create',
      [ActivityType.UPDATE]: 'update',
      [ActivityType.DELETE]: 'delete',
      [ActivityType.VIEW]: 'view'
    };
    return typeMap[type] || 'view';
  }

  private mapPrismaActivityType(type: activity_type_enum): ActivityType {
    const typeMap: Record<activity_type_enum, ActivityType> = {
      'login': ActivityType.LOGIN,
      'logout': ActivityType.LOGOUT,
      'create': ActivityType.CREATE,
      'update': ActivityType.UPDATE,
      'delete': ActivityType.DELETE,
      'view': ActivityType.VIEW
    };
    return typeMap[type] || ActivityType.VIEW;
  }

  private mapActivityStatusToPrisma(status: ActivityStatus): activity_status_enum {
    const statusMap: Record<ActivityStatus, activity_status_enum> = {
      [ActivityStatus.PENDING]: 'pending',
      [ActivityStatus.COMPLETED]: 'completed',
      [ActivityStatus.FAILED]: 'failed',
      [ActivityStatus.CANCELLED]: 'cancelled'
    };
    return statusMap[status] || 'completed';
  }

  private mapPrismaActivityStatus(status: activity_status_enum): ActivityStatus {
    const statusMap: Record<activity_status_enum, ActivityStatus> = {
      'pending': ActivityStatus.PENDING,
      'completed': ActivityStatus.COMPLETED,
      'failed': ActivityStatus.FAILED,
      'cancelled': ActivityStatus.CANCELLED
    };
    return statusMap[status] || ActivityStatus.COMPLETED;
  }

  // Método para invalidar explícitamente la caché de un operador
  invalidateOperatorCache(operatorId: string): void {
    this.logger.debug(`Invalidando caché del operador ${operatorId}`);
    const cacheKey = this.cache.getOperatorCacheKey(operatorId);
    this.cache.invalidate(cacheKey);
  }

  // Verificar si la contraseña actual es correcta
  async verifyPassword(operatorId: string, currentPassword: string): Promise<boolean> {
    try {
      this.logger.debug(`Verificando contraseña para operador ${operatorId}...`);
      
      // Obtener el operador con su hash de contraseña
      const operator = await this.prisma.operators.findUnique({
        where: { id: operatorId },
        select: { password: true }
      });
      
      if (!operator) {
        this.logger.warn(`Operador ${operatorId} no encontrado al verificar contraseña`);
        throw new NotFoundException('Operador no encontrado');
      }
      
      // Verificar si las contraseñas coinciden
      const isMatch = await bcrypt.compare(currentPassword, operator.password);
      
      if (!isMatch) {
        this.logger.warn(`Contraseña actual incorrecta para operador ${operatorId}`);
        return false;
      }
      
      this.logger.debug(`Contraseña verificada exitosamente para operador ${operatorId}`);
      return true;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al verificar contraseña para operador ${operatorId}:`, error);
      throw new InternalServerErrorException('Error al verificar la contraseña');
    }
  }
  
  // Actualizar la contraseña del operador
  async updatePassword(operatorId: string, newPassword: string): Promise<void> {
    try {
      this.logger.debug(`Actualizando contraseña para operador ${operatorId}...`);
      
      // Obtener el operador para verificar que existe
      const operator = await this.prisma.operators.findUnique({
        where: { id: operatorId },
        select: { id: true }
      });
      
      if (!operator) {
        this.logger.warn(`Operador ${operatorId} no encontrado al actualizar contraseña`);
        throw new NotFoundException('Operador no encontrado');
      }
      
      // Generar hash para la nueva contraseña
      const salt = await bcrypt.genSalt();
      const hashedPassword = await bcrypt.hash(newPassword, salt);
      
      // Actualizar la contraseña en la base de datos
      await this.prisma.operators.update({
        where: { id: operatorId },
        data: { 
          password: hashedPassword,
          updated_at: new Date()
        }
      });
      
      // Invalidar caché del operador
      this.invalidateOperatorCache(operatorId);
      
      this.logger.debug(`Contraseña actualizada exitosamente para operador ${operatorId}`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(`Error al actualizar contraseña para operador ${operatorId}:`, error);
      throw new InternalServerErrorException('Error al actualizar la contraseña');
    }
  }
} 