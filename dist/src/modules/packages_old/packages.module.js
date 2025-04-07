"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PackagesModule = void 0;
const common_1 = require("@nestjs/common");
const packages_service_1 = require("./packages.service");
const firebase_module_1 = require("../firebase/firebase.module");
const activities_module_1 = require("../activities/activities.module");
const cargo_module_1 = require("../../cargo/cargo.module");
let PackagesModule = class PackagesModule {
};
exports.PackagesModule = PackagesModule;
exports.PackagesModule = PackagesModule = __decorate([
    (0, common_1.Module)({
        imports: [
            firebase_module_1.FirebaseModule,
            activities_module_1.ActivitiesModule,
            (0, common_1.forwardRef)(() => cargo_module_1.CargoModule)
        ],
        providers: [packages_service_1.PackagesService],
        exports: [packages_service_1.PackagesService],
    })
], PackagesModule);
//# sourceMappingURL=packages.module.js.map