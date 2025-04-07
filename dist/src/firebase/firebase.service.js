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
var FirebaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const admin = require("firebase-admin");
let FirebaseService = FirebaseService_1 = class FirebaseService {
    constructor(configService) {
        this.configService = configService;
        this.logger = new common_1.Logger(FirebaseService_1.name);
        if (!admin.apps.length) {
            try {
                const projectId = this.configService.get('FIREBASE_PROJECT_ID');
                const clientEmail = this.configService.get('FIREBASE_CLIENT_EMAIL');
                const privateKey = this.configService.get('FIREBASE_PRIVATE_KEY');
                const storageBucket = this.configService.get('FIREBASE_STORAGE_BUCKET');
                if (!projectId || !clientEmail || !privateKey || !storageBucket) {
                    throw new Error('Faltan variables de entorno de Firebase');
                }
                this.logger.log('🔑 Verificando configuración de Firebase:');
                this.logger.debug('- Project ID:', projectId);
                this.logger.debug('- Client Email:', clientEmail);
                this.logger.debug('- Private Key disponible:', !!privateKey);
                this.logger.debug('- Storage Bucket:', storageBucket);
                let processedPrivateKey = privateKey;
                if (processedPrivateKey.startsWith('"') && processedPrivateKey.endsWith('"')) {
                    processedPrivateKey = processedPrivateKey.slice(1, -1);
                }
                processedPrivateKey = processedPrivateKey.replace(/\\n/g, '\n');
                this.logger.log('🔧 Inicializando Firebase Admin SDK...');
                if (!storageBucket.includes('.appspot.com')) {
                    this.logger.warn('⚠️ El formato del bucket puede ser incorrecto. Debería ser: projectId.appspot.com');
                }
                const credential = admin.credential.cert({
                    projectId,
                    clientEmail,
                    privateKey: processedPrivateKey,
                });
                admin.initializeApp({
                    credential,
                    storageBucket: storageBucket
                });
                this.logger.log('✅ Firebase Admin SDK inicializado correctamente');
                this.firestore = admin.firestore();
                this.firestore.settings({
                    ignoreUndefinedProperties: true,
                    timestampsInSnapshots: true,
                    preferRest: true,
                    host: 'firestore.googleapis.com',
                    ssl: true
                });
                process.env.FIRESTORE_EMULATOR_HOST = 'nam5-firestore.googleapis.com';
                this.logger.log('🌎 Firestore configurado para usar la región nam5');
                this.storage = admin.storage();
                this.logger.log('🔍 Verificando acceso al bucket de Storage...');
                this.storage.bucket().exists().then((exists) => {
                    if (!exists[0]) {
                        this.logger.error('❌ El bucket no existe o no es accesible:', storageBucket);
                    }
                    else {
                        this.logger.log('✅ Bucket de Storage verificado y accesible');
                    }
                }).catch(error => {
                    this.logger.error('❌ Error al verificar el bucket:', error);
                });
                this.logger.log('✅ Firestore y Storage inicializados');
            }
            catch (error) {
                this.logger.error('❌ Error al inicializar Firebase:', error);
                if (error instanceof Error) {
                    this.logger.error('Detalles del error:', error.message);
                    this.logger.error('Stack:', error.stack);
                }
                throw error;
            }
        }
        else {
            this.logger.log('♻️ Reutilizando instancia existente de Firebase');
            this.firestore = admin.firestore();
            this.storage = admin.storage();
        }
    }
    async onModuleInit() {
        try {
            if (!this.firestore) {
                this.firestore = admin.firestore();
                this.firestore.settings({
                    ignoreUndefinedProperties: true,
                    timestampsInSnapshots: true
                });
            }
            await this.firestore.listCollections();
            this.logger.log('✅ Conexión a Firestore verificada');
            if (!this.storage) {
                this.storage = admin.storage();
            }
            this.logger.log('✅ Conexión a Storage verificada');
            this.logger.log('🔍 Verificando conexión con Firebase Auth...');
            await admin.auth().listUsers(1);
            this.logger.log('✅ Conexión con Firebase Auth verificada');
            await this.verifyCollectionAccess('operators');
            await this.verifyCollectionAccess('activities');
        }
        catch (error) {
            this.logger.error('❌ Error al verificar servicios de Firebase:', error);
            throw error;
        }
    }
    async verifyCollectionAccess(collectionName) {
        try {
            const snapshot = await this.firestore.collection(collectionName).limit(1).get();
            this.logger.log(`✅ Colección ${collectionName} accesible`);
            if (snapshot.size > 0) {
                this.logger.debug(`📄 Ejemplo de documento en ${collectionName}:`, snapshot.docs[0].data());
            }
        }
        catch (error) {
            this.logger.error(`❌ Error al acceder a la colección ${collectionName}:`, error);
            throw error;
        }
    }
    getFirestore() {
        if (!this.firestore) {
            this.logger.warn('⚠️ Firestore no inicializado, intentando reinicializar...');
            this.firestore = admin.firestore();
            this.firestore.settings({
                ignoreUndefinedProperties: true,
                timestampsInSnapshots: true
            });
        }
        return this.firestore;
    }
    getStorage() {
        if (!this.storage) {
            this.logger.warn('⚠️ Storage no inicializado, intentando reinicializar...');
            this.storage = admin.storage();
        }
        return this.storage;
    }
    async uploadImage(imageBuffer, path) {
        try {
            console.log('📤 Iniciando subida de imagen...');
            console.log('- Path:', path);
            const bucket = this.storage.bucket();
            const [exists] = await bucket.exists();
            if (!exists) {
                throw new Error(`El bucket ${bucket.name} no existe o no es accesible`);
            }
            console.log('✅ Bucket verificado:', bucket.name);
            const file = bucket.file(path);
            console.log('📁 Guardando archivo...');
            await file.save(imageBuffer, {
                metadata: {
                    contentType: 'image/jpeg'
                }
            });
            await file.makePublic();
            const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;
            console.log('✅ Imagen subida exitosamente');
            console.log('🔗 URL pública:', publicUrl);
            return publicUrl;
        }
        catch (error) {
            console.error('❌ Error detallado al subir imagen:', error);
            if (error.code === 404) {
                throw new Error(`El bucket no existe o no es accesible. Verifique la configuración de FIREBASE_STORAGE_BUCKET`);
            }
            throw error;
        }
    }
    async collectionExists(collectionName) {
        try {
            const collection = await this.firestore.collection(collectionName).limit(1).get();
            return collection.size > 0;
        }
        catch (error) {
            console.error(`Error checking collection ${collectionName}:`, error);
            return false;
        }
    }
    async createCollection(collectionName) {
        try {
            await this.firestore.collection(collectionName).doc('_dummy_').set({
                _created: admin.firestore.FieldValue.serverTimestamp()
            });
            await this.firestore.collection(collectionName).doc('_dummy_').delete();
        }
        catch (error) {
            console.error(`Error creating collection ${collectionName}:`, error);
            throw error;
        }
    }
    async create(collection, data) {
        try {
            const sanitizedData = this.sanitizeData(data);
            const docRef = await this.firestore.collection(collection).add(sanitizedData);
            return docRef.id;
        }
        catch (error) {
            console.error(`Error creating document in ${collection}:`, error);
            throw error;
        }
    }
    async findOne(collection, id) {
        try {
            this.logger.log(`🔍 Buscando documento ${id} en colección ${collection}`);
            const doc = await this.firestore.collection(collection).doc(id).get();
            if (!doc.exists) {
                this.logger.warn(`⚠️ Documento no encontrado: ${collection}/${id}`);
                return null;
            }
            const data = { id: doc.id, ...doc.data() };
            this.logger.log('✅ Documento encontrado');
            this.logger.debug('📄 Datos:', data);
            return data;
        }
        catch (error) {
            this.logger.error(`❌ Error al buscar documento en ${collection}:`, error);
            this.logger.error('Stack:', error.stack);
            throw new Error(`Error al buscar documento en ${collection}: ${error.message}`);
        }
    }
    async findAll(collection) {
        try {
            const snapshot = await this.firestore.collection(collection).get();
            return snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
        }
        catch (error) {
            console.error(`Error finding all documents in ${collection}:`, error);
            throw error;
        }
    }
    async update(collection, id, data) {
        try {
            const sanitizedData = this.sanitizeData(data);
            await this.firestore.collection(collection).doc(id).update(sanitizedData);
        }
        catch (error) {
            console.error(`Error updating document in ${collection}:`, error);
            throw error;
        }
    }
    async delete(collection, id) {
        try {
            await this.firestore.collection(collection).doc(id).delete();
        }
        catch (error) {
            console.error(`Error deleting document in ${collection}:`, error);
            throw error;
        }
    }
    async query(collection, conditions) {
        try {
            this.logger.log(`🔍 Realizando consulta en colección ${collection}:`, conditions);
            let query = this.firestore.collection(collection);
            for (const condition of conditions) {
                this.logger.debug(`- Aplicando condición: ${condition.field} ${condition.operator} ${condition.value}`);
                query = query.where(condition.field, condition.operator, condition.value);
            }
            const snapshot = await query.get();
            this.logger.log(`📊 Se encontraron ${snapshot.size} documentos que coinciden con la consulta`);
            const results = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            this.logger.debug('📄 Resultados:', results);
            return results;
        }
        catch (error) {
            this.logger.error(`❌ Error en consulta de ${collection}:`, error);
            this.logger.error('Stack:', error.stack);
            throw new Error(`Error al consultar la colección ${collection}: ${error.message}`);
        }
    }
    sanitizeData(data) {
        if (data === undefined) {
            return null;
        }
        if (Array.isArray(data)) {
            return data.map(item => this.sanitizeData(item));
        }
        if (typeof data === 'object' && data !== null) {
            const sanitized = {};
            for (const [key, value] of Object.entries(data)) {
                sanitized[key] = this.sanitizeData(value);
            }
            return sanitized;
        }
        return data;
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = FirebaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map