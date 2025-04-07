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
Object.defineProperty(exports, "__esModule", { value: true });
exports.CargoService = void 0;
const common_1 = require("@nestjs/common");
const axios_1 = require("@nestjs/axios");
const config_1 = require("@nestjs/config");
const operators_1 = require("rxjs/operators");
const axios_2 = require("axios");
let CargoService = class CargoService {
    constructor(configService, httpService) {
        this.configService = configService;
        this.httpService = httpService;
        this.baseUrl = 'https://crm.panacargalogistic.com/paqueteria/busqueda/all/all';
    }
    async getPackages() {
        try {
            const response = await axios_2.default.get(this.configService.get('CARGOPANAMA_API_URL'), {
                params: {
                    length: 500,
                    start: 0,
                    mode: 'all',
                    interval: 'last_5d'
                },
                headers: {
                    'authtoken': this.configService.get('CARGOPANAMA_AUTH_TOKEN'),
                    'Content-Type': 'application/json'
                }
            });
            if (response.data && response.data.data) {
                return {
                    success: true,
                    data: response.data.data.map((item) => ({
                        hash: item.hash,
                        clientId: item.client_id,
                        clientName: item.client_name,
                        packageName: item.package_name,
                        receipt: item.receipt,
                        tracking: item.tracking,
                        mode: item.mode,
                        shipper: item.shipper,
                        totalItems: item.total_items,
                        totalWeight: item.total_weight,
                        volWeight: item.vol_weight,
                        dimensions: {
                            length: item.cargo_length,
                            width: item.cargo_width,
                            height: item.cargo_height,
                            unit: item.unit
                        },
                        status: item.status,
                        statusName: item.status_name,
                        dateCreated: item.datecreated,
                        dateUpdated: item.dateupdated
                    }))
                };
            }
            throw new common_1.HttpException('No se encontraron datos', common_1.HttpStatus.NOT_FOUND);
        }
        catch (error) {
            console.error('Error al obtener paquetes:', error.response?.data || error.message);
            throw new common_1.HttpException(error.response?.data?.message || 'Error al consultar paquetes', error.response?.status || common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    getShipmentDetails(trackingNumber) {
        const headers = {
            'accept': 'application/json, text/javascript, */*; q=0.01',
            'accept-encoding': 'gzip, deflate, br, zstd',
            'accept-language': 'es-419,es;q=0.9',
            'x-requested-with': 'XMLHttpRequest',
            'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
            'referer': `https://crm.panacargalogistic.com/paqueteria/resultado/${trackingNumber}`,
        };
        const params = {
            'csrf_token_name': '75a8fce5283677258d9f6614dccc4206',
            'draw': '1',
            'columns[0][data]': 'hash',
            'columns[0][searchable]': 'true',
            'columns[1][data]': 'status',
            'columns[2][data]': 'mode_name',
            'columns[3][data]': 'receipt',
            'columns[4][data]': 'datecreated',
            'columns[6][data]': 'tracking',
            'columns[8][data]': 'consignee_fullname',
            'start': '0',
            'length': '30',
            'search[value]': trackingNumber,
            'search[regex]': 'false',
        };
        return this.httpService.get(this.baseUrl, { headers, params }).pipe((0, operators_1.map)((response) => {
            if (response.status === 200 && response.data.data && response.data.data.length > 0) {
                const shipment = response.data.data[0];
                const fullDetails = {
                    cargo_height: shipment.cargo_height,
                    cargo_length: shipment.cargo_length,
                    cargo_width: shipment.cargo_width,
                    consignee_fullname: shipment.consignee_fullname,
                    consignee_id: shipment.consignee_id,
                    datecreated: shipment.datecreated,
                    destination: shipment.destination,
                    destionation_id: shipment.destionation_id,
                    hash: shipment.hash,
                    hast_files: shipment.hast_files,
                    is_communal: shipment.is_communal,
                    mode_id: shipment.mode_id,
                    mode_name: shipment.mode_name,
                    origin_name: shipment.origin_name,
                    origin_shortname: shipment.origin_shortname,
                    other: shipment.other,
                    parent: shipment.parent,
                    photo: shipment.photo,
                    receipt: shipment.receipt,
                    shipment: shipment.shipment,
                    shipper: shipment.shipper,
                    status: shipment.status,
                    status_name: shipment.status_name,
                    total_cft: shipment.total_cft,
                    total_items: shipment.total_items,
                    total_pcs: shipment.total_pcs,
                    total_weight: shipment.total_weight,
                    tracking: shipment.tracking,
                    unit: shipment.unit,
                    vol_weight: shipment.vol_weight,
                    vol_weight_kg: shipment.vol_weight_kg,
                    message: response.data.message,
                    recordsFiltered: response.data.recordsFiltered,
                    recordsTotal: response.data.recordsTotal,
                    success: response.data.success
                };
                return fullDetails;
            }
            return null;
        }));
    }
    async findByTracking(trackingNumber) {
        const intervals = ['last_2d', 'last_3d', 'last_5d'];
        for (const interval of intervals) {
            try {
                console.log(`🔍 Buscando tracking en intervalo ${interval}:`, trackingNumber);
                const result = await this.searchWithParams(trackingNumber, { interval });
                if (result)
                    return result;
            }
            catch (error) {
                console.error(`❌ Error en intervalo ${interval}:`, error.message);
                continue;
            }
        }
        const dates = [];
        const today = new Date();
        for (let i = 0; i < 30; i++) {
            const date = new Date(today);
            date.setDate(date.getDate() - i);
            dates.push(date.toISOString().split('T')[0]);
        }
        for (const date of dates) {
            try {
                console.log(`🔍 Buscando tracking en fecha ${date}:`, trackingNumber);
                const result = await this.searchWithParams(trackingNumber, { date });
                if (result)
                    return result;
                await new Promise(resolve => setTimeout(resolve, 1000));
            }
            catch (error) {
                console.error(`❌ Error en fecha ${date}:`, error.message);
                continue;
            }
        }
        throw new common_1.HttpException(`No se encontró ningún paquete con el tracking: ${trackingNumber}`, common_1.HttpStatus.NOT_FOUND);
    }
    async searchWithParams(trackingNumber, params) {
        try {
            console.log('🔍 Parámetros de búsqueda:', { trackingNumber, ...params });
            const response = await axios_2.default.get(this.configService.get('CARGOPANAMA_API_URL'), {
                params: {
                    tracking: trackingNumber,
                    length: 500,
                    start: 0,
                    mode: 'all',
                    ...params
                },
                headers: {
                    'authtoken': this.configService.get('CARGOPANAMA_AUTH_TOKEN'),
                    'Content-Type': 'application/json'
                }
            });
            console.log('📦 Respuesta API:', {
                status: response.status,
                hasData: !!response.data,
                dataLength: response.data?.data?.length || 0
            });
            if (!response.data?.data?.length) {
                console.log('❌ No hay datos en la respuesta');
                return null;
            }
            const packageData = response.data.data.find((item) => item.tracking === trackingNumber);
            if (!packageData) {
                console.log('❌ No se encontró el tracking específico');
                return null;
            }
            console.log('✅ Paquete encontrado:', {
                tracking: packageData.tracking,
                status: packageData.status_name
            });
            return {
                success: true,
                data: {
                    hash: packageData.hash,
                    clientId: packageData.client_id,
                    clientName: packageData.client_name,
                    packageName: packageData.package_name,
                    receipt: packageData.receipt,
                    tracking: packageData.tracking,
                    mode: packageData.mode,
                    shipper: packageData.shipper,
                    totalItems: packageData.total_items,
                    totalWeight: packageData.total_weight,
                    volWeight: packageData.vol_weight,
                    dimensions: {
                        length: packageData.cargo_length,
                        width: packageData.cargo_width,
                        height: packageData.cargo_height,
                        unit: packageData.unit
                    },
                    status: packageData.status,
                    statusName: packageData.status_name,
                    dateCreated: packageData.datecreated,
                    dateUpdated: packageData.dateupdated
                }
            };
        }
        catch (error) {
            console.error('❌ Error en searchWithParams:', {
                message: error.message,
                params,
                response: error.response?.data
            });
            return null;
        }
    }
};
exports.CargoService = CargoService;
exports.CargoService = CargoService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        axios_1.HttpService])
], CargoService);
//# sourceMappingURL=cargo.service.js.map