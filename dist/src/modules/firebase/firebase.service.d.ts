import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export declare class FirebaseService implements OnModuleInit {
    private configService;
    private db;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    verifyCollection(collection: string): Promise<boolean>;
    create(collection: string, data: any): Promise<string>;
    findAll(collection: string): Promise<any[]>;
    findOne(collection: string, id: string): Promise<any>;
    update(collection: string, id: string, data: any): Promise<void>;
    delete(collection: string, id: string): Promise<void>;
    query(collection: string, conditions: any[]): Promise<any[]>;
}
