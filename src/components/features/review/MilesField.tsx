import { useState, type FormEvent } from "react";
import { Pen } from "reicon-react";
import { toast } from "sonner";
import { useAppDispatch } from "@/redux/hooks";
import { editVehicle } from "@/redux/vehicle/vehicleSlice";
import { useUpdateMileage } from "@/services/queries/vehicleQueries";
import type { Vehicle } from "@/types/vehicle";

// "45,230 mi" -> "45230"
const digitsOf = (value: string) => value.replace(/\D/g, "");

// The vehicle's mileage, editable in place. The VIN lookup doesn't always return
// it, so the customer can type it in (or correct it) without leaving the page.
// Saved with vehicles/:id/mileage; a failed save is toasted by the API layer and
// leaves the field open.
export function MilesField({ vehicle }: { vehicle: Vehicle }) {
  const dispatch = useAppDispatch();
  const updateMileage = useUpdateMileage();
  const saving = updateMileage.isPending;
  const miles = vehicle.miles?.trim() ?? "";
  // null while just showing the value; the typed digits while editing
  const [draft, setDraft] = useState<string | null>(null);

  const handleSave = (event: FormEvent) => {
    event.preventDefault();
    if (!draft || saving) return;

    updateMileage.mutate(
      { vehicleId: vehicle.id, mileage: Number(draft) },
      {
        onSuccess: (miles) => {
          // Straight into Redux too, before the list is copied in again
          dispatch(editVehicle({ ...vehicle, miles }));
          setDraft(null);
          toast.success("Miles saved");
        },
      },
    );
  };

  if (draft !== null) {
    return (
      <form onSubmit={handleSave} className="flex flex-wrap items-center gap-2">
        <label htmlFor="vehicle-miles">Miles:</label>

        <input
          data-test-id="miles-input"
          id="vehicle-miles"
          autoFocus
          inputMode="numeric"
          value={draft && Number(draft).toLocaleString("en-US")}
          onChange={(event) => setDraft(digitsOf(event.target.value).slice(0, 7))}
          onKeyDown={(event) => event.key === "Escape" && !saving && setDraft(null)}
          disabled={saving}
          placeholder="e.g. 45,230"
          className="form-input h-8 w-28 px-2"
        />

        <button
          data-test-id="miles-save-button"
          type="submit"
          disabled={!draft || saving}
          className="h-8 rounded-lg bg-black px-3 text-xs font-semibold text-white transition hover:bg-gray-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {saving ? "Saving..." : "Save"}
        </button>

        <button
          data-test-id="miles-cancel-button"
          type="button"
          onClick={() => setDraft(null)}
          disabled={saving}
          className="h-8 px-1 text-xs font-semibold text-gray-600 transition hover:text-gray-900 disabled:cursor-not-allowed disabled:opacity-40"
        >
          Cancel
        </button>
      </form>
    );
  }

  return (
    // One line: "Miles:", the value and its pencil
    <p className="flex items-center gap-1.5 whitespace-nowrap">
      Miles:
      {miles ? (
        <span className="flex items-center gap-1.5 whitespace-nowrap">
          <span className="font-semibold text-gray-900">{miles}</span>
          <button
            data-test-id="miles-edit-button"
            type="button"
            onClick={() => setDraft(digitsOf(miles))}
            title="Edit miles"
            aria-label="Edit miles"
            className="flex h-6 w-6 items-center justify-center rounded-md text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          >
            <Pen size={13} />
          </button>
        </span>
      ) : (
        <button
          data-test-id="miles-add-button"
          type="button"
          onClick={() => setDraft("")}
          className="text-xs font-semibold text-gray-900 underline underline-offset-4 transition hover:text-black"
        >
          Add Miles
        </button>
      )}
    </p>
  );
}
