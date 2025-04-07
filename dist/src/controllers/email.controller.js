"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmailController = void 0;
const firebase_config_1 = require("../config/firebase.config");
const tracking_1 = require("../utils/tracking");
const tracking_service_1 = require("../services/tracking.service");
class EmailController {
    static async sendCampaign(req, res) {
        try {
            const { trackingId, tracking, ...campaign } = req.body;
            console.log('📧 Enviando campaña:', campaign.name);
            console.log('🔍 Tracking ID:', trackingId);
            const initialMetrics = {
                totalRecipients: campaign.recipients.length,
                totalOpens: 0,
                uniqueOpens: 0,
                openRate: 0,
                totalClicks: 0,
                clickThroughRate: 0,
                bounceRate: 0,
                bouncedCount: 0,
                responseRate: 0,
                responseCount: 0,
                deliveredCount: campaign.recipients.length,
                deviceMetrics: {
                    Desktop: 0,
                    Mobile: 0,
                    Tablet: 0,
                    Unknown: 0
                },
                lastUpdated: new Date()
            };
            await firebase_config_1.db.collection('emailCampaigns').doc(campaign.id).set({
                ...campaign,
                status: 'sending',
                metrics: initialMetrics,
                updatedAt: new Date()
            }, { merge: true });
            if (tracking) {
                const templateDoc = await firebase_config_1.db.collection('emailTemplates').doc(campaign.templateId).get();
                if (!templateDoc.exists) {
                    console.error('❌ Plantilla no encontrada:', campaign.templateId);
                    return res.status(404).json({ error: 'Plantilla no encontrada' });
                }
                const template = templateDoc.data();
                console.log('📝 Plantilla obtenida:', template.name);
                const trackingPixel = (0, tracking_1.generatePixelImage)(trackingId);
                template.elements.unshift({
                    id: `tracking-${trackingId}`,
                    type: 'text',
                    content: trackingPixel,
                    options: {
                        padding: '0',
                        margin: '0',
                        backgroundColor: 'transparent'
                    }
                });
                template.elements = template.elements.map(element => {
                    if (element.type === 'button' && element.options?.href) {
                        const linkId = `${trackingId}-${element.id}`;
                        element.options.href = (0, tracking_1.generateTrackingLink)(element.options.href, trackingId, linkId);
                    }
                    return element;
                });
                await firebase_config_1.db.collection('emailTracking').add({
                    trackingId,
                    campaignId: campaign.id,
                    createdAt: new Date()
                });
            }
            const results = await Promise.all(campaign.recipients.map(async (recipient) => {
                try {
                    console.log('📤 Enviando a:', recipient.email);
                    const messageId = `${trackingId}-${recipient.id}`;
                    return {
                        success: true,
                        recipientId: recipient.id,
                        messageId,
                        sentAt: new Date()
                    };
                }
                catch (error) {
                    console.error('❌ Error enviando a:', recipient.email, error);
                    return {
                        success: false,
                        recipientId: recipient.id,
                        error: error.message,
                        sentAt: new Date()
                    };
                }
            }));
            const stats = {
                total: results.length,
                sent: results.filter(r => r.success).length,
                delivered: results.filter(r => r.success).length,
                failed: results.filter(r => !r.success).length,
                opened: 0,
                clicked: 0
            };
            console.log('📊 Estadísticas de la campaña:', stats);
            await firebase_config_1.db.collection('emailCampaigns').doc(campaign.id).update({
                status: 'sent',
                sentDate: new Date(),
                'metrics.deliveredCount': stats.delivered,
                'metrics.lastUpdated': new Date()
            });
            console.log('✅ Campaña enviada exitosamente');
            res.json(results);
        }
        catch (error) {
            console.error('❌ Error al enviar la campaña:', error);
            res.status(500).json({ error: 'Error al enviar la campaña' });
        }
    }
    static async trackOpen(req, res) {
        try {
            const { trackingId } = req.params;
            const userAgent = req.headers['user-agent'] || '';
            const ipAddress = req.ip;
            await tracking_service_1.TrackingService.recordOpen(trackingId, { userAgent, ipAddress });
            res.setHeader('Content-Type', 'image/gif');
            res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
            res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
        }
        catch (error) {
            console.error('❌ Error al registrar apertura:', error);
            res.setHeader('Content-Type', 'image/gif');
            res.send(Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64'));
        }
    }
    static async trackClick(req, res) {
        try {
            const { trackingId, linkId } = req.params;
            const { url } = req.query;
            if (!url) {
                return res.status(400).json({ error: 'URL no proporcionada' });
            }
            await tracking_service_1.TrackingService.recordClick(trackingId, linkId);
            res.redirect(url.toString());
        }
        catch (error) {
            console.error('❌ Error al registrar clic:', error);
            if (req.query.url) {
                res.redirect(req.query.url.toString());
            }
            else {
                res.status(500).json({ error: 'Error al registrar clic' });
            }
        }
    }
    static async getMetrics(req, res) {
        try {
            const { campaignId } = req.params;
            const metrics = await tracking_service_1.TrackingService.getCampaignMetrics(campaignId);
            res.json(metrics);
        }
        catch (error) {
            console.error('Error al obtener métricas:', error);
            res.status(500).json({ error: 'Error al obtener métricas' });
        }
    }
    static async handleBounce(req, res) {
        try {
            const { trackingId, type, reason } = req.body;
            const trackingSnapshot = await firebase_config_1.db.collection('emailTracking')
                .where('trackingId', '==', trackingId)
                .limit(1)
                .get();
            if (!trackingSnapshot.empty) {
                const tracking = trackingSnapshot.docs[0].data();
                const campaignId = tracking.campaignId;
                await firebase_config_1.db.collection('emailBounces').add({
                    trackingId,
                    campaignId,
                    type,
                    reason,
                    timestamp: new Date()
                });
                const campaignDoc = await firebase_config_1.db.collection('emailCampaigns').doc(campaignId).get();
                if (campaignDoc.exists) {
                    const campaign = campaignDoc.data();
                    const bouncesSnapshot = await firebase_config_1.db.collection('emailBounces')
                        .where('campaignId', '==', campaignId)
                        .get();
                    const bouncedCount = bouncesSnapshot.size;
                    const bounceRate = (bouncedCount / campaign.metrics.totalRecipients) * 100;
                    await firebase_config_1.db.collection('emailCampaigns').doc(campaignId).update({
                        'metrics.bouncedCount': bouncedCount,
                        'metrics.bounceRate': bounceRate,
                        'metrics.lastUpdated': new Date()
                    });
                }
            }
            res.status(200).send();
        }
        catch (error) {
            console.error('Error al procesar rebote:', error);
            res.status(500).json({ error: 'Error al procesar rebote' });
        }
    }
    static async handleResponse(req, res) {
        try {
            const { trackingId, type } = req.body;
            const trackingSnapshot = await firebase_config_1.db.collection('emailTracking')
                .where('trackingId', '==', trackingId)
                .limit(1)
                .get();
            if (!trackingSnapshot.empty) {
                const tracking = trackingSnapshot.docs[0].data();
                const campaignId = tracking.campaignId;
                await firebase_config_1.db.collection('emailResponses').add({
                    trackingId,
                    campaignId,
                    type,
                    timestamp: new Date()
                });
                const campaignDoc = await firebase_config_1.db.collection('emailCampaigns').doc(campaignId).get();
                if (campaignDoc.exists) {
                    const campaign = campaignDoc.data();
                    const responsesSnapshot = await firebase_config_1.db.collection('emailResponses')
                        .where('campaignId', '==', campaignId)
                        .get();
                    const responseCount = responsesSnapshot.size;
                    const responseRate = (responseCount / campaign.metrics.totalRecipients) * 100;
                    await firebase_config_1.db.collection('emailCampaigns').doc(campaignId).update({
                        'metrics.responseCount': responseCount,
                        'metrics.responseRate': responseRate,
                        'metrics.lastUpdated': new Date()
                    });
                }
            }
            res.status(200).send();
        }
        catch (error) {
            console.error('Error al procesar respuesta:', error);
            res.status(500).json({ error: 'Error al procesar respuesta' });
        }
    }
    static async getCampaigns(req, res) {
        try {
            console.log('🔍 Iniciando obtención de campañas');
            const userId = req.query.userId || 'user-test';
            console.log('👤 Usuario solicitante:', userId);
            const campaignsRef = firebase_config_1.db.collection('emailCampaigns');
            const campaignsSnap = await campaignsRef.where('userId', '==', userId).get();
            console.log('📊 Total de campañas encontradas:', campaignsSnap.size);
            const campaigns = campaignsSnap.docs.map(doc => {
                const data = doc.data();
                console.log(`\n📧 Campaña ${doc.id}:`, {
                    nombre: data.name,
                    estado: data.status,
                    métricas: data.metrics ? {
                        totalDestinatarios: data.metrics.totalRecipients,
                        aperturasÚnicas: data.metrics.uniqueOpens,
                        tasaApertura: `${data.metrics.openRate?.toFixed(1)}%`,
                        clicsTotal: data.metrics.totalClicks,
                        tasaRebote: `${data.metrics.bounceRate?.toFixed(1)}%`
                    } : 'Sin métricas'
                });
                return {
                    id: doc.id,
                    ...data
                };
            });
            console.log('✅ Enviando respuesta al frontend');
            res.json(campaigns);
        }
        catch (error) {
            console.error('❌ Error al obtener campañas:', error);
            res.status(500).json({ error: 'Error al obtener campañas' });
        }
    }
    static async getCampaignById(req, res) {
        try {
            const { id } = req.params;
            const campaignDoc = await firebase_config_1.db.collection('emailCampaigns').doc(id).get();
            if (!campaignDoc.exists) {
                return res.status(404).json({ error: 'Campaña no encontrada' });
            }
            res.json({
                id: campaignDoc.id,
                ...campaignDoc.data()
            });
        }
        catch (error) {
            console.error('❌ Error al obtener campaña:', error);
            res.status(500).json({ error: 'Error al obtener campaña' });
        }
    }
    static async deleteCampaign(req, res) {
        try {
            const { id } = req.params;
            await firebase_config_1.db.collection('emailCampaigns').doc(id).delete();
            res.status(200).send();
        }
        catch (error) {
            console.error('❌ Error al eliminar campaña:', error);
            res.status(500).json({ error: 'Error al eliminar campaña' });
        }
    }
}
exports.EmailController = EmailController;
//# sourceMappingURL=email.controller.js.map