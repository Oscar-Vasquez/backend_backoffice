export interface EmailElementOptions {
  padding?: string;
  backgroundColor?: string;
  textColor?: string;
  fontFamily?: string;
  fontSize?: string;
  textAlign?: 'left' | 'center' | 'right' | 'justify';
  alignment?: 'left' | 'center' | 'right';
  alt?: string;
  maxWidth?: string;
  borderRadius?: string;
  url?: string;
  color?: string;
  [key: string]: any;
}

export interface EmailElement {
  id: string;
  type: 'text' | 'columns' | 'image' | 'button' | 'divider' | 'footer';
  content: string;
  backgroundColor?: string;
  columns?: number;
  gap?: number;
  elements?: EmailElement[][];
  options?: EmailElementOptions;
}

export interface EditorSettings {
  backgroundColor?: string;
  contentBackground?: string;
  maxWidth?: string;
  [key: string]: any;
}

export interface EmailTemplate {
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

export interface EmailRecipient {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  [key: string]: any;
}

export type EmailCampaignStatus = 'draft' | 'scheduled' | 'sending' | 'sent' | 'failed';

export interface EmailCampaignMetrics {
  totalRecipients: number;
  totalOpens: number;
  uniqueOpens: number;
  openRate: number;
  totalClicks: number;
  clickThroughRate: number;
  bounceRate: number;
  bouncedCount: number;
  responseRate: number;
  responseCount: number;
  deliveredCount: number;
  deviceMetrics: {
    Desktop: number;
    Mobile: number;
    Tablet: number;
    Unknown: number;
  };
  lastUpdated: Date;
}

export interface EmailCampaign {
  id?: string;
  name: string;
  subject: string;
  templateId: string;
  status: EmailCampaignStatus;
  recipients: EmailRecipient[];
  metrics?: EmailCampaignMetrics;
  createdAt?: Date;
  updatedAt?: Date;
  userId?: string;
}

export interface EmailSendResult {
  success: boolean;
  recipientId: string;
  error?: string;
  messageId?: string;
  sentAt: Date;
} 