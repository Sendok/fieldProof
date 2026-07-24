import { z } from "zod";

const optionalCoordinate = z.preprocess((value) => value === "" ? undefined : value, z.coerce.number().optional());

export const siteInputSchema = z.object({
  clientId: z.uuid(),
  code: z.string().trim().toUpperCase().min(2).max(40).regex(/^[A-Z0-9-]+$/),
  name: z.string().trim().min(2).max(180),
  address: z.string().trim().min(5).max(1000),
  city: z.string().trim().max(100).optional().or(z.literal("")),
  state: z.string().trim().max(100).optional().or(z.literal("")),
  country: z.string().length(2).default("ID"),
  postalCode: z.string().trim().max(20).optional().or(z.literal("")),
  latitude: optionalCoordinate.refine((value) => value === undefined || (value >= -90 && value <= 90)),
  longitude: optionalCoordinate.refine((value) => value === undefined || (value >= -180 && value <= 180)),
  contactPerson: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  accessInstructions: z.string().trim().max(2000).optional().or(z.literal("")),
  safetyNotes: z.string().trim().max(2000).optional().or(z.literal("")),
  status: z.enum(["ACTIVE", "INACTIVE"]).default("ACTIVE"),
});
