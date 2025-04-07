import { db } from '../config/firebase.config';
import { EmailCampaignMetrics } from '../types/email-template';

interface TrackingInfo {
  userAgent?: string;
  ipAddress?: string;
}

export class TrackingService {
  static async recordOpen(trackingId: string, trackingInfo?: TrackingInfo): Promise<void> {
    try {
      console.log('📊 Registrando apertura para trackingId:', trackingId);
      
      // Extraer campaignId y recipientId del trackingId compuesto
      const [campaignId, recipientId] = trackingId.split('-');
      
      if (!campaignId || !recipientId) {
        console.error('❌ TrackingId inválido:', trackingId);
        return;
      }

      console.log('📝 Datos de tracking:', { campaignId, recipientId });

      // Registrar apertura con información detallada
      const openData = {
        trackingId,
        campaignId,
        recipientId,
        timestamp: new Date(),
        metadata: {
          userAgent: trackingInfo?.userAgent || 'Unknown',
          ipAddress: trackingInfo?.ipAddress || 'Unknown',
          deviceType: this.getDeviceType(trackingInfo?.userAgent),
        }
      };

      await db.collection('emailOpens').add(openData);
      console.log('✅ Apertura registrada en la colección emailOpens');

      // Obtener métricas actualizadas
      const metrics = await this.getCampaignMetrics(campaignId);
      console.log('📊 Métricas calculadas:', metrics);

      // Actualizar campaña
      const campaignRef = db.collection('emailCampaigns').doc(campaignId);
      await campaignRef.update({
        metrics,
        status: 'sent',
        'stats.opened': metrics.uniqueOpens,
        updatedAt: new Date()
      });

      console.log('✅ Campaña actualizada con nuevas métricas:', {
        campaignId,
        metrics
      });
    } catch (error) {
      console.error('❌ Error al registrar apertura:', error);
      throw error;
    }
  }

  private static async getOpenCount(trackingId: string): Promise<number> {
    const opensRef = db.collection('emailOpens').where('trackingId', '==', trackingId);
    const opensDoc = await opensRef.get();
    return opensDoc.size;
  }

  private static getDeviceType(userAgent?: string): string {
    if (!userAgent) return 'Unknown';
    
    const userAgentLower = userAgent.toLowerCase();
    if (/mobile|android|iphone|ipad|ipod/i.test(userAgentLower)) {
      if (/ipad/i.test(userAgentLower)) return 'Tablet';
      if (/mobile|android|iphone|ipod/i.test(userAgentLower)) return 'Mobile';
    }
    return 'Desktop';
  }

  static async recordClick(trackingId: string, linkId: string): Promise<void> {
    const trackingRef = db.collection('emailTracking').where('trackingId', '==', trackingId);
    const trackingDoc = await trackingRef.get();

    if (trackingDoc.empty) return;

    const tracking = trackingDoc.docs[0];
    const campaignId = tracking.data().campaignId;

    // Registrar clic
    await db.collection('emailClicks').add({
      trackingId,
      linkId,
      campaignId,
      timestamp: new Date()
    });

    // Actualizar métricas de la campaña
    await this.updateCampaignMetrics(campaignId);
  }

  static async recordBounce(bounceData: any): Promise<void> {
    const { trackingId, type, reason } = bounceData;
    
    const trackingRef = db.collection('emailTracking').where('trackingId', '==', trackingId);
    const trackingDoc = await trackingRef.get();

    if (trackingDoc.empty) return;

    const tracking = trackingDoc.docs[0];
    const campaignId = tracking.data().campaignId;

    // Registrar rebote
    await db.collection('emailBounces').add({
      trackingId,
      campaignId,
      type,
      reason,
      timestamp: new Date()
    });

    // Actualizar métricas de la campaña
    await this.updateCampaignMetrics(campaignId);
  }

  static async recordResponse(responseData: any): Promise<void> {
    const { trackingId, type } = responseData;
    
    const trackingRef = db.collection('emailTracking').where('trackingId', '==', trackingId);
    const trackingDoc = await trackingRef.get();

    if (trackingDoc.empty) return;

    const tracking = trackingDoc.docs[0];
    const campaignId = tracking.data().campaignId;

    // Registrar respuesta
    await db.collection('emailResponses').add({
      trackingId,
      campaignId,
      type,
      timestamp: new Date()
    });

    // Actualizar métricas de la campaña
    await this.updateCampaignMetrics(campaignId);
  }

