export interface Vehicle {
  id: string;
  brand: string;
  model: string;
  year: number;
  vin: string;
  // e.g. "45,230 mi"; the VIN lookup doesn't always return it
  miles: string | null;
  image: string;
}
