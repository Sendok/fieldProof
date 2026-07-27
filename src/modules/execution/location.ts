export type Coordinates = {
  latitude: number;
  longitude: number;
};

const EARTH_RADIUS_METERS = 6_371_000;

const radians = (degrees: number) => (degrees * Math.PI) / 180;

export function distanceMeters(from: Coordinates, to: Coordinates): number {
  const latitudeDelta = radians(to.latitude - from.latitude);
  const longitudeDelta = radians(to.longitude - from.longitude);
  const fromLatitude = radians(from.latitude);
  const toLatitude = radians(to.latitude);
  const haversine =
    Math.sin(latitudeDelta / 2) ** 2 +
    Math.cos(fromLatitude) *
      Math.cos(toLatitude) *
      Math.sin(longitudeDelta / 2) ** 2;
  return (
    2 *
    EARTH_RADIUS_METERS *
    Math.atan2(Math.sqrt(haversine), Math.sqrt(1 - haversine))
  );
}

export function formatWorkDuration(
  startedAt: Date | string | null | undefined,
  finishedAt: Date | string | null | undefined,
  now: Date | number = new Date(),
): string {
  if (!startedAt) return "Belum dimulai";
  const start = new Date(startedAt).getTime();
  const end = finishedAt
    ? new Date(finishedAt).getTime()
    : typeof now === "number"
      ? now
      : now.getTime();
  const seconds = Math.max(0, Math.floor((end - start) / 1_000));
  const hours = Math.floor(seconds / 3_600);
  const minutes = Math.floor((seconds % 3_600) / 60);
  const remainder = seconds % 60;
  return hours > 0
    ? `${hours}j ${minutes}m ${remainder}d`
    : `${minutes}m ${remainder}d`;
}
