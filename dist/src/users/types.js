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
exports.SearchDto = exports.TypeUser = exports.UpdateStatusResponse = exports.FirebaseUser = exports.CreateUserDto = void 0;
const swagger_1 = require("@nestjs/swagger");
class CreateUserDto {
}
exports.CreateUserDto = CreateUserDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name of the user', example: 'John' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last name of the user', example: 'Doe' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email of the user', example: 'john.doe@example.com' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Password of the user', example: 'SecurePassword123' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone number of the user', example: '+1234567890' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth date of the user in ISO format', example: '1990-01-01' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Reference to the branch', example: 'branch-123' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "branchReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Subscription plan ID', example: 'plan-123' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "subscriptionPlan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type user reference ID', example: 'type-123' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "typeUserReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User address', example: '123 Main St, Anytown, AT 12345' }),
    __metadata("design:type", String)
], CreateUserDto.prototype, "address", void 0);
class FirebaseUser {
}
exports.FirebaseUser = FirebaseUser;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User ID', example: 'user-123' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "userId", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'First name of the user', example: 'John' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "firstName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last name of the user', example: 'Doe' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "lastName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Email of the user', example: 'john.doe@example.com' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "email", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Phone number of the user', example: '+1234567890' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "phone", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User address', example: '123 Main St, Anytown, AT 12345' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "address", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the user is verified', example: true }),
    __metadata("design:type", Boolean)
], FirebaseUser.prototype, "isVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the user email is verified', example: true }),
    __metadata("design:type", Boolean)
], FirebaseUser.prototype, "isEmailVerified", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User account status', example: true }),
    __metadata("design:type", Boolean)
], FirebaseUser.prototype, "accountStatus", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Birth date of the user', example: '1990-01-01' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "birthDate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'URL to user photo', example: 'https://example.com/photo.jpg' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "photo", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Branch reference information',
        example: { path: 'branches/123', id: '123' }
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "branchReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Multiple branch references',
        example: ['branches/123', 'branches/456'],
        required: false
    }),
    __metadata("design:type", Array)
], FirebaseUser.prototype, "branchReferences", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch name', example: 'Downtown Branch' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "branchName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch address', example: '456 Branch St, Anytown, AT 12345' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "branchAddress", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Branch location', example: 'Downtown' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "branchLocation", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subscription plan reference',
        example: { path: 'plans/123', id: '123' }
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "subscriptionPlan", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Type user reference',
        example: { path: 'typeUsers/123', id: '123' }
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "typeUserReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Plan rate', example: 4.5, required: false }),
    __metadata("design:type", Number)
], FirebaseUser.prototype, "planRate", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Subscription price', example: 29.99, required: false }),
    __metadata("design:type", Number)
], FirebaseUser.prototype, "price", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp', example: '2023-01-01T12:00:00Z' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp', example: '2023-01-15T12:00:00Z' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "updatedAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last login timestamp', example: '2023-01-20T12:00:00Z' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "lastLoginAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Wallet reference',
        example: { path: 'wallets/123', id: '123' }
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "walletReference", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Wallet name', example: 'Main Wallet' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "walletName", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'User password', example: '*****', required: false }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "password", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Assigned locker', example: 'A123' }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "assignedLocker", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Display message', example: 'Welcome back!', required: false }),
    __metadata("design:type", String)
], FirebaseUser.prototype, "displayMessage", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Subscription details',
        example: {
            planName: 'Premium',
            description: 'Premium subscription with all features',
            price: '29.99'
        },
        required: false
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "subscriptionDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Branch details',
        example: {
            name: 'Downtown Branch',
            province: 'State',
            address: '456 Branch St, Anytown, AT 12345'
        },
        required: false
    }),
    __metadata("design:type", Object)
], FirebaseUser.prototype, "branchDetails", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether user has shipping insurance', example: true, required: false }),
    __metadata("design:type", Boolean)
], FirebaseUser.prototype, "shipping_insurance", void 0);
class UpdateStatusResponse {
}
exports.UpdateStatusResponse = UpdateStatusResponse;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the operation was successful', example: true }),
    __metadata("design:type", Boolean)
], UpdateStatusResponse.prototype, "success", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Message describing the result', example: 'User status updated successfully' }),
    __metadata("design:type", String)
], UpdateStatusResponse.prototype, "message", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({
        description: 'Additional details about the operation',
        example: {
            userId: 'user-123',
            previousStatus: false,
            newStatus: true,
            timestamp: '2023-01-01T12:00:00Z'
        },
        required: false
    }),
    __metadata("design:type", Object)
], UpdateStatusResponse.prototype, "details", void 0);
class TypeUser {
}
exports.TypeUser = TypeUser;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type user ID', example: 'type-123' }),
    __metadata("design:type", String)
], TypeUser.prototype, "id", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type user name', example: 'Admin' }),
    __metadata("design:type", String)
], TypeUser.prototype, "name", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Type user description', example: 'Administrator with full access' }),
    __metadata("design:type", String)
], TypeUser.prototype, "description", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Whether the type user is active', example: true }),
    __metadata("design:type", Boolean)
], TypeUser.prototype, "isActive", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Creation timestamp', example: '2023-01-01T12:00:00Z' }),
    __metadata("design:type", String)
], TypeUser.prototype, "createdAt", void 0);
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Last update timestamp', example: '2023-01-15T12:00:00Z' }),
    __metadata("design:type", String)
], TypeUser.prototype, "updatedAt", void 0);
class SearchDto {
}
exports.SearchDto = SearchDto;
__decorate([
    (0, swagger_1.ApiProperty)({ description: 'Search query', example: 'john' }),
    __metadata("design:type", String)
], SearchDto.prototype, "query", void 0);
//# sourceMappingURL=types.js.map