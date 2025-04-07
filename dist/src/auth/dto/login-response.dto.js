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
exports.LoginResponseDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class OperatorDto {
}
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator ID',
        example: 'op_123456',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator email',
        example: 'operator@example.com',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator first name',
        example: 'John',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator last name',
        example: 'Doe',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator role',
        example: 'admin',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "role", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Branch name',
        example: 'Downtown Branch',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "branchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Branch reference ID',
        example: 'branch_123',
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "branchReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator type ID',
        example: 'type_123',
        nullable: true,
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "type_operator_id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator photo URL',
        example: 'https://example.com/photo.jpg',
        nullable: true,
    }),
    __metadata("design:type", String)
], OperatorDto.prototype, "photo", void 0);
class LoginResponseDto {
}
exports.LoginResponseDto = LoginResponseDto;
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Access token (JWT)',
        example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    }),
    __metadata("design:type", String)
], LoginResponseDto.prototype, "access_token", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Operator information',
        type: OperatorDto,
    }),
    __metadata("design:type", OperatorDto)
], LoginResponseDto.prototype, "operator", void 0);
//# sourceMappingURL=login-response.dto.js.map