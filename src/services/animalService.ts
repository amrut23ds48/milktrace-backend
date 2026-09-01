import { AnimalResponse, UpdateAnimalBaselinesInput } from '../types/animal.types';
import { findAllAnimals, findAnimalById, updateAnimalBaselines as repoUpdateBaselines } from '../repositories/animalRepository';
import { NotFoundError } from '../lib/errors';

export async function getAnimals(): Promise<AnimalResponse[]> {
  const animals = await findAllAnimals();
  return animals.map(mapAnimalToResponse);
}

export async function updateAnimalBaselines(id: string, data: UpdateAnimalBaselinesInput): Promise<AnimalResponse> {
  const animal = await findAnimalById(id);
  if (!animal) {
    throw new NotFoundError('Animal', id);
  }

  const updated = await repoUpdateBaselines(id, data);
  return mapAnimalToResponse(updated);
}

function mapAnimalToResponse(animal: any): AnimalResponse {
  return {
    id: animal.id,
    farmer_id: animal.farmer_id,
    species: animal.species,
    breed: animal.breed,
    identifier: animal.identifier,
    sex: animal.sex,
    approximate_age: animal.approximate_age,
    expected_daily_yield: animal.expected_daily_yield ? Number(animal.expected_daily_yield) : null,
    expected_fat: animal.expected_fat ? Number(animal.expected_fat) : null,
    expected_snf: animal.expected_snf ? Number(animal.expected_snf) : null,
    status: animal.status,
    created_at: animal.created_at,
    updated_at: animal.updated_at,
    farmer: animal.farmer
  };
}
