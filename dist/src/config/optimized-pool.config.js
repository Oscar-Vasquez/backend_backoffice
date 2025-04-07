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
exports.OptimizedPoolService = void 0;
const pg_1 = require("pg");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
let OptimizedPoolService = class OptimizedPoolService {
    constructor(configService) {
        this.configService = configService;
        const poolConfig = {
            connectionString: this.configService.get('DATABASE_URL'),
            max: this.configService.get('DB_MAX_CONNECTIONS', 30),
            idleTimeoutMillis: this.configService.get('DB_IDLE_TIMEOUT', 30000),
            connectionTimeoutMillis: this.configService.get('DB_CONNECTION_TIMEOUT', 10000),
        };
        const additionalConfig = {
            statement_timeout: this.configService.get('DB_STATEMENT_TIMEOUT', 20000),
            query_timeout: this.configService.get('DB_QUERY_TIMEOUT', 10000),
            application_name: 'workexpress_optimized',
        };
        this.pool = new pg_1.Pool({
            ...poolConfig,
            ...additionalConfig,
        });
        this.pool.on('error', (err) => {
            console.error('Unexpected error on idle client', err);
        });
    }
    getPool() {
        return this.pool;
    }
    async getClient() {
        return this.pool.connect();
    }
    async query(text, params = []) {
        return this.pool.query(text, params);
    }
    async transaction(callback) {
        const client = await this.pool.connect();
        try {
            await client.query('BEGIN');
            const result = await callback(client);
            await client.query('COMMIT');
            return result;
        }
        catch (e) {
            await client.query('ROLLBACK');
            throw e;
        }
        finally {
            client.release();
        }
    }
    async onApplicationShutdown() {
        await this.pool.end();
    }
};
exports.OptimizedPoolService = OptimizedPoolService;
exports.OptimizedPoolService = OptimizedPoolService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], OptimizedPoolService);
//# sourceMappingURL=optimized-pool.config.js.map