import { ProfileSummary } from "@/components/features/account/ProfileSummary";
import { AccountSettings } from "@/components/features/account/AccountSettings";
import { EditProfile } from "@/components/features/account/EditProfile";

import { AccountAddresses } from "@/components/features/addresses/AccountAddresses";
import { AddAddressModal } from "@/components/features/addresses/AddAddressModal";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectActiveSection } from "@/redux/account/accountSlice";
import {
  closeAddressModal,
  selectAccountModal,
} from "@/redux/modals/accountModal/accountModalSlice";


export function Account() {
  const dispatch = useAppDispatch();
  const { addressModalOpen, editingAddressId } = useAppSelector(selectAccountModal);

  return (
    <main className="min-h-[calc(100vh-72px)] bg-[#f8f9fa] px-6 py-4 lg:px-10">
      <div className="mx-auto">
        {/* Content */}
        <div className="grid gap-6 lg:grid-cols-[280px_minmax(0,1fr)]">
          {/* Left */}
          <aside className="space-y-6">
            <header>
              <h1 className="text-3xl font-bold tracking-tight text-gray-900">
                Account
              </h1>

              <p className="mt-1.5 text-sm text-gray-500">
                Manage your profile, preferences and account settings.
              </p>
            </header>

            <ProfileSummary />

            <AccountSettings />
          </aside>
        <div>
          <Content />
        </div>

        </div>
      </div>
      <AddAddressModal
        open={addressModalOpen}
        addressId={editingAddressId}
        onClose={() => dispatch(closeAddressModal())}
      />
    </main>
  );
}

const Content = () => {
  const section = useAppSelector(selectActiveSection);

  switch (section) {
    case "account": {
      return <EditProfile />
    }
    case "addresses": {
      return <AccountAddresses />
    }
    default:
      return null;
  }
}
