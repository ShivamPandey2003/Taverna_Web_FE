import { Pen, UserCircle } from 'reicon-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import { selectAccountUser, setActiveSection } from '@/redux/account/accountSlice';

export function ProfileSummary() {
  const dispatch = useAppDispatch();
  const { name, email, phone } = useAppSelector(selectAccountUser);

  const onEdit = () => dispatch(setActiveSection("account"));

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <div className="flex items-center gap-4">
        {/* Avatar */}
        <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-gray-50 text-gray-600">
          <UserCircle size={22} strokeWidth={1.8} />
        </div>

        {/* User information */}
        <div className="min-w-0 flex-1">
          <h2 className="text-base font-bold text-gray-900">
            {name}
          </h2>

          <p className="mt-0.5 truncate text-xs text-gray-500">
            {email}
          </p>

          <p className="mt-0.5 text-xs text-gray-400">
            {phone}
          </p>
        </div>

        {/* Edit */}
        <button
          type="button"
          onClick={onEdit}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gray-50 text-gray-500 transition hover:bg-gray-100 hover:text-gray-900"
          aria-label="Edit profile"
        >
          <Pen size={15} />
        </button>
      </div>
    </div>
  );
}