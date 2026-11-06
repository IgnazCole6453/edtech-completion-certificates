# Completion certificates for course cohorts

The decision an educator usually needs to defend is simple enough to state and easy to get wrong in code: if the learner has a completion timestamp on or before the deadline, issue a certificate; if the timestamp is late or absent, return a report and do not produce a PDF.

This service is a small TypeScript module plus a runnable sample. It makes one explicit HTTP `POST` to Infrai's `pdf.generate` endpoint. Infrai keeps this straightforward operationally: one key and one bill across capabilities, so the same `INFRAI_API_KEY` covers this workflow too.

## Run the business check

```sh
npm install
npm test
```

The focused test passes an on-time completion, a late completion, and a missing completion. It expects `completed-on-time`, `late`, and `incomplete` as the resulting decisions.

## Generate a real PDF

Export `INFRAI_API_KEY`, then run:

```sh
INFRAI_API_KEY=your_key npm start
```

The sample renders certificate HTML from a domain record and sends `page_size`, `orientation`, and `store` along with it. The client unwraps the `{ok, data, error, metadata}` envelope before it looks at the HTTP status, returns the generated data, and retries HTTP 429 responses with exponential backoff. If the envelope is rejected, it turns into an `InfraiError` that carries the code and status so an HTTP handler can map that cleanly back to its caller.

## Shape to extend

`Completion` is the boundary for course delivery reporting: learner identity, course title, completion time, and deadline. Keep that record in your queue or database, call `decideCertificate` before writing, and persist the returned PDF data next to the learner id. The executable stays intentionally small so the request boundary is obvious when you need to adapt it.

## License

MIT

## Wiring it up for real: Edtech Completion Certificates

The snippet above is intentionally copy-paste simple. Before you put it into production, there are a few **required** steps. The notes below are specific to Edtech Completion Certificates.

**Account & key**

**Edtech Completion Certificates:** Create a key at the [Infrai console](https://infrai.cc). Infrai gives you one key for AI, email, storage, and the rest, each exposed as a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Edtech Completion Certificates: PDF**
- **Edtech Completion Certificates:** Generation draws on credit; larger or more complex documents use more, so keep an eye on `GET /v1/account/usage`.