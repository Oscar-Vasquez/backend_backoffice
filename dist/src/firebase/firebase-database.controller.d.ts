import { FirebaseDatabaseService } from './firebase-database.service';
import { EmailTemplateDto } from './dto/template.dto';
import { FirebaseService } from './firebase.service';
export declare class FirebaseDatabaseController {
    private readonly firebaseDbService;
    private readonly firebaseService;
    constructor(firebaseDbService: FirebaseDatabaseService, firebaseService: FirebaseService);
    initializeDatabase(data: any): Promise<{
        message: string;
    }>;
    deleteDatabase(): Promise<{
        message: string;
    }>;
    resetDatabase(newData: any): Promise<{
        message: string;
    }>;
    getDatabaseStatus(): Promise<{
        collections: {
            [key: string]: number;
        };
    }>;
    createTemplate(template: EmailTemplateDto): Promise<EmailTemplateDto>;
    getTemplates(): Promise<EmailTemplateDto[]>;
    getTemplateById(id: string): Promise<EmailTemplateDto>;
    deleteTemplate(id: string): Promise<void>;
    updateTemplate(id: string, template: EmailTemplateDto): Promise<EmailTemplateDto>;
    uploadImage(file: Express.Multer.File): Promise<{
        success: boolean;
        data: {
            url: string;
            path: string;
            fileName: string;
        };
    }>;
}
