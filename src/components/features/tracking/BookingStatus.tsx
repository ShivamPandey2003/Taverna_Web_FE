interface BookingStatusProps {
  dealership: string;
  time: string;
  status: string;
  valetName?: string;
}

export function BookingStatus({
  dealership,
  time,
  status,
  valetName,
}: BookingStatusProps) {
  return (
    <section className="flex min-h-[166px] flex-col items-center justify-center rounded-2xl bg-[#05a568] px-6 text-center text-white">
      <p className="text-sm font-medium">
        {dealership}
      </p>

      <h1 className="mt-2 text-2xl font-bold tracking-tight md:text-[26px]">
        Service booked at {time}
      </h1>

      <div className="mt-3 rounded-full bg-white/15 px-5 py-2 text-sm font-semibold backdrop-blur-sm">
        {status}
      </div>

      {valetName && (
        <p className="mt-2 text-sm text-white/90">
          Your valet: <span className="font-semibold">{valetName}</span>
        </p>
      )}
    </section>
  );
}
