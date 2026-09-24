import { MessageText2 } from 'reicon-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectBooking, setConcern } from '@/redux/booking/bookingSlice';

export function ConcernInput() {
  const dispatch = useAppDispatch();
  const { concern: value } = useAppSelector(selectBooking);

  const onChange = (concern: string) => dispatch(setConcern(concern));

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6">
      <label
        htmlFor="service-concern"
        className="block text-sm font-bold text-gray-900"
      >
        Describe your concern{" "}
        <span className="font-normal text-gray-500">
          (Optional)
        </span>
      </label>

      <div className="relative mt-4">
        <MessageText2
          size={19}
          className="absolute left-4 top-4 text-gray-400"
        />

        <textarea
          id="service-concern"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          rows={2}
          placeholder="E.g. Engine makes a rattling noise when accelerating, brake pads feel worn, check engine light is on..."
          className="min-h-[80px] w-full resize-none rounded-lg border border-gray-200 bg-white py-3 pl-11 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>
    </section>
  );
}