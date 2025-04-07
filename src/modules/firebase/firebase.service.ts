import { Injectable, OnModuleInit } from '@nestjs/common';
import * as admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class FirebaseService implements OnModuleInit {
  private db: FirebaseFirestore.Firestore;

  constructor(private configService: ConfigService) {
    try {
      // Verificar si ya hay una instancia de Firebase
      if (!admin.apps.length) {
        console.log('🔥 Inicializando Firebase Admin...');
        
        // Intentar obtener la configuración del proyecto
        const projectId = this.configService.get<string>('FIREBASE_PROJECT_ID');
        
        if (!projectId) {
          console.error('❌ Error: FIREBASE_PROJECT_ID no está configurado en las variables de entorno');
          throw new Error('FIREBASE_PROJECT_ID es requerido');
        }

        // Configuración de Firebase Admin
        admin.initializeApp({
          credential: admin.credential.applicationDefault(),
          projectId: projectId
        });
        
        console.log('✅ Firebase Admin inicializado con proyecto:', projectId);
      } else {
        console.log('♻️ Reutilizando instancia existente de Firebase');
      }
      
      this.db = getFirestore();
    } catch (error) {
      console.error('❌ Error al inicializar Firebase:', error);
      throw error;
    }
  }

  async onModuleInit() {
    try {
      // Verificar la conexión a Firestore
      await this.db.collection('test').limit(1).get();
      console.log('✅ Conexión a Firestore verificada');
    } catch (error) {
      console.error('❌ Error al verificar servicios de Firebase:', error);
      throw error;
    }
  }

  async verifyCollection(collection: string): Promise<boolean> {
    try {
      console.log(`🔍 Verificando existencia de colección: ${collection}`);
      const snapshot = await this.db.collection(collection).limit(1).get();
      const exists = !snapshot.empty || (await this.db.collection(collection).listDocuments()).length > 0;
      console.log(`${exists ? '✅' : '⚠️'} Colección ${collection} ${exists ? 'existe' : 'no existe'}`);
      return exists;
    } catch (error) {
      console.error(`❌ Error al verificar colección ${collection}:`, error);
      return false;
    }
  }

  async create(collection: string, data: any): Promise<string> {
    try {
      // Verificar si la colección existe
      await this.verifyCollection(collection);
      
      console.log(`📝 Creando documento en colección ${collection}:`, data);
      
      const docRef = await this.db.collection(collection).add({
        ...data,
        createdAt: new Date().toISOString()
      });

      console.log(`✅ Documento creado con ID: ${docRef.id}`);
      return docRef.id;
    } catch (error) {
      console.error(`❌ Error al crear documento en ${collection}:`, error);
      throw error;
    }
  }

  async findAll(collection: string): Promise<any[]> {
    try {
      console.log(`🔍 Buscando todos los documentos en colección ${collection}`);
      
      const snapshot = await this.db.collection(collection).get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`📊 Se encontraron ${documents.length} documentos`);
      return documents;
    } catch (error) {
      console.error(`❌ Error al buscar documentos en ${collection}:`, error);
      throw error;
    }
  }

  async findOne(collection: string, id: string): Promise<any> {
    try {
      console.log(`🔍 Buscando documento ${id} en colección ${collection}`);
      
      const doc = await this.db.collection(collection).doc(id).get();
      if (!doc.exists) {
        console.log('⚠️ Documento no encontrado');
        return null;
      }
      
      console.log('✅ Documento encontrado');
      return { id: doc.id, ...doc.data() };
    } catch (error) {
      console.error(`❌ Error al buscar documento ${id} en ${collection}:`, error);
      throw error;
    }
  }

  async update(collection: string, id: string, data: any): Promise<void> {
    try {
      console.log(`📝 Actualizando documento ${id} en colección ${collection}:`, data);
      
      await this.db.collection(collection).doc(id).update({
        ...data,
        updatedAt: new Date().toISOString()
      });
      
      console.log('✅ Documento actualizado correctamente');
    } catch (error) {
      console.error(`❌ Error al actualizar documento ${id} en ${collection}:`, error);
      throw error;
    }
  }

  async delete(collection: string, id: string): Promise<void> {
    try {
      console.log(`🗑️ Eliminando documento ${id} de colección ${collection}`);
      
      await this.db.collection(collection).doc(id).delete();
      
      console.log('✅ Documento eliminado correctamente');
    } catch (error) {
      console.error(`❌ Error al eliminar documento ${id} de ${collection}:`, error);
      throw error;
    }
  }

  async query(collection: string, conditions: any[]): Promise<any[]> {
    try {
      console.log(`🔍 Realizando consulta en colección ${collection}:`, conditions);
      
      let query: FirebaseFirestore.Query = this.db.collection(collection);
      
      conditions.forEach(condition => {
        query = query.where(condition.field, condition.operator, condition.value);
      });

      const snapshot = await query.get();
      const documents = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      
      console.log(`📊 Se encontraron ${documents.length} documentos que coinciden con la consulta`);
      return documents;
    } catch (error) {
      console.error(`❌ Error al realizar consulta en ${collection}:`, error);
      throw error;
    }
  }
} 