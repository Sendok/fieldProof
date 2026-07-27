import fs from "node:fs";
import path from "node:path";

type RegionRow = { code: string; name: string };
type ChildRegionRow = RegionRow & { provinceCode: string };
type DistrictRow = ChildRegionRow & { cityCode: string };
type SubdistrictRow = DistrictRow & { districtCode: string };

export type RegionOption = { code: string; value: string; label: string };

function normalizeName(value: string) {
  return value.trim().toLocaleLowerCase("id-ID");
}

function titleCaseSegment(value: string) {
  return value
    .toLocaleLowerCase("id-ID")
    .split(" ")
    .filter(Boolean)
    .map((part) => part.charAt(0).toLocaleUpperCase("id-ID") + part.slice(1))
    .join(" ");
}

function prettifyRegionName(value: string) {
  return titleCaseSegment(value)
    .replaceAll("Kab.", "Kab.")
    .replaceAll("Kota", "Kota")
    .replaceAll("Adm.", "Adm.")
    .replaceAll("Dki", "DKI")
    .replaceAll("Di ", "DI ");
}

function toOption(row: RegionRow): RegionOption {
  const label = prettifyRegionName(row.name);
  return { code: row.code, value: label, label };
}

function matchByName<T extends RegionRow>(rows: T[], value?: string | null) {
  if (!value) return null;
  const normalized = normalizeName(value);
  return rows.find((row) => normalizeName(prettifyRegionName(row.name)) === normalized || normalizeName(row.name) === normalized) ?? null;
}

function readDataFile<T>(filename: string) {
  const filePath = path.join(process.cwd(), "data/indonesia-regions", filename);
  return JSON.parse(fs.readFileSync(filePath, "utf8")) as T;
}

const provinceRows = readDataFile<RegionRow[]>("provinces.json");
const cityRows = readDataFile<ChildRegionRow[]>("cities.json");
const districtRows = readDataFile<DistrictRow[]>("districts.json");
const subdistrictRows = readDataFile<SubdistrictRow[]>("subdistricts.json");

export function listProvinceOptions() {
  return provinceRows.map(toOption);
}

export function listCityOptions(provinceName?: string | null) {
  const province = matchByName(provinceRows, provinceName);
  const filtered = province ? cityRows.filter((row) => row.provinceCode === province.code) : cityRows;
  return filtered.map(toOption);
}

export function listDistrictOptions(input: { provinceName?: string | null; cityName?: string | null }) {
  const province = matchByName(provinceRows, input.provinceName);
  const availableCities = province ? cityRows.filter((row) => row.provinceCode === province.code) : cityRows;
  const city = matchByName(availableCities, input.cityName);
  const filtered = city ? districtRows.filter((row) => row.cityCode === city.code) : districtRows;
  return filtered.map(toOption);
}

export function listSubdistrictOptions(input: { provinceName?: string | null; cityName?: string | null; districtName?: string | null }) {
  const province = matchByName(provinceRows, input.provinceName);
  const availableCities = province ? cityRows.filter((row) => row.provinceCode === province.code) : cityRows;
  const city = matchByName(availableCities, input.cityName);
  const availableDistricts = city ? districtRows.filter((row) => row.cityCode === city.code) : districtRows;
  const district = matchByName(availableDistricts, input.districtName);
  const filtered = district ? subdistrictRows.filter((row) => row.districtCode === district.code) : subdistrictRows;
  return filtered.map(toOption);
}
