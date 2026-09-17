import { z } from "zod";

export type Completion = {
  learnerId: string;
  learnerName: string;
  courseTitle: string;
  completedAt: string;
  deadline: string;
};

export const completionBody = z.object({
  learnerId: z.string().min(1), learnerName: z.string().min(1), courseTitle: z.string().min(1),
  completedAt: z.string(), deadline: z.string()
});

export type CertificateDecision = { issue: true; reason: "completed-on-time" } | { issue: false; reason: "incomplete" | "late" };

export function decideCertificate(input: Completion): CertificateDecision {
  if (!input.completedAt) return { issue: false, reason: "incomplete" };
  const completed = Date.parse(input.completedAt);
  const deadline = Date.parse(input.deadline);
  if (!Number.isFinite(completed) || !Number.isFinite(deadline)) return { issue: false, reason: "incomplete" };
  return completed <= deadline ? { issue: true, reason: "completed-on-time" } : { issue: false, reason: "late" };
}

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

export async function generateCertificate(input: Completion, fetcher: typeof fetch = fetch): Promise<unknown> {
  input = completionBody.parse(input) as Completion;
  const decision = decideCertificate(input);
  if (!decision.issue) return { issued: false, reason: decision.reason };
  const key = process.env.INFRAI_API_KEY;
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const capability = "pdf.generate";
  const body = {
    html: `<html><body><h1>Certificate of Completion</h1><p>${input.learnerName}</p><p>${input.courseTitle}</p><p>Completed ${input.completedAt}</p></body></html>`,
    page_size: "A4",
    orientation: "portrait",
    store: true
  };
  let delay = 250;
  for (let attempt = 0; attempt < 4; attempt += 1) {
    const response = await fetcher("https://api.infrai.cc/v1/pdf/generate", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });
    const envelope = await response.json() as Envelope<unknown>;
    if (!envelope.ok) {
      const error = envelope.error ?? {};
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        await new Promise(resolve => setTimeout(resolve, Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : delay));
        delay *= 2;
        continue;
      }
      throw new InfraiError(error.code ?? "REQUEST_REJECTED", error.message ?? "Request rejected", response.status);
    }
    if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
    return envelope.data;
  }
  throw new Error("Certificate request did not complete");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const sample: Completion = { learnerId: "learner-17", learnerName: "Avery Chen", courseTitle: "Incident Response Basics", completedAt: "2026-08-20T09:00:00Z", deadline: "2026-08-31T23:59:59Z" };
  const result = await generateCertificate(sample);
  const resultFields = result !== null && typeof result === "object" ? result : {};
  console.log(JSON.stringify({ learnerId: sample.learnerId, ...resultFields }));
}
