import { OFFER_TYPES } from "@/components/features/offers/offer.utils";
import { brandName, cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import {
  selectSpecialsParams,
  setSpecialsOfferType,
  setSpecialsVehicle,
} from "@/redux/specials/specialsSlice";
import { selectVehicles } from "@/redux/vehicle/vehicleSlice";

// The models the customer owns, once each ("RAM 1500")
function useOwnedModels() {
  const vehicles = useAppSelector(selectVehicles);
  const models = new Map<string, { brandName: string; model: string }>();
  vehicles.forEach((vehicle) => {
    if (!vehicle.brand || !vehicle.model) return;
    const key = `${vehicle.brand} ${vehicle.model}`.toLowerCase();
    if (!models.has(key)) models.set(key, { brandName: vehicle.brand, model: vehicle.model });
  });
  return [...models.values()];
}

// Narrows the offers to a model the customer owns (an offer's VIN is a dealer
// vehicle, so it's matched by make and model) and to one kind of deal
export function SpecialsFilters() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectSpecialsParams);
  const models = useOwnedModels();

  const chip = (active: boolean) =>
    cn(
      "h-9 shrink-0 rounded-full border px-4 text-sm font-medium transition",
      active
        ? "border-black bg-black text-white"
        : "border-gray-200 bg-white text-gray-700 hover:bg-gray-50",
    );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex min-w-0 flex-1 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => dispatch(setSpecialsVehicle({ brandName: "", model: "" }))}
          className={chip(!params.brandName && !params.model)}
        >
          All Offers
        </button>

        {models.map((item) => {
          const active =
            params.brandName.toLowerCase() === item.brandName.toLowerCase() &&
            params.model.toLowerCase() === item.model.toLowerCase();
          return (
            <button
              key={`${item.brandName}-${item.model}`}
              type="button"
              onClick={() => dispatch(setSpecialsVehicle(item))}
              className={chip(active)}
            >
              For your {brandName(item.brandName)} {item.model}
            </button>
          );
        })}
      </div>

      <select
        value={params.offerType}
        onChange={(event) => dispatch(setSpecialsOfferType(event.target.value))}
        className="h-9 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400"
        aria-label="Filter by offer type"
      >
        <option value="all">All Offer Types</option>
        {OFFER_TYPES.map((type) => (
          <option key={type} value={type}>
            {type}
          </option>
        ))}
      </select>
    </div>
  );
}
