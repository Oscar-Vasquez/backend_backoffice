"use strict";
var __esDecorate = (this && this.__esDecorate) || function (ctor, descriptorIn, decorators, contextIn, initializers, extraInitializers) {
    function accept(f) { if (f !== void 0 && typeof f !== "function") throw new TypeError("Function expected"); return f; }
    var kind = contextIn.kind, key = kind === "getter" ? "get" : kind === "setter" ? "set" : "value";
    var target = !descriptorIn && ctor ? contextIn["static"] ? ctor : ctor.prototype : null;
    var descriptor = descriptorIn || (target ? Object.getOwnPropertyDescriptor(target, contextIn.name) : {});
    var _, done = false;
    for (var i = decorators.length - 1; i >= 0; i--) {
        var context = {};
        for (var p in contextIn) context[p] = p === "access" ? {} : contextIn[p];
        for (var p in contextIn.access) context.access[p] = contextIn.access[p];
        context.addInitializer = function (f) { if (done) throw new TypeError("Cannot add initializers after decoration has completed"); extraInitializers.push(accept(f || null)); };
        var result = (0, decorators[i])(kind === "accessor" ? { get: descriptor.get, set: descriptor.set } : descriptor[key], context);
        if (kind === "accessor") {
            if (result === void 0) continue;
            if (result === null || typeof result !== "object") throw new TypeError("Object expected");
            if (_ = accept(result.get)) descriptor.get = _;
            if (_ = accept(result.set)) descriptor.set = _;
            if (_ = accept(result.init)) initializers.unshift(_);
        }
        else if (_ = accept(result)) {
            if (kind === "field") initializers.unshift(_);
            else descriptor[key] = _;
        }
    }
    if (target) Object.defineProperty(target, contextIn.name, descriptor);
    done = true;
};
var __runInitializers = (this && this.__runInitializers) || function (thisArg, initializers, value) {
    var useValue = arguments.length > 2;
    for (var i = 0; i < initializers.length; i++) {
        value = useValue ? initializers[i].call(thisArg, value) : initializers[i].call(thisArg);
    }
    return useValue ? value : void 0;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CreateCustomerDto = void 0;
var class_validator_1 = require("class-validator");
var CreateCustomerDto = function () {
    var _a;
    var _first_name_decorators;
    var _first_name_initializers = [];
    var _first_name_extraInitializers = [];
    var _last_name_decorators;
    var _last_name_initializers = [];
    var _last_name_extraInitializers = [];
    var _email_decorators;
    var _email_initializers = [];
    var _email_extraInitializers = [];
    var _phone_type_decorators;
    var _phone_type_initializers = [];
    var _phone_type_extraInitializers = [];
    var _country_code_decorators;
    var _country_code_initializers = [];
    var _country_code_extraInitializers = [];
    var _phone_number_decorators;
    var _phone_number_initializers = [];
    var _phone_number_extraInitializers = [];
    var _phone_subscription_status_decorators;
    var _phone_subscription_status_initializers = [];
    var _phone_subscription_status_extraInitializers = [];
    var _address_type_decorators;
    var _address_type_initializers = [];
    var _address_type_extraInitializers = [];
    var _street_decorators;
    var _street_initializers = [];
    var _street_extraInitializers = [];
    var _street_line_2_decorators;
    var _street_line_2_initializers = [];
    var _street_line_2_extraInitializers = [];
    var _city_decorators;
    var _city_initializers = [];
    var _city_extraInitializers = [];
    var _country_decorators;
    var _country_initializers = [];
    var _country_extraInitializers = [];
    var _postal_code_decorators;
    var _postal_code_initializers = [];
    var _postal_code_extraInitializers = [];
    var _plan_decorators;
    var _plan_initializers = [];
    var _plan_extraInitializers = [];
    var _email_subscription_status_decorators;
    var _email_subscription_status_initializers = [];
    var _email_subscription_status_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateCustomerDto() {
                this.first_name = __runInitializers(this, _first_name_initializers, void 0);
                this.last_name = (__runInitializers(this, _first_name_extraInitializers), __runInitializers(this, _last_name_initializers, void 0));
                this.email = (__runInitializers(this, _last_name_extraInitializers), __runInitializers(this, _email_initializers, void 0));
                this.phone_type = (__runInitializers(this, _email_extraInitializers), __runInitializers(this, _phone_type_initializers, void 0));
                this.country_code = (__runInitializers(this, _phone_type_extraInitializers), __runInitializers(this, _country_code_initializers, void 0));
                this.phone_number = (__runInitializers(this, _country_code_extraInitializers), __runInitializers(this, _phone_number_initializers, void 0));
                this.phone_subscription_status = (__runInitializers(this, _phone_number_extraInitializers), __runInitializers(this, _phone_subscription_status_initializers, void 0));
                this.address_type = (__runInitializers(this, _phone_subscription_status_extraInitializers), __runInitializers(this, _address_type_initializers, void 0));
                this.street = (__runInitializers(this, _address_type_extraInitializers), __runInitializers(this, _street_initializers, void 0));
                this.street_line_2 = (__runInitializers(this, _street_extraInitializers), __runInitializers(this, _street_line_2_initializers, void 0));
                this.city = (__runInitializers(this, _street_line_2_extraInitializers), __runInitializers(this, _city_initializers, void 0));
                this.country = (__runInitializers(this, _city_extraInitializers), __runInitializers(this, _country_initializers, void 0));
                this.postal_code = (__runInitializers(this, _country_extraInitializers), __runInitializers(this, _postal_code_initializers, void 0));
                this.plan = (__runInitializers(this, _postal_code_extraInitializers), __runInitializers(this, _plan_initializers, void 0));
                this.email_subscription_status = (__runInitializers(this, _plan_extraInitializers), __runInitializers(this, _email_subscription_status_initializers, void 0));
                __runInitializers(this, _email_subscription_status_extraInitializers);
            }
            return CreateCustomerDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _first_name_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _last_name_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _email_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsEmail)()];
            _phone_type_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _country_code_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _phone_number_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _phone_subscription_status_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _address_type_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _street_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _street_line_2_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _city_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _country_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _postal_code_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _plan_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _email_subscription_status_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            __esDecorate(null, null, _first_name_decorators, { kind: "field", name: "first_name", static: false, private: false, access: { has: function (obj) { return "first_name" in obj; }, get: function (obj) { return obj.first_name; }, set: function (obj, value) { obj.first_name = value; } }, metadata: _metadata }, _first_name_initializers, _first_name_extraInitializers);
            __esDecorate(null, null, _last_name_decorators, { kind: "field", name: "last_name", static: false, private: false, access: { has: function (obj) { return "last_name" in obj; }, get: function (obj) { return obj.last_name; }, set: function (obj, value) { obj.last_name = value; } }, metadata: _metadata }, _last_name_initializers, _last_name_extraInitializers);
            __esDecorate(null, null, _email_decorators, { kind: "field", name: "email", static: false, private: false, access: { has: function (obj) { return "email" in obj; }, get: function (obj) { return obj.email; }, set: function (obj, value) { obj.email = value; } }, metadata: _metadata }, _email_initializers, _email_extraInitializers);
            __esDecorate(null, null, _phone_type_decorators, { kind: "field", name: "phone_type", static: false, private: false, access: { has: function (obj) { return "phone_type" in obj; }, get: function (obj) { return obj.phone_type; }, set: function (obj, value) { obj.phone_type = value; } }, metadata: _metadata }, _phone_type_initializers, _phone_type_extraInitializers);
            __esDecorate(null, null, _country_code_decorators, { kind: "field", name: "country_code", static: false, private: false, access: { has: function (obj) { return "country_code" in obj; }, get: function (obj) { return obj.country_code; }, set: function (obj, value) { obj.country_code = value; } }, metadata: _metadata }, _country_code_initializers, _country_code_extraInitializers);
            __esDecorate(null, null, _phone_number_decorators, { kind: "field", name: "phone_number", static: false, private: false, access: { has: function (obj) { return "phone_number" in obj; }, get: function (obj) { return obj.phone_number; }, set: function (obj, value) { obj.phone_number = value; } }, metadata: _metadata }, _phone_number_initializers, _phone_number_extraInitializers);
            __esDecorate(null, null, _phone_subscription_status_decorators, { kind: "field", name: "phone_subscription_status", static: false, private: false, access: { has: function (obj) { return "phone_subscription_status" in obj; }, get: function (obj) { return obj.phone_subscription_status; }, set: function (obj, value) { obj.phone_subscription_status = value; } }, metadata: _metadata }, _phone_subscription_status_initializers, _phone_subscription_status_extraInitializers);
            __esDecorate(null, null, _address_type_decorators, { kind: "field", name: "address_type", static: false, private: false, access: { has: function (obj) { return "address_type" in obj; }, get: function (obj) { return obj.address_type; }, set: function (obj, value) { obj.address_type = value; } }, metadata: _metadata }, _address_type_initializers, _address_type_extraInitializers);
            __esDecorate(null, null, _street_decorators, { kind: "field", name: "street", static: false, private: false, access: { has: function (obj) { return "street" in obj; }, get: function (obj) { return obj.street; }, set: function (obj, value) { obj.street = value; } }, metadata: _metadata }, _street_initializers, _street_extraInitializers);
            __esDecorate(null, null, _street_line_2_decorators, { kind: "field", name: "street_line_2", static: false, private: false, access: { has: function (obj) { return "street_line_2" in obj; }, get: function (obj) { return obj.street_line_2; }, set: function (obj, value) { obj.street_line_2 = value; } }, metadata: _metadata }, _street_line_2_initializers, _street_line_2_extraInitializers);
            __esDecorate(null, null, _city_decorators, { kind: "field", name: "city", static: false, private: false, access: { has: function (obj) { return "city" in obj; }, get: function (obj) { return obj.city; }, set: function (obj, value) { obj.city = value; } }, metadata: _metadata }, _city_initializers, _city_extraInitializers);
            __esDecorate(null, null, _country_decorators, { kind: "field", name: "country", static: false, private: false, access: { has: function (obj) { return "country" in obj; }, get: function (obj) { return obj.country; }, set: function (obj, value) { obj.country = value; } }, metadata: _metadata }, _country_initializers, _country_extraInitializers);
            __esDecorate(null, null, _postal_code_decorators, { kind: "field", name: "postal_code", static: false, private: false, access: { has: function (obj) { return "postal_code" in obj; }, get: function (obj) { return obj.postal_code; }, set: function (obj, value) { obj.postal_code = value; } }, metadata: _metadata }, _postal_code_initializers, _postal_code_extraInitializers);
            __esDecorate(null, null, _plan_decorators, { kind: "field", name: "plan", static: false, private: false, access: { has: function (obj) { return "plan" in obj; }, get: function (obj) { return obj.plan; }, set: function (obj, value) { obj.plan = value; } }, metadata: _metadata }, _plan_initializers, _plan_extraInitializers);
            __esDecorate(null, null, _email_subscription_status_decorators, { kind: "field", name: "email_subscription_status", static: false, private: false, access: { has: function (obj) { return "email_subscription_status" in obj; }, get: function (obj) { return obj.email_subscription_status; }, set: function (obj, value) { obj.email_subscription_status = value; } }, metadata: _metadata }, _email_subscription_status_initializers, _email_subscription_status_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateCustomerDto = CreateCustomerDto;
