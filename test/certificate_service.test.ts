import assert from "node:assert/strict";
import { decideCertificate } from "../src/certificate_service.js";

const onTime = { learnerId: "l1", learnerName: "Sam Lee", courseTitle: "Course", completedAt: "2026-01-10T10:00:00Z", deadline: "2026-01-10T12:00:00Z" };
assert.deepEqual(decideCertificate(onTime), { issue: true, reason: "completed-on-time" });
assert.deepEqual(decideCertificate({ ...onTime, completedAt: "2026-01-11T10:00:00Z" }), { issue: false, reason: "late" });
assert.deepEqual(decideCertificate({ ...onTime, completedAt: "" }), { issue: false, reason: "incomplete" });
console.log("certificate decision tests passed");
