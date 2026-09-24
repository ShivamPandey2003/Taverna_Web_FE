import { cn } from '@/libs/utils';
import { Bell, HelpCircle, AngleRight, Pin, Shield2 } from 'reicon-react';
import { useAppDispatch, useAppSelector } from '@/redux/hooks';
import {
  selectActiveSection,
  setActiveSection,
  type AccountSection,
} from '@/redux/account/accountSlice';

const settings: { id: AccountSection; label: string; icon: typeof Bell }[] = [
  {
    id: "notifications",
    label: "Notifications",
    icon: Bell,
  },
  {
    id: "addresses",
    label: "Addresses",
    icon: Pin,
  },
  {
    id: "privacy",
    label: "Privacy & Security",
    icon: Shield2,
  },
  {
    id: "support",
    label: "Help & Support",
    icon: HelpCircle,
  },
];

export function AccountSettings() {
  const dispatch = useAppDispatch();
  const selectedRoute = useAppSelector(selectActiveSection);

  const handleSettingClick = (id: AccountSection) => {
    dispatch(setActiveSection(id));
  };

  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-5">
      <h2 className="text-base font-bold text-gray-900">
        Settings
      </h2>

      <div className="mt-4 space-y-1">
        {settings.map((setting) => {
          const Icon = setting.icon;

          return (
            <button
              key={setting.id}
              type="button"
              onClick={() =>
                handleSettingClick(setting.id)
              }
              className={cn("flex h-11 w-full items-center cursor-pointer gap-4 rounded-lg px-2 text-left transition hover:bg-gray-50", selectedRoute ===setting.id && "bg-black hover:bg-black/90")}
            >
              <Icon
                size={19}
                strokeWidth={1.8}
                className={cn("text-gray-500", selectedRoute ===setting.id && "text-white")}
              />

              <span className={cn("flex-1 text-sm font-medium text-gray-600", selectedRoute ===setting.id && "text-white")}>
                {setting.label}
              </span>

              <AngleRight
                size={17}
                className="text-gray-400"
              />
            </button>
          );
        })}
      </div>
    </div>
  );
}