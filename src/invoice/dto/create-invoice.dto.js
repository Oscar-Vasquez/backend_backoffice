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
exports.CreateInvoiceDto = exports.CreateInvoiceItemDto = void 0;
var class_validator_1 = require("class-validator");
var class_transformer_1 = require("class-transformer");
var CreateInvoiceItemDto = function () {
    var _a;
    var _name_decorators;
    var _name_initializers = [];
    var _name_extraInitializers = [];
    var _description_decorators;
    var _description_initializers = [];
    var _description_extraInitializers = [];
    var _quantity_decorators;
    var _quantity_initializers = [];
    var _quantity_extraInitializers = [];
    var _price_decorators;
    var _price_initializers = [];
    var _price_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateInvoiceItemDto() {
                this.name = __runInitializers(this, _name_initializers, void 0);
                this.description = (__runInitializers(this, _name_extraInitializers), __runInitializers(this, _description_initializers, void 0));
                this.quantity = (__runInitializers(this, _description_extraInitializers), __runInitializers(this, _quantity_initializers, void 0));
                this.price = (__runInitializers(this, _quantity_extraInitializers), __runInitializers(this, _price_initializers, void 0));
                __runInitializers(this, _price_extraInitializers);
            }
            return CreateInvoiceItemDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _name_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _description_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _quantity_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsNumber)()];
            _price_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsNumber)()];
            __esDecorate(null, null, _name_decorators, { kind: "field", name: "name", static: false, private: false, access: { has: function (obj) { return "name" in obj; }, get: function (obj) { return obj.name; }, set: function (obj, value) { obj.name = value; } }, metadata: _metadata }, _name_initializers, _name_extraInitializers);
            __esDecorate(null, null, _description_decorators, { kind: "field", name: "description", static: false, private: false, access: { has: function (obj) { return "description" in obj; }, get: function (obj) { return obj.description; }, set: function (obj, value) { obj.description = value; } }, metadata: _metadata }, _description_initializers, _description_extraInitializers);
            __esDecorate(null, null, _quantity_decorators, { kind: "field", name: "quantity", static: false, private: false, access: { has: function (obj) { return "quantity" in obj; }, get: function (obj) { return obj.quantity; }, set: function (obj, value) { obj.quantity = value; } }, metadata: _metadata }, _quantity_initializers, _quantity_extraInitializers);
            __esDecorate(null, null, _price_decorators, { kind: "field", name: "price", static: false, private: false, access: { has: function (obj) { return "price" in obj; }, get: function (obj) { return obj.price; }, set: function (obj, value) { obj.price = value; } }, metadata: _metadata }, _price_initializers, _price_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateInvoiceItemDto = CreateInvoiceItemDto;
var CreateInvoiceDto = function () {
    var _a;
    var _invoice_number_decorators;
    var _invoice_number_initializers = [];
    var _invoice_number_extraInitializers = [];
    var _customer_id_decorators;
    var _customer_id_initializers = [];
    var _customer_id_extraInitializers = [];
    var _issue_date_decorators;
    var _issue_date_initializers = [];
    var _issue_date_extraInitializers = [];
    var _due_date_decorators;
    var _due_date_initializers = [];
    var _due_date_extraInitializers = [];
    var _status_decorators;
    var _status_initializers = [];
    var _status_extraInitializers = [];
    var _total_amount_decorators;
    var _total_amount_initializers = [];
    var _total_amount_extraInitializers = [];
    var _paid_amount_decorators;
    var _paid_amount_initializers = [];
    var _paid_amount_extraInitializers = [];
    var _notes_decorators;
    var _notes_initializers = [];
    var _notes_extraInitializers = [];
    var _footer_decorators;
    var _footer_initializers = [];
    var _footer_extraInitializers = [];
    var _invoice_items_decorators;
    var _invoice_items_initializers = [];
    var _invoice_items_extraInitializers = [];
    return _a = /** @class */ (function () {
            function CreateInvoiceDto() {
                this.invoice_number = __runInitializers(this, _invoice_number_initializers, void 0);
                this.customer_id = (__runInitializers(this, _invoice_number_extraInitializers), __runInitializers(this, _customer_id_initializers, void 0));
                this.issue_date = (__runInitializers(this, _customer_id_extraInitializers), __runInitializers(this, _issue_date_initializers, void 0));
                this.due_date = (__runInitializers(this, _issue_date_extraInitializers), __runInitializers(this, _due_date_initializers, void 0));
                this.status = (__runInitializers(this, _due_date_extraInitializers), __runInitializers(this, _status_initializers, void 0));
                this.total_amount = (__runInitializers(this, _status_extraInitializers), __runInitializers(this, _total_amount_initializers, void 0));
                this.paid_amount = (__runInitializers(this, _total_amount_extraInitializers), __runInitializers(this, _paid_amount_initializers, void 0));
                this.notes = (__runInitializers(this, _paid_amount_extraInitializers), __runInitializers(this, _notes_initializers, void 0));
                this.footer = (__runInitializers(this, _notes_extraInitializers), __runInitializers(this, _footer_initializers, void 0));
                this.invoice_items = (__runInitializers(this, _footer_extraInitializers), __runInitializers(this, _invoice_items_initializers, void 0));
                __runInitializers(this, _invoice_items_extraInitializers);
            }
            return CreateInvoiceDto;
        }()),
        (function () {
            var _metadata = typeof Symbol === "function" && Symbol.metadata ? Object.create(null) : void 0;
            _invoice_number_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsString)()];
            _customer_id_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsNumber)()];
            _issue_date_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_transformer_1.Type)(function () { return Date; }), (0, class_validator_1.IsDate)()];
            _due_date_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_transformer_1.Type)(function () { return Date; }), (0, class_validator_1.IsDate)()];
            _status_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _total_amount_decorators = [(0, class_validator_1.IsNotEmpty)(), (0, class_validator_1.IsNumber)()];
            _paid_amount_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsNumber)()];
            _notes_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _footer_decorators = [(0, class_validator_1.IsOptional)(), (0, class_validator_1.IsString)()];
            _invoice_items_decorators = [(0, class_validator_1.IsArray)(), (0, class_validator_1.ValidateNested)({ each: true }), (0, class_transformer_1.Type)(function () { return CreateInvoiceItemDto; })];
            __esDecorate(null, null, _invoice_number_decorators, { kind: "field", name: "invoice_number", static: false, private: false, access: { has: function (obj) { return "invoice_number" in obj; }, get: function (obj) { return obj.invoice_number; }, set: function (obj, value) { obj.invoice_number = value; } }, metadata: _metadata }, _invoice_number_initializers, _invoice_number_extraInitializers);
            __esDecorate(null, null, _customer_id_decorators, { kind: "field", name: "customer_id", static: false, private: false, access: { has: function (obj) { return "customer_id" in obj; }, get: function (obj) { return obj.customer_id; }, set: function (obj, value) { obj.customer_id = value; } }, metadata: _metadata }, _customer_id_initializers, _customer_id_extraInitializers);
            __esDecorate(null, null, _issue_date_decorators, { kind: "field", name: "issue_date", static: false, private: false, access: { has: function (obj) { return "issue_date" in obj; }, get: function (obj) { return obj.issue_date; }, set: function (obj, value) { obj.issue_date = value; } }, metadata: _metadata }, _issue_date_initializers, _issue_date_extraInitializers);
            __esDecorate(null, null, _due_date_decorators, { kind: "field", name: "due_date", static: false, private: false, access: { has: function (obj) { return "due_date" in obj; }, get: function (obj) { return obj.due_date; }, set: function (obj, value) { obj.due_date = value; } }, metadata: _metadata }, _due_date_initializers, _due_date_extraInitializers);
            __esDecorate(null, null, _status_decorators, { kind: "field", name: "status", static: false, private: false, access: { has: function (obj) { return "status" in obj; }, get: function (obj) { return obj.status; }, set: function (obj, value) { obj.status = value; } }, metadata: _metadata }, _status_initializers, _status_extraInitializers);
            __esDecorate(null, null, _total_amount_decorators, { kind: "field", name: "total_amount", static: false, private: false, access: { has: function (obj) { return "total_amount" in obj; }, get: function (obj) { return obj.total_amount; }, set: function (obj, value) { obj.total_amount = value; } }, metadata: _metadata }, _total_amount_initializers, _total_amount_extraInitializers);
            __esDecorate(null, null, _paid_amount_decorators, { kind: "field", name: "paid_amount", static: false, private: false, access: { has: function (obj) { return "paid_amount" in obj; }, get: function (obj) { return obj.paid_amount; }, set: function (obj, value) { obj.paid_amount = value; } }, metadata: _metadata }, _paid_amount_initializers, _paid_amount_extraInitializers);
            __esDecorate(null, null, _notes_decorators, { kind: "field", name: "notes", static: false, private: false, access: { has: function (obj) { return "notes" in obj; }, get: function (obj) { return obj.notes; }, set: function (obj, value) { obj.notes = value; } }, metadata: _metadata }, _notes_initializers, _notes_extraInitializers);
            __esDecorate(null, null, _footer_decorators, { kind: "field", name: "footer", static: false, private: false, access: { has: function (obj) { return "footer" in obj; }, get: function (obj) { return obj.footer; }, set: function (obj, value) { obj.footer = value; } }, metadata: _metadata }, _footer_initializers, _footer_extraInitializers);
            __esDecorate(null, null, _invoice_items_decorators, { kind: "field", name: "invoice_items", static: false, private: false, access: { has: function (obj) { return "invoice_items" in obj; }, get: function (obj) { return obj.invoice_items; }, set: function (obj, value) { obj.invoice_items = value; } }, metadata: _metadata }, _invoice_items_initializers, _invoice_items_extraInitializers);
            if (_metadata) Object.defineProperty(_a, Symbol.metadata, { enumerable: true, configurable: true, writable: true, value: _metadata });
        })(),
        _a;
}();
exports.CreateInvoiceDto = CreateInvoiceDto;
