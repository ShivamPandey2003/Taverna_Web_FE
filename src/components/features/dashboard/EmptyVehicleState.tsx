import { Car, Plus } from "reicon-react";

interface EmptyVehicleStateProps {
  userName?: string;
  onAddVehicle: () => void;
}

export function EmptyVehicleState({
  userName = "Alex",
  onAddVehicle,
}: EmptyVehicleStateProps) {
  return (
    <section className="flex min-h-[710px] w-full items-center justify-center bg-white px-6">
      <div className="flex w-full max-w-[710px] flex-col items-center text-center">
        {/* Welcome */}
        <h1 className="text-3xl font-bold tracking-tight text-[#080808]">
          Welcome {userName}!
        </h1>

        <p className="mt-2 text-sm text-[#9aa3b2]">
          Your premium valet car care service
        </p>

        {/* Vehicle icon */}
        <div className="mt-5 flex h-40 w-40 items-center justify-center rounded-full bg-[#f5f5f5]">
          <Car
            size={54}
            strokeWidth={1.8}
            className="text-[#080808]"
          />
        </div>

        {/* Empty state */}
        <h2 className="mt-5 text-base font-semibold text-[#111827]">
          No vehicles yet
        </h2>

        <p className="mt-1 text-sm text-[#9aa3b2]">
          Add your first vehicle to get started with our premium
          valet services.
        </p>

        {/* CTA */}
        <button
          type="button"
          onClick={onAddVehicle}
          className="mt-4 flex h-14 w-full items-center justify-center gap-3 rounded-xl bg-black text-base font-semibold text-white transition hover:bg-[#171717] active:scale-[0.99]"
        >
          <Plus size={22} strokeWidth={2} />

          <span>Add Your First Vehicle</span>
        </button>
      </div>
    </section>
  );
}