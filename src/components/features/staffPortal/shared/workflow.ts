import { VALET_LEGS, type ValetLeg } from "@/types/admin";

export function isValetLeg(value: string | undefined): value is ValetLeg {
  return VALET_LEGS.includes(value as ValetLeg);
}
