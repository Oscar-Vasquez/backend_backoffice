"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const email_controller_1 = require("../controllers/email.controller");
const async_handler_1 = require("../middleware/async-handler");
const router = (0, express_1.Router)();
router.get('/track/open/:trackingId', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.trackOpen));
router.get('/track/click/:trackingId/:linkId', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.trackClick));
router.post('/track/bounce', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.handleBounce));
router.post('/track/response', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.handleResponse));
router.get('/campaigns', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.getCampaigns));
router.get('/campaigns/:id', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.getCampaignById));
router.delete('/campaigns/:id', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.deleteCampaign));
router.post('/send', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.sendCampaign));
router.get('/metrics/:campaignId', (0, async_handler_1.asyncHandler)(email_controller_1.EmailController.getMetrics));
exports.default = router;
//# sourceMappingURL=email.routes.js.map