import { EmailElement, EmailElementOptions, EditorSettings, EmailTemplate } from '../../types/email-template';
export { EmailElement, EmailElementOptions, EditorSettings, EmailTemplate };
export interface EmailTemplateDto {
    id?: string;
    name: string;
    elements: EmailElement[];
    editorSettings: EditorSettings;
    createdAt: Date;
    updatedAt: Date;
    userId: string;
    thumbnail?: string;
    description?: string;
    category?: string;
}
