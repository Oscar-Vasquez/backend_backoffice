"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTrackingLink = exports.generatePixelImage = exports.generateTrackingId = void 0;
const uuid_1 = require("uuid");
const API_URL = process.env.API_URL || 'http://localhost:3001/api/v1';
const generateTrackingId = () => {
    return (0, uuid_1.v4)();
};
exports.generateTrackingId = generateTrackingId;
const generatePixelImage = (trackingId) => {
    const trackingUrl = `http://localhost:3001/api/v1/email/track/open/${trackingId}`;
    return `
    <!-- Email Tracking Pixel -->
    <img src="${trackingUrl}" alt="" width="1" height="1" style="display:block !important; width:1px !important; height:1px !important; border:0 !important; margin:0 !important; padding:0 !important;" />
  `;
};
exports.generatePixelImage = generatePixelImage;
const generateTrackingLink = (originalUrl, trackingId, linkId) => {
    return `${API_URL}/email/track/click/${trackingId}/${linkId}?url=${encodeURIComponent(originalUrl)}`;
};
exports.generateTrackingLink = generateTrackingLink;
//# sourceMappingURL=tracking.js.map