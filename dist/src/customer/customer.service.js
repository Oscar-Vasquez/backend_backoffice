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
exports.CustomerService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let CustomerService = class CustomerService {
    constructor() {
        this.db = admin.firestore();
    }
    async create(createCustomerDto) {
        try {
            const customerRef = this.db.collection('customers').doc();
            await customerRef.set({
                ...createCustomerDto,
                createdAt: admin.firestore.FieldValue.serverTimestamp(),
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                id: customerRef.id,
                ...createCustomerDto
            };
        }
        catch (error) {
            throw new Error(`Error al crear cliente: ${error.message}`);
        }
    }
    async findAll() {
        try {
            const snapshot = await this.db.collection('customers').get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            throw new Error(`Error al obtener clientes: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            const doc = await this.db.collection('customers').doc(id).get();
            if (!doc.exists) {
                throw new common_1.NotFoundException(`Cliente con ID ${id} no encontrado`);
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new Error(`Error al obtener cliente: ${error.message}`);
        }
    }
    async update(id, updateCustomerDto) {
        try {
            const doc = await this.db.collection('customers').doc(id).get();
            if (!doc.exists) {
                throw new common_1.NotFoundException(`Cliente con ID ${id} no encontrado`);
            }
            await this.db.collection('customers').doc(id).update({
                ...updateCustomerDto,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            return {
                id,
                ...doc.data(),
                ...updateCustomerDto
            };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new Error(`Error al actualizar cliente: ${error.message}`);
        }
    }
    async remove(id) {
        try {
            const doc = await this.db.collection('customers').doc(id).get();
            if (!doc.exists) {
                throw new common_1.NotFoundException(`Cliente con ID ${id} no encontrado`);
            }
            await this.db.collection('customers').doc(id).delete();
            return { message: 'Cliente eliminado correctamente' };
        }
        catch (error) {
            if (error instanceof common_1.NotFoundException)
                throw error;
            throw new Error(`Error al eliminar cliente: ${error.message}`);
        }
    }
};
exports.CustomerService = CustomerService;
exports.CustomerService = CustomerService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], CustomerService);
//# sourceMappingURL=customer.service.js.map