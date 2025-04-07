export interface OperatorType {
    id: string;
    name: string;
    description?: string;
    permissions?: Record<string, any>;
    created_at: Date;
    updated_at?: Date;
}
