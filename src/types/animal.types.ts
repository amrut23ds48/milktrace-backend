export interface AnimalResponse {
  id: string;
  farmer_id: string;
  species: string;
  breed: string | null;
  identifier: string;
  sex: string;
  approximate_age: number | null;
  expected_daily_yield: number | null;
  expected_fat: number | null;
  expected_snf: number | null;
  status: string;
  created_at: Date;
  updated_at: Date;
  farmer?: {
    id: string;
    farmer_code: string;
    name: string;
    collection_center_id: string;
  };
}

export interface UpdateAnimalBaselinesInput {
  expected_daily_yield: number | null;
  expected_fat: number | null;
  expected_snf: number | null;
}
