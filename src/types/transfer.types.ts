export interface CreateTransferRequest {
  batch_id: string;
  source_facility_id: string;
  destination_facility_id: string;
  dispatched_quantity: number;
  vehicle_number?: string;
  driver_name?: string;
}
