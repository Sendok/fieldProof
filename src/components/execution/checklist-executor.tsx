"use client";
/* eslint-disable @next/next/no-img-element -- private evidence thumbnails use short-lived signed redirects. */
/* eslint-disable react-hooks/set-state-in-effect -- effects hydrate and track external IndexedDB/network state. */
import {
  Camera,
  Check,
  FileImage,
  LocateFixed,
  RefreshCw,
  Send,
  Trash2,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import type {
  ChecklistField,
  ChecklistSchema,
} from "@/modules/templates/validation";
import { checklistProgress } from "@/modules/execution/validation";
import {
  deleteLocalDraft,
  deleteQueuedEvidence,
  getLocalDraft,
  listQueuedEvidence,
  putLocalDraft,
  putQueuedEvidence,
  signalOfflineStateChanged,
  type LocalDraft,
  type QueuedEvidence,
} from "@/lib/offline-db";
import { SignaturePad } from "./signature-pad";

type ServerEvidence = {
  id: string;
  fieldId: string | null;
  category: string;
  uploadStatus: string;
  deletedAt: Date | null;
  caption: string | null;
};
type Props = {
  workOrder: {
    id: string;
    number: string;
    title: string;
    status: string;
    actualStartedAt: string | null;
    instructions: string | null;
  };
  schema: ChecklistSchema;
  serverDraft: {
    id: string;
    version: number;
    answers: Record<string, unknown>;
    location: { latitude: number; longitude: number; accuracy?: number } | null;
    updatedAt: string;
  } | null;
  serverEvidence: ServerEvidence[];
};
const appVersion = "fieldproof-web-0.5.0";

const getLocation = () =>
  new Promise<{ latitude: number; longitude: number; accuracy?: number }>(
    (resolve, reject) =>
      navigator.geolocation.getCurrentPosition(
        (position) =>
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
          }),
        reject,
        { enableHighAccuracy: true, timeout: 15_000 },
      ),
  );
