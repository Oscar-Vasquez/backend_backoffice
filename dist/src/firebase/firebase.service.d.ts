import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as admin from 'firebase-admin';
export declare class FirebaseService implements OnModuleInit {
    private configService;
    private firestore;
    private storage;
    private readonly logger;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    private verifyCollectionAccess;
    getFirestore(): admin.firestore.Firestore;
    getStorage(): admin.storage.Storage;
    uploadImage(imageBuffer: Buffer, path: string): Promise<string>;
    collectionExists(collectionName: string): Promise<boolean>;
    createCollection(collectionName: string): Promise<void>;
    create(collection: string, data: any): Promise<string>;
    findOne(collection: string, id: string): Promise<any>;
    findAll(collection: string): Promise<any[]>;
    update(collection: string, id: string, data: any): Promise<void>;
    delete(collection: string, id: string): Promise<void>;
    query(collection: string, conditions: Array<{
        field: string;
        operator: admin.firestore.WhereFilterOp;
        value: any;
    }>): Promise<any[]>;
    private sanitizeData;
}
