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
exports.CreateActivityDto = void 0;
const class_validator_1 = require("class-validator");
const operator_activity_interface_1 = require("../interfaces/operator-activity.interface");
class CreateActivityDto {
    constructor() {
        this.status = operator_activity_interface_1.ActivityStatus.COMPLETED;
    }
}
exports.CreateActivityDto = CreateActivityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "operatorName", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(operator_activity_interface_1.ActivityAction, {
        message: 'La acción debe ser un valor válido de ActivityAction'
    }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], CreateActivityDto.prototype, "metadata", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(operator_activity_interface_1.ActivityStatus, {
        message: 'El estado debe ser un valor válido de ActivityStatus'
    }),
    __metadata("design:type", String)
], CreateActivityDto.prototype, "status", void 0);
//# sourceMappingURL=create-activity.dto.js.map