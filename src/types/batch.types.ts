export interface CreateBatchRequest {
  source_facility_id: string;
  destination_facility_id?: string;
  collection_ids: string[];
}
