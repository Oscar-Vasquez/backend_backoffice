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
var OperatorsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.OperatorsService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const operators_cache_service_1 = require("./operators-cache.service");
const bcrypt = require("bcrypt");
const uuid_1 = require("uuid");
const operator_activity_dto_1 = require("./dto/operator-activity.dto");
const client_1 = require("@prisma/client");
let OperatorsService = OperatorsService_1 = class OperatorsService {
    constructor(prisma, cache) {
        this.prisma = prisma;
        this.cache = cache;
        this.logger = new common_1.Logger(OperatorsService_1.name);
    }
    mapOperatorData(operator) {
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
    parseEmergencyContact(contact) {
        if (!contact)
            return null;
        try {
            if (typeof contact === 'object' && contact.name && contact.phone) {
                return contact;
            }
            if (typeof contact === 'string') {
                const parsed = JSON.parse(contact);
                if (parsed && typeof parsed === 'object' && parsed.name && parsed.phone) {
                    return parsed;
                }
            }
            this.logger.warn(`Formato inesperado de emergency_contact: ${JSON.stringify(contact)}`);
            return null;
        }
        catch (error) {
            this.logger.error(`Error al parsear emergency_contact: ${error.message}`, error.stack);
            return null;
        }
    }
    async findAll(page = 1, limit = 20, filters) {
        const cacheKey = this.cache.getOperatorsListCacheKey(page, limit, filters);
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        try {
            const where = {};
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
                if (filters.search && filters.search.trim()) {
                    const search = filters.search.trim();
                    if (search.length > 3) {
                        const searchResults = await this.prisma.$queryRaw `
              SELECT o.id 
              FROM operators o
              WHERE o.first_name ILIKE ${`%${search}%`} 
                 OR o.last_name ILIKE ${`%${search}%`}
                 OR o.email ILIKE ${`%${search}%`}
              LIMIT 100
            `;
                        const ids = searchResults.map(r => r.id);
                        if (ids.length > 0) {
                            where.id = { in: ids };
                        }
                        else {
                            const result = { operators: [], total: 0 };
                            this.cache.set(cacheKey, result);
                            return result;
                        }
                    }
                    else {
                        where.OR = [
                            { first_name: { contains: search, mode: 'insensitive' } },
                            { last_name: { contains: search, mode: 'insensitive' } },
                            { email: { contains: search, mode: 'insensitive' } }
                        ];
                    }
                }
            }
            if (!filters || Object.keys(filters).length === 0) {
                const allOperatorsKey = this.cache.getOperatorsListCacheKey(1, 1000, {});
                const allCachedOperators = this.cache.get(allOperatorsKey);
                if (allCachedOperators) {
                    const start = (page - 1) * limit;
                    const end = start + limit;
                    const paginatedOperators = allCachedOperators.operators.slice(start, end);
                    const result = {
                        operators: paginatedOperators,
                        total: allCachedOperators.total
                    };
                    this.cache.set(cacheKey, result);
                    return result;
                }
            }
            const [total, operators] = await Promise.all([
                this.prisma.operators.count({ where }),
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
            if (total === 0) {
                const result = { operators: [], total: 0 };
                this.cache.set(cacheKey, result);
                return result;
            }
            const mappedOperators = operators.map(operator => this.mapOperatorData(operator));
            const result = { operators: mappedOperators, total };
            const isCommonQuery = !filters || Object.keys(filters).length === 0 ||
                (filters.status === 'active' && !filters.search);
            this.cache.set(cacheKey, result, isCommonQuery ? 60 * 60 * 1000 : undefined);
            return result;
        }
        catch (error) {
            this.logger.error(`Error al buscar operadores: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al buscar operadores');
        }
    }
    async findOne(operatorId, forceRefresh = false) {
        const cacheKey = this.cache.getOperatorCacheKey(operatorId);
        const cachedOperator = forceRefresh ? null : this.cache.get(cacheKey);
        if (cachedOperator) {
            this.logger.debug(`Operador ${operatorId} obtenido desde caché`);
            return cachedOperator;
        }
        try {
            this.logger.debug(`Buscando operador con ID: ${operatorId}`);
            const startTime = Date.now();
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
                throw new common_1.NotFoundException(`Operador con ID ${operatorId} no encontrado`);
            }
            const mappedOperator = this.mapOperatorData(operator);
            this.logger.debug(`Datos de emergency_contact: ${JSON.stringify(operator.emergency_contact)}`);
            this.logger.debug(`Tipo de emergency_contact: ${typeof operator.emergency_contact}`);
            this.cache.set(cacheKey, mappedOperator);
            const queryTime = Date.now() - startTime;
            this.logger.debug(`Operador obtenido en ${queryTime}ms`);
            return mappedOperator;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al buscar operador ${operatorId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al buscar el operador');
        }
    }
    async create(createOperatorDto) {
        try {
            this.logger.debug(`Creando nuevo operador: ${createOperatorDto.email}`);
            const startTime = Date.now();
            const existingOperator = await this.prisma.operators.findUnique({
                where: { email: createOperatorDto.email },
                select: { id: true }
            });
            if (existingOperator) {
                throw new common_1.ConflictException(`Ya existe un operador con el email ${createOperatorDto.email}`);
            }
            const hashedPassword = await bcrypt.hash(createOperatorDto.password, 10);
            const newOperator = await this.prisma.operators.create({
                data: {
                    email: createOperatorDto.email,
                    password: hashedPassword,
                    first_name: createOperatorDto.firstName,
                    last_name: createOperatorDto.lastName,
                    phone: createOperatorDto.phone,
                    role: createOperatorDto.role,
                    status: createOperatorDto.status || 'active',
                    photo: createOperatorDto.photo || '',
                    branch_id: createOperatorDto.branch_id,
                    type_operator_id: createOperatorDto.type_operator_id,
                    birth_date: createOperatorDto.birth_date ? new Date(createOperatorDto.birth_date) : null,
                    hire_date: createOperatorDto.hire_date ? new Date(createOperatorDto.hire_date) : null,
                    personal_id: createOperatorDto.personal_id,
                    address: createOperatorDto.address,
                    emergency_contact: createOperatorDto.emergency_contact ? createOperatorDto.emergency_contact : null,
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
            const mappedOperator = this.mapOperatorData(newOperator);
            const cacheKey = this.cache.getOperatorCacheKey(newOperator.id);
            this.cache.set(cacheKey, mappedOperator);
            this.cache.invalidatePattern('operators:list:*');
            const createTime = Date.now() - startTime;
            this.logger.debug(`Operador creado en ${createTime}ms: ${newOperator.id}`);
            return mappedOperator;
        }
        catch (error) {
            if (error instanceof common_1.ConflictException) {
                throw error;
            }
            this.logger.error(`Error al crear operador: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al crear el operador');
        }
    }
    async update(operatorId, updateOperatorDto) {
        try {
            this.logger.log(`Intentando actualizar operador ${operatorId} con datos:`, updateOperatorDto);
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
                    throw new common_1.NotFoundException('Operador no encontrado');
                }
                this.logger.log(`Operador existente:`, existingOperator);
                if (updateOperatorDto.photo && existingOperator.photo &&
                    (updateOperatorDto.photo === existingOperator.photo ||
                        updateOperatorDto.photo.split('?')[0] === existingOperator.photo)) {
                    this.logger.log(`La URL de la foto no ha cambiado, manteniendo la original: "${existingOperator.photo}"`);
                    updateOperatorDto.photo = existingOperator.photo;
                }
                if (updateOperatorDto.branch_id) {
                    const branch = await prisma.branches.findUnique({
                        where: { id: updateOperatorDto.branch_id },
                        select: { id: true }
                    });
                    if (!branch) {
                        throw new common_1.NotFoundException(`La sucursal con ID ${updateOperatorDto.branch_id} no existe`);
                    }
                }
                if (updateOperatorDto.type_operator_id) {
                    const typeOperator = await prisma.operator_types.findUnique({
                        where: { id: updateOperatorDto.type_operator_id },
                        select: { id: true }
                    });
                    if (!typeOperator) {
                        throw new common_1.NotFoundException(`El tipo de operador con ID ${updateOperatorDto.type_operator_id} no existe`);
                    }
                }
                if (updateOperatorDto.role) {
                    this.logger.log(`Valor de rol recibido: "${updateOperatorDto.role}"`);
                    try {
                        const validRoles = Object.values(client_1.operator_role_enum);
                        if (!validRoles.includes(updateOperatorDto.role)) {
                            this.logger.warn(`⚠️ Rol "${updateOperatorDto.role}" no válido. Roles permitidos: ${validRoles.join(', ')}`);
                            updateOperatorDto.role = existingOperator.role || 'staff';
                            this.logger.log(`Rol corregido a "${updateOperatorDto.role}"`);
                        }
                        else {
                            this.logger.log(`✅ Rol "${updateOperatorDto.role}" es válido`);
                        }
                    }
                    catch (error) {
                        this.logger.error(`Error validando rol: ${error.message}`);
                        updateOperatorDto.role = existingOperator.role;
                    }
                }
                else {
                    updateOperatorDto.role = existingOperator.role;
                    this.logger.log(`No se especificó rol, usando existente: "${updateOperatorDto.role}"`);
                }
                if (updateOperatorDto.photo && updateOperatorDto.photo !== existingOperator.photo) {
                    this.logger.log(`URL de foto recibida: "${updateOperatorDto.photo}"`);
                    try {
                        new URL(updateOperatorDto.photo);
                        if (updateOperatorDto.photo.includes('/sign/')) {
                            const publicUrl = updateOperatorDto.photo.replace('/sign/', '/public/');
                            this.logger.log(`URL de foto convertida de '/sign/' a '/public/': "${publicUrl}"`);
                            updateOperatorDto.photo = publicUrl;
                        }
                        if (updateOperatorDto.photo.includes('?')) {
                            const cleanUrl = updateOperatorDto.photo.split('?')[0];
                            this.logger.log(`URL de foto limpiada (sin token): "${cleanUrl}"`);
                            updateOperatorDto.photo = cleanUrl;
                        }
                        this.logger.log(`✅ URL de foto final: "${updateOperatorDto.photo}"`);
                    }
                    catch (urlError) {
                        this.logger.error(`❌ URL de foto inválida: ${urlError.message}`);
                        delete updateOperatorDto.photo;
                        this.logger.log(`Campo de foto removido para evitar errores de validación`);
                    }
                }
                const updateData = {
                    first_name: updateOperatorDto.firstName,
                    last_name: updateOperatorDto.lastName,
                    phone: updateOperatorDto.phone,
                    role: updateOperatorDto.role,
                    status: updateOperatorDto.status,
                    branch_id: updateOperatorDto.branch_id,
                    type_operator_id: updateOperatorDto.type_operator_id,
                    photo: updateOperatorDto.photo,
                    updated_at: new Date()
                };
                this.logger.log(`Datos de actualización preparados (base):`, updateData);
                if ('birth_date' in updateOperatorDto) {
                    this.logger.log(`✅ Campo birth_date encontrado en el DTO:`, updateOperatorDto.birth_date);
                    if (updateOperatorDto.birth_date) {
                        try {
                            updateData.birth_date = new Date(updateOperatorDto.birth_date);
                            this.logger.log(`✅ Fecha de nacimiento convertida a objeto Date:`, updateData.birth_date);
                        }
                        catch (error) {
                            this.logger.error(`Error al convertir birth_date a Date:`, error);
                            updateData.birth_date = updateOperatorDto.birth_date;
                        }
                    }
                    else {
                        updateData.birth_date = null;
                        this.logger.log(`✅ Fecha de nacimiento establecida a null`);
                    }
                }
                else {
                    updateData.birth_date = existingOperator.birth_date;
                    this.logger.log(`✅ Usando birth_date existente:`, updateData.birth_date);
                }
                if ('personal_id' in updateOperatorDto) {
                    this.logger.log(`✅ Campo personal_id encontrado en el DTO:`, updateOperatorDto.personal_id);
                    updateData.personal_id = updateOperatorDto.personal_id || null;
                    this.logger.log(`✅ personal_id final para DB:`, updateData.personal_id);
                }
                else {
                    updateData.personal_id = existingOperator.personal_id;
                    this.logger.log(`✅ Usando personal_id existente:`, updateData.personal_id);
                }
                if ('emergency_contact' in updateOperatorDto) {
                    this.logger.log(`✅ Campo emergency_contact encontrado en el DTO:`, updateOperatorDto.emergency_contact);
                    if (updateOperatorDto.emergency_contact) {
                        if (typeof updateOperatorDto.emergency_contact === 'object') {
                            updateData.emergency_contact = updateOperatorDto.emergency_contact;
                            this.logger.log(`✅ emergency_contact procesado como objeto:`, updateData.emergency_contact);
                        }
                        else if (typeof updateOperatorDto.emergency_contact === 'string') {
                            try {
                                updateData.emergency_contact = JSON.parse(updateOperatorDto.emergency_contact);
                                this.logger.log(`✅ emergency_contact parseado desde string:`, updateData.emergency_contact);
                            }
                            catch (error) {
                                this.logger.error(`Error al parsear emergency_contact:`, error);
                                updateData.emergency_contact = null;
                            }
                        }
                    }
                    else {
                        updateData.emergency_contact = null;
                        this.logger.log(`✅ emergency_contact establecido a null`);
                    }
                }
                else {
                    updateData.emergency_contact = existingOperator.emergency_contact;
                    this.logger.log(`✅ Usando emergency_contact existente:`, updateData.emergency_contact);
                }
                if ('address' in updateOperatorDto) {
                    this.logger.log(`✅ Campo address encontrado en el DTO:`, updateOperatorDto.address);
                    updateData.address = updateOperatorDto.address || null;
                    this.logger.log(`✅ address final para DB:`, updateData.address);
                }
                else {
                    updateData.address = existingOperator.address;
                    this.logger.log(`✅ Usando address existente:`, updateData.address);
                }
                Object.keys(updateData).forEach(key => updateData[key] === undefined && delete updateData[key]);
                this.logger.log(`Datos de actualización filtrados:`, updateData);
                if (updateOperatorDto.password) {
                    updateData.password = await bcrypt.hash(updateOperatorDto.password, 10);
                }
                this.logger.log(`⚠️ OBJETO FINAL A ENVIAR A LA BASE DE DATOS:`, JSON.stringify(updateData, null, 2));
                if ('birth_date' in updateData) {
                    this.logger.log(`⚠️ Tipo de birth_date: ${typeof updateData.birth_date}`);
                    this.logger.log(`⚠️ Valor de birth_date: ${JSON.stringify(updateData.birth_date)}`);
                    if (typeof updateData.birth_date === 'string') {
                        try {
                            updateData.birth_date = new Date(updateData.birth_date);
                            this.logger.log(`⚠️ birth_date convertido a Date: ${updateData.birth_date}`);
                        }
                        catch (error) {
                            this.logger.error(`⚠️ Error al convertir birth_date a Date: ${error.message}`);
                        }
                    }
                }
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
                this.logger.log(`⚠️ DATOS DEVUELTOS POR LA BASE DE DATOS:`, JSON.stringify(updatedOperator, null, 2));
                this.logger.log(`⚠️ birth_date en la respuesta: ${updatedOperator.birth_date}`);
                this.logger.log(`⚠️ personal_id en la respuesta: ${updatedOperator.personal_id}`);
                this.logger.log(`⚠️ emergency_contact en la respuesta: ${JSON.stringify(updatedOperator.emergency_contact)}`);
                this.logger.log(`⚠️ address en la respuesta: ${updatedOperator.address}`);
                this.logger.log(`Operador actualizado en la base de datos:`, updatedOperator);
                const mappedOperator = this.mapOperatorData(updatedOperator);
                const cacheKey = this.cache.getOperatorCacheKey(operatorId);
                this.logger.log(`Actualizando caché para el operador con clave: ${cacheKey}`);
                this.cache.set(cacheKey, mappedOperator);
                this.logger.log('Invalidando todas las entradas de caché de listados de operadores');
                this.cache.invalidatePattern('^operators:list:');
                this.logger.log(`Invalidando todas las entradas relacionadas con el operador ${operatorId}`);
                this.cache.invalidatePattern(`^operator:${operatorId}:`);
                return mappedOperator;
            });
        }
        catch (error) {
            this.logger.error(`Error al actualizar operador ${operatorId}:`, error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al actualizar el operador');
        }
    }
    async remove(operatorId) {
        try {
            return await this.prisma.$transaction(async (prisma) => {
                const operator = await prisma.operators.findUnique({
                    where: { id: operatorId },
                    select: { id: true }
                });
                if (!operator) {
                    throw new common_1.NotFoundException('Operador no encontrado');
                }
                await prisma.operators.delete({
                    where: { id: operatorId }
                });
                const cacheKey = this.cache.getOperatorCacheKey(operatorId);
                this.cache.invalidate(cacheKey);
                this.cache.invalidatePattern(`^operator:${operatorId}:activities:`);
                this.cache.invalidatePattern('^operators:list:');
            });
        }
        catch (error) {
            this.logger.error(`Error al eliminar operador ${operatorId}:`, error);
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            throw new common_1.InternalServerErrorException('Error al eliminar el operador');
        }
    }
    async logActivity(operatorId, type, action, description, details, status = operator_activity_dto_1.ActivityStatus.COMPLETED, branchId, req) {
        try {
            const activityData = {
                id: (0, uuid_1.v4)(),
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
            this.prisma.activities.create({ data: activityData })
                .then(() => {
                this.logger.log(`✅ Actividad registrada: ${description}`);
                this.cache.invalidatePattern(`^operator:${operatorId}:activities:`);
            })
                .catch(error => this.logger.error(`❌ Error al registrar actividad: ${error.message}`));
        }
        catch (error) {
            this.logger.error(`❌ Error al preparar registro de actividad: ${error.message}`);
        }
    }
    async getOperatorActivities(operatorId, page = 1, limit = 20) {
        const cacheKey = this.cache.getOperatorActivitiesCacheKey(operatorId, page, limit);
        const cachedResult = this.cache.get(cacheKey);
        if (cachedResult) {
            return cachedResult;
        }
        try {
            try {
                await this.findOne(operatorId, false);
            }
            catch (error) {
                if (error instanceof common_1.NotFoundException) {
                    throw error;
                }
            }
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
            const [countResult, activitiesResult] = await Promise.all([
                this.prisma.$queryRawUnsafe(countQuery, operatorId),
                this.prisma.$queryRawUnsafe(activitiesQuery, operatorId, limit, (page - 1) * limit)
            ]);
            const total = parseInt(countResult[0].total);
            if (total === 0) {
                const result = { activities: [], total: 0 };
                this.cache.set(cacheKey, result);
                return result;
            }
            const mappedActivities = activitiesResult.map(activity => ({
                id: activity.id,
                operatorId: activity.operator_id,
                type: this.mapPrismaActivityType(activity.type),
                action: activity.action,
                description: activity.description,
                timestamp: activity.created_at,
                status: this.mapPrismaActivityStatus(activity.status),
                branchId: activity.branch_id,
                details: activity.metadata ? JSON.parse(activity.metadata) : null,
                ipAddress: activity.ip_address,
                userAgent: activity.user_agent
            }));
            const result = { activities: mappedActivities, total };
            const isHistoricalData = page > 1;
            this.cache.set(cacheKey, result, isHistoricalData ? 2 * 60 * 60 * 1000 : undefined);
            return result;
        }
        catch (error) {
            this.logger.error(`Error al obtener actividades del operador ${operatorId}: ${error.message}`, error.stack);
            throw new common_1.InternalServerErrorException('Error al obtener las actividades del operador');
        }
    }
    mapActivityTypeToPrisma(type) {
        const typeMap = {
            [operator_activity_dto_1.ActivityType.LOGIN]: 'login',
            [operator_activity_dto_1.ActivityType.LOGOUT]: 'logout',
            [operator_activity_dto_1.ActivityType.CREATE]: 'create',
            [operator_activity_dto_1.ActivityType.UPDATE]: 'update',
            [operator_activity_dto_1.ActivityType.DELETE]: 'delete',
            [operator_activity_dto_1.ActivityType.VIEW]: 'view'
        };
        return typeMap[type] || 'view';
    }
    mapPrismaActivityType(type) {
        const typeMap = {
            'login': operator_activity_dto_1.ActivityType.LOGIN,
            'logout': operator_activity_dto_1.ActivityType.LOGOUT,
            'create': operator_activity_dto_1.ActivityType.CREATE,
            'update': operator_activity_dto_1.ActivityType.UPDATE,
            'delete': operator_activity_dto_1.ActivityType.DELETE,
            'view': operator_activity_dto_1.ActivityType.VIEW
        };
        return typeMap[type] || operator_activity_dto_1.ActivityType.VIEW;
    }
    mapActivityStatusToPrisma(status) {
        const statusMap = {
            [operator_activity_dto_1.ActivityStatus.PENDING]: 'pending',
            [operator_activity_dto_1.ActivityStatus.COMPLETED]: 'completed',
            [operator_activity_dto_1.ActivityStatus.FAILED]: 'failed',
            [operator_activity_dto_1.ActivityStatus.CANCELLED]: 'cancelled'
        };
        return statusMap[status] || 'completed';
    }
    mapPrismaActivityStatus(status) {
        const statusMap = {
            'pending': operator_activity_dto_1.ActivityStatus.PENDING,
            'completed': operator_activity_dto_1.ActivityStatus.COMPLETED,
            'failed': operator_activity_dto_1.ActivityStatus.FAILED,
            'cancelled': operator_activity_dto_1.ActivityStatus.CANCELLED
        };
        return statusMap[status] || operator_activity_dto_1.ActivityStatus.COMPLETED;
    }
    invalidateOperatorCache(operatorId) {
        this.logger.debug(`Invalidando caché del operador ${operatorId}`);
        const cacheKey = this.cache.getOperatorCacheKey(operatorId);
        this.cache.invalidate(cacheKey);
    }
    async verifyPassword(operatorId, currentPassword) {
        try {
            this.logger.debug(`Verificando contraseña para operador ${operatorId}...`);
            const operator = await this.prisma.operators.findUnique({
                where: { id: operatorId },
                select: { password: true }
            });
            if (!operator) {
                this.logger.warn(`Operador ${operatorId} no encontrado al verificar contraseña`);
                throw new common_1.NotFoundException('Operador no encontrado');
            }
            const isMatch = await bcrypt.compare(currentPassword, operator.password);
            if (!isMatch) {
                this.logger.warn(`Contraseña actual incorrecta para operador ${operatorId}`);
                return false;
            }
            this.logger.debug(`Contraseña verificada exitosamente para operador ${operatorId}`);
            return true;
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al verificar contraseña para operador ${operatorId}:`, error);
            throw new common_1.InternalServerErrorException('Error al verificar la contraseña');
        }
    }
    async updatePassword(operatorId, newPassword) {
        try {
            this.logger.debug(`Actualizando contraseña para operador ${operatorId}...`);
            const operator = await this.prisma.operators.findUnique({
                where: { id: operatorId },
                select: { id: true }
            });
            if (!operator) {
                this.logger.warn(`Operador ${operatorId} no encontrado al actualizar contraseña`);
                throw new common_1.NotFoundException('Operador no encontrado');
            }
            const salt = await bcrypt.genSalt();
            const hashedPassword = await bcrypt.hash(newPassword, salt);
            await this.prisma.operators.update({
                where: { id: operatorId },
                data: {
                    password: hashedPassword,
                    updated_at: new Date()
                }
            });
            this.invalidateOperatorCache(operatorId);
            this.logger.debug(`Contraseña actualizada exitosamente para operador ${operatorId}`);
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException) {
                throw error;
            }
            this.logger.error(`Error al actualizar contraseña para operador ${operatorId}:`, error);
            throw new common_1.InternalServerErrorException('Error al actualizar la contraseña');
        }
    }
};
exports.OperatorsService = OperatorsService;
exports.OperatorsService = OperatorsService = OperatorsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        operators_cache_service_1.OperatorsCacheService])
], OperatorsService);
//# sourceMappingURL=operators.service.js.map