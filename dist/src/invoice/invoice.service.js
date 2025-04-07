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
exports.InvoiceService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let InvoiceService = class InvoiceService {
    constructor() {
        this.db = admin.firestore();
    }
    async create(createInvoiceDto) {
        try {
            const invoiceId = this.db.collection('invoices').doc().id;
            const customerId = createInvoiceDto.customer_id.toString().includes('/')
                ? createInvoiceDto.customer_id.toString().split('/').pop()
                : createInvoiceDto.customer_id.toString();
            const newInvoice = {
                invoiceId,
                userReference: customerId,
                totalAmount: createInvoiceDto.total_amount,
                isPaid: false,
                paymentMethod: 'PENDING',
                paymentDetails: null,
                invoiceStatus: createInvoiceDto.status || 'PENDING',
                createdTimestamp: new Date(),
                updatedTimestamp: new Date()
            };
            await this.db.collection('invoices').doc(invoiceId).set(newInvoice);
            return newInvoice;
        }
        catch (error) {
            throw new Error(`Error al crear la factura: ${error.message}`);
        }
    }
    async findAll() {
        try {
            const snapshot = await this.db.collection('invoices').get();
            if (snapshot.empty) {
                console.log('No se encontraron facturas');
                return [];
            }
            const invoices = [];
            for (const doc of snapshot.docs) {
                const data = doc.data();
                let clienteData = null;
                if (data.userReference) {
                    try {
                        const userId = data.userReference.replace('/users/', '');
                        console.log('🔍 Buscando cliente con ID:', userId);
                        const clienteRef = await this.db.collection('users').doc(userId).get();
                        if (clienteRef.exists) {
                            clienteData = clienteRef.data();
                            console.log('✅ Cliente encontrado:', clienteData);
                        }
                        else {
                            console.log('❌ Cliente no encontrado para ID:', userId);
                        }
                    }
                    catch (error) {
                        console.error('Error al obtener datos del cliente:', error);
                    }
                }
                invoices.push({
                    id: doc.id,
                    numero: data.invoiceId,
                    cliente: {
                        id: data.userReference.replace('/users/', ''),
                        name: clienteData?.displayName || clienteData?.fullName || clienteData?.name || "Cliente no encontrado",
                        email: clienteData?.email || "email@example.com"
                    },
                    email: clienteData?.email || "email@example.com",
                    fechaEmision: data.createdTimestamp.toDate().toISOString(),
                    fechaVencimiento: data.updatedTimestamp.toDate().toISOString(),
                    total: parseFloat(data.totalAmount) || 0,
                    estado: data.invoiceStatus === 'paid' ? 'PAGADO' : data.invoiceStatus.toUpperCase(),
                    items: data.packageReferences || []
                });
            }
            return invoices;
        }
        catch (error) {
            console.error('Error al obtener facturas:', error);
            throw new Error(`Error al obtener las facturas: ${error.message}`);
        }
    }
    async findOne(id) {
        try {
            const doc = await this.db.collection('invoices').doc(id.toString()).get();
            if (!doc.exists) {
                throw new common_1.NotFoundException(`Factura con ID ${id} no encontrada`);
            }
            return doc.data();
        }
        catch (error) {
            throw new Error(`Error al obtener la factura: ${error.message}`);
        }
    }
    async updateStatus(id, status) {
        try {
            const invoiceRef = this.db.collection('invoices').doc(id);
            await invoiceRef.update({
                invoiceStatus: status,
                updatedTimestamp: new Date()
            });
            const updatedDoc = await invoiceRef.get();
            return updatedDoc.data();
        }
        catch (error) {
            throw new Error(`Error al actualizar el estado: ${error.message}`);
        }
    }
    async remove(id) {
        try {
            await this.db.collection('invoices').doc(id.toString()).delete();
        }
        catch (error) {
            throw new Error(`Error al eliminar la factura: ${error.message}`);
        }
    }
};
exports.InvoiceService = InvoiceService;
exports.InvoiceService = InvoiceService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [])
], InvoiceService);
//# sourceMappingURL=invoice.service.js.map