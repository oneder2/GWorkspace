# Resume project review

Reviewed: 2026-09-03

This review is based on repository code, READMEs, migrations, tests, and Git history. It deliberately avoids user, revenue, conversion, latency, and accuracy claims because those metrics are not present in the repositories.

## Positioning

Primary positioning: full-stack software engineer building AI and local-first products across web, desktop, and mobile.

The strongest differentiator is not the number of frameworks. It is the ability to take a product through the complete delivery path: interface, domain data, backend workflow, security boundary, testing, deployment, and product presentation.

## Commercial experience

### CiteAI

Resume placement: Experience section and web portfolio. The PDF project section excludes CiteAI to avoid repeating the same work twice.

Verified scope:

- Next.js/TypeScript document editor and citation review UI.
- Supabase domain schemas for workspaces, analysis, knowledge, quotas, and billing.
- FastAPI citation engine on AWS Lambda with NLP, OpenAlex/Tavily retrieval, BM25 ranking, and model verification.
- Stripe subscriptions and top-ups, ownership checks, idempotent webhooks, and quota-period refresh.
- Citation formatting and DOCX, HTML, and BibTeX export.
- Jest, evaluation tooling, CI builds, and Lambda deployment workflows.

Evidence: /home/gellar/Desktop/program/us_buisness/CiteAI-refactor/README.md, src/, container/, supabase/migrations/, .github/workflows/, and Git history from 2026-01 through 2026-05.

## Selected personal projects

| Project | Resume value | Placement |
| --- | --- | --- |
| GWorkspace | Full-stack platform architecture, versioned content contracts, deployment, and 3D web integration | PDF + web |
| Oceannect | Production Flutter/FastAPI product, paired-user domain, media and notification reliability, and deployment operations | PDF + web |
| Vana | Local-first desktop architecture, SQLite/Supabase sync, Rust/Tauri, and document export | PDF + web |
| Farivy | Flutter mobile engineering, recoverable sessions, SQLite v13, notifications, and analytics | Web |
| Tideplan / OceanSEO | Native desktop integration, local credential handling, AI workflow, schema validation, and reviewed synchronization | Web |
| Moblify | Python/FastAPI automation, scoring, OpenCV/FFmpeg rendering, and Canvas preview | Web |

The PDF project limit is three. GWorkspace, Oceannect, and Vana provide the broadest non-overlapping evidence after CiteAI appears in Experience. Oceannect replaces Farivy in the PDF because it demonstrates a production mobile client, backend security, multi-channel notifications, database migration, and operational recovery rather than another primarily local Flutter application.

## Secondary projects

- SurfSmart: retain on the web as a collaborative hackathon record, but do not prioritize over shipped independent systems.
- Twilight Zone: retain on the web for game and digital-art breadth, but exclude from a software-engineering PDF.
- Structured Resume Website: retain as supporting infrastructure, but it should not compete with the products whose delivery it documents.
- Fiverr Launch Kit: do not present as a primary software project. It is a service operations and delivery asset library rather than a shipped product.

## Maintenance rule

GWorkspace is the resume authority. Update project facts and surface visibility here, then build the resume client at /home/gellar/Desktop/program/personal/oneder2.github.io. Do not edit generated snapshots or PDF files as source data.
