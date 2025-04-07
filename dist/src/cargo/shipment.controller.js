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
exports.ShipmentController = void 0;
const common_1 = require("@nestjs/common");
const cargo_service_1 = require("./cargo.service");
const rxjs_1 = require("rxjs");
const packages_service_1 = require("../packages/packages.service");
const jwt_auth_guard_1 = require("../auth/guards/jwt-auth.guard");
const prisma_service_1 = require("../prisma/prisma.service");
let ShipmentController = class ShipmentController {
    constructor(cargoService, packagesService, prisma) {
        this.cargoService = cargoService;
        this.packagesService = packagesService;
        this.prisma = prisma;
        console.log('🚀 ShipmentController inicializado');
    }
    async trackShipment(trackingNumber, req) {
        console.log('==================================');
        console.log(`🔍 GET /api/v1/shipments/track/${trackingNumber}`);
        console.log('🔍 Buscando información de envío:', trackingNumber);
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
        const userIdFromRequest = req.user?.sub || req.user?.id;
        const userEmailFromRequest = req.user?.email;
        const userRoleFromRequest = req.user?.role;
        console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
        console.log('🔍 Procesando usuario autenticado:', {
            id: userIdFromRequest,
            email: userEmailFromRequest,
            role: userRoleFromRequest || 'no_role'
        });
        let validOperatorId = null;
        let operatorEmail = 'system@workexpress.com';
        if (userIdFromRequest && userEmailFromRequest) {
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
        try {
            const localPackage = await this.packagesService.findByTracking(trackingNumber);
            if (localPackage) {
                console.log('✅ Paquete encontrado en la base de datos local:', localPackage.id);
                console.log('📦 Datos del paquete local:');
                console.log(JSON.stringify({
                    id: localPackage.id,
                    trackingNumber: localPackage.trackingNumber,
                    packageStatus: localPackage.packageStatus,
                    weight: localPackage.weight,
                    volumetricWeight: localPackage.volumetricWeight,
                    dimensions: {
                        length: localPackage.length,
                        width: localPackage.width,
                        height: localPackage.height
                    },
                    createdAt: localPackage.createdAt
                }, null, 2));
                return {
                    tracking: localPackage.trackingNumber,
                    status: localPackage.packageStatus,
                    status_name: this.getStatusName(localPackage.packageStatus),
                    total_weight: localPackage.weight?.toString() || '0',
                    vol_weight: localPackage.volumetricWeight?.toString() || '0',
                    cargo_length: localPackage.length?.toString() || '0',
                    cargo_width: localPackage.width?.toString() || '0',
                    cargo_height: localPackage.height?.toString() || '0',
                    unit: 'in',
                    mode_name: 'AIR',
                    shipper: 'WORKEXPRESS',
                    datecreated: localPackage.createdAt || new Date().toISOString(),
                    success: true
                };
            }
            console.log('🔄 Paquete no encontrado localmente, buscando en servicio externo...');
            const shipmentDetails = await (0, rxjs_1.firstValueFrom)(this.cargoService.getShipmentDetails(trackingNumber)).catch(error => {
                console.error('❌ Error en la llamada a getShipmentDetails:', error);
                return null;
            });
            if (!shipmentDetails) {
                console.log('❌ No se encontraron detalles para el tracking:', trackingNumber);
                throw new common_1.HttpException(`No se encontró información para el tracking: ${trackingNumber}`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log('✅ Información de envío encontrada en servicio externo:', {
                tracking: shipmentDetails.tracking,
                status: shipmentDetails.status,
                statusName: shipmentDetails.status_name || shipmentDetails.mode_name
            });
            console.log('📋 Respuesta completa del servicio externo:');
            console.log(JSON.stringify(shipmentDetails, null, 2));
            try {
                console.log('📦 Guardando información en base de datos usando Prisma...');
                console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
                const validTrackingNumber = shipmentDetails.tracking || trackingNumber;
                const mappedStatus = this.mapExternalStatus(shipmentDetails.status);
                console.log(`🔄 Estado mapeado: ${shipmentDetails.status} -> ${mappedStatus}`);
                const packageData = {
                    trackingNumber: validTrackingNumber,
                    packageStatus: mappedStatus,
                    weight: parseFloat(shipmentDetails.total_weight) || 0,
                    volumetricWeight: parseFloat(shipmentDetails.vol_weight) || 0,
                    volWeight: parseFloat(shipmentDetails.vol_weight) || 0,
                    length: parseFloat(shipmentDetails.cargo_length) || 0,
                    width: parseFloat(shipmentDetails.cargo_width) || 0,
                    height: parseFloat(shipmentDetails.cargo_height) || 0,
                    insurance: false,
                    shippingStages: [{
                            location: shipmentDetails.destination || "Miami Warehouse",
                            photo: "",
                            stage: "En tránsito",
                            status: shipmentDetails.status || "in transit",
                            updatedTimestamp: shipmentDetails.datecreated || new Date().toISOString()
                        }]
                };
                console.log('📦 Datos a guardar en la base de datos:');
                console.log(JSON.stringify(packageData, null, 2));
                const savedPackage = await this.packagesService.createPackage(packageData, operatorData);
                console.log('✅ Paquete guardado exitosamente en base de datos con Prisma:', savedPackage?.id);
                if (savedPackage) {
                    console.log('📦 Datos guardados en base de datos:');
                    console.log(JSON.stringify({
                        id: savedPackage.id,
                        tracking_number: savedPackage.tracking_number,
                        package_status: savedPackage.package_status,
                        weight: savedPackage.weight,
                        volumetric_weight: savedPackage.volumetric_weight
                    }, null, 2));
                }
            }
            catch (saveError) {
                console.error('⚠️ Error al guardar paquete en base de datos:', saveError);
                console.error('Detalles del error:', saveError.message);
            }
            if (!shipmentDetails.tracking) {
                shipmentDetails.tracking = trackingNumber;
            }
            if (!shipmentDetails.status) {
                shipmentDetails.status = 'pending';
            }
            if (!shipmentDetails.status_name && !shipmentDetails.mode_name) {
                shipmentDetails.status_name = 'PENDIENTE';
            }
            return shipmentDetails;
        }
        catch (error) {
            console.error('❌ Error al buscar shipment:', error);
            throw new common_1.HttpException(error.message || 'Error al buscar información del envío', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getTrackingDetails(trackingNumber, req) {
        try {
            console.log('==================================');
            console.log(`🔍 GET /api/v1/shipments/track-details/${trackingNumber}`);
            console.log('🔍 Buscando detalles completos del envío:', trackingNumber);
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
            const userIdFromRequest = req.user?.sub || req.user?.id;
            const userEmailFromRequest = req.user?.email;
            const userRoleFromRequest = req.user?.role;
            console.log('🔍 Verificando si el usuario autenticado es un operador válido...');
            console.log('🔍 Procesando usuario autenticado:', {
                id: userIdFromRequest,
                email: userEmailFromRequest,
                role: userRoleFromRequest || 'no_role'
            });
            let validOperatorId = null;
            let operatorEmail = 'system@workexpress.com';
            if (userIdFromRequest && userEmailFromRequest) {
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
            const localPackage = await this.packagesService.findByTracking(trackingNumber);
            if (localPackage) {
                console.log('✅ Paquete encontrado en la base de datos local');
                let destination = '';
                if (Array.isArray(localPackage.shippingStages) && localPackage.shippingStages.length > 0) {
                    const firstStage = localPackage.shippingStages[0];
                    destination = firstStage.location || '';
                }
                return {
                    tracking: localPackage.trackingNumber,
                    status: {
                        code: localPackage.packageStatus,
                        name: this.getStatusName(localPackage.packageStatus)
                    },
                    dimensions: {
                        length: localPackage.length?.toString() || '0',
                        width: localPackage.width?.toString() || '0',
                        height: localPackage.height?.toString() || '0',
                        unit: 'in'
                    },
                    weight: {
                        total: localPackage.weight?.toString() || '0',
                        volumetric: localPackage.volumetricWeight?.toString() || '0'
                    },
                    shipment: {
                        mode: 'AIR',
                        carrier: 'WORKEXPRESS',
                        receipt: ''
                    },
                    dates: {
                        created: localPackage.createdAt || new Date().toISOString()
                    },
                    destination: destination,
                    consignee: '',
                    source: 'local'
                };
            }
            console.log('🔄 Paquete no encontrado localmente, buscando en servicio externo...');
            const shipmentDetails = await (0, rxjs_1.firstValueFrom)(this.cargoService.getShipmentDetails(trackingNumber)).catch(error => {
                console.error('❌ Error en la llamada a getShipmentDetails:', error);
                return null;
            });
            if (!shipmentDetails) {
                throw new common_1.HttpException(`No se encontró información para el tracking: ${trackingNumber}`, common_1.HttpStatus.NOT_FOUND);
            }
            console.log('✅ Detalles de envío encontrados en servicio externo');
            try {
                console.log('📦 Guardando información en base de datos con Prisma...');
                console.log('👤 Usando el ID del operador actual para operator_id:', operatorData.id);
                const validTrackingNumber = shipmentDetails.tracking || trackingNumber;
                const packageData = {
                    trackingNumber: validTrackingNumber,
                    packageStatus: this.mapExternalStatus(shipmentDetails.status),
                    weight: parseFloat(shipmentDetails.total_weight) || 0,
                    volumetricWeight: parseFloat(shipmentDetails.vol_weight) || 0,
                    volWeight: parseFloat(shipmentDetails.vol_weight) || 0,
                    length: parseFloat(shipmentDetails.cargo_length) || 0,
                    width: parseFloat(shipmentDetails.cargo_width) || 0,
                    height: parseFloat(shipmentDetails.cargo_height) || 0,
                    insurance: false,
                    shippingStages: [{
                            location: shipmentDetails.destination || "Miami Warehouse",
                            photo: "",
                            stage: "En tránsito",
                            status: shipmentDetails.status || "in transit",
                            updatedTimestamp: shipmentDetails.datecreated || new Date().toISOString()
                        }]
                };
                await this.packagesService.createPackage(packageData, operatorData);
                console.log('✅ Paquete guardado exitosamente en base de datos con Prisma');
            }
            catch (saveError) {
                console.error('⚠️ Error al guardar paquete en base local:', saveError);
            }
            return {
                tracking: shipmentDetails.tracking || trackingNumber,
                status: {
                    code: shipmentDetails.status || 'pending',
                    name: shipmentDetails.status_name || shipmentDetails.mode_name || 'PENDIENTE'
                },
                dimensions: {
                    length: shipmentDetails.cargo_length || '0',
                    width: shipmentDetails.cargo_width || '0',
                    height: shipmentDetails.cargo_height || '0',
                    unit: shipmentDetails.unit || 'in'
                },
                weight: {
                    total: shipmentDetails.total_weight || '0',
                    volumetric: shipmentDetails.vol_weight || '0'
                },
                shipment: {
                    mode: shipmentDetails.mode_name || 'AIR',
                    carrier: shipmentDetails.shipper || 'WORKEXPRESS',
                    receipt: shipmentDetails.receipt
                },
                dates: {
                    created: shipmentDetails.datecreated || new Date().toISOString()
                },
                destination: shipmentDetails.destination,
                consignee: shipmentDetails.consignee_fullname,
                source: 'external'
            };
        }
        catch (error) {
            console.error('❌ Error al obtener detalles del envío:', error);
            throw new common_1.HttpException(error.message || 'Error al obtener detalles del envío', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getStatusName(statusCode) {
        const statusMap = {
            'pending': 'Pendiente',
            'in_transit': 'En Tránsito',
            'delivered': 'Entregado',
            'canceled': 'Cancelado',
            'returned': 'Devuelto',
            'lost': 'Extraviado',
            'INVOICED': 'Facturado',
            'PENDING': 'Pendiente',
            'APPROVED': 'Aprobado',
            'REJECTED': 'Rechazado'
        };
        return statusMap[statusCode] || statusCode || 'Desconocido';
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
exports.ShipmentController = ShipmentController;
__decorate([
    (0, common_1.Get)('track/:trackingNumber'),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "trackShipment", null);
__decorate([
    (0, common_1.Get)('track-details/:trackingNumber'),
    __param(0, (0, common_1.Param)('trackingNumber')),
    __param(1, (0, common_1.Req)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], ShipmentController.prototype, "getTrackingDetails", null);
exports.ShipmentController = ShipmentController = __decorate([
    (0, common_1.Controller)('shipments'),
    (0, common_1.UseGuards)(jwt_auth_guard_1.JwtAuthGuard),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => packages_service_1.PackagesService))),
    __metadata("design:paramtypes", [cargo_service_1.CargoService,
        packages_service_1.PackagesService,
        prisma_service_1.PrismaService])
], ShipmentController);
//# sourceMappingURL=shipment.controller.js.map