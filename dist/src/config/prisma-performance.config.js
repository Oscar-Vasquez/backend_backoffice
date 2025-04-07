"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const config_1 = require("@nestjs/config");
exports.default = (0, config_1.registerAs)('prisma', () => ({
    queryLogging: process.env.PRISMA_QUERY_LOGGING === 'true',
    errorLogging: process.env.PRISMA_ERROR_LOGGING !== 'false',
    connectionLimit: parseInt(process.env.PRISMA_CONNECTION_LIMIT || '10', 10),
    useQueryCache: process.env.PRISMA_USE_QUERY_CACHE !== 'false',
    queryTimeout: parseInt(process.env.PRISMA_QUERY_TIMEOUT || '30000', 10),
    transactionTimeout: parseInt(process.env.PRISMA_TRANSACTION_TIMEOUT || '60000', 10),
    slowQueryThreshold: parseInt(process.env.PRISMA_SLOW_QUERY_THRESHOLD || '100', 10),
}));
//# sourceMappingURL=prisma-performance.config.js.map