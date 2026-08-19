import { CollectionSession, EntityStatus } from '../generated/prisma/client';

export interface CreateCollectionInput {
  collection_code: string;
  farmer_id: string;
  facility_id: string;
  operator_id: string;
  session: CollectionSession;
  quantity_liters: number;
  collection_timestamp: Date | string;
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
}
