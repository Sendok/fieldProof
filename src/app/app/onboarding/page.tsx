import { AuthCard, Field, SubmitButton } from "@/components/forms/auth-card";
import { createOrganizationAction } from "../actions";

export default function OnboardingPage() {
  return <div className="md:col-span-2"><AuthCard title="Buat organisasi" description="Langkah pertama untuk memisahkan data perusahaan dan anggota Anda."><form action={createOrganizationAction} className="space-y-5"><Field label="Nama perusahaan" name="name" /><Field label="Slug" name="slug" /><Field label="Industri" name="industry" required={false} /><input type="hidden" name="country" value="ID" /><input type="hidden" name="timezone" value="Asia/Jakarta" /><input type="hidden" name="locale" value="id-ID" /><SubmitButton>Buat organisasi</SubmitButton></form></AuthCard></div>;
}
