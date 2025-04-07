export interface ShipmentDetails {
  // Dimensiones y detalles físicos
  cargo_height?: string;
  cargo_length?: string;
  cargo_width?: string;

  // Información del destinatario
  consignee_fullname?: string;
  consignee_id?: string;

  // Fechas y tracking
  datecreated?: string;
  destination?: string;
  destionation_id?: string;

  // Identificadores únicos
  hash?: string;
  hast_files?: string;
  is_communal?: string;

  // Modo de envío
  mode_id?: string;
  mode_name?: string;

  // Detalles de origen
  origin_name?: string;
  origin_shortname?: string;
  other?: string;

  // Metadatos adicionales
  parent?: string;
  photo?: string;
  receipt?: string;
  shipment?: string;
  shipper?: string;
  status?: string;
  status_name?: string;

  // Detalles de peso y volumen
  total_cft?: string;
  total_items?: string;
  total_pcs?: string;
  total_weight?: string;
  tracking?: string;
  unit?: string;
  vol_weight?: string;
  vol_weight_kg?: string;

  // Metadatos globales
  message?: string;
  recordsFiltered?: number;
  recordsTotal?: number;
  success?: boolean;
} 