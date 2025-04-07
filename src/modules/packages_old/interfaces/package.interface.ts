export interface Package {
  id?: string;
  packageId?: string;
  trackingNumber: string;
  packageStatus: string;
  weight: number;
  volumetricWeight: number;
  length: number;
  width: number;
  height: number;
  insurance: boolean;
  shippingStages?: ShippingStage[];
  userReference?: string;
  client?: {
    id: string;
    name: string;
    email: string;
  };
}

export interface ShippingStage {
  location: string;
  photo: string;
  stage: string;
  status: string;
  updatedTimestamp: string;
} 