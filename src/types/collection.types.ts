import { CollectionSession, EntityStatus } from '../generated/prisma/client';

export interface CreateCollectionInput {
  collection_code: string;
  farmer_id: string;
  facility_id: string;
  operator_id: string;
  session: CollectionSession;
  quantity_liters: number;
  collection_timestamp: Date | string;
  quality?: {
    fat_percent?: number;
    snf_percent?: number;
    density?: number;
    temperature?: number;
    water_estimate?: number;
  };
}

export interface CollectionResponse {
  id: string;
  collection_code: string;
  farmer_id: string;
  facility_id: string;
  operator_id: string;
  session: CollectionSession;
  quantity_liters: number;
  collection_timestamp: Date;
  status: EntityStatus;
  created_at: Date;
  updated_at: Date;
  farmer?: any;
  facility?: any;
  operator?: any;
  quality_measurements?: any[];
}
