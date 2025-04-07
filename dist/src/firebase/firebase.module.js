"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const firebase_service_1 = require("./firebase.service");
const firebase_database_service_1 = require("./firebase-database.service");
const firebase_database_controller_1 = require("./firebase-database.controller");
const email_module_1 = require("../email/email.module");
let FirebaseModule = class FirebaseModule {
};
exports.FirebaseModule = FirebaseModule;
exports.FirebaseModule = FirebaseModule = __decorate([
    (0, common_1.Module)({
        imports: [config_1.ConfigModule.forRoot(), (0, common_1.forwardRef)(() => email_module_1.EmailModule)],
        controllers: [firebase_database_controller_1.FirebaseDatabaseController],
        providers: [firebase_service_1.FirebaseService, firebase_database_service_1.FirebaseDatabaseService],
        exports: [firebase_service_1.FirebaseService, firebase_database_service_1.FirebaseDatabaseService],
    })
], FirebaseModule);
//# sourceMappingURL=firebase.module.js.map