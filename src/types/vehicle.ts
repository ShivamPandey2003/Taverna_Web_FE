export interface Vehicle {
  // The API's vehicleId
  id: string;
  // The API calls it "make"
  brand: string;
  model: string;
  year: number;
  vin: string;
  // e.g. "45,230 mi"; null until the customer adds it
  miles: string | null;
  // Photo to show: the API's image_url, or a placeholder when it has none
  image: string;
  trim?: string;
  engine?: string;
}

// What the VIN lookup returned, waiting for the customer to confirm "Add Vehicle"
export interface VerifiedVehicle extends Omit<Vehicle, "id"> {
  // As the lookup returned it, to send back when the vehicle is saved
  imageUrl: string | null;
}
