import { User } from "reicon-react";
import { useNavigate } from "react-router";
import { BookingSummaryCard, type StepProps } from "./BookingSummaryCard";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectAccountUser, setActiveSection } from "@/redux/account/accountSlice";

import { hasUserDetails } from "./review.utils";

// The customer's name, email and phone, edited on the Account page
export function UserSummary({ highlight, step }: StepProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const user = useAppSelector(selectAccountUser);
  const complete = hasUserDetails(user);

  // Edited on the Account page's profile section
  const onChange = () => {
    dispatch(setActiveSection("account"));
    navigate("/dashboard/account");
  };

  return (
    <BookingSummaryCard
      step={step}
      title="My Details"
      highlight={highlight}
      status={{
        valid: complete,
        label: complete ? "Contact details complete" : "Add your name and phone number",
      }}
      onChange={onChange}
      // Opens the Account page to edit the profile
      changeLabel="Update"
    >
      <div className="flex items-center gap-3 sm:gap-5">
        <div className="flex h-10 w-10 shrink-0 items-center sm:h-12 sm:w-12 justify-center rounded-full bg-gray-50">
          <User size={21} strokeWidth={2} className="text-gray-700" />
        </div>

        <div className="min-w-0">
          <p className="truncate text-base font-bold text-gray-900">
            {user.name.trim() || "No name added"}
          </p>

          <div className="mt-1 flex flex-wrap gap-x-6 gap-y-1 text-sm text-gray-800">
            <p className="max-w-full truncate">{user.email}</p>
            <p className={user.phone.trim() ? undefined : "text-gray-500"}>
              {user.phone.trim() || "No phone number added"}
            </p>
          </div>
        </div>
      </div>
    </BookingSummaryCard>
  );
}
