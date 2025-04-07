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
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firestore_1 = require("firebase-admin/firestore");
const config_1 = require("@nestjs/config");
let FirebaseService = class FirebaseService {
    constructor(configService) {
        this.configService = configService;
        try {
            if (!admin.apps.length) {
                console.log('🔥 Inicializando Firebase Admin...');
                const projectId = this.configService.get('FIREBASE_PROJECT_ID');
                if (!projectId) {
                    console.error('❌ Error: FIREBASE_PROJECT_ID no está configurado en las variables de entorno');
                    throw new Error('FIREBASE_PROJECT_ID es requerido');
                }
                admin.initializeApp({
                    credential: admin.credential.applicationDefault(),
                    projectId: projectId
                });
                console.log('✅ Firebase Admin inicializado con proyecto:', projectId);
            }
            else {
                console.log('♻️ Reutilizando instancia existente de Firebase');
            }
            this.db = (0, firestore_1.getFirestore)();
        }
        catch (error) {
            console.error('❌ Error al inicializar Firebase:', error);
            throw error;
        }
    }
    async onModuleInit() {
        try {
            await this.db.collection('test').limit(1).get();
            console.log('✅ Conexión a Firestore verificada');
        }
        catch (error) {
            console.error('❌ Error al verificar servicios de Firebase:', error);
            throw error;
        }
    }
    async verifyCollection(collection) {
        try {
            console.log(`🔍 Verificando existencia de colección: ${collection}`);
            const snapshot = await this.db.collection(collection).limit(1).get();
            const exists = !snapshot.empty || (await this.db.collection(collection).listDocuments()).length > 0;
            console.log(`${exists ? '✅' : '⚠️'} Colección ${collection} ${exists ? 'existe' : 'no existe'}`);
            return exists;
        }
        catch (error) {
            console.error(`❌ Error al verificar colección ${collection}:`, error);
            return false;
        }
    }
    async create(collection, data) {
        try {
            await this.verifyCollection(collection);
            console.log(`📝 Creando documento en colección ${collection}:`, data);
            const docRef = await this.db.collection(collection).add({
                ...data,
                createdAt: new Date().toISOString()
            });
            console.log(`✅ Documento creado con ID: ${docRef.id}`);
            return docRef.id;
        }
        catch (error) {
            console.error(`❌ Error al crear documento en ${collection}:`, error);
            throw error;
        }
    }
    async findAll(collection) {
        try {
            console.log(`🔍 Buscando todos los documentos en colección ${collection}`);
            const snapshot = await this.db.collection(collection).get();
            const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`📊 Se encontraron ${documents.length} documentos`);
            return documents;
        }
        catch (error) {
            console.error(`❌ Error al buscar documentos en ${collection}:`, error);
            throw error;
        }
    }
    async findOne(collection, id) {
        try {
            console.log(`🔍 Buscando documento ${id} en colección ${collection}`);
            const doc = await this.db.collection(collection).doc(id).get();
            if (!doc.exists) {
                console.log('⚠️ Documento no encontrado');
                return null;
            }
            console.log('✅ Documento encontrado');
            return { id: doc.id, ...doc.data() };
        }
        catch (error) {
            console.error(`❌ Error al buscar documento ${id} en ${collection}:`, error);
            throw error;
        }
    }
    async update(collection, id, data) {
        try {
            console.log(`📝 Actualizando documento ${id} en colección ${collection}:`, data);
            await this.db.collection(collection).doc(id).update({
                ...data,
                updatedAt: new Date().toISOString()
            });
            console.log('✅ Documento actualizado correctamente');
        }
        catch (error) {
            console.error(`❌ Error al actualizar documento ${id} en ${collection}:`, error);
            throw error;
        }
    }
    async delete(collection, id) {
        try {
            console.log(`🗑️ Eliminando documento ${id} de colección ${collection}`);
            await this.db.collection(collection).doc(id).delete();
            console.log('✅ Documento eliminado correctamente');
        }
        catch (error) {
            console.error(`❌ Error al eliminar documento ${id} de ${collection}:`, error);
            throw error;
        }
    }
    async query(collection, conditions) {
        try {
            console.log(`🔍 Realizando consulta en colección ${collection}:`, conditions);
            let query = this.db.collection(collection);
            conditions.forEach(condition => {
                query = query.where(condition.field, condition.operator, condition.value);
            });
            const snapshot = await query.get();
            const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
            console.log(`📊 Se encontraron ${documents.length} documentos que coinciden con la consulta`);
            return documents;
        }
        catch (error) {
            console.error(`❌ Error al realizar consulta en ${collection}:`, error);
            throw error;
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map