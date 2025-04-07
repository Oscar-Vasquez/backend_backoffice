"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var EmailController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const common_1 = require("@nestjs/common");
const email_service_1 = require("./email.service");
const prisma_service_1 = require("../prisma/prisma.service");
let EmailController = EmailController_1 = class EmailController {
    constructor(emailService, prisma) {
        this.emailService = emailService;
        this.prisma = prisma;
        this.logger = new common_1.Logger(EmailController_1.name);
    }
    async sendCampaign(campaign) {
        try {
            this.logger.log('📧 Recibida solicitud de envío de campaña:', {
                name: campaign.name,
                templateId: campaign.templateId,
                recipientsCount: campaign.recipients?.length || 0
            });
            if (!campaign.templateId) {
                throw new common_1.HttpException('ID de plantilla no proporcionado', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!campaign.recipients || campaign.recipients.length === 0) {
                throw new common_1.HttpException('No se proporcionaron destinatarios', common_1.HttpStatus.BAD_REQUEST);
            }
            if (!campaign.subject) {
                throw new common_1.HttpException('Asunto del correo no proporcionado', common_1.HttpStatus.BAD_REQUEST);
            }
            const results = await this.emailService.sendCampaign(campaign);
            this.logger.log('✅ Campaña enviada exitosamente');
            return results;
        }
        catch (error) {
            this.logger.error('❌ Error al enviar campaña:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Error al enviar la campaña de correo', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCampaigns() {
        try {
            this.logger.log('🔍 Obteniendo campañas de correo');
            const campaigns = await this.emailService.getCampaigns();
            this.logger.log('✅ Campañas obtenidas:', campaigns.length);
            return campaigns;
        }
        catch (error) {
            this.logger.error('❌ Error al obtener campañas:', error);
            throw new common_1.HttpException(error.message || 'Error al obtener las campañas', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async getCampaignById(id) {
        try {
            this.logger.log('🔍 Obteniendo campaña:', id);
            const campaign = await this.prisma.email_campaigns.findUnique({
                where: { id },
                include: { email_templates: true }
            });
            if (!campaign) {
                throw new common_1.HttpException('Campaña no encontrada', common_1.HttpStatus.NOT_FOUND);
            }
            return {
                id: campaign.id,
                name: campaign.name,
                subject: campaign.subject,
                templateId: campaign.template_id,
                status: campaign.status,
                recipients: campaign.recipients || [],
                metrics: campaign.stats,
                createdAt: campaign.created_at,
                updatedAt: campaign.updated_at,
                userId: campaign.user_id
            };
        }
        catch (error) {
            this.logger.error('❌ Error al obtener campaña por ID:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Error al obtener la campaña', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async deleteCampaign(id) {
        try {
            this.logger.log('🗑️ Eliminando campaña:', id);
            const campaign = await this.prisma.email_campaigns.findUnique({
                where: { id }
            });
            if (!campaign) {
                throw new common_1.HttpException('Campaña no encontrada', common_1.HttpStatus.NOT_FOUND);
            }
            await this.prisma.email_campaigns.delete({
                where: { id }
            });
            this.logger.log('✅ Campaña eliminada correctamente');
        }
        catch (error) {
            this.logger.error('❌ Error al eliminar campaña:', error);
            if (error instanceof common_1.HttpException) {
                throw error;
            }
            throw new common_1.HttpException(error.message || 'Error al eliminar la campaña', common_1.HttpStatus.INTERNAL_SERVER_ERROR);
        }
    }
    async trackEmailOpen(trackingId, req, res) {
        try {
            this.logger.log('📊 Tracking email open:', trackingId);
            const trackingPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.setHeader('Content-Type', 'image/gif');
            res.setHeader('Content-Length', trackingPixel.length);
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.setHeader('Pragma', 'no-cache');
            res.setHeader('Expires', '0');
            await this.emailService.trackEmailOpen(trackingId, {
                userAgent: req.headers['user-agent'],
                ipAddress: req.ip
            });
            res.send(trackingPixel);
        }
        catch (error) {
            this.logger.error('❌ Error al registrar apertura de email:', error);
            const fallbackPixel = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
            res.send(fallbackPixel);
        }
    }
    async trackEmailClick(campaignId, recipientId, targetUrl, res) {
        try {
            this.logger.log('🔗 Rastreando clic en enlace:', { campaignId, recipientId, targetUrl });
            const campaign = await this.prisma.email_campaigns.findUnique({
                where: { id: campaignId },
                select: { stats: true }
            });
            if (!campaign) {
                throw new Error('Campaña no encontrada');
            }
            const stats = campaign.stats || {};
            stats.clicked = (stats.clicked || 0) + 1;
            stats.clickedLinks = stats.clickedLinks || [];
            stats.clickedLinks.push({
                recipientId,
                url: targetUrl,
                clickedAt: new Date()
            });
            await this.prisma.email_campaigns.update({
                where: { id: campaignId },
                data: {
                    stats: stats,
                    updated_at: new Date()
                }
            });
            res.redirect(targetUrl);
        }
        catch (error) {
            this.logger.error('❌ Error al rastrear clic:', error);
            res.redirect(targetUrl);
        }
    }
};
exports.EmailController = EmailController;
__decorate([
    (0, common_1.Post)('send'),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "sendCampaign", null);
__decorate([
    (0, common_1.Get)('campaigns'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getCampaigns", null);
__decorate([
    (0, common_1.Get)('campaigns/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "getCampaignById", null);
__decorate([
    (0, common_1.Delete)('campaigns/:id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "deleteCampaign", null);
__decorate([
    (0, common_1.Get)('track/open/:trackingId'),
    __param(0, (0, common_1.Param)('trackingId')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "trackEmailOpen", null);
__decorate([
    (0, common_1.Get)('track/click/:campaignId/:recipientId'),
    __param(0, (0, common_1.Param)('campaignId')),
    __param(1, (0, common_1.Param)('recipientId')),
    __param(2, (0, common_1.Query)('url')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], EmailController.prototype, "trackEmailClick", null);
exports.EmailController = EmailController = EmailController_1 = __decorate([
    (0, common_1.Controller)('email'),
    __metadata("design:paramtypes", [email_service_1.EmailService,
        prisma_service_1.PrismaService])
], EmailController);
//# sourceMappingURL=email.controller.js.map