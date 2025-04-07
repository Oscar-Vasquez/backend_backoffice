import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { AxiosResponse } from 'axios';
import axios from 'axios';
import { CargoPanamaResponse } from './interfaces/cargo-response.interface';
import { ShipmentDetails } from './interfaces/shipment-details.interface';

@Injectable()
export class CargoService {
  private readonly baseUrl = 'https://crm.panacargalogistic.com/paqueteria/busqueda/all/all';

  constructor(
    private configService: ConfigService,
    private readonly httpService: HttpService
  ) {}

  async getPackages() {
    try {
      const response = await axios.get<CargoPanamaResponse>(
        this.configService.get<string>('CARGOPANAMA_API_URL'),
        {
          params: {
            length: 500,
            start: 0,
            mode: 'all',
            interval: 'last_5d'
          },
          headers: {
            'authtoken': this.configService.get<string>('CARGOPANAMA_AUTH_TOKEN'),
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.data) {
        return {
          success: true,
          data: response.data.data.map((item) => ({
            hash: item.hash,
            clientId: item.client_id,
            clientName: item.client_name,
            packageName: item.package_name,
            receipt: item.receipt,
            tracking: item.tracking,
            mode: item.mode,
            shipper: item.shipper,
            totalItems: item.total_items,
            totalWeight: item.total_weight,
            volWeight: item.vol_weight,
            dimensions: {
              length: item.cargo_length,
              width: item.cargo_width,
              height: item.cargo_height,
              unit: item.unit
            },
            status: item.status,
            statusName: item.status_name,
            dateCreated: item.datecreated,
            dateUpdated: item.dateupdated
          }))
        };
      }

      throw new HttpException('No se encontraron datos', HttpStatus.NOT_FOUND);
    } catch (error) {
      console.error('Error al obtener paquetes:', error.response?.data || error.message);
      throw new HttpException(
        error.response?.data?.message || 'Error al consultar paquetes',
        error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }

  getShipmentDetails(trackingNumber: string): Observable<ShipmentDetails | null> {
    const headers = {
      'accept': 'application/json, text/javascript, */*; q=0.01',
      'accept-encoding': 'gzip, deflate, br, zstd',
      'accept-language': 'es-419,es;q=0.9',
      'x-requested-with': 'XMLHttpRequest',
      'user-agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
      'referer': `https://crm.panacargalogistic.com/paqueteria/resultado/${trackingNumber}`,
    };

    const params = {
      'csrf_token_name': '75a8fce5283677258d9f6614dccc4206',
      'draw': '1',
      'columns[0][data]': 'hash',
      'columns[0][searchable]': 'true',
      'columns[1][data]': 'status',
      'columns[2][data]': 'mode_name',
      'columns[3][data]': 'receipt',
      'columns[4][data]': 'datecreated',
      'columns[6][data]': 'tracking',
      'columns[8][data]': 'consignee_fullname',
      'start': '0',
      'length': '30',
      'search[value]': trackingNumber,
      'search[regex]': 'false',
    };

    return this.httpService.get(this.baseUrl, { headers, params }).pipe(
      map((response: AxiosResponse) => {
        if (response.status === 200 && response.data.data && response.data.data.length > 0) {
          const shipment = response.data.data[0];
          
          const fullDetails: ShipmentDetails = {
            cargo_height: shipment.cargo_height,
            cargo_length: shipment.cargo_length,
            cargo_width: shipment.cargo_width,
            consignee_fullname: shipment.consignee_fullname,
            consignee_id: shipment.consignee_id,
            datecreated: shipment.datecreated,
            destination: shipment.destination,
            destionation_id: shipment.destionation_id,
            hash: shipment.hash,
            hast_files: shipment.hast_files,
            is_communal: shipment.is_communal,
            mode_id: shipment.mode_id,
            mode_name: shipment.mode_name,
            origin_name: shipment.origin_name,
            origin_shortname: shipment.origin_shortname,
            other: shipment.other,
            parent: shipment.parent,
            photo: shipment.photo,
            receipt: shipment.receipt,
            shipment: shipment.shipment,
            shipper: shipment.shipper,
            status: shipment.status,
            status_name: shipment.status_name,
            total_cft: shipment.total_cft,
            total_items: shipment.total_items,
            total_pcs: shipment.total_pcs,
            total_weight: shipment.total_weight,
            tracking: shipment.tracking,
            unit: shipment.unit,
            vol_weight: shipment.vol_weight,
            vol_weight_kg: shipment.vol_weight_kg,
            message: response.data.message,
            recordsFiltered: response.data.recordsFiltered,
            recordsTotal: response.data.recordsTotal,
            success: response.data.success
          };

          return fullDetails;
        }
        return null;
      })
    );
  }

  async findByTracking(trackingNumber: string) {
    // Primero intentamos con los intervalos predefinidos
    const intervals = ['last_2d', 'last_3d', 'last_5d'];
    
    for (const interval of intervals) {
      try {
        console.log(`🔍 Buscando tracking en intervalo ${interval}:`, trackingNumber);
        const result = await this.searchWithParams(trackingNumber, { interval });
        if (result) return result;
      } catch (error) {
        console.error(`❌ Error en intervalo ${interval}:`, error.message);
        continue;
      }
    }
  
    // Si no encontramos en los intervalos, buscamos por fechas específicas
    const dates = [];
    const today = new Date();
    for (let i = 0; i < 30; i++) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      dates.push(date.toISOString().split('T')[0]);
    }
  
    for (const date of dates) {
      try {
        console.log(`🔍 Buscando tracking en fecha ${date}:`, trackingNumber);
        const result = await this.searchWithParams(trackingNumber, { date });
        if (result) return result;
        
        // Agregar un pequeño delay entre peticiones para no sobrecargar la API
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error(`❌ Error en fecha ${date}:`, error.message);
        continue;
      }
    }
  
    throw new HttpException(
      `No se encontró ningún paquete con el tracking: ${trackingNumber}`,
      HttpStatus.NOT_FOUND
    );
  }
  
  private async searchWithParams(trackingNumber: string, params: { interval?: string, date?: string }) {
    try {
      console.log('🔍 Parámetros de búsqueda:', { trackingNumber, ...params });
      
      const response = await axios.get<CargoPanamaResponse>(
        this.configService.get<string>('CARGOPANAMA_API_URL'),
        {
          params: {
            tracking: trackingNumber,
            length: 500,
            start: 0,
            mode: 'all',
            ...params
          },
          headers: {
            'authtoken': this.configService.get<string>('CARGOPANAMA_AUTH_TOKEN'),
            'Content-Type': 'application/json'
          }
        }
      );

      console.log('📦 Respuesta API:', {
        status: response.status,
        hasData: !!response.data,
        dataLength: response.data?.data?.length || 0
      });

      if (!response.data?.data?.length) {
        console.log('❌ No hay datos en la respuesta');
        return null;
      }

      const packageData = response.data.data.find(
        (item) => item.tracking === trackingNumber
      );

      if (!packageData) {
        console.log('❌ No se encontró el tracking específico');
        return null;
      }

      console.log('✅ Paquete encontrado:', {
        tracking: packageData.tracking,
        status: packageData.status_name
      });

      return {
        success: true,
        data: {
          hash: packageData.hash,
          clientId: packageData.client_id,
          clientName: packageData.client_name,
          packageName: packageData.package_name,
          receipt: packageData.receipt,
          tracking: packageData.tracking,
          mode: packageData.mode,
          shipper: packageData.shipper,
          totalItems: packageData.total_items,
          totalWeight: packageData.total_weight,
          volWeight: packageData.vol_weight,
          dimensions: {
            length: packageData.cargo_length,
            width: packageData.cargo_width,
            height: packageData.cargo_height,
            unit: packageData.unit
          },
          status: packageData.status,
          statusName: packageData.status_name,
          dateCreated: packageData.datecreated,
          dateUpdated: packageData.dateupdated
        }
      };
    } catch (error) {
      console.error('❌ Error en searchWithParams:', {
        message: error.message,
        params,
        response: error.response?.data
      });
      return null;
    }
  }
}