  static async getCampaignMetrics(campaignId: string): Promise<EmailCampaignMetrics> {
    try {
      console.log('\n📊 Calculando métricas para campaña:', campaignId);

      const [opensSnap, clicksSnap, bouncesSnap, responsesSnap, campaignSnap] = await Promise.all([
        db.collection('emailOpens').where('campaignId', '==', campaignId).get(),
        db.collection('emailClicks').where('campaignId', '==', campaignId).get(),
        db.collection('emailBounces').where('campaignId', '==', campaignId).get(),
        db.collection('emailResponses').where('campaignId', '==', campaignId).get(),
        db.collection('emailCampaigns').doc(campaignId).get()
      ]);

      console.log('📥 Datos crudos obtenidos:', {
        aperturas: opensSnap.size,
        clics: clicksSnap.size,
        rebotes: bouncesSnap.size,
        respuestas: responsesSnap.size,
        existeCampaña: campaignSnap.exists
      });

      if (!campaignSnap.exists) {
        throw new Error('Campaña no encontrada');
      }

      const campaign = campaignSnap.data();
      const totalRecipients = campaign?.recipients?.length || 0;
      const bouncedCount = bouncesSnap.size;
      const deliveredCount = totalRecipients - bouncedCount;

      console.log('📬 Datos de entrega:', {
        totalDestinatarios: totalRecipients,
        rebotados: bouncedCount,
        entregados: deliveredCount
      });

      // Calcular aperturas únicas
      const uniqueTrackingIds = new Set(opensSnap.docs.map(doc => doc.data().trackingId));
      const uniqueOpens = uniqueTrackingIds.size;
      const totalOpens = opensSnap.size;

      console.log('👁️ Datos de apertura:', {
        aperturasÚnicas: uniqueOpens,
        aperturasTotal: totalOpens,
        trackingIdsÚnicos: Array.from(uniqueTrackingIds)
      });

      // Calcular tasa de apertura
      const openRate = deliveredCount > 0 ? (uniqueOpens / deliveredCount) * 100 : 0;

      console.log('📈 Cálculo de tasa de apertura:', {
        fórmula: 'aperturasÚnicas / entregados * 100',
        valores: `${uniqueOpens} / ${deliveredCount} * 100`,
        resultado: `${openRate.toFixed(2)}%`
      });

      // Resto de cálculos...
      const totalClicks = clicksSnap.size;
      const responseCount = responsesSnap.size;
      const bounceRate = totalRecipients > 0 ? (bouncedCount / totalRecipients) * 100 : 0;
      const responseRate = deliveredCount > 0 ? (responseCount / deliveredCount) * 100 : 0;
      const clickThroughRate = uniqueOpens > 0 ? (totalClicks / uniqueOpens) * 100 : 0;

      // Calcular métricas por dispositivo
      const deviceMetrics = this.calculateDeviceMetrics(opensSnap.docs);

      const metrics = {
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

      console.log('✅ Métricas finales calculadas:', metrics);
      return metrics;
    } catch (error) {
      console.error('❌ Error al calcular métricas:', error);
      throw error;
    }
  }

  private static calculateDeviceMetrics(openDocs: FirebaseFirestore.QueryDocumentSnapshot<FirebaseFirestore.DocumentData>[]): any {
    const devices = {
      Desktop: 0,
      Mobile: 0,
      Tablet: 0,
      Unknown: 0
    };

    openDocs.forEach(doc => {
      const deviceType = doc.data().metadata?.deviceType || 'Unknown';
      devices[deviceType]++;
    });

    return devices;
  }

  private static async updateCampaignMetrics(campaignId: string): Promise<void> {
    try {
      const metrics = await this.getCampaignMetrics(campaignId);
      
      await db.collection('emailCampaigns').doc(campaignId).update({
        metrics,
        updatedAt: new Date()
      });

      console.log('✅ Métricas actualizadas correctamente:', {
        campaignId,
        metrics
      });
    } catch (error) {
      console.error('❌ Error al actualizar métricas:', error);
      throw error;
    }
  }
} 