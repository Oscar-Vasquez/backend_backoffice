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
var ActivitiesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ActivitiesService = void 0;
const common_1 = require("@nestjs/common");
const firebase_service_1 = require("../../firebase/firebase.service");
const operator_activity_interface_1 = require("./interfaces/operator-activity.interface");
let ActivitiesService = ActivitiesService_1 = class ActivitiesService {
    constructor(firebaseService) {
        this.firebaseService = firebaseService;
        this.COLLECTION = 'activities';
        this.logger = new common_1.Logger(ActivitiesService_1.name);
    }
    async createActivity(activity) {
        try {
            this.logger.log(`📝 Creando nueva actividad: ${JSON.stringify(activity)}`);
            const collectionExists = await this.firebaseService.collectionExists(this.COLLECTION);
            if (!collectionExists) {
                this.logger.log('🔄 Creando colección de actividades...');
                await this.firebaseService.createCollection(this.COLLECTION);
            }
            const activityWithTimestamp = {
                ...activity,
                timestamp: activity.timestamp || new Date().toISOString(),
                status: activity.status || operator_activity_interface_1.ActivityStatus.COMPLETED
            };
            const docId = await this.firebaseService.create(this.COLLECTION, activityWithTimestamp);
            this.logger.log(`✅ Actividad creada exitosamente con ID: ${docId}`);
            return {
                id: docId,
                ...activityWithTimestamp
            };
        }
        catch (error) {
            this.logger.error(`❌ Error al crear actividad: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getRecentActivities(limit = 50, days = 7) {
        try {
            const daysAgo = new Date();
            daysAgo.setDate(daysAgo.getDate() - days);
            const activities = await this.firebaseService.query(this.COLLECTION, [
                { field: 'timestamp', operator: '>=', value: daysAgo.toISOString() }
            ]);
            return activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener actividades recientes: ${error.message}`, error.stack);
            throw error;
        }
    }
    async getOperatorActivities(operatorId, limit = 50) {
        try {
            const activities = await this.firebaseService.query(this.COLLECTION, [
                { field: 'operatorId', operator: '==', value: operatorId }
            ]);
            return activities
                .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                .slice(0, limit);
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener actividades del operador: ${error.message}`, error.stack);
            throw error;
        }
    }
};
exports.ActivitiesService = ActivitiesService;
exports.ActivitiesService = ActivitiesService = ActivitiesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService])
], ActivitiesService);
//# sourceMappingURL=activities.service.js.map