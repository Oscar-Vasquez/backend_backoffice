import { Injectable, Logger } from '@nestjs/common';
import { FirebaseService } from '../../firebase/firebase.service';
import { CreateActivityDto, ActivityStatus } from './interfaces/operator-activity.interface';

@Injectable()
export class ActivitiesService {
  private readonly COLLECTION = 'activities';
  private readonly logger = new Logger(ActivitiesService.name);

  constructor(private readonly firebaseService: FirebaseService) {}

  async createActivity(activity: CreateActivityDto): Promise<any> {
    try {
      this.logger.log(`📝 Creando nueva actividad: ${JSON.stringify(activity)}`);

      // Asegurarnos que la colección existe
      const collectionExists = await this.firebaseService.collectionExists(this.COLLECTION);
      if (!collectionExists) {
        this.logger.log('🔄 Creando colección de actividades...');
        await this.firebaseService.createCollection(this.COLLECTION);
      }

      // Asegurarnos que tenemos un timestamp
      const activityWithTimestamp = {
        ...activity,
        timestamp: activity.timestamp || new Date().toISOString(),
        status: activity.status || ActivityStatus.COMPLETED
      };

      // Crear la actividad
      const docId = await this.firebaseService.create(this.COLLECTION, activityWithTimestamp);
      this.logger.log(`✅ Actividad creada exitosamente con ID: ${docId}`);
      
      return {
        id: docId,
        ...activityWithTimestamp
      };
    } catch (error) {
      this.logger.error(`❌ Error al crear actividad: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getRecentActivities(limit: number = 50, days: number = 7): Promise<any[]> {
    try {
      // Calcular la fecha límite
      const daysAgo = new Date();
      daysAgo.setDate(daysAgo.getDate() - days);

      const activities = await this.firebaseService.query(this.COLLECTION, [
        { field: 'timestamp', operator: '>=', value: daysAgo.toISOString() }
      ]);
      
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error al obtener actividades recientes: ${error.message}`, error.stack);
      throw error;
    }
  }

  async getOperatorActivities(operatorId: string, limit: number = 50): Promise<any[]> {
    try {
      const activities = await this.firebaseService.query(this.COLLECTION, [
        { field: 'operatorId', operator: '==', value: operatorId }
      ]);
      return activities
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      this.logger.error(`❌ Error al obtener actividades del operador: ${error.message}`, error.stack);
      throw error;
    }
  }
} 