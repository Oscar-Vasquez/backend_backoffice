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
exports.FirebaseDatabaseController = void 0;
const common_1 = require("@nestjs/common");
const firebase_database_service_1 = require("./firebase-database.service");
const platform_express_1 = require("@nestjs/platform-express");
const firebase_service_1 = require("./firebase.service");
let FirebaseDatabaseController = class FirebaseDatabaseController {
    constructor(firebaseDbService, firebaseService) {
        this.firebaseDbService = firebaseDbService;
        this.firebaseService = firebaseService;
    }
    async initializeDatabase(data) {
        console.log('🎯 POST /api/firebase/database/init');
        console.log('📦 Inicializando base de datos...');
        await this.firebaseDbService.initializeDatabase(data);
        return { message: 'Base de datos inicializada correctamente' };
    }
    async deleteDatabase() {
        console.log('🎯 DELETE /api/firebase/database');
        console.log('🗑️ Eliminando base de datos...');
        await this.firebaseDbService.deleteDatabase();
        return { message: 'Base de datos eliminada correctamente' };
    }
    async resetDatabase(newData) {
        console.log('🎯 POST /api/firebase/database/reset');
        console.log('🔄 Reiniciando base de datos...');
        await this.firebaseDbService.resetDatabase(newData);
        return { message: 'Base de datos reiniciada correctamente' };
    }
    async getDatabaseStatus() {
        console.log('🎯 GET /api/firebase/database/status');
        console.log('📊 Verificando estado de la base de datos...');
        return await this.firebaseDbService.verifyDatabase();
    }
    async createTemplate(template) {
        console.log('Guardando plantilla:', template);
        return this.firebaseDbService.saveEmailTemplate(template);
    }
    async getTemplates() {
        console.log('Obteniendo plantillas');
        const userId = 'user-test';
        return this.firebaseDbService.getEmailTemplates(userId);
    }
    async getTemplateById(id) {
        return this.firebaseDbService.getEmailTemplateById(id);
    }
    async deleteTemplate(id) {
        return this.firebaseDbService.deleteEmailTemplate(id);
    }
    async updateTemplate(id, template) {
        console.log('Actualizando plantilla:', id);
        return this.firebaseDbService.updateEmailTemplate(id, template);
    }
    async uploadImage(file) {
        try {
            console.log('📤 Subiendo imagen a Firebase Storage...');
            if (!file) {
                throw new Error('No se ha proporcionado ningún archivo');
            }
            const timestamp = Date.now();
            const fileName = `${timestamp}-${file.originalname}`;
            const path = `templates/images/${fileName}`;
            const imageUrl = await this.firebaseService.uploadImage(file.buffer, path);
            console.log('✅ Imagen subida exitosamente:', imageUrl);
            return {
                success: true,
                data: {
                    url: imageUrl,
                    path: path,
                    fileName: fileName
                }
            };
        }
        catch (error) {
            console.error('❌ Error al subir la imagen:', error);
            throw new Error('Error al subir la imagen');
        }
    }
};
exports.FirebaseDatabaseController = FirebaseDatabaseController;
__decorate([
    (0, common_1.Post)('init'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "initializeDatabase", null);
__decorate([
    (0, common_1.Delete)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "deleteDatabase", null);
__decorate([
    (0, common_1.Post)('reset'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "resetDatabase", null);
__decorate([
    (0, common_1.Get)('status'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "getDatabaseStatus", null);
__decorate([
    (0, common_1.Post)('templates'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "createTemplate", null);
__decorate([
    (0, common_1.Get)('templates'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "getTemplates", null);
__decorate([
    (0, common_1.Get)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "getTemplateById", null);
__decorate([
    (0, common_1.Delete)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "deleteTemplate", null);
__decorate([
    (0, common_1.Put)('templates/:id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "updateTemplate", null);
__decorate([
    (0, common_1.Post)('upload-image'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], FirebaseDatabaseController.prototype, "uploadImage", null);
exports.FirebaseDatabaseController = FirebaseDatabaseController = __decorate([
    (0, common_1.Controller)('firebase/database'),
    __metadata("design:paramtypes", [firebase_database_service_1.FirebaseDatabaseService,
        firebase_service_1.FirebaseService])
], FirebaseDatabaseController);
//# sourceMappingURL=firebase-database.controller.js.map