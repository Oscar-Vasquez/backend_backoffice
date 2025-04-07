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
exports.OperatorActivityDto = exports.ActivityDetailsDto = exports.ActivityAction = exports.ActivityStatus = exports.ActivityType = void 0;
const class_validator_1 = require("class-validator");
const client_1 = require("@prisma/client");
var ActivityType;
(function (ActivityType) {
    ActivityType["LOGIN"] = "login";
    ActivityType["LOGOUT"] = "logout";
    ActivityType["CREATE"] = "create";
    ActivityType["UPDATE"] = "update";
    ActivityType["DELETE"] = "delete";
    ActivityType["VIEW"] = "view";
})(ActivityType || (exports.ActivityType = ActivityType = {}));
var ActivityStatus;
(function (ActivityStatus) {
    ActivityStatus["COMPLETED"] = "completed";
    ActivityStatus["PENDING"] = "pending";
    ActivityStatus["FAILED"] = "failed";
    ActivityStatus["CANCELLED"] = "cancelled";
})(ActivityStatus || (exports.ActivityStatus = ActivityStatus = {}));
var ActivityAction;
(function (ActivityAction) {
    ActivityAction["CREATE"] = "create";
    ActivityAction["UPDATE"] = "update";
    ActivityAction["DELETE"] = "delete";
    ActivityAction["VIEW"] = "view";
})(ActivityAction || (exports.ActivityAction = ActivityAction = {}));
class ActivityDetailsDto {
}
exports.ActivityDetailsDto = ActivityDetailsDto;
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "trackingNumber", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "location", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "packageId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "invoiceId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsNumber)(),
    __metadata("design:type", Number)
], ActivityDetailsDto.prototype, "amount", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ActivityDetailsDto.prototype, "previousData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", Object)
], ActivityDetailsDto.prototype, "newData", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "entityId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "entityType", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], ActivityDetailsDto.prototype, "reason", void 0);
class OperatorActivityDto {
}
exports.OperatorActivityDto = OperatorActivityDto;
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "id", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "operatorId", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.activity_type_enum),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "type", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(ActivityAction),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "action", void 0);
__decorate([
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "description", void 0);
__decorate([
    (0, class_validator_1.IsDate)(),
    __metadata("design:type", Date)
], OperatorActivityDto.prototype, "timestamp", void 0);
__decorate([
    (0, class_validator_1.IsEnum)(client_1.activity_status_enum),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "status", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "branchId", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsObject)(),
    __metadata("design:type", ActivityDetailsDto)
], OperatorActivityDto.prototype, "details", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "ipAddress", void 0);
__decorate([
    (0, class_validator_1.IsOptional)(),
    (0, class_validator_1.IsString)(),
    __metadata("design:type", String)
], OperatorActivityDto.prototype, "userAgent", void 0);
//# sourceMappingURL=operator-activity.dto.js.map