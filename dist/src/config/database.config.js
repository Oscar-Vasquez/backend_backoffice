"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('database', () => ({
    url: process.env.DATABASE_URL,
    directUrl: process.env.DIRECT_URL,
    connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '10000', 10),
    maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '30', 10),
    idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '60000', 10),
    queryTimeout: parseInt(process.env.DB_QUERY_TIMEOUT || '10000', 10),
    transactionTimeout: parseInt(process.env.DB_TRANSACTION_TIMEOUT || '15000', 10),
}));
//# sourceMappingURL=database.config.js.map