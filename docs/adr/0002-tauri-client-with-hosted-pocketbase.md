# A native Tauri client against a hosted PocketBase

For a single-user list of a few hundred books this looks like considerable over-engineering, so the reasoning is worth recording. The app's value depends on being reachable at the moment a book is recommended — in a shop, mid-article, away from a desk — which rules out anything desk-bound and makes Android the shipped target. Two devices then need one shared truth, so a server is unavoidable; PocketBase on a single Fly.io machine gives SQLite, auth, a REST/realtime SDK and an admin UI for fiddly edits, in one binary with no service tier to assemble.

## Considered options

- **Local-first web app, no backend.** The original choice. Rejected because "works on laptop and phone" quietly means two diverging datasets when there is nothing to sync through.
- **Plain text file in git.** Excellent history and zero infrastructure, but no phone access — and phone capture is the whole point.
- **Full offline support with an outbox.** Rejected as disproportionate: it demands stable IDs, write ordering and a conflict story, and the Nightstand's fixed Slot count makes conflicts real rather than theoretical (two devices claiming the last Slot).

## Consequences

- The client is online-only. With no connection there is no app, including in the bookshop basement that motivated going mobile. Accepted deliberately; revisit only if it actually bites.
- The dataset is small enough that swapping PocketBase for something else later is cheap. This decision is far less locked-in than it appears.
- Desktop is a development convenience via `tauri dev`, not a shipped artifact. Packaging and notarising a macOS build is disproportionate for one user.
- CI owns the Android toolchain (JDK 17, NDK, SDK 34). Local machines never cross-compile, which is what keeps the pre-push hook fast enough to survive.
