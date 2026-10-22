import { ProfileSummary } from "@/components/features/account/ProfileSummary";
import { AccountSettings } from "@/components/features/account/AccountSettings";
import { EditProfile } from "@/components/features/account/EditProfile";
import { NotificationSettings } from "@/components/features/account/NotificationSettings";

import { AccountAddresses } from "@/components/features/addresses/AccountAddresses";
import { AddAddressModal } from "@/components/features/addresses/AddAddressModal";
import { useOverflowing } from "@/hooks/useOverflowing";
import { cn } from "@/libs/utils";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { selectActiveSection } from "@/redux/account/accountSlice";
import {
  closeAddressModal,
  selectAccountModal,
} from "@/redux/modals/accountModal/accountModalSlice";


export function Account() {
  const dispatch = useAppDispatch();
  const { addressModalOpen, editingAddressId } = useAppSelector(selectAccountModal);
  // Room for the status bubbles under the section, only once it scrolls
  const {
    containerRef: sectionRef,
    contentRef: sectionContentRef,
    overflowing,
  } = useOverflowing<HTMLDivElement, HTMLDivElement>();

  return (
    // The layout clips its content, so the page scrolls itself. Side by side (lg)
    // each column scrolls on its own: the menu stays put while the section
    // scrolls. Stacked (phones) the whole page scrolls, ending with the layout's
    // room for the status bubbles; side by side the root doesn't scroll, so
    // that spacer is off there.
    <main className="flex h-full flex-col overflow-y-auto bg-[#f8f9fa] px-6 pb-4 pt-4 lg:overflow-hidden lg:px-10 lg:after:hidden">
      <div className="lg:min-h-0 lg:flex-1">
        {/* Content */}
        <div className="grid gap-6 lg:h-full lg:grid-cols-[280px_minmax(0,1fr)] lg:grid-rows-[minmax(0,1fr)]">
          {/* Left */}
          <aside className="space-y-6 lg:overflow-y-auto">
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
        <div ref={sectionRef} className={cn("lg:overflow-y-auto", overflowing && "pb-24")}>
          <div ref={sectionContentRef}>
            <Content />
          </div>
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
    case "notifications": {
      return <NotificationSettings />
    }
    default:
      return null;
  }
}
