import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

// The device location's address in the fields a saved address has, so it can be
// saved as one (user/addresses)
export type AddressParts = {
  street: string;
  city: string;
  state: string;
  zip: string;
};

type LocationState = {
  address: string | null;
  parts: AddressParts | null;
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
};

const initialState: LocationState = {
  address: null,
  parts: null,
  coordinates: null,
  loading: false,
  error: null,
};

// Nominatim's reverse lookup names the parts of an address by the kind of place,
// which differs from country to country: take the first one that's there
type NominatimAddress = Partial<Record<string, string>>;

function toAddressParts(
  address: NominatimAddress | undefined,
  displayName: string | null,
): AddressParts | null {
  if (!address) return null;

  const first = (...keys: string[]) =>
    keys.map((key) => address[key]?.trim()).find((value) => !!value) ?? "";
  const street =
    [address.house_number, address.road].filter(Boolean).join(" ") ||
    first("neighbourhood", "suburb", "quarter", "residential") ||
    displayName?.split(",")[0]?.trim() ||
    "";

  return {
    street,
    city: first("city", "town", "village", "municipality", "city_district", "county", "state_district"),
    state: first("state", "region", "state_district"),
    zip: first("postcode"),
  };
}

function getPosition() {
  return new Promise<GeolocationPosition>((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: true,
      timeout: 10000,
      maximumAge: 0,
    });
  });
}

function getPositionErrorMessage(error: GeolocationPositionError) {
  switch (error.code) {
    case error.PERMISSION_DENIED:
      return "Location permission was denied.";
    case error.POSITION_UNAVAILABLE:
      return "Location information is unavailable.";
    case error.TIMEOUT:
      return "Location request timed out.";
    default:
      return "Unable to get your location.";
  }
}

type LocationError = { message: string; coordinates?: Coordinates };

export const fetchCurrentLocation = createAsyncThunk<
  { address: string | null; parts: AddressParts | null; coordinates: Coordinates },
  void,
  { rejectValue: LocationError }
>("location/fetchCurrentLocation", async (_, { rejectWithValue }) => {
  if (!navigator.geolocation) {
    return rejectWithValue({
      message: "Geolocation is not supported by your browser.",
    });
  }

  let coordinates: Coordinates;
  try {
    const position = await getPosition();
    const { latitude, longitude, accuracy } = position.coords;
    coordinates = { latitude, longitude, accuracy };
  } catch (error) {
    return rejectWithValue({
      message: getPositionErrorMessage(error as GeolocationPositionError),
    });
  }

  try {
    const response = await fetch(
      `https://nominatim.openstreetmap.org/reverse?lat=${coordinates.latitude}&lon=${coordinates.longitude}&format=json`,
    );

    if (!response.ok) {
      throw new Error("Failed to get address");
    }

    const data = await response.json();
    const address: string | null = data.display_name ?? null;
    return { address, parts: toAddressParts(data.address, address), coordinates };
  } catch (err) {
    console.error(err);
    return rejectWithValue({ message: "Unable to get your address.", coordinates });
  }
});

const locationSlice = createSlice({
  name: "location",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchCurrentLocation.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchCurrentLocation.fulfilled, (state, action) => {
        state.loading = false;
        state.address = action.payload.address;
        state.parts = action.payload.parts;
        state.coordinates = action.payload.coordinates;
      })
      .addCase(fetchCurrentLocation.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload?.message ?? "Unable to get your location.";
        if (action.payload?.coordinates) {
          state.coordinates = action.payload.coordinates;
        }
      });
  },
});

export const selectLocation = (state: RootState) => state.location;

export default locationSlice.reducer;
