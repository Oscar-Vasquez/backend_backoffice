"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createPgPool = void 0;
const pg_1 = require("pg");
const createPgPool = (configService) => {
    const config = {
        connectionString: configService.get('database.url'),
        max: configService.get('database.maxConnections') || 30,
        idleTimeoutMillis: configService.get('database.idleTimeout') || 30000,
        connectionTimeoutMillis: configService.get('database.connectionTimeout') || 10000,
        statement_timeout: configService.get('database.queryTimeout') || 20000,
        query_timeout: configService.get('database.queryTimeout') || 10000,
        application_name: 'workexpress_optimized',
        keepAlive: true,
        keepAliveInitialDelayMillis: 10000,
    };
    const connectionParams = new URLSearchParams();
    connectionParams.append('statement_timeout', String(config.statement_timeout));
    connectionParams.append('lock_timeout', '10000');
    connectionParams.append('idle_in_transaction_session_timeout', '30000');
    const url = config.connectionString;
    if (url) {
        if (url.includes('?')) {
            config.connectionString = `${url}&${connectionParams.toString()}`;
        }
        else {
            config.connectionString = `${url}?${connectionParams.toString()}`;
        }
    }
    return new pg_1.Pool(config);
};
exports.createPgPool = createPgPool;
//# sourceMappingURL=pg-pool.config.js.map