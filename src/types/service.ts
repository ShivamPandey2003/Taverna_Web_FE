export type ServiceId = "pickup-delivery" | "loaner-only";

export interface Service {
  id: ServiceId;
  title: string;
  description: string;
  image: string;
  features: string[];
}
