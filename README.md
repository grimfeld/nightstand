# Nightstand

A reading tracker with five slots. A book you are halfway through still occupies
one, so the only ways to make room are to finish something or admit you never
will.

Books live on two independent axes — **Acquisition** (`WANTED` / `OWNED` /
`BORROWED` / `GONE`) and **Engagement** (`UNREAD` / `READING` / `READ` /
`ABANDONED`) — plus a self-declared **Studied** flag that is orthogonal to both,
because a textbook abandoned at chapter four can still have been studied hard.

A `WANTED` book holding a slot is the instruction to buy it, which is why there
is no separate wishlist.

See [`CONTEXT.md`](./CONTEXT.md) for the full vocabulary and
[`docs/adr/`](./docs/adr) for why it is shaped this way.

## Stack

React 19 · Vite · Tailwind v4 · shadcn/ui · Tauri v2 (Android) · PocketBase on
Fly.io. The client is **online-only** by design — see
[ADR 0002](./docs/adr/0002-tauri-client-with-hosted-pocketbase.md).

## Running it

```bash
npm install
npm run setup:hooks        # enables .githooks/pre-push
cp .env.example .env       # point VITE_PB_URL at your PocketBase
npm run dev                # browser
npm run tauri dev          # desktop shell
```

Desktop is a development convenience, not a shipped artifact. Android is the
target that ships.

## The server

PocketBase runs as a single pinned binary with the schema applied from
`server/pb_migrations/` at boot, so it is version-controlled rather than clicked
into the admin UI.

```bash
cd server
fly launch --no-deploy --name nightstand
fly volumes create pb_data --size 1 --region lhr
fly deploy
```

Then create your account at `https://nightstand.fly.dev/_/` — one superuser for
the admin UI, and one record in `users` that owns every book. Collection rules
scope everything to `owner = @request.auth.id`.

The five-slot cap is enforced in the client, not the database: collection rules
cannot count sibling records. With one user that is sufficient.

## Building an APK

Every push to `main` builds a release-signed arm64 APK and uploads it as a
workflow artifact. Download it on the phone and install straight over the
previous one — the signature is stable, so no uninstall dance.

### Signing

Generate the keystore once and keep it somewhere you will not lose it. Losing it
means a new signature, which means uninstalling before the next update.

```bash
keytool -genkeypair -v \
  -keystore nightstand.keystore \
  -alias nightstand \
  -keyalg RSA -keysize 2048 -validity 10000

base64 -i nightstand.keystore | pbcopy
```

Set three repository secrets:

| Secret | Value |
| --- | --- |
| `ANDROID_KEYSTORE_B64` | the base64 blob just copied |
| `ANDROID_KEYSTORE_PASSWORD` | the keystore password |
| `ANDROID_KEY_ALIAS` | `nightstand` |

Optionally set a repository **variable** `VITE_PB_URL` if your PocketBase is not
at `https://nightstand.fly.dev`.

### Building locally

Not set up, deliberately. It needs JDK 17, an NDK, and SDK 34, and the pre-push
hook stays fast precisely because it never cross-compiles. If you do want it:

```bash
export JAVA_HOME=$(/usr/libexec/java_home -v 17)
export NDK_HOME=$ANDROID_HOME/ndk/<version>
npm run tauri android init
npm run tauri android build --apk --target aarch64
```

## Checks

`.githooks/pre-push` runs `tsc -b`, `vite build` and `cargo check` — about 30
seconds, no Android toolchain. CI repeats all three so a `--no-verify` push is
still caught, then builds the APK.