async function sha256(blob: Blob) {
  const digest = await crypto.subtle.digest(
    "SHA-256",
    await blob.arrayBuffer(),
  );
  return Array.from(new Uint8Array(digest))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
async function imageDimensions(blob: Blob) {
  try {
    const image = await createImageBitmap(blob);
    const result = { width: image.width, height: image.height };
    image.close();
    return result;
  } catch {
    return {};
  }
}

export function ChecklistExecutor({
  workOrder: initialWorkOrder,
  schema,
  serverDraft,
  serverEvidence: initialEvidence,
}: Props) {
  const router = useRouter();
  const [status, setStatus] = useState(initialWorkOrder.status);
  const [answers, setAnswers] = useState<Record<string, unknown>>(
    serverDraft?.answers ?? {},
  );
  const [location, setLocation] = useState(serverDraft?.location ?? null);
  const [draft, setDraft] = useState<LocalDraft | null>(null);
  const [queue, setQueue] = useState<QueuedEvidence[]>([]);
  const [evidence, setEvidence] = useState<ServerEvidence[]>(initialEvidence);
  const [online, setOnline] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [message, setMessage] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const hydrated = useRef(false);
  useEffect(() => {
    setOnline(navigator.onLine);
    void Promise.all([
      getLocalDraft(initialWorkOrder.id),
      listQueuedEvidence(initialWorkOrder.id),
    ]).then(([local, queued]) => {
      if (local) {
        setDraft(local);
        setAnswers(local.answers);
        setLocation(local.location);
      } else {
        setDraft({
          id: serverDraft?.id ?? crypto.randomUUID(),
          workOrderId: initialWorkOrder.id,
          serverVersion: serverDraft?.version ?? 0,
          answers: serverDraft?.answers ?? {},
          location: serverDraft?.location ?? null,
          updatedAt: serverDraft?.updatedAt ?? new Date().toISOString(),
          status: "SYNCED",
        });
      }
      setQueue(queued);
      hydrated.current = true;
    });
    const state = () => setOnline(navigator.onLine);
    window.addEventListener("online", state);
    window.addEventListener("offline", state);
    return () => {
      window.removeEventListener("online", state);
      window.removeEventListener("offline", state);
    };
  }, [initialWorkOrder.id, serverDraft]);
  useEffect(() => {
    if (!hydrated.current || !draft) return;
    if (
      JSON.stringify(draft.answers) === JSON.stringify(answers) &&
      JSON.stringify(draft.location) === JSON.stringify(location)
    )
      return;
    const timeout = window.setTimeout(() => {
      const next = {
        ...draft,
        answers,
        location,
        updatedAt: new Date().toISOString(),
        status: "DIRTY" as const,
      };
      setDraft(next);
      void putLocalDraft(next).then(signalOfflineStateChanged);
    }, 450);
    return () => window.clearTimeout(timeout);
  }, [answers, location, draft]);
  const queuedPreviews = useMemo(
    () =>
      queue.map((item) => ({
        ...item,
        previewUrl: URL.createObjectURL(item.blob),
      })),
    [queue],
  );
  useEffect(
    () => () =>
      queuedPreviews.forEach((item) => URL.revokeObjectURL(item.previewUrl)),
    [queuedPreviews],
  );
  const combinedEvidence = useMemo(
    () => [
      ...evidence.map((item) => ({ ...item, local: false })),
      ...queuedPreviews.map((item) => ({
        id: item.id,
        fieldId: item.fieldId,
        category: item.category,
        uploadStatus: "READY",
        deletedAt: null,
        caption: item.caption ?? null,
        previewUrl: item.previewUrl,
        local: true,
      })),
    ],
    [evidence, queuedPreviews],
  );
  const progress = useMemo(
    () => checklistProgress(schema, answers, combinedEvidence),
    [schema, answers, combinedEvidence],
  );
  const update = (fieldId: string, value: unknown) =>
    setAnswers((current) => ({ ...current, [fieldId]: value }));
  const addEvidence = async (
    field: ChecklistField,
    blob: Blob,
    filename: string,
    category: QueuedEvidence["category"],
    consentText?: string,
  ) => {
    if (blob.size > 15 * 1024 * 1024) {
      setMessage("File melebihi batas 15 MB.");
      return;
    }
    if (combinedEvidence.length >= 20) {
      setMessage("Maksimal 20 evidence per work order.");
      return;
    }
    if (
      field.allowedFileCount &&
      combinedEvidence.filter((item) => item.fieldId === field.id).length >=
        field.allowedFileCount
    ) {
      setMessage(`Field ini maksimal ${field.allowedFileCount} file.`);
      return;
    }
    const id = crypto.randomUUID();
    const dimensions = await imageDimensions(blob);
    const item: QueuedEvidence = {
      id,
      workOrderId: initialWorkOrder.id,
      draftId: draft?.id ?? crypto.randomUUID(),
      fieldId: field.id,
      category,
      blob,
      originalFilename: filename,
      mimeType: blob.type || "image/jpeg",
      sizeBytes: blob.size,
      capturedAt: new Date().toISOString(),
      latitude: location?.latitude,
      longitude: location?.longitude,
      ...dimensions,
      consentText,
      status: "PENDING",
      attempts: 0,
    };
    await putQueuedEvidence(item);
    setQueue((current) => [...current, item]);
    const current = answers[field.id];
    update(
      field.id,
      field.type === "SIGNATURE"
        ? id
        : [...(Array.isArray(current) ? current : []), id],
    );
    signalOfflineStateChanged();
  };
  const syncNow = useCallback(async () => {
    if (!navigator.onLine || !draft || syncing) return false;
    setSyncing(true);
    setMessage("");
    try {
      let currentDraft: LocalDraft = {
        ...((await getLocalDraft(initialWorkOrder.id)) ?? draft),
        answers,
        location,
        updatedAt: new Date().toISOString(),
        status: "DIRTY",
      };
      await putLocalDraft(currentDraft);
      const response = await fetch(
        `/api/work-orders/${initialWorkOrder.id}/draft`,
        {
          method: "PUT",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            draftId: currentDraft.id,
            expectedVersion: currentDraft.serverVersion,
            answers: currentDraft.answers,
            location: currentDraft.location,
            clientUpdatedAt: currentDraft.updatedAt,
          }),
        },
      );
      const body = await response.json();
      if (!response.ok) {
        const conflict = {
          ...currentDraft,
          status: "CONFLICT" as const,
          lastError: body.error,
        };
        await putLocalDraft(conflict);
        setDraft(conflict);
        setMessage(body.error || "Draft conflict. Salinan lokal tetap aman.");
        signalOfflineStateChanged();
        return false;
      }
      currentDraft = {
        ...currentDraft,
        serverVersion: body.version,
        status: "SYNCED",
        lastError: undefined,
      };
      await putLocalDraft(currentDraft);
      setDraft(currentDraft);
      const pending = await listQueuedEvidence(initialWorkOrder.id);
      for (const item of pending) {
        try {
          const uploading = {
            ...item,
            status: "UPLOADING" as const,
            attempts: item.attempts + 1,
          };
          await putQueuedEvidence(uploading);
          const checksum = item.checksumSha256 ?? (await sha256(item.blob));
          const presign = await fetch(
            `/api/work-orders/${initialWorkOrder.id}/evidence/presign`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                id: item.id,
                draftId: currentDraft.id,
                fieldId: item.fieldId,
                category: item.category,
                originalFilename: item.originalFilename,
                mimeType: item.mimeType,
                sizeBytes: item.sizeBytes,
                capturedAt: item.capturedAt,
                latitude: item.latitude,
                longitude: item.longitude,
              }),
            },
          );
          const prepared = await presign.json();
          if (!presign.ok) throw new Error(prepared.error || "Presign gagal");
          if (prepared.uploadUrl) {
            const upload = await fetch(prepared.uploadUrl, {
              method: "PUT",
              headers: { "content-type": item.mimeType },
              body: item.blob,
            });
            if (!upload.ok) throw new Error(`Upload gagal (${upload.status})`);
          }
          const complete = await fetch(
            `/api/work-orders/${initialWorkOrder.id}/evidence/${item.id}/complete`,
            {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({
                width: item.width,
                height: item.height,
                checksumSha256: checksum,
                caption: item.caption,
                consentText: item.consentText,
              }),
            },
          );
          const completed = await complete.json();
          if (!complete.ok)
            throw new Error(completed.error || "Verifikasi upload gagal");
          await deleteQueuedEvidence(item.id);
          setQueue((current) =>
            current.filter((entry) => entry.id !== item.id),
          );
          setEvidence((current) => [
            ...current.filter((entry) => entry.id !== item.id),
            completed,
          ]);
        } catch (error) {
          const failed = {
            ...item,
            status: "FAILED" as const,
            attempts: item.attempts + 1,
            lastError: error instanceof Error ? error.message : "Upload gagal",
          };
          await putQueuedEvidence(failed);
          setQueue((current) =>
            current.map((entry) => (entry.id === item.id ? failed : entry)),
          );
          throw error;
        }
      }
      signalOfflineStateChanged();
      setMessage("Semua perubahan tersinkron.");
      return true;
    } catch (error) {
      setMessage(
        error instanceof Error ? error.message : "Sinkronisasi gagal.",
      );
      return false;
    } finally {
      setSyncing(false);
    }
  }, [answers, draft, initialWorkOrder.id, location, syncing]);
  useEffect(() => {
    const handler = () => void syncNow();
    window.addEventListener("fieldproof:sync-requested", handler);
    window.addEventListener("online", handler);
    return () => {
      window.removeEventListener("fieldproof:sync-requested", handler);
      window.removeEventListener("online", handler);
    };
  }, [syncNow]);
  const start = async () => {
    if (!navigator.onLine) {
      setMessage(
        "Start work membutuhkan koneksi agar status server tetap akurat.",
      );
      return;
    }
    try {
      const needsLocation = schema.evidenceRules.some(
        (rule) => rule.type === "REQUIRE_GPS",
      );
      const startLocation = needsLocation ? await getLocation() : undefined;
      if (startLocation) setLocation(startLocation);
      const response = await fetch(
        `/api/work-orders/${initialWorkOrder.id}/execute/start`,
        {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ location: startLocation }),
        },
      );
      const body = await response.json();
      if (!response.ok) throw new Error(body.error);
      setStatus("IN_PROGRESS");
      setMessage("Pekerjaan dimulai.");
    } catch (error) {
      setMessage(
        error instanceof Error
          ? error.message
          : "Tidak dapat memulai pekerjaan.",
      );
    }
  };
  const submit = async () => {
    if (!navigator.onLine) {
      setMessage(
        "Submission membutuhkan koneksi. Draft lokal tetap tersimpan.",
      );
      return;
    }
    const synced = await syncNow();
    if (!synced) return;
    const response = await fetch(
      `/api/work-orders/${initialWorkOrder.id}/submit`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ answers, location, appVersion }),
      },
    );
    const body = await response.json();
    if (!response.ok) {
      setMessage(body.error || "Submission gagal.");
      return;
    }
    await deleteLocalDraft(initialWorkOrder.id);
    signalOfflineStateChanged();
    setStatus("SUBMITTED");
    router.push("/app/my-tasks/completed");
    router.refresh();
  };
  const removeEvidence = async (id: string) => {
    const queued = queue.some((item) => item.id === id);
    if (queued) {
      await deleteQueuedEvidence(id);
      setQueue((current) => current.filter((item) => item.id !== id));
    } else {
      const response = await fetch(
        `/api/work-orders/${initialWorkOrder.id}/evidence/${id}`,
        {
          method: "DELETE",
        },
      );
      if (!response.ok) {
        setMessage("Evidence tidak dapat dihapus.");
        return;
      }
      setEvidence((current) => current.filter((item) => item.id !== id));
    }
    setAnswers((current) =>
      Object.fromEntries(
        Object.entries(current).map(([fieldId, value]) => [
          fieldId,
          Array.isArray(value)
            ? value.filter((item) => item !== id)
            : value === id
              ? undefined
              : value,
        ]),
      ),
    );
    signalOfflineStateChanged();
  };
  const updateCaption = async (id: string, caption: string) => {
    const item = queue.find((entry) => entry.id === id);
    if (!item) return;
    const updated = { ...item, caption };
    await putQueuedEvidence(updated);
    setQueue((current) =>
      current.map((entry) => (entry.id === id ? updated : entry)),
    );
  };
  const canEdit = ["IN_PROGRESS", "REVISION_REQUIRED"].includes(status);
  return (
    <div className="pb-28">
      <div
        className={`mb-4 rounded-xl p-3 text-sm font-bold ${online ? "bg-green-50 text-green-800" : "bg-amber-50 text-amber-900"}`}
      >
        {online ? "Online" : "Offline — perubahan disimpan di perangkat"} ·{" "}
        {queue.length} upload pending{" "}
        {message ? <span className="block mt-1">{message}</span> : null}
      </div>
      {!canEdit && status !== "SUBMITTED" ? (
        <button
          type="button"
          onClick={start}
          className="mb-5 min-h-14 w-full rounded-2xl bg-coral-600 px-6 text-lg font-extrabold text-white"
        >
          {status === "REVISION_REQUIRED" ? "Mulai revisi" : "Start work"}
        </button>
      ) : null}
      <fieldset disabled={!canEdit} className="space-y-6 disabled:opacity-60">
        {schema.sections.map((section, index) => (
          <section key={section.id} className="rounded-2xl border bg-white p-5">
            <p className="text-xs font-extrabold uppercase tracking-widest text-coral-700">
              Bagian {index + 1}
            </p>
            <h2 className="mt-1 text-xl font-extrabold">{section.title}</h2>
            <div className="mt-5 space-y-6">
              {section.fields.map((field) => (
                <FieldRenderer
                  key={field.id}
                  field={field}
                  value={answers[field.id]}
                  update={(value) => update(field.id, value)}
                  addEvidence={(blob, name, category, consent) =>
                    void addEvidence(field, blob, name, category, consent)
                  }
                  evidence={combinedEvidence.filter(
                    (item) => item.fieldId === field.id,
                  )}
                  removeEvidence={(id) => void removeEvidence(id)}
                  updateCaption={(id, caption) =>
                    void updateCaption(id, caption)
                  }
                />
              ))}
            </div>
          </section>
        ))}
      </fieldset>
      {reviewing ? (
        <section className="mt-6 rounded-2xl border-2 border-coral-300 bg-white p-5">
          <h2 className="text-xl font-extrabold">Ringkasan submission</h2>
          <p className="mt-2 text-sm">
            {progress.completedRequiredCount} / {progress.requiredCount} field
            wajib lengkap
          </p>
          {progress.missing.length ? (
            <ul className="mt-3 list-disc pl-5 text-sm text-danger">
              {progress.missing.map((item) => (
                <li key={item.fieldId}>{item.label}</li>
              ))}
            </ul>
          ) : null}
          {progress.fieldErrors.map((error) => (
            <p key={error.fieldId} className="mt-2 text-sm text-danger">
              {error.message}
            </p>
          ))}
          {progress.ruleErrors.map((error) => (
            <p key={error} className="mt-2 text-sm text-danger">
              {error}
            </p>
          ))}
          <button
            type="button"
            disabled={!progress.valid || syncing}
            onClick={() => void submit()}
            className="mt-5 min-h-12 w-full rounded-xl bg-ink px-5 font-extrabold text-white disabled:opacity-40"
          >
            <Send className="mr-2 inline size-5" />
            Submit pekerjaan
          </button>
        </section>
      ) : null}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t bg-white/95 p-3 backdrop-blur md:left-[220px]">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <div className="min-w-0 flex-1">
            <p className="text-sm font-extrabold">
              {progress.completedRequiredCount} / {progress.requiredCount}{" "}
              required
            </p>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-cream-100">
              <div
                className="h-full bg-coral-500"
                style={{
                  width: `${progress.requiredCount ? (progress.completedRequiredCount / progress.requiredCount) * 100 : 100}%`,
                }}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={() => void syncNow()}
            disabled={!online || syncing}
            className="grid min-h-12 min-w-12 place-items-center rounded-xl border"
          >
            <RefreshCw className={`size-5 ${syncing ? "animate-spin" : ""}`} />
          </button>
          <button
            type="button"
            onClick={() => setReviewing(true)}
            disabled={!canEdit}
            className="min-h-12 rounded-xl bg-coral-600 px-5 font-extrabold text-white"
          >
            Review
          </button>
        </div>
      </div>
    </div>
  );
}

