declare const _default: (() => {
    queryLogging: boolean;
    errorLogging: boolean;
    connectionLimit: number;
    useQueryCache: boolean;
    queryTimeout: number;
    transactionTimeout: number;
    slowQueryThreshold: number;
}) & import("@nestjs/config").ConfigFactoryKeyHost<{
    queryLogging: boolean;
    errorLogging: boolean;
    connectionLimit: number;
    useQueryCache: boolean;
    queryTimeout: number;
    transactionTimeout: number;
    slowQueryThreshold: number;
}>;
export default _default;
