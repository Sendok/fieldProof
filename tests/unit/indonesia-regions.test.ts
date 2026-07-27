import { describe, expect, it } from "vitest";

import { listCityOptions, listDistrictOptions, listProvinceOptions, listSubdistrictOptions } from "@/modules/locations/indonesia-regions";

describe("indonesia regions dataset", () => {
  it("ships all 38 provinces including the new Papua splits", () => {
    const provinces = listProvinceOptions();
    expect(provinces).toHaveLength(38);
    expect(provinces.some((item) => item.value === "Papua Barat Daya")).toBe(true);
    expect(provinces.some((item) => item.value === "Papua Pegunungan")).toBe(true);
  });

  it("filters administrative descendants correctly", () => {
    const cities = listCityOptions("DKI Jakarta");
    expect(cities.some((item) => item.value === "Kota Adm. Jakarta Selatan")).toBe(true);

    const districts = listDistrictOptions({
      provinceName: "DKI Jakarta",
      cityName: "Kota Adm. Jakarta Selatan",
    });
    expect(districts.some((item) => item.value === "Kebayoran Baru")).toBe(true);

    const subdistricts = listSubdistrictOptions({
      provinceName: "DKI Jakarta",
      cityName: "Kota Adm. Jakarta Selatan",
      districtName: "Kebayoran Baru",
    });
    expect(subdistricts.some((item) => item.value === "Selong")).toBe(true);
  });
});
