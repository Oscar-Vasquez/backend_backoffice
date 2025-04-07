export interface CargoPanamaResponse {
  success: boolean;
  message?: string;
  data: {
    hash: string;
    client_id: number;
    client_name: string;
    package_name: string;
    receipt: string;
    tracking: string;
    mode: string;
    shipper: string;
    total_items: string;
    unit: string;
    total_weight: string;
    vol_weight: string;
    cargo_length: string;
    cargo_width: string;
    cargo_height: string;
    total_cft: string;
    is_communal: string;
    status: string;
    status_name: string;
    datecreated: string;
    dateupdated: string;
  }[];
} 