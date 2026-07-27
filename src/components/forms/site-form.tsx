"use client";

import { useEffect, useState } from "react";

import { FormField, Submit, TextAreaField, inputClass } from "@/components/forms/master-data";

type RegionOption = { code: string; value: string; label: string };

type SiteFormProps = {
  action: (formData: FormData) => void | Promise<void>;
  clients: Array<{ id: string; name: string }>;
  site?: {
    id: string;
    clientId: string;
    code: string;
    name: string;
    address: string;
    city: string | null;
    state: string | null;
    district: string | null;
    subdistrict: string | null;
    country: string;
    postalCode: string | null;
    latitude: number | null;
    longitude: number | null;
    contactPerson: string | null;
    phone: string | null;
    accessInstructions: string | null;
    safetyNotes: string | null;
    status: "ACTIVE" | "INACTIVE";
  };
};

type RegionLevel = "province" | "city" | "district" | "subdistrict";

async function fetchRegionOptions(level: RegionLevel, params: Record<string, string | null | undefined> = {}) {
  const query = new URLSearchParams({ level });
  for (const [key, value] of Object.entries(params)) {
    if (value?.trim()) query.set(key, value.trim());
  }
  const response = await fetch(`/api/locations/indonesia?${query.toString()}`, { cache: "force-cache" });
  if (!response.ok) throw new Error(`Gagal memuat ${level}`);
  const payload = (await response.json()) as { options: RegionOption[] };
  return payload.options;
}

function ensureOption(options: RegionOption[], value: string | null | undefined) {
  if (!value?.trim()) return options;
  return options.some((option) => option.value === value)
    ? options
    : [{ code: `manual-${value}`, value, label: value }, ...options];
}

