"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
let FirebaseService = class FirebaseService {
    async uploadFile(file, path) {
        const bucket = admin.storage().bucket();
        const fileUpload = bucket.file(path);
        try {
            await fileUpload.save(file, {
                contentType: 'application/pdf'
            });
            const [url] = await fileUpload.getSignedUrl({
                action: 'read',
                expires: '03-01-2500'
            });
            return url;
        }
        catch (error) {
            console.error('Error al subir archivo a Firebase:', error);
            throw error;
        }
    }
    async deleteFile(path) {
        const bucket = admin.storage().bucket();
        const file = bucket.file(path);
        try {
            await file.delete();
        }
        catch (error) {
            console.error('Error al eliminar archivo de Firebase:', error);
            throw error;
        }
    }
};
exports.FirebaseService = FirebaseService;
exports.FirebaseService = FirebaseService = __decorate([
    (0, common_1.Injectable)()
], FirebaseService);
//# sourceMappingURL=firebase.service.js.map