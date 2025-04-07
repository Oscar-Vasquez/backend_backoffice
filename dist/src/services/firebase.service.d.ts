export declare class FirebaseService {
    uploadFile(file: Buffer, path: string): Promise<string>;
    deleteFile(path: string): Promise<void>;
}
