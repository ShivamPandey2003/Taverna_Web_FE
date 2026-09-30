import {Pin, HomeSmile} from "reicon-react"

export function TrackingMap() {
  return (
    <section className="bg-[#f5f5f5] p-5">
      <div className="relative h-[320px] overflow-hidden rounded-2xl bg-[#e7e7e7]">
        {/* Map background */}
        <div className="absolute inset-0">
          <MapBackground />
        </div>

        {/* Route */}
        <svg
          className="absolute inset-0 h-full w-full"
          viewBox="0 0 1000 400"
          preserveAspectRatio="none"
        >
          <path
            d="M430 145 C450 190 465 225 510 230 C550 235 570 190 620 215"
            fill="none"
            stroke="#111827"
            strokeWidth="3"
            strokeDasharray="8 8"
          />
        </svg>

        {/* Start marker */}
        <div className="absolute left-[43%] top-[34%]">
          <MapMarker>
            <HomeSmile size={18} strokeWidth={2.5} />
          </MapMarker>
        </div>

        {/* Destination marker */}
        <div className="absolute left-[62%] top-[54%]">
          <MapMarker>
            <Pin size={18} strokeWidth={2.5} />
          </MapMarker>
        </div>
      </div>
    </section>
  );
}

function MapMarker({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white shadow-md">
      {children}
    </div>
  );
}

function MapBackground() {
  return (
    <div className="relative h-full w-full overflow-hidden bg-[#e5e5e5]">
      {/* Major roads */}
      <div className="absolute left-[10%] top-[45%] h-[2px] w-[80%] rotate-[8deg] bg-white" />

      <div className="absolute left-[15%] top-[60%] h-[2px] w-[70%] rotate-[-12deg] bg-white" />

      <div className="absolute left-[20%] top-[25%] h-[2px] w-[65%] rotate-[35deg] bg-white" />

      <div className="absolute left-[50%] top-[-20%] h-[150%] w-[2px] rotate-[15deg] bg-white" />

      <div className="absolute left-[70%] top-[-20%] h-[150%] w-[2px] rotate-[-30deg] bg-white" />

      {/* Secondary roads */}
      <div className="absolute left-[5%] top-[35%] h-px w-[90%] rotate-[20deg] bg-gray-300" />

      <div className="absolute left-[5%] top-[70%] h-px w-[90%] rotate-[-20deg] bg-gray-300" />

      <div className="absolute left-[35%] top-[0%] h-[100%] w-px rotate-[-20deg] bg-gray-300" />

      <div className="absolute left-[55%] top-[0%] h-[100%] w-px rotate-[25deg] bg-gray-300" />

      {/* Neighborhood blocks */}
      <div className="absolute left-[25%] top-[20%] h-[100px] w-[180px] rotate-[20deg] border border-gray-300" />

      <div className="absolute left-[48%] top-[15%] h-[80px] w-[150px] rotate-[-15deg] border border-gray-300" />

      <div className="absolute left-[60%] top-[55%] h-[100px] w-[190px] rotate-[15deg] border border-gray-300" />

      <div className="absolute left-[20%] top-[55%] h-[80px] w-[150px] rotate-[-15deg] border border-gray-300" />

      {/* Soft overlay */}
      <div className="absolute inset-0 bg-white/30" />
    </div>
  );
}