# GWorkspace feature mapping

Gellaria mirrors public meaning, not GWorkspace's dashboard layout. A source
record should become a place, exhibit, echo, or doorway while keeping the same
ownership and privacy boundary.

| GWorkspace capability | Gellaria projection | Sync rule |
| --- | --- | --- |
| Owner profile, status, slogan and tasks | Arrival screen and ambient exhibition context | Read from `/api/public/world` |
| Public resume authority | Project exhibit facts and identity context | Read and validate `/api/public/v1/resume?locale=zh&surface=gellaria` v1 |
| Published projects | Project-hall prototype exhibits | Prefer the resume `gellaria` surface; the canonical detail remains `/portfolio` in GWorkspace |
| Published blogs | Writing-hall constellation exhibits | Published records only; full reading remains in GWorkspace |
| Approved guestbook entries | Memory-grove echoes | Approved records only |
| Daily capsule | First observatory exhibit | Read from `/api/ai/daily-capsule`; omitted on failure |
| Spotify now playing | First memory-grove echo | Read from `/api/spotify/now-playing`; omitted when idle or unavailable |
| Guest writing lab | Writing doorway in the study-room annex | Link back to GWorkspace `/workspace` |
| Owner writing studio | No document-level projection | Private projects stay in `/api/admin/writing`; published essays re-enter through the blog mapping |
| Workspace journal and recent tools | No projection | Browser-local working state stays on that browser |
| Admin and system controls | No projection | Remain under `/admin` |

The public-world adapter validates every remote payload and keeps bundled
fallback records. A failed optional pulse endpoint must remove only that pulse,
never the underlying landmark or archive.
