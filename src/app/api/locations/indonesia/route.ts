import { NextRequest, NextResponse } from "next/server";

import { listCityOptions, listDistrictOptions, listProvinceOptions, listSubdistrictOptions } from "@/modules/locations/indonesia-regions";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const level = searchParams.get("level");

  const options = (() => {
    switch (level) {
      case "province":
        return listProvinceOptions();
      case "city":
        return listCityOptions(searchParams.get("province"));
      case "district":
        return listDistrictOptions({
          provinceName: searchParams.get("province"),
          cityName: searchParams.get("city"),
        });
      case "subdistrict":
        return listSubdistrictOptions({
          provinceName: searchParams.get("province"),
          cityName: searchParams.get("city"),
          districtName: searchParams.get("district"),
        });
      default:
        return [];
    }
  })();

  return NextResponse.json({ options });
}
