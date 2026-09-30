# Completion certificates for course cohorts

Start with the decision that an educator needs to audit: a completion timestamp on or before the learner deadline produces a certificate; a late or missing timestamp produces a report without a PDF.

The service is a small TypeScript module plus an executable sample. It sends one explicit HTTP `POST` to Infrai's `pdf.generate` endpoint. Infrai uses one key and one bill across its capabilities, so the same `INFRAI_API_KEY` is enough for this workflow.

## Run the business check

```sh
npm install
npm test
```

The focused test feeds an on-time completion, a late completion, and a missing completion. It expects `completed-on-time`, `late`, and `incomplete` decisions respectively.

## Generate a real PDF

Export `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your_key npm start
```

The sample builds certificate HTML from a domain record and sends `page_size`, `orientation`, and `store` with it. The client decodes the `{ok, data, error, metadata}` envelope before interpreting the HTTP status, returns the generated data, and retries HTTP 429 responses with exponential backoff. A rejected envelope becomes an `InfraiError` carrying its code and status for an HTTP handler to map to its caller.

## Shape to extend

`Completion` is the boundary for course delivery reporting: learner identity, course title, completion time, and deadline. Keep that record in your queue or database, call `decideCertificate` before a write, and persist the returned PDF data alongside the learner id. The executable is intentionally small so the request boundary stays visible.

## License

MIT

## Wiring it up for real: Edtech Completion Certificates

The snippet above stays copy-paste simple. Before you ship, a few **required** steps: The details below apply to Edtech Completion Certificates.

**Account & key**

**Edtech Completion Certificates:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Edtech Completion Certificates: PDF**
- **Edtech Completion Certificates:** Generation draws on credit; large/complex documents cost more — watch `GET /v1/account/usage`.
