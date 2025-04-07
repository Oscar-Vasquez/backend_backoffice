import { v4 as uuidv4 } from 'uuid';

const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';

export const generateTrackingId = (): string => {
  return uuidv4();
};

export const generatePixelImage = (trackingId: string): string => {
  const trackingUrl = `http://localhost:3001/api/v1/email/track/open/${trackingId}`;
  return `
    <!-- Email Tracking Pixel -->
    <img src="${trackingUrl}" alt="" width="1" height="1" style="display:block !important; width:1px !important; height:1px !important; border:0 !important; margin:0 !important; padding:0 !important;" />
  `;
};

export const generateTrackingLink = (originalUrl: string, trackingId: string, linkId: string): string => {
  return `${API_URL}/email/track/click/${trackingId}/${linkId}?url=${encodeURIComponent(originalUrl)}`;
}; 