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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoController = void 0;
const common_1 = require("@nestjs/common");
const cargo_service_1 = require("./cargo.service");
const rxjs_1 = require("rxjs");
const packages_service_1 = require("../packages/packages.service");
const prisma_service_1 = require("../prisma/prisma.service");
let CargoController = class CargoController {
    constructor(cargoService, packagesService, prisma) {
        this.cargoService = cargoService;
        this.packagesService = packagesService;
        this.prisma = prisma;
        console.log('🚀 CargoController inicializado');
    }
    async getPackages() {
        try {
            console.log('⚡ Obteniendo paquetes de CargoPanama');
            const result = await this.cargoService.getPackages();
            console.log(`✅ Se encontraron ${result.data.length} paquetes`);
            return result;
        }
        catch (error) {
            console.error('❌ Error al obtener paquetes:', error);
            throw new common_1.HttpException(error.message || 'Error al obtener paquetes', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async findByTracking(trackingNumber, request) {
        try {
            console.log('==================================');
            console.log(`🎯 GET /api/v1/cargo/tracking/${trackingNumber}`);
            console.log('📡 Headers:', JSON.stringify(request.headers, null, 2));
            console.log('🔍 Buscando tracking:', trackingNumber);
            const result = await this.cargoService.findByTracking(trackingNumber);
            console.log('✅ Paquete encontrado:', JSON.stringify(result, null, 2));
            return result;
        }
        catch (error) {
            console.error('❌ Error al buscar tracking:', error);
            throw new common_1.HttpException(error.message || 'Error al buscar tracking', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getExternalTracking(trackingNumber, req) {
        try {
            console.log('==================================');
            console.log(`🌐 GET /api/v1/cargo/external-tracking/${trackingNumber}`);
            console.log('🔍 Buscando tracking externo:', trackingNumber);
            if (!req.user?.id && !req.user?.sub) {
                console.log('🔑 No se detectó usuario en req.user, intentando extraer token manualmente...');
                const authHeader = req.headers.authorization;
                const token = authHeader?.split(' ')[1];
                const cookies = req.headers.cookie;
                const tokenFromCookie = cookies?.split(';')
                    .find(c => c.trim().startsWith('workexpress_token='))
                    ?.split('=')[1];
                if (token || tokenFromCookie) {
                    try {
                        const jwt = require('jsonwebtoken');
                        const selectedToken = token || tokenFromCookie;
                        const decoded = jwt.verify(selectedToken, process.env.JWT_SECRET || 'workexpress_secret_key');
                        console.log('✅ Token decodificado manualmente:', decoded);
                        req.user = {
                            id: decoded.sub,
                            sub: decoded.sub,
                            email: decoded.email,
                            role: decoded.role,
                            ...decoded
                        };
                        console.log('✅ Usuario extraído manualmente del token:', {
                            id: req.user.id || req.user.sub,
                            email: req.user.email,
                            role: req.user.role
                        });
                    }
                    catch (tokenError) {
                        console.error('❌ Error al decodificar token manualmente:', tokenError.message);
                    }
                }
            }
            console.log('👤 Usuario autenticado:', {
                id: req.user?.sub || req.user?.id,
                email: req.user?.email,
                role: req.user?.role
            });
            console.log('🔍 Verificando información de autenticación en el controlador de Cargo');
            if (!req.user) {
                console.log('⚠️ ADVERTENCIA: No hay información de usuario en req.user. Headers:', req.headers);
            }
            const userIdFromRequest = req.user?.sub || req.user?.id;
            const userEmailFromRequest = req.user?.email;
            const userRoleFromRequest = req.user?.role;
            console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
            let validOperatorId = null;
            let operatorEmail = 'system@workexpress.com';
            if (userIdFromRequest && userEmailFromRequest) {
                console.log('🔍 Procesando usuario autenticado:', {
                    id: userIdFromRequest,
                    email: userEmailFromRequest,
                    role: userRoleFromRequest || 'no_role'
                });
                try {
                    const operator = await this.prisma.operators.findUnique({
                        where: { id: userIdFromRequest },
                        select: { id: true, email: true }
                    });
                    if (operator) {
                        validOperatorId = operator.id;
                        operatorEmail = operator.email;
                        console.log('✅ Usuario autenticado encontrado como operador por ID exacto:', {
                            id: validOperatorId,
                            email: operatorEmail
                        });
                    }
                    else {
                        const operatorByEmail = await this.prisma.operators.findUnique({
                            where: { email: userEmailFromRequest },
                            select: { id: true, email: true }
                        });
                        if (operatorByEmail) {
                            validOperatorId = operatorByEmail.id;
                            operatorEmail = operatorByEmail.email;
                            console.log('✅ Usuario autenticado encontrado como operador por email exacto:', {
                                id: validOperatorId,
                                email: operatorEmail
                            });
                        }
                        else {
                            console.log('⚠️ Usuario autenticado no es un operador exacto:', userIdFromRequest);
                            if (userRoleFromRequest && ['admin', 'programador', 'manager'].includes(userRoleFromRequest.toLowerCase())) {
                                console.log('🔍 Usuario tiene rol privilegiado, buscando operador predeterminado...');
                                const defaultOperator = await this.prisma.operators.findFirst({
                                    where: {
                                        status: 'active',
                                        role: { in: ['admin', 'manager'] }
                                    },
                                    orderBy: { created_at: 'desc' },
                                    select: { id: true, email: true }
                                });
                                if (defaultOperator) {
                                    validOperatorId = defaultOperator.id;
                                    operatorEmail = defaultOperator.email;
                                    console.log('✅ Usando operador predeterminado (usuario tiene rol privilegiado):', {
                                        id: validOperatorId,
                                        email: operatorEmail
                                    });
                                }
                                else {
                                    console.log('⚠️ No se encontró operador predeterminado con rol privilegiado');
                                    const anyActiveOperator = await this.prisma.operators.findFirst({
                                        where: { status: 'active' },
                                        orderBy: { created_at: 'desc' },
                                        select: { id: true, email: true }
                                    });
                                    if (anyActiveOperator) {
                                        validOperatorId = anyActiveOperator.id;
                                        operatorEmail = anyActiveOperator.email;
                                        console.log('✅ Usando cualquier operador activo como último recurso:', {
                                            id: validOperatorId,
                                            email: operatorEmail
                                        });
                                    }
                                }
                            }
                        }
                    }
                }
                catch (error) {
                    console.error('❌ Error al verificar operador:', error);
                }
            }
            else {
                console.log('⚠️ No hay información de usuario en la solicitud, buscando operador predeterminado...');
                console.log('⚠️ Detalles de la solicitud:');
                console.log('- Headers de autorización:', req.headers.authorization ? 'Presente' : 'No presente');
                console.log('- Cookies:', req.headers.cookie || 'No hay cookies');
                try {
                    const defaultOperator = await this.prisma.operators.findFirst({
                        where: { status: 'active' },
                        orderBy: { created_at: 'desc' },
                        select: { id: true, email: true }
                    });
                    if (defaultOperator) {
                        validOperatorId = defaultOperator.id;
                        operatorEmail = defaultOperator.email;
                        console.log('✅ Usando operador predeterminado (no hay usuario autenticado):', {
                            id: validOperatorId,
                            email: operatorEmail
                        });
                    }
                }
                catch (error) {
                    console.error('❌ Error al buscar operador predeterminado:', error);
                }
            }
            const operatorData = {
                id: validOperatorId,
                email: operatorEmail
            };
            console.log('👤 Datos finales del operador para la creación del paquete:', operatorData);
            console.log('🔍 Verificando si ya existe en la base de datos local antes de buscar externamente...');
            const existingPackage = await this.packagesService.findByTracking(trackingNumber);
            if (existingPackage) {
                console.log('✅ Paquete ya existente en base de datos local:', existingPackage.id);
                console.log('📦 Datos del paquete existente:');
                console.log(JSON.stringify({
                    id: existingPackage.id,
                    trackingNumber: existingPackage.trackingNumber,
                    packageStatus: existingPackage.packageStatus,
                    weight: existingPackage.weight,
                    volumetricWeight: existingPackage.volumetricWeight,
                    dimensions: {
                        length: existingPackage.length,
                        width: existingPackage.width,
                        height: existingPackage.height
                    }
                }, null, 2));
                return {
                    tracking: existingPackage.trackingNumber,
                    status: existingPackage.packageStatus,
                    status_name: existingPackage.packageStatus === 'in_transit' ? 'EN TRÁNSITO' :
                        existingPackage.packageStatus === 'delivered' ? 'ENTREGADO' : 'PENDIENTE',
                    total_weight: String(existingPackage.weight || '0'),
                    vol_weight: String(existingPackage.volumetricWeight || '0'),
                    cargo_length: String(existingPackage.length || '0'),
                    cargo_width: String(existingPackage.width || '0'),
                    cargo_height: String(existingPackage.height || '0'),
                    unit: 'in',
                    mode: 'AIR',
                    shipper: 'WORKEXPRESS',
                };
            }
            console.log('🌐 Paquete no encontrado localmente, buscando en servicio externo...');
            const externalData = await (0, rxjs_1.firstValueFrom)(this.cargoService.getShipmentDetails(trackingNumber));
            console.log('🌐 Respuesta del servicio externo:');
            console.log(JSON.stringify(externalData, null, 2));
            if (externalData && externalData.tracking === trackingNumber) {
                console.log('✅ Paquete encontrado en servicio externo:', {
                    tracking: externalData.tracking,
                    status: externalData.status
                });
                console.log('📊 Analizando datos de respuesta externa:');
                console.log({
                    tracking: externalData.tracking || 'No disponible',
                    status: externalData.status || 'No disponible',
                    status_name: externalData.status_name || 'No disponible',
                    weight: {
                        total: externalData.total_weight || '0',
                        volumetric: externalData.vol_weight || '0'
                    },
                    dimensions: {
                        length: externalData.cargo_length || '0',
                        width: externalData.cargo_width || '0',
                        height: externalData.cargo_height || '0'
                    }
                });
                try {
                    console.log('💾 Guardando resultado de tracking externo en base de datos local...');
                    console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
                    const packageData = {
                        trackingNumber: externalData.tracking,
                        packageStatus: this.mapExternalStatus(externalData.status),
                        weight: parseFloat(externalData.total_weight) || 0,
                        volWeight: parseFloat(externalData.vol_weight) || 0,
                        volumetricWeight: parseFloat(externalData.vol_weight) || 0,
                        length: parseFloat(externalData.cargo_length) || 0,
                        width: parseFloat(externalData.cargo_width) || 0,
                        height: parseFloat(externalData.cargo_height) || 0,
                    };
                    console.log('📦 Datos transformados para createPackage:');
                    console.log(JSON.stringify(packageData, null, 2));
                    const savedPackage = await this.packagesService.createPackage(packageData, operatorData);
                    console.log('✅ Paquete guardado en base de datos local:', savedPackage?.id);
                    if (savedPackage) {
                        console.log('📦 Datos guardados en base de datos:');
                        console.log(JSON.stringify({
                            id: savedPackage.id,
                            tracking_number: savedPackage.tracking_number,
                            package_status: savedPackage.package_status,
                            weight: savedPackage.weight,
                            volumetric_weight: savedPackage.volumetric_weight,
                            dimensions: {
                                length: savedPackage.length,
                                width: savedPackage.width,
                                height: savedPackage.height
                            }
                        }, null, 2));
                    }
                }
                catch (saveError) {
                    console.error('❌ Error al guardar paquete en base de datos local:', saveError);
                    console.error('Detalles del error:', saveError.message);
                    if (saveError.stack) {
                        console.error('Stack trace:', saveError.stack);
                    }
                }
                return externalData;
            }
            console.log('❌ Paquete no encontrado en servicio externo');
            throw new common_1.HttpException('Package not found', common_1.HttpStatus.NOT_FOUND);
        }
        catch (error) {
            console.error('❌ Error en getExternalTracking:', error.message);
            console.error('Detalles completos del error:', error);
            throw new common_1.HttpException(error.message || 'Error getting external tracking', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    mapExternalStatus(externalStatus) {
        console.log('🔄 Mapeando estado externo:', externalStatus);
        const status = String(externalStatus || '').toLowerCase();
        const statusMap = {
            '1': 'in_transit',
            '2': 'delivered',
            '3': 'pending',
            '4': 'returned',
            '5': 'lost',
            '0': 'canceled',
            'en tránsito': 'in_transit',
            'entregado': 'delivered',
            'pendiente': 'pending',
            'devuelto': 'returned',
            'perdido': 'lost',
            'cancelado': 'canceled',
            'in transit': 'in_transit',
            'delivered': 'delivered',
            'pending': 'pending',
            'returned': 'returned',
            'lost': 'lost',
            'canceled': 'canceled'
        };
        const mappedStatus = statusMap[status] || 'pending';
        console.log('✅ Estado mapeado:', status, '->', mappedStatus);
        return mappedStatus;
    }
};
exports.CargoController = CargoController;
__decorate([
    (0, common_1.Get)('packages'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], CargoController.prototype, "getPackages", null);
__decorate([
    (0, common_1.Get)('tracking/:number'),
    __param(0, (0, common_1.Param)('number')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CargoController.prototype, "findByTracking", null);
__decorate([
    (0, common_1.Get)('external-tracking/:number'),
    __param(0, (0, common_1.Param)('number')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CargoController.prototype, "getExternalTracking", null);
exports.CargoController = CargoController = __decorate([
    (0, common_1.Controller)('cargo'),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => packages_service_1.PackagesService))),
    __metadata("design:paramtypes", [cargo_service_1.CargoService,
        packages_service_1.PackagesService,
        prisma_service_1.PrismaService])
], CargoController);
//# sourceMappingURL=cargo.controller.js.map