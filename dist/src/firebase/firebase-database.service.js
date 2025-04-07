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
var FirebaseDatabaseService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.FirebaseDatabaseService = void 0;
const common_1 = require("@nestjs/common");
const admin = require("firebase-admin");
const firebase_service_1 = require("./firebase.service");
const email_service_1 = require("../email/email.service");
const puppeteer = require("puppeteer");
let FirebaseDatabaseService = FirebaseDatabaseService_1 = class FirebaseDatabaseService {
    constructor(firebaseService, emailService) {
        this.firebaseService = firebaseService;
        this.emailService = emailService;
        this.logger = new common_1.Logger(FirebaseDatabaseService_1.name);
        this.db = admin.firestore();
    }
    getCollection(collectionName) {
        this.logger.debug(`🔍 Intentando obtener colección: ${collectionName}`);
        try {
            const collection = this.db.collection(collectionName);
            collection.limit(1).get().then(snapshot => {
                this.logger.debug(`✅ Colección ${collectionName} accesible. Documentos encontrados: ${snapshot.size}`);
                if (snapshot.size > 0) {
                    const ejemplo = snapshot.docs[0].data();
                    this.logger.debug(`📄 Ejemplo de documento en ${collectionName}:`, ejemplo);
                }
            }).catch(error => {
                this.logger.error(`❌ Error al acceder a la colección ${collectionName}:`, error);
            });
            return collection;
        }
        catch (error) {
            this.logger.error(`❌ Error al obtener colección ${collectionName}:`, error);
            throw error;
        }
    }
    convertTimestampToDate(data) {
        if (data instanceof admin.firestore.Timestamp) {
            return data.toDate();
        }
        if (Array.isArray(data)) {
            return data.map(item => this.convertTimestampToDate(item));
        }
        if (typeof data === 'object' && data !== null) {
            return Object.keys(data).reduce((result, key) => ({
                ...result,
                [key]: this.convertTimestampToDate(data[key])
            }), {});
        }
        return data;
    }
    async initializeDatabase(data) {
        try {
            const batch = this.db.batch();
            if (data.branches) {
                Object.entries(data.branches).forEach(([id, branch]) => {
                    const ref = this.db.collection('branches').doc(id);
                    batch.set(ref, branch);
                });
            }
            if (data.operators) {
                Object.entries(data.operators).forEach(([id, operator]) => {
                    const ref = this.db.collection('operators').doc(id);
                    batch.set(ref, operator);
                });
            }
            if (data.users) {
                Object.entries(data.users).forEach(([id, user]) => {
                    const ref = this.db.collection('users').doc(id);
                    batch.set(ref, user);
                });
            }
            if (data.companies) {
                Object.entries(data.companies).forEach(([id, company]) => {
                    const ref = this.db.collection('companies').doc(id);
                    batch.set(ref, company);
                });
            }
            await batch.commit();
            this.logger.log('✅ Base de datos inicializada correctamente');
        }
        catch (error) {
            this.logger.error('❌ Error al inicializar la base de datos:', error);
            throw error;
        }
    }
    async deleteDatabase() {
        try {
            const collections = await this.db.listCollections();
            for (const collection of collections) {
                const documents = await collection.listDocuments();
                const batch = this.db.batch();
                documents.forEach(doc => {
                    batch.delete(doc);
                });
                await batch.commit();
            }
            this.logger.log('✅ Base de datos eliminada correctamente');
        }
        catch (error) {
            this.logger.error('❌ Error al eliminar la base de datos:', error);
            throw error;
        }
    }
    async resetDatabase(newData) {
        try {
            await this.deleteDatabase();
            await this.initializeDatabase(newData);
            this.logger.log('✅ Base de datos reiniciada correctamente');
        }
        catch (error) {
            this.logger.error('❌ Error al reiniciar la base de datos:', error);
            throw error;
        }
    }
    async verifyDatabase() {
        try {
            const collections = await this.db.listCollections();
            const result = {};
            for (const collection of collections) {
                const snapshot = await collection.get();
                result[collection.id] = snapshot.size;
            }
            this.logger.log('📊 Estado actual de la base de datos:', result);
            return { collections: result };
        }
        catch (error) {
            this.logger.error('❌ Error al verificar la base de datos:', error);
            throw error;
        }
    }
    async generateTemplateThumbnail(template) {
        try {
            console.log('🎨 Iniciando generación de miniatura para template:', template.name);
            console.log('📝 Generando HTML del template...');
            const thumbnailHtml = this.emailService.generateTemplateHtml(template);
            console.log('✅ HTML generado correctamente');
            console.log('🖼️ Convirtiendo HTML a imagen...');
            const thumbnailBase64 = await this.captureHtmlAsImage(thumbnailHtml);
            if (!thumbnailBase64) {
                console.warn('⚠️ No se pudo generar la miniatura - Error en la captura de imagen');
                return null;
            }
            console.log('✅ Imagen generada correctamente');
            const fileName = `templates/thumbnails/${Date.now()}-${template.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
            console.log('📤 Subiendo imagen a Firebase Storage:', fileName);
            const fileUrl = await this.uploadBase64Image(fileName, thumbnailBase64);
            if (!fileUrl) {
                console.warn('⚠️ No se pudo generar la miniatura - Error al subir la imagen');
                return null;
            }
            console.log('✅ Miniatura generada y subida correctamente:', fileUrl);
            return fileUrl;
        }
        catch (error) {
            console.error('❌ Error al generar miniatura:', error);
            return null;
        }
    }
    async captureHtmlAsImage(html) {
        let browser = null;
        try {
            console.log('🌐 Iniciando navegador puppeteer...');
            browser = await puppeteer.launch({
                headless: true,
                args: [
                    '--no-sandbox',
                    '--disable-setuid-sandbox',
                    '--disable-dev-shm-usage',
                    '--disable-accelerated-2d-canvas',
                    '--disable-gpu'
                ]
            });
            console.log('✅ Navegador iniciado correctamente');
            const page = await browser.newPage();
            console.log('📄 Nueva página creada');
            await page.setViewport({
                width: 600,
                height: 800,
                deviceScaleFactor: 2,
            });
            console.log('🖥️ Viewport configurado');
            console.log('📝 Cargando HTML en la página...');
            await page.setContent(html, {
                waitUntil: ['networkidle0', 'domcontentloaded']
            });
            console.log('✅ HTML cargado correctamente');
            await page.evaluate(() => {
                return Promise.all(Array.from(document.images)
                    .filter(img => !img.complete)
                    .map(img => new Promise(resolve => {
                    img.onload = img.onerror = resolve;
                })));
            });
            console.log('🖼️ Imágenes cargadas correctamente');
            console.log('📸 Capturando screenshot...');
            const screenshot = await page.screenshot({
                type: 'png',
                encoding: 'base64',
                fullPage: true
            });
            console.log('✅ Screenshot capturado correctamente');
            return `data:image/png;base64,${screenshot}`;
        }
        catch (error) {
            console.error('❌ Error al capturar HTML como imagen:', error);
            return null;
        }
        finally {
            if (browser) {
                try {
                    await browser.close();
                    console.log('🔒 Navegador cerrado correctamente');
                }
                catch (error) {
                    console.error('❌ Error al cerrar el navegador:', error);
                }
            }
        }
    }
    async uploadBase64Image(fileName, base64Data) {
        try {
            console.log('🔄 Preparando imagen para subir...');
            const imageBuffer = Buffer.from(base64Data.split(',')[1], 'base64');
            console.log('✅ Buffer creado correctamente');
            console.log('📤 Subiendo a Firebase Storage...');
            const bucket = admin.storage().bucket();
            const file = bucket.file(fileName);
            await file.save(imageBuffer, {
                metadata: {
                    contentType: 'image/png',
                    cacheControl: 'public, max-age=31536000'
                }
            });
            console.log('✅ Archivo guardado en Storage');
            console.log('🔗 Generando URL pública...');
            const [downloadUrl] = await file.getSignedUrl({
                action: 'read',
                expires: Date.now() + 7 * 24 * 60 * 60 * 1000,
            });
            console.log('✅ URL generada correctamente:', downloadUrl);
            return downloadUrl;
        }
        catch (error) {
            console.error('❌ Error al subir imagen:', error);
            if (error instanceof Error) {
                console.error('Detalles del error:', error.message);
                console.error('Stack:', error.stack);
            }
            return null;
        }
    }
    async saveEmailTemplate(template) {
        try {
            console.log('📝 Guardando template y generando miniatura...');
            const thumbnailUrl = await this.generateTemplateThumbnail(template);
            console.log('🖼️ URL de la miniatura:', thumbnailUrl);
            const templateData = {
                ...template,
                thumbnail: thumbnailUrl,
                createdAt: new Date(),
                updatedAt: new Date()
            };
            const firestoreData = {
                ...templateData,
                createdAt: admin.firestore.Timestamp.fromDate(templateData.createdAt),
                updatedAt: admin.firestore.Timestamp.fromDate(templateData.updatedAt)
            };
            const templateRef = await this.db.collection('emailTemplates').add(firestoreData);
            console.log('✅ Template guardado con ID:', templateRef.id);
            return {
                ...templateData,
                id: templateRef.id
            };
        }
        catch (error) {
            console.error('❌ Error al guardar template:', error);
            throw error;
        }
    }
    async getEmailTemplates(userId) {
        try {
            console.log('🔍 Verificando conexión a Firestore...');
            const collections = await this.db.listCollections();
            console.log('📚 Colecciones disponibles:', collections.map(col => col.id));
            console.log('🔍 Intentando acceder a la colección "emailTemplates"...');
            const templatesRef = this.db.collection('emailTemplates');
            const snapshot = await templatesRef.get();
            console.log('📊 Total de plantillas encontradas:', snapshot.size);
            if (snapshot.size > 0) {
                console.log('📄 Contenido de la primera plantilla:', snapshot.docs[0].data());
            }
            const templates = snapshot.docs.map(doc => {
                const data = doc.data();
                console.log('📄 Plantilla encontrada:', {
                    id: doc.id,
                    userId: data.userId,
                    name: data.name,
                    createdAt: data.createdAt
                });
                return this.convertTimestampToDate({
                    id: doc.id,
                    ...data
                });
            });
            return templates;
        }
        catch (error) {
            console.error('❌ Error al obtener las plantillas de Firebase:', error);
            if (error instanceof Error) {
                console.error('Detalles del error:', error.message);
                console.error('Stack:', error.stack);
            }
            return [];
        }
    }
    async getEmailTemplateById(templateId) {
        try {
            console.log('🔍 Buscando plantilla con ID:', templateId);
            const templateDoc = await this.db.collection('emailTemplates').doc(templateId).get();
            if (!templateDoc.exists) {
                console.log('❌ Plantilla no encontrada');
                throw new Error('Plantilla no encontrada');
            }
            const data = templateDoc.data();
            console.log('📄 Datos completos de la plantilla encontrada:', JSON.stringify({
                id: templateDoc.id,
                name: data?.name,
                elements: data?.elements,
                editorSettings: data?.editorSettings,
                userId: data?.userId,
                createdAt: data?.createdAt,
                updatedAt: data?.updatedAt
            }, null, 2));
            const convertedData = this.convertTimestampToDate({
                id: templateDoc.id,
                ...data
            });
            console.log('🔄 Datos convertidos de la plantilla:', JSON.stringify(convertedData, null, 2));
            return convertedData;
        }
        catch (error) {
            console.error('❌ Error al obtener la plantilla:', error);
            throw error;
        }
    }
    async deleteEmailTemplate(templateId) {
        try {
            console.log('🗑️ Eliminando plantilla con ID:', templateId);
            await this.db.collection('emailTemplates').doc(templateId).delete();
            console.log('✅ Plantilla eliminada correctamente');
        }
        catch (error) {
            console.error('❌ Error al eliminar la plantilla:', error);
            throw error;
        }
    }
    async updateCampaignStats(campaignId, stats) {
        try {
            console.log('📊 Actualizando estadísticas de campaña:', campaignId);
            await this.db.collection('emailCampaigns').doc(campaignId).update({
                stats,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Estadísticas actualizadas');
        }
        catch (error) {
            console.error('❌ Error al actualizar estadísticas:', error);
            throw error;
        }
    }
    async getEmailCampaigns(userId) {
        try {
            console.log('🔍 Obteniendo campañas de correo para usuario:', userId);
            const snapshot = await this.db.collection('emailCampaigns')
                .where('userId', '==', userId)
                .get();
            const campaigns = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            return campaigns.sort((a, b) => {
                const dateA = new Date(a.createdAt);
                const dateB = new Date(b.createdAt);
                return dateB.getTime() - dateA.getTime();
            });
        }
        catch (error) {
            console.error('❌ Error al obtener campañas:', error);
            throw error;
        }
    }
    async getEmailCampaignById(campaignId) {
        try {
            console.log('🔍 Obteniendo campaña:', campaignId);
            const doc = await this.db.collection('emailCampaigns').doc(campaignId).get();
            if (!doc.exists) {
                throw new Error('Campaña no encontrada');
            }
            return {
                id: doc.id,
                ...doc.data()
            };
        }
        catch (error) {
            console.error('❌ Error al obtener campaña:', error);
            throw error;
        }
    }
    async deleteEmailCampaign(campaignId) {
        try {
            console.log('🗑️ Eliminando campaña:', campaignId);
            await this.db.collection('emailCampaigns').doc(campaignId).delete();
            console.log('✅ Campaña eliminada');
        }
        catch (error) {
            console.error('❌ Error al eliminar campaña:', error);
            throw error;
        }
    }
    async updateEmailTemplate(templateId, template) {
        try {
            console.log('📝 Actualizando template y regenerando miniatura...');
            const thumbnailUrl = await this.generateTemplateThumbnail(template);
            console.log('🖼️ URL de la miniatura:', thumbnailUrl);
            const templateData = {
                ...template,
                thumbnail: thumbnailUrl,
                updatedAt: new Date()
            };
            const firestoreData = {
                ...templateData,
                updatedAt: admin.firestore.Timestamp.fromDate(templateData.updatedAt)
            };
            await this.db.collection('emailTemplates').doc(templateId).update(firestoreData);
            console.log('✅ Template actualizado con ID:', templateId);
            return {
                ...templateData,
                id: templateId
            };
        }
        catch (error) {
            console.error('❌ Error al actualizar template:', error);
            throw error;
        }
    }
    async createEmailCampaign(campaignData) {
        try {
            console.log('📝 Creando nueva campaña de email');
            const campaignRef = await this.db.collection('emailCampaigns').add(campaignData);
            console.log('✅ Campaña creada con ID:', campaignRef.id);
            return campaignRef.id;
        }
        catch (error) {
            console.error('❌ Error al crear campaña:', error);
            throw error;
        }
    }
    async updateEmailCampaignStatus(campaignId, status, updatedAt = new Date()) {
        try {
            console.log('🔄 Actualizando estado de campaña:', campaignId, status);
            await this.db.collection('emailCampaigns').doc(campaignId).update({
                status,
                updatedAt
            });
            console.log('✅ Estado de campaña actualizado');
        }
        catch (error) {
            console.error('❌ Error al actualizar estado de campaña:', error);
            throw error;
        }
    }
    async trackEmailOpen(trackingId, trackingInfo) {
        try {
            console.log('📊 Iniciando registro de apertura:', {
                trackingId,
                trackingInfo,
                timestamp: new Date().toISOString()
            });
            const trackingRef = this.db.collection('emailTracking').where('trackingId', '==', trackingId);
            const trackingDoc = await trackingRef.get();
            if (trackingDoc.empty) {
                console.error('❌ Error: Tracking no encontrado:', trackingId);
                throw new Error(`Tracking no encontrado: ${trackingId}`);
            }
            const tracking = trackingDoc.docs[0];
            const campaignId = tracking.data().campaignId;
            const openData = {
                trackingId,
                campaignId,
                timestamp: admin.firestore.FieldValue.serverTimestamp(),
                metadata: {
                    userAgent: trackingInfo?.userAgent || 'Unknown',
                    ipAddress: trackingInfo?.ipAddress || 'Unknown',
                    deviceType: this.getDeviceType(trackingInfo?.userAgent),
                }
            };
            await this.db.collection('emailOpens').add(openData);
            console.log('✅ Apertura registrada en la colección emailOpens');
            const metrics = await this.getCampaignMetrics(campaignId);
            console.log('📊 Métricas calculadas:', metrics);
            const campaignRef = this.db.collection('emailCampaigns').doc(campaignId);
            await campaignRef.update({
                metrics,
                'stats.opened': metrics.uniqueOpens,
                updatedAt: admin.firestore.FieldValue.serverTimestamp()
            });
            console.log('✅ Campaña actualizada con nuevas métricas:', {
                campaignId,
                metrics
            });
        }
        catch (error) {
            console.error('❌ Error al registrar apertura:', error);
            throw error;
        }
    }
    getDeviceType(userAgent) {
        if (!userAgent)
            return 'Unknown';
        const ua = userAgent.toLowerCase();
        if (/mobile/i.test(ua))
            return 'Mobile';
        if (/ipad|tablet/i.test(ua))
            return 'Tablet';
        if (/android/i.test(ua) && !/mobile/i.test(ua))
            return 'Tablet';
        if (/windows|macintosh|linux/i.test(ua))
            return 'Desktop';
        return 'Unknown';
    }
    async trackEmailClick(campaignId, recipientId) {
        try {
            console.log('📊 Registrando clic en email:', { campaignId, recipientId });
            const campaignRef = this.db.collection('emailCampaigns').doc(campaignId);
            const campaignDoc = await campaignRef.get();
            if (!campaignDoc.exists) {
                throw new Error('Campaña no encontrada');
            }
            const campaign = campaignDoc.data();
            const stats = campaign.stats || {
                total: 0,
                sent: 0,
                delivered: 0,
                opened: 0,
                clicked: 0,
                failed: 0
            };
            const clickedByRef = this.db.collection('emailCampaigns')
                .doc(campaignId)
                .collection('clickedBy')
                .doc(recipientId);
            const clickedByDoc = await clickedByRef.get();
            if (!clickedByDoc.exists) {
                await clickedByRef.set({
                    timestamp: admin.firestore.FieldValue.serverTimestamp()
                });
                stats.clicked += 1;
                await campaignRef.update({
                    stats,
                    updatedAt: admin.firestore.FieldValue.serverTimestamp()
                });
            }
            console.log('✅ Clic registrado correctamente');
        }
        catch (error) {
            console.error('❌ Error al registrar clic:', error);
            throw error;
        }
    }
    async getCampaignMetrics(campaignId) {
        try {
            console.log('🔍 Obteniendo métricas para campaña:', campaignId);
            const [opensSnap, clicksSnap, bouncesSnap, responsesSnap, campaignSnap] = await Promise.all([
                this.db.collection('emailOpens').where('campaignId', '==', campaignId).get(),
                this.db.collection('emailClicks').where('campaignId', '==', campaignId).get(),
                this.db.collection('emailBounces').where('campaignId', '==', campaignId).get(),
                this.db.collection('emailResponses').where('campaignId', '==', campaignId).get(),
                this.db.collection('emailCampaigns').doc(campaignId).get()
            ]);
            if (!campaignSnap.exists) {
                throw new Error('Campaña no encontrada');
            }
            const campaign = campaignSnap.data();
            const totalRecipients = campaign?.recipients?.length || 0;
            const bouncedCount = bouncesSnap.size;
            const deliveredCount = totalRecipients - bouncedCount;
            const uniqueOpens = new Set(opensSnap.docs.map(doc => doc.data().trackingId)).size;
            const totalOpens = opensSnap.size;
            const totalClicks = clicksSnap.size;
            const responseCount = responsesSnap.size;
            const openRate = deliveredCount > 0 ? (uniqueOpens / deliveredCount) * 100 : 0;
            const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0;
            const responseRate = deliveredCount > 0 ? (responseCount / deliveredCount) * 100 : 0;
            const clickThroughRate = uniqueOpens > 0 ? (totalClicks / uniqueOpens) * 100 : 0;
            const deviceMetrics = this.calculateDeviceMetrics(opensSnap.docs);
            return {
                totalRecipients,
                totalOpens,
                uniqueOpens,
                openRate,
                totalClicks,
                clickThroughRate,
                bounceRate,
                bouncedCount,
                responseRate,
                responseCount,
                deliveredCount,
                deviceMetrics,
                lastUpdated: new Date()
            };
        }
        catch (error) {
            console.error('❌ Error al obtener métricas:', error);
            throw error;
        }
    }
    calculateDeviceMetrics(openDocs) {
        const deviceCounts = {
            Desktop: 0,
            Mobile: 0,
            Tablet: 0,
            Unknown: 0
        };
        openDocs.forEach(doc => {
            const data = doc.data();
            const deviceType = data.metadata?.deviceType || 'Unknown';
            deviceCounts[deviceType] = (deviceCounts[deviceType] || 0) + 1;
        });
        return deviceCounts;
    }
};
exports.FirebaseDatabaseService = FirebaseDatabaseService;
exports.FirebaseDatabaseService = FirebaseDatabaseService = FirebaseDatabaseService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(1, (0, common_1.Inject)((0, common_1.forwardRef)(() => email_service_1.EmailService))),
    __metadata("design:paramtypes", [firebase_service_1.FirebaseService,
        email_service_1.EmailService])
], FirebaseDatabaseService);
//# sourceMappingURL=firebase-database.service.js.map