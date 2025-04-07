import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private firestore: admin.firestore.Firestore;
  private storage: admin.storage.Storage;
  private readonly logger = new Logger(FirebaseService.name);

  constructor(private configService: ConfigService) {
    if (!admin.apps.length) {
      try {
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        const clientEmail = this.configService.get<string>('FIREBASE_CLIENT_EMAIL');
        const privateKey = this.configService.get<string>('FIREBASE_PRIVATE_KEY');
        const storageBucket = this.configService.get<string>('FIREBASE_STORAGE_BUCKET');

        if (!projectId || !clientEmail || !privateKey || !storageBucket) {
          throw new Error('Faltan variables de entorno de Firebase');
        }

        this.logger.log('🔑 Verificando configuración de Firebase:');
        this.logger.debug('- Project ID:', projectId);
        this.logger.debug('- Client Email:', clientEmail);
        this.logger.debug('- Private Key disponible:', !!privateKey);
        this.logger.debug('- Storage Bucket:', storageBucket);

        // Procesar la clave privada
        let processedPrivateKey = privateKey;
        
        // Si la clave está entre comillas dobles, removerlas
        if (processedPrivateKey.startsWith('"') && processedPrivateKey.endsWith('"')) {
          processedPrivateKey = processedPrivateKey.slice(1, -1);
        }
        
        // Reemplazar \\n con saltos de línea reales
        processedPrivateKey = processedPrivateKey.replace(/\\n/g, '\n');

        this.logger.log('🔧 Inicializando Firebase Admin SDK...');
        
        // Verificar formato del bucket
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
        
        // Configurar Firestore con la región nam5 y otras opciones
        this.firestore.settings({
          ignoreUndefinedProperties: true,
          timestampsInSnapshots: true,
          preferRest: true, // Usar REST API en lugar de gRPC
          host: 'firestore.googleapis.com', // Host por defecto
          ssl: true // Usar SSL
        });

        // Configurar la región para las operaciones de Firestore
        process.env.FIRESTORE_EMULATOR_HOST = 'nam5-firestore.googleapis.com';
        
        this.logger.log('🌎 Firestore configurado para usar la región nam5');
        this.storage = admin.storage();
        
        // Verificar acceso al bucket
        this.logger.log('🔍 Verificando acceso al bucket de Storage...');
        this.storage.bucket().exists().then((exists) => {
          if (!exists[0]) {
            this.logger.error('❌ El bucket no existe o no es accesible:', storageBucket);
          } else {
            this.logger.log('✅ Bucket de Storage verificado y accesible');
          }
        }).catch(error => {
          this.logger.error('❌ Error al verificar el bucket:', error);
        });

        this.logger.log('✅ Firestore y Storage inicializados');

      } catch (error) {
        this.logger.error('❌ Error al inicializar Firebase:', error);
        if (error instanceof Error) {
          this.logger.error('Detalles del error:', error.message);
          this.logger.error('Stack:', error.stack);
        }
        throw error;
      }
    } else {
      this.logger.log('♻️ Reutilizando instancia existente de Firebase');
      this.firestore = admin.firestore();
      this.storage = admin.storage();
    }
  }

  async onModuleInit() {
    try {
      // Verificar que Firestore esté disponible
      if (!this.firestore) {
        this.firestore = admin.firestore();
        // Desactivar conexiones persistentes para evitar errores de WebSocket
        this.firestore.settings({
          ignoreUndefinedProperties: true,
          // Configuración para evitar errores de WebSocket
          timestampsInSnapshots: true
        });
      }
      
      // Verificar la conexión a Firestore
      await this.firestore.listCollections();
      this.logger.log('✅ Conexión a Firestore verificada');
      
      // Verificar que Storage esté disponible
      if (!this.storage) {
        this.storage = admin.storage();
      }
      this.logger.log('✅ Conexión a Storage verificada');
      
      // Verificar que la autenticación funciona
      this.logger.log('🔍 Verificando conexión con Firebase Auth...');
      await admin.auth().listUsers(1);
      this.logger.log('✅ Conexión con Firebase Auth verificada');
      
      // Verificar acceso a colecciones críticas
      await this.verifyCollectionAccess('operators');
      await this.verifyCollectionAccess('activities');
      
    } catch (error) {
      this.logger.error('❌ Error al verificar servicios de Firebase:', error);
      throw error;
    }
  }

  private async verifyCollectionAccess(collectionName: string) {
    try {
      const snapshot = await this.firestore.collection(collectionName).limit(1).get();
      this.logger.log(`✅ Colección ${collectionName} accesible`);
      if (snapshot.size > 0) {
        this.logger.debug(`📄 Ejemplo de documento en ${collectionName}:`, snapshot.docs[0].data());
      }
    } catch (error) {
      this.logger.error(`❌ Error al acceder a la colección ${collectionName}:`, error);
      throw error;
    }
  }

  getFirestore(): admin.firestore.Firestore {
    if (!this.firestore) {
      this.logger.warn('⚠️ Firestore no inicializado, intentando reinicializar...');
      this.firestore = admin.firestore();
      // Desactivar conexiones persistentes para evitar errores de WebSocket
      this.firestore.settings({
        ignoreUndefinedProperties: true,
        // Configuración para evitar errores de WebSocket
        timestampsInSnapshots: true
      });
    }
    return this.firestore;
  }

  getStorage(): admin.storage.Storage {
    if (!this.storage) {
      this.logger.warn('⚠️ Storage no inicializado, intentando reinicializar...');
      this.storage = admin.storage();
    }
    return this.storage;
  }

  async uploadImage(imageBuffer: Buffer, path: string): Promise<string> {
    try {
      console.log('📤 Iniciando subida de imagen...');
      console.log('- Path:', path);
      
      const bucket = this.storage.bucket();
      
      // Verificar que el bucket existe
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

      // Hacer el archivo público
      await file.makePublic();

      // Obtener la URL pública
      const publicUrl = `https://storage.googleapis.com/${bucket.name}/${path}`;

      console.log('✅ Imagen subida exitosamente');
      console.log('🔗 URL pública:', publicUrl);

      return publicUrl;
    } catch (error) {
      console.error('❌ Error detallado al subir imagen:', error);
      if (error.code === 404) {
        throw new Error(`El bucket no existe o no es accesible. Verifique la configuración de FIREBASE_STORAGE_BUCKET`);
      }
      throw error;
    }
  }

  async collectionExists(collectionName: string): Promise<boolean> {
    try {
      const collection = await this.firestore.collection(collectionName).limit(1).get();
      return collection.size > 0;
    } catch (error) {
      console.error(`Error checking collection ${collectionName}:`, error);
      return false;
    }
  }

  async createCollection(collectionName: string): Promise<void> {
    try {
      // En Firestore, las colecciones se crean automáticamente al crear el primer documento
      await this.firestore.collection(collectionName).doc('_dummy_').set({
        _created: admin.firestore.FieldValue.serverTimestamp()
      });
      await this.firestore.collection(collectionName).doc('_dummy_').delete();
    } catch (error) {
      console.error(`Error creating collection ${collectionName}:`, error);
      throw error;
    }
  }

  async create(collection: string, data: any): Promise<string> {
    try {
      // Sanitizar los datos antes de guardar
      const sanitizedData = this.sanitizeData(data);
      
      const docRef = await this.firestore.collection(collection).add(sanitizedData);
      return docRef.id;
    } catch (error) {
      console.error(`Error creating document in ${collection}:`, error);
      throw error;
    }
  }

  async findOne(collection: string, id: string): Promise<any> {
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
    } catch (error) {
      this.logger.error(`❌ Error al buscar documento en ${collection}:`, error);
      this.logger.error('Stack:', error.stack);
      throw new Error(`Error al buscar documento en ${collection}: ${error.message}`);
    }
  }

  async findAll(collection: string): Promise<any[]> {
    try {
      const snapshot = await this.firestore.collection(collection).get();
      return snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
    } catch (error) {
      console.error(`Error finding all documents in ${collection}:`, error);
      throw error;
    }
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    try {
      const sanitizedData = this.sanitizeData(data);
      await this.firestore.collection(collection).doc(id).update(sanitizedData);
    } catch (error) {
      console.error(`Error updating document in ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      await this.firestore.collection(collection).doc(id).delete();
    } catch (error) {
      console.error(`Error deleting document in ${collection}:`, error);
      throw error;
    }
  }

  async query(collection: string, conditions: Array<{
    field: string;
    operator: admin.firestore.WhereFilterOp;
    value: any;
  }>): Promise<any[]> {
    try {
      this.logger.log(`🔍 Realizando consulta en colección ${collection}:`, conditions);

      let query: admin.firestore.Query = this.firestore.collection(collection);
      
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
    } catch (error) {
      this.logger.error(`❌ Error en consulta de ${collection}:`, error);
      this.logger.error('Stack:', error.stack);
      throw new Error(`Error al consultar la colección ${collection}: ${error.message}`);
    }
  }

  private sanitizeData(data: any): any {
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
} 