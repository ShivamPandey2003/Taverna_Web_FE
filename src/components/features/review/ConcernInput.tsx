// import { MessageText2 } from 'reicon-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectBooking, setConcern } from '@/redux/booking/bookingSlice';

export function ConcernInput() {
  const dispatch = useAppDispatch();
  const { concern: value } = useAppSelector(selectBooking);

  const onChange = (concern: string) => dispatch(setConcern(concern));

  return (
    <section className="flex flex-1 flex-col rounded-2xl border border-gray-200 bg-white p-5">
      <label
        htmlFor="service-concern"
        className="block text-sm font-bold text-gray-900"
      >
        Describe Your Concern{" "}
        <span className="font-normal text-gray-500">
          (Optional)
        </span>
      </label>

      <div className="relative mt-4 flex flex-1 flex-col">
        {/* Message icon hidden for now; restore it with pl-11 on the textarea */}
        {/* <MessageText2
          size={19}
          className="absolute left-4 top-4 text-gray-400"
        /> */}

        <textarea
          id="service-concern"
          value={value}
          onChange={(event) =>
            onChange(event.target.value)
          }
          rows={4}
          placeholder="E.g. Engine makes a rattling noise when accelerating, brake pads feel worn, check engine light is on..."
          className="min-h-[96px] w-full flex-1 resize-none rounded-lg border border-gray-200 bg-white py-3 pl-4 pr-4 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-gray-400 focus:ring-2 focus:ring-gray-100"
        />
      </div>
    </section>
  );
}