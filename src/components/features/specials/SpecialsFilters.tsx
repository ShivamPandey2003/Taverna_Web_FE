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

// A model's value in the vehicle dropdown; "" is every offer
const modelKey = ({ brandName, model }: { brandName: string; model: string }) =>
  brandName || model ? `${brandName}|${model}`.toLowerCase() : "";

const selectClass =
  "h-10 min-w-0 rounded-lg border border-gray-200 bg-white px-3 text-sm text-gray-700 outline-none focus:border-gray-400";

// Narrows the offers to a model the customer owns (an offer's VIN is a dealer
// vehicle, so it's matched by make and model) and to one kind of deal. Both are
// dropdowns, so any number of vehicles fits on one line.
export function SpecialsFilters() {
  const dispatch = useAppDispatch();
  const params = useAppSelector(selectSpecialsParams);
  const models = useOwnedModels();

  const selectVehicle = (key: string) =>
    dispatch(
      setSpecialsVehicle(
        models.find((item) => modelKey(item) === key) ?? { brandName: "", model: "" },
      ),
    );

  return (
    <div className="flex flex-wrap items-center gap-3">
      <select
        value={modelKey(params)}
        onChange={(event) => selectVehicle(event.target.value)}
        className={cn(selectClass, "w-full sm:w-72")}
        aria-label="Filter by vehicle"
      >
        <option value="">All Offers</option>
        {models.map((item) => (
          <option key={modelKey(item)} value={modelKey(item)}>
            For your {brandName(item.brandName)} {item.model}
          </option>
        ))}
      </select>

      <select
        value={params.offerType}
        onChange={(event) => dispatch(setSpecialsOfferType(event.target.value))}
        className={cn(selectClass, "w-full sm:w-56")}
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
