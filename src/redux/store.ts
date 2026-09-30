import { combineReducers, configureStore } from "@reduxjs/toolkit";

// Domain data
import vehicle from "./vehicle/vehicleSlice";
import address from "./address/addressSlice";
import booking from "./booking/bookingSlice";
import tracking from "./tracking/trackingSlice";
import notification from "./notification/notificationSlice";
import account from "./account/accountSlice";
import auth from "./auth/authSlice";
import location from "./location/locationSlice";
import adminBookings from "./adminBookings/adminBookingsSlice";
import adminDealerships from "./adminDealerships/adminDealershipsSlice";
import adminStaff from "./adminStaff/adminStaffSlice";
import { authStorage } from "@/services/authStorage";

// Modal visibility, one reducer per page
import homeModal from "./modals/homeModal/homeModalSlice";
import dashboardModal from "./modals/dashboardModal/dashboardModalSlice";
import bookServiceModal from "./modals/bookServiceModal/bookServiceModalSlice";
import reviewModal from "./modals/reviewModal/reviewModalSlice";
import accountModal from "./modals/accountModal/accountModalSlice";
import adminModal from "./modals/adminModal/adminModalSlice";
import dealershipModal from "./modals/dealershipModal/dealershipModalSlice";
import staffModal from "./modals/staffModal/staffModalSlice";

const rootReducer = combineReducers({
  vehicle,
  address,
  booking,
  tracking,
  notification,
  account,
  auth,
  location,
  adminBookings,
  adminDealerships,
  adminStaff,

  homeModal,
  dashboardModal,
  bookServiceModal,
  reviewModal,
  accountModal,
  adminModal,
  dealershipModal,
  staffModal,
});

export const store = configureStore({
  reducer: rootReducer,
});

// Keep the persisted session in step with Redux (login, logout, profile edits)
let lastSession = store.getState().auth.session;
let lastProfile = store.getState().account.user;
store.subscribe(() => {
  const { auth, account } = store.getState();
  if (auth.session === lastSession && account.user === lastProfile) return;
  lastSession = auth.session;
  lastProfile = account.user;

  if (auth.session) {
    authStorage.save({
      ...auth.session,
      user: { ...auth.session.user, name: account.user.name, phone: account.user.phone },
    });
  } else {
    authStorage.clear();
  }
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