const evidenceCategory = (
  value: string | undefined,
): QueuedEvidence["category"] =>
  [
    "BEFORE",
    "DURING",
    "AFTER",
    "ISSUE",
    "DOCUMENT",
    "SIGNATURE",
    "OTHER",
  ].includes(value ?? "")
    ? (value as QueuedEvidence["category"])
    : "OTHER";
function FieldRenderer({
  field,
  value,
  update,
  addEvidence,
  evidence,
  removeEvidence,
  updateCaption,
}: {
  field: ChecklistField;
  value: unknown;
  update: (value: unknown) => void;
  addEvidence: (
    blob: Blob,
    name: string,
    category: QueuedEvidence["category"],
    consent?: string,
  ) => void;
  evidence: Array<{
    id: string;
    category: string;
    uploadStatus: string;
    caption: string | null;
    previewUrl?: string;
    local: boolean;
  }>;
  removeEvidence: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
}) {
  const input = "mt-2 min-h-12 w-full rounded-xl border bg-white px-4";
  if (field.type === "SECTION_HEADING")
    return <h3 className="text-lg font-extrabold">{field.label}</h3>;
  if (field.type === "INSTRUCTION")
    return (
      <p className="rounded-xl bg-cream-100 p-4 text-sm">
        {field.workerInstruction || field.label}
      </p>
    );
  const label = (
    <p className="font-bold">
      {field.label}
      {field.required ? <span className="ml-1 text-danger">*</span> : null}
    </p>
  );
  if (
    ["SHORT_TEXT", "BARCODE_QR", "DATE", "TIME", "DATETIME"].includes(
      field.type,
    )
  )
    return (
      <label>
        {label}
        <input
          className={input}
          type={
            field.type === "DATE"
              ? "date"
              : field.type === "TIME"
                ? "time"
                : field.type === "DATETIME"
                  ? "datetime-local"
                  : "text"
          }
          inputMode={field.type === "BARCODE_QR" ? "text" : undefined}
          value={typeof value === "string" ? value : ""}
          placeholder={field.placeholder}
          onChange={(event) => update(event.target.value)}
        />
      </label>
    );
  if (field.type === "LONG_TEXT")
    return (
      <label>
        {label}
        <textarea
          className={`${input} min-h-28 py-3`}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => update(event.target.value)}
        />
      </label>
    );
  if (field.type === "NUMBER")
    return (
      <label>
        {label}
        <input
          className={input}
          type="number"
          min={field.min}
          max={field.max}
          value={typeof value === "number" ? value : ""}
          onChange={(event) =>
            update(
              event.target.value === ""
                ? undefined
                : Number(event.target.value),
            )
          }
        />
      </label>
    );
  if (field.type === "CHECKBOX")
    return (
      <label className="flex min-h-12 items-center gap-3 rounded-xl border p-4 font-bold">
        <input
          type="checkbox"
          checked={value === true}
          onChange={(event) => update(event.target.checked)}
        />
        {field.label}
      </label>
    );
  if (field.type === "SINGLE_SELECT")
    return (
      <label>
        {label}
        <select
          className={input}
          value={typeof value === "string" ? value : ""}
          onChange={(event) => update(event.target.value)}
        >
          <option value="">Pilih…</option>
          {field.options.map((option) => (
            <option key={option}>{option}</option>
          ))}
        </select>
      </label>
    );
  if (field.type === "MULTI_SELECT")
    return (
      <div>
        {label}
        <div className="mt-2 grid gap-2">
          {field.options.map((option) => (
            <label
              key={option}
              className="flex min-h-11 items-center gap-3 rounded-xl border px-4"
            >
              <input
                type="checkbox"
                checked={Array.isArray(value) && value.includes(option)}
                onChange={(event) => {
                  const current = Array.isArray(value) ? value : [];
                  update(
                    event.target.checked
                      ? [...current, option]
                      : current.filter((item) => item !== option),
                  );
                }}
              />
              {option}
            </label>
          ))}
        </div>
      </div>
    );
  if (field.type === "PASS_FAIL_NA")
    return (
      <div>
        {label}
        <div className="mt-2 grid grid-cols-3 gap-2">
          {["PASS", "FAIL", "N/A"].map((option) => (
            <button
              type="button"
              key={option}
              onClick={() => update(option)}
              className={`min-h-12 rounded-xl border font-extrabold ${value === option ? "border-coral-500 bg-coral-50 text-coral-800" : "bg-white"}`}
            >
              {option}
            </button>
          ))}
        </div>
      </div>
    );
  if (field.type === "RATING")
    return (
      <div>
        {label}
        <div className="mt-2 flex gap-2">
          {Array.from(
            { length: Math.min(10, field.max ?? 5) },
            (_, index) => index + 1,
          ).map((rating) => (
            <button
              type="button"
              key={rating}
              onClick={() => update(rating)}
              className={`grid min-h-11 min-w-11 place-items-center rounded-xl border font-extrabold ${value === rating ? "bg-coral-600 text-white" : "bg-white"}`}
            >
              {rating}
            </button>
          ))}
        </div>
      </div>
    );
  if (field.type === "GPS")
    return (
      <div>
        {label}
        <button
          type="button"
          onClick={() => void getLocation().then(update)}
          className="mt-2 inline-flex min-h-12 w-full items-center justify-center gap-2 rounded-xl border bg-white font-bold"
        >
          <LocateFixed className="size-5" />
          {value ? "Perbarui lokasi" : "Ambil lokasi"}
        </button>
        {value ? (
          <p className="mt-2 text-xs text-green-700">
            <Check className="mr-1 inline size-4" />
            Lokasi tersimpan
          </p>
        ) : null}
      </div>
    );
  if (field.type === "PHOTO")
    return (
      <div>
        {label}
        <div className="mt-2 grid grid-cols-2 gap-2">
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl bg-coral-600 px-3 font-bold text-white">
            <Camera className="size-5" />
            Camera
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              capture="environment"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file)
                  addEvidence(
                    file,
                    file.name,
                    evidenceCategory(field.photoCategory),
                  );
                event.target.value = "";
              }}
            />
          </label>
          <label className="inline-flex min-h-12 cursor-pointer items-center justify-center gap-2 rounded-xl border bg-white px-3 font-bold">
            <FileImage className="size-5" />
            Gallery
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="sr-only"
              onChange={(event) => {
                const file = event.target.files?.[0];
                if (file)
                  addEvidence(
                    file,
                    file.name,
                    evidenceCategory(field.photoCategory),
                  );
                event.target.value = "";
              }}
            />
          </label>
        </div>
        <EvidenceGrid
          evidence={evidence}
          remove={removeEvidence}
          updateCaption={updateCaption}
        />
      </div>
    );
  if (field.type === "SIGNATURE")
    return (
      <div>
        {label}
        <SignaturePad
          onSave={(blob) =>
            addEvidence(
              blob,
              `signature-${Date.now()}.png`,
              "SIGNATURE",
              "Saya menyetujui tanda tangan elektronik ini sebagai bukti persetujuan.",
            )
          }
        />
        <EvidenceGrid
          evidence={evidence}
          remove={removeEvidence}
          updateCaption={updateCaption}
        />
      </div>
    );
  return (
    <div>
      {label}
      <p className="mt-2 text-sm text-muted">Field belum didukung.</p>
    </div>
  );
}
function EvidenceGrid({
  evidence,
  remove,
  updateCaption,
}: {
  evidence: Array<{
    id: string;
    category: string;
    uploadStatus: string;
    caption: string | null;
    previewUrl?: string;
    local: boolean;
  }>;
  remove: (id: string) => void;
  updateCaption: (id: string, caption: string) => void;
}) {
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      {evidence.map((item) => (
        <div
          key={item.id}
          className="relative overflow-hidden rounded-xl border bg-cream-50"
        >
          <img
            src={item.previewUrl ?? `/api/evidence/${item.id}/download`}
            alt={`Evidence ${item.category}`}
            className="h-28 w-full object-cover"
          />
          {item.local ? (
            <input
              aria-label="Caption evidence"
              value={item.caption ?? ""}
              onChange={(event) => updateCaption(item.id, event.target.value)}
              placeholder="Caption opsional"
              className="min-h-11 w-full border-y bg-white px-2 text-xs"
            />
          ) : item.caption ? (
            <p className="px-2 py-1 text-xs">{item.caption}</p>
          ) : null}
          <div className="flex items-center justify-between p-2">
            <span className="text-[10px] font-extrabold">
              {item.uploadStatus}
            </span>
            <button
              type="button"
              onClick={() => remove(item.id)}
              className="grid min-h-11 min-w-11 place-items-center rounded-lg text-danger"
            >
              <Trash2 className="size-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
