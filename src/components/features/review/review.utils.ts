// Who the booking is for: the logged-in customer's profile. The dealership and
// valet reach them on this phone, so both a name and a phone are needed.
export function hasUserDetails(user: { name: string; phone: string }) {
  return !!user.name.trim() && !!user.phone.trim();
}
