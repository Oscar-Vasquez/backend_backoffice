import { Router } from 'express';
import { EmailController } from '../controllers/email.controller';
import { asyncHandler } from '../middleware/async-handler';

const router = Router();

// Rutas para tracking
router.get('/track/open/:trackingId', asyncHandler(EmailController.trackOpen));
router.get('/track/click/:trackingId/:linkId', asyncHandler(EmailController.trackClick));
router.post('/track/bounce', asyncHandler(EmailController.handleBounce));
router.post('/track/response', asyncHandler(EmailController.handleResponse));

// Rutas para campañas
router.get('/campaigns', asyncHandler(EmailController.getCampaigns));
router.get('/campaigns/:id', asyncHandler(EmailController.getCampaignById));
router.delete('/campaigns/:id', asyncHandler(EmailController.deleteCampaign));

// Ruta de envío de campaña
router.post('/send', asyncHandler(EmailController.sendCampaign));

// Rutas de métricas
router.get('/metrics/:campaignId', asyncHandler(EmailController.getMetrics));

export default router; 