function RegionSelect({
  label,
  name,
  value,
  options,
  onChange,
  disabled = false,
  required = false,
  placeholder,
}: {
  label: string;
  name: string;
  value: string;
  options: RegionOption[];
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  placeholder: string;
}) {
  return (
    <label className="block text-sm font-bold text-ink">
      {label}
      <select
        name={name}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={inputClass}
        disabled={disabled}
        required={required}
      >
        <option value="">{placeholder}</option>
        {options.map((option) => (
          <option key={option.code} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function SiteForm({ action, clients, site }: SiteFormProps) {
  const [province, setProvince] = useState(site?.state ?? "");
  const [city, setCity] = useState(site?.city ?? "");
  const [district, setDistrict] = useState(site?.district ?? "");
  const [subdistrict, setSubdistrict] = useState(site?.subdistrict ?? "");
  const [provinceOptions, setProvinceOptions] = useState<RegionOption[]>([]);
  const [cityOptions, setCityOptions] = useState<RegionOption[]>([]);
  const [districtOptions, setDistrictOptions] = useState<RegionOption[]>([]);
  const [subdistrictOptions, setSubdistrictOptions] = useState<RegionOption[]>([]);

  useEffect(() => {
    void fetchRegionOptions("province").then((options) => {
      setProvinceOptions(ensureOption(options, site?.state));
    });
  }, [site?.state]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const options = province ? await fetchRegionOptions("city", { province }) : [];
      if (active) setCityOptions(ensureOption(options, site?.city));
    };
    void load();
    return () => {
      active = false;
    };
  }, [province, site?.city]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const options = province && city ? await fetchRegionOptions("district", { province, city }) : [];
      if (active) setDistrictOptions(ensureOption(options, site?.district));
    };
    void load();
    return () => {
      active = false;
    };
  }, [province, city, site?.district]);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const options = province && city && district ? await fetchRegionOptions("subdistrict", { province, city, district }) : [];
      if (active) setSubdistrictOptions(ensureOption(options, site?.subdistrict));
    };
    void load();
    return () => {
      active = false;
    };
  }, [province, city, district, site?.subdistrict]);

  const coordinateSummary = site?.latitude != null && site?.longitude != null
    ? `${site.latitude.toFixed(6)}, ${site.longitude.toFixed(6)}`
    : null;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      {site ? <input type="hidden" name="id" value={site.id} /> : null}

      <label className="text-sm font-bold">
        Client
        <select required name="clientId" defaultValue={site?.clientId} className={inputClass}>
          <option value="">Pilih client</option>
          {clients.map((client) => (
            <option key={client.id} value={client.id}>
              {client.name}
            </option>
          ))}
        </select>
      </label>

      <FormField label="Site code" name="code" defaultValue={site?.code} required />
      <FormField label="Nama site" name="name" defaultValue={site?.name} required />

      <RegionSelect
        label="Provinsi"
        name="state"
        value={province}
        options={provinceOptions}
        onChange={(value) => {
          setProvince(value);
          setCity("");
          setDistrict("");
          setSubdistrict("");
        }}
        required
        placeholder="Pilih provinsi"
      />

      <RegionSelect
        label="Kabupaten / Kota"
        name="city"
        value={city}
        options={cityOptions}
        onChange={(value) => {
          setCity(value);
          setDistrict("");
          setSubdistrict("");
        }}
        disabled={!province}
        required
        placeholder={province ? "Pilih kabupaten/kota" : "Pilih provinsi dulu"}
      />

      <RegionSelect
        label="Kecamatan"
        name="district"
        value={district}
        options={districtOptions}
        onChange={(value) => {
          setDistrict(value);
          setSubdistrict("");
        }}
        disabled={!city}
        placeholder={city ? "Pilih kecamatan" : "Pilih kabupaten/kota dulu"}
      />

      <RegionSelect
        label="Kelurahan / Desa"
        name="subdistrict"
        value={subdistrict}
        options={subdistrictOptions}
        onChange={setSubdistrict}
        disabled={!district}
        placeholder={district ? "Pilih kelurahan/desa" : "Pilih kecamatan dulu"}
      />

      <div className="sm:col-span-2">
        <TextAreaField label="Alamat detail" name="address" defaultValue={site?.address} />
      </div>

      <FormField label="Postal code" name="postalCode" defaultValue={site?.postalCode} />
      <input type="hidden" name="country" value="ID" />

      <FormField label="Contact person" name="contactPerson" defaultValue={site?.contactPerson} />
      <FormField label="Telepon" name="phone" defaultValue={site?.phone} />

      <div className="rounded-2xl border border-coral-200 bg-coral-50/70 p-4 text-sm text-ink-soft sm:col-span-2">
        <p className="font-extrabold text-ink">Lokasi nasional Indonesia</p>
        <p className="mt-1">
          Form ini mendukung seluruh wilayah Indonesia hingga level kelurahan/desa. Koordinat site dipakai sebagai target GPS saat worker mulai kerja dengan toleransi radius 50 meter.
        </p>
        {coordinateSummary ? <p className="mt-2 font-mono text-xs text-coral-800">Koordinat tersimpan: {coordinateSummary}</p> : null}
      </div>

      <FormField label="Latitude" name="latitude" type="number" defaultValue={site?.latitude} />
      <FormField label="Longitude" name="longitude" type="number" defaultValue={site?.longitude} />

      <label className="text-sm font-bold">
        Status
        <select name="status" defaultValue={site?.status ?? "ACTIVE"} className={inputClass}>
          <option>ACTIVE</option>
          <option>INACTIVE</option>
        </select>
      </label>

      <div className="sm:col-span-2">
        <TextAreaField label="Access instructions" name="accessInstructions" defaultValue={site?.accessInstructions} />
      </div>

      <div className="sm:col-span-2">
        <TextAreaField label="Safety notes" name="safetyNotes" defaultValue={site?.safetyNotes} />
      </div>

      <div className="sm:col-span-2">
        <Submit>{site ? "Simpan perubahan" : "Simpan site"}</Submit>
      </div>
    </form>
  );
}
