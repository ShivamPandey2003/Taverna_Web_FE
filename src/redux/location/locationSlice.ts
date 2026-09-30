import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import type { RootState } from "@/redux/store";

type Coordinates = {
  latitude: number;
  longitude: number;
  accuracy: number;
};

type LocationState = {
  address: string | null;
  coordinates: Coordinates | null;
  loading: boolean;
  error: string | null;
};

const initialState: LocationState = {
  address: null,
  coordinates: null,
  loading: false,
  error: null,
};

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
  { address: string | null; coordinates: Coordinates },
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
    return { address: data.display_name ?? null, coordinates };
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
