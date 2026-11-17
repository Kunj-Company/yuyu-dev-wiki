# Android and iOS apps

Yuyu's two mobile clients live in their own repositories, `yuyu-android` and `yuyu-ios`, next to the server repository. Both are companion apps for a self-hosted server. They do the phone-first jobs (signing in, tickets, organiser day-of work) through the [mobile API](/api/mobile-api) and leave everything else to the website. This page describes how each is organised, how to build and test it, how to point it at an instance, and where the two disagree with the server repository.

Facts here come from each repository's `README.md`, `AGENTS.md`, `CLAUDE.md`, `docs/` and build files, read at their current `main`. To write your own client instead, see [Build a client app](/build/client-apps).

## What the apps cover

| | Android | iOS |
| --- | --- | --- |
| Attendee | Sign in (email and password, two-step code, Google), discover, event page, registration, live tickets that work offline, feedback | Sign in (email and password, authenticator MFA), discover and search, event pages, registration forms, live QR tickets, feedback and certificates, add to calendar |
| Organiser | Organisation events, guests, check-in scanner and door station, broadcasts, programme, live delays, closing sign-ups | Events with live counts, guests, day-of controls, offline-capable check-in scanner, broadcasts |
| Not covered | Account creation, event editing, page designers, analytics, instance administration | The same. `docs/IOS_PLAN.md` lists it as "stays on the web" |
| Teams and judging | No module for them | No screens for them |

Neither repository implements the team and judging endpoints that the server's contract now has.

## Android: `yuyu-android`

A Gradle multi-module Kotlin project: Jetpack Compose UI, Hilt, Retrofit with OkHttp, kotlinx.serialization, Room and WorkManager. The module map in its README:

| Module | Holds |
| --- | --- |
| `:app` | `MainActivity`, the Hilt application, top-level navigation and bottom bar (Tickets, Organise, Account), deep links |
| `:core:common` | `AppResult` and `AppError`, dispatchers, `EventTimeFormatter`, `AppearanceMode`, `AppBuildInfo` |
| `:core:designsystem` | `YuyuTheme`, colour, type, spacing and motion tokens, event accent maths, brand components (`DotMark`, `DotLockup`, `DotFace`, `DotLoader`), bundled fonts, a debug gallery |
| `:core:network` | Retrofit APIs, DTOs for the whole contract, error envelope parsing, the runtime base URL, the bearer and refresh authenticator, the SSE ticket client, station clients |
| `:core:database` | Room: cached tickets, the offline check-in roster and queue (schemas exported to `core/database/schemas`) |
| `:core:data` | Repositories, the Keystore-encrypted session store, preferences, the offline check-in sync worker |
| `:feature:auth`, `:feature:attendee`, `:feature:organiser`, `:feature:checkin`, `:feature:broadcasts` | One feature each, exposing a `NavGraphBuilder.xxxGraph(...)` and its routes |

Shared Gradle setup is in `build-logic/` (convention plugins `yuyu.android.application`, `yuyu.android.library`, `yuyu.android.compose`, `yuyu.android.feature`, `yuyu.hilt`), and versions are in `gradle/libs.versions.toml`.

### Architecture

- **MVVM.** Each screen has an immutable `UiState` in a `StateFlow`, collected with `collectAsStateWithLifecycle()`. View models are `@HiltViewModel`.
- **Repositories return `AppResult<T>`** with a typed `AppError` whose `message` is always UI-safe. Server rules are not duplicated beyond UI hints, and `EventPermissions` only hides controls.
- **Feature modules never depend on each other.** To leave a feature, a graph function takes a callback (for example `OrganiserExternalNavigation`), and `:app` wires it.
- **Token refresh** is a `TokenAuthenticator` guarded by a `Mutex`, so parallel `401`s share one refresh. A rejected refresh token clears the session and broadcasts sign-out. A network failure during refresh keeps the session.
- **Base URL at runtime.** Retrofit is built against a placeholder host, and `BaseUrlInterceptor` rewrites requests to the server the user entered, keeping any base path.
- **Secrets.** Tokens, ticket tokens and station PINs are never logged or persisted in clear, and DTOs holding them override `toString()`.
- **Design system first.** Use `YuyuTheme.colors` and `typography`, never hard-coded hex values, and `EventAccentScope(event.accentColor)` only on event-facing screens.

### Requirements, build and test

- JDK 21 (the wrapper downloads Gradle 9.8.1), Android SDK platform `android-37` to compile and build-tools 36, and `local.properties` with `sdk.dir=...`. Minimum Android is 8.0 (API 26), target SDK 36.

```bash
./gradlew assembleDebug          # app/build/outputs/apk/debug/app-debug.apk
./gradlew assembleRelease        # R8-minified release APK
./gradlew testDebugUnitTest      # JVM and Robolectric unit tests
./gradlew lintDebug              # Android lint, errors fail the build
```

Release signing reads `YUYU_KEYSTORE_PATH`, `YUYU_KEYSTORE_PASSWORD`, `YUYU_KEY_ALIAS` and `YUYU_KEY_PASSWORD`. Without them, `assembleRelease` falls back to the debug key, which is fine locally and never for shipping. CI (`.github/workflows/android.yml`) runs the tests and lint on every push to `main`, `feat/**` and `fix/**`, on pull requests and on `v*` tags, then builds the APKs and bundle. `versionCode` is the commit count. See `docs/RELEASING.md` in that repository.

### Point it at an instance

There is nothing to configure in the app. The user types the server address on the "Connect to your Yuyu" screen.

- **Local Yuyu on your computer.** Run Yuyu with `npm run dev` (port 3000), start an emulator with a **debug** build and enter `http://10.0.2.2:3000`. On a physical device, run `adb reverse tcp:3000 tcp:3000` and enter `http://localhost:3000`. Plain `http` is accepted only in debug builds and only for `10.0.2.2`, `localhost` and `127.0.0.1` (`app/src/debug/res/xml/network_security_config.xml`). Release builds are HTTPS-only and trust only system certificate authorities.
- **Your own host for App Links.** The default build verifies links for one host, `yuyu.idliapps.com`. Build for another with `-Pyuyu.appLinkHost=events.example.org`, and set `ANDROID_APP_SHA256_CERT_FINGERPRINTS` on the server.
- **Google sign-in.** It appears only when the server reports it. The same Google Cloud project needs an **Android** OAuth client for package `com.twilighty.yuyu` and the signing certificate's SHA-1. If the server sets `GOOGLE_MOBILE_CLIENT_IDS`, it must include that Android client id, or every Google sign-in fails.
- **Fork the app.** The package `com.twilighty.yuyu` and the default host are the maintainers'. Change both, and the signing keystore, for your own build.

### Testing and contract

`core/network/src/test/.../FixtureContractTest.kt` decodes every fixture in `core/network/src/test/resources/fixtures/` with a strict decoder, so an unknown or renamed field fails the build. When the server adds a fixture, copy it in and add it to the `serializers` map. `TokenAuthenticatorTest` covers refresh and sign-out. Test sources sit in the modules (`core/network`, `core/data`, `core/database`, the `feature` modules and `app`). The workflow in the README: branch per feature (`feat/<name>`), merge back with `--no-ff`, and run the four Gradle commands above before merging.

## iOS: `yuyu-ios`

A SwiftUI app target plus a Swift package, with the Xcode project generated by XcodeGen. It needs macOS with Xcode 26 or newer, and the app targets iOS 18 and up with Swift 6 strict concurrency.

```text
Yuyu/                     the app target
  App/                    YuyuApp, AppModel, Routing, tabs
  Features/<Area>/        screens and view models (Auth, Discover, Event, Tickets,
                          Account, Organiser, CheckIn, Broadcasts, Forms)
  Resources/              Info.plist, assets, fonts
Packages/YuyuKit/         Swift package
  Sources/YuyuKit/        APIClient, Endpoints, Models, SessionStore (Keychain),
                          Mock server, Offline stores, live ticket updates
  Sources/YuyuUI/         design tokens and shared SwiftUI components
  Tests/YuyuKitTests/     package tests with the contract fixtures
YuyuTests/, YuyuUITests/  app unit and UI tests
docs/contract/            the mobile API contract, copied from the Yuyu repo
dev-server/               Docker Compose stack for a local Yuyu server
scripts/                  dev-server.sh, sync-contract.sh, ci/
project.yml               XcodeGen spec (the .xcodeproj is generated, not committed)
```

### Architecture

- **`YuyuKit` is the core.** `Endpoint<Response>` describes a request (method, path, query, body, `Auth` of `.required`, `.optional` or `.none`, and a `Format` of `.envelope` or `.bare` for existing web routes). `APIClient` is an actor that performs it through an `HTTPTransport`. `URLSessionTransport` is used in the app and a mock transport in tests and demo mode.
- **Single-flight refresh.** Concurrent `401`s share one rotation, because reusing a rotated refresh token revokes the session server-side. Only a definitive `401` from `/auth/refresh` signs out. Offline errors, timeouts, `429` and `5xx` are rethrown without ending the session.
- **View models** are `@MainActor @Observable`, and they call the API through `app.send(...)` on the `AppModel` from the environment.
- **Tokens** live only in `SessionStore`, which uses the Keychain. The offline roster contains ticket tokens, so `OfflineRosterStore` writes it with file protection `.complete`. Server HTML renders only in the broadcast preview's `WKWebView`, with JavaScript disabled.
- **Design.** Use `YY.*` tokens, `yyFont`, `.buttonStyle(.yy(...))`, `YYCard`, `StatusChip`, `EmptyState` and `DotLoader`. No raw hex colours, no emoji, SF Symbols for icons, and event screens use the event accent through `AccentPalette`. The design reference is `../yuyu/docs/DESIGN.md`.
- **Ownership rules** in `AGENTS.md`: edit inside your own area, add YuyuKit code in new files, and do not change shared files (`Models.swift`, `Endpoints.swift`, `APIClient.swift`, `DemoState.swift`, `Routing.swift`, `AppModel.swift`, `project.yml`) without agreeing it first.

### Build, run and test

```bash
brew install xcodegen swiftlint
xcodegen generate            # creates Yuyu.xcodeproj from project.yml
open Yuyu.xcodeproj          # choose the Yuyu scheme and an iPhone simulator, then Run
```

Run `xcodegen generate` again whenever files are added or removed. Tests and lint, as CI runs them:

```bash
scripts/ci/run-all.sh                      # select Xcode, generate, lint, package tests, app tests
scripts/ci/test-package.sh                 # fast YuyuKit tests, no simulator
SKIP_UI_TESTS=1 scripts/ci/test-app.sh     # app unit tests only
(cd Packages/YuyuKit && swift test)        # package tests directly
swiftlint
```

`.github/workflows/ci.yml` runs on every push and pull request, and `release.yml` builds an unsigned `.ipa` on `v*` tags. The app has no paid-developer-account setup: free signing cannot use Associated Domains or push, so links use the `yuyu://` scheme for now. `docs/SIDELOADING.md` describes installing on a phone with a free Apple ID or SideStore and AltStore.

### Point it at an instance

- **Demo mode** needs no server. Tap **Try the demo** on the first screen. A mock server inside the app behaves like the real API. Demo accounts are `demo@yuyu.app` and `mfa@yuyu.app` (both with password `yuyu-demo`, MFA code `123456`). UI tests launch into it with `-uiTestingDemo -signedIn`.
- **A real server.** Enter its address (for example `events.example.org`) on the first screen. The app calls `GET /api/mobile/v1/auth/config` before showing sign-in. To change server later, sign out and choose **Change server**. Plain `http` is allowed only for local-network development servers.
- **A local server on your Mac, reachable from a phone.** The `dev-server` stack runs Yuyu with PostgreSQL, Redis, MinIO and Mailpit in Docker Compose project `yuyu-ios-dev`, behind a Cloudflare quick tunnel.

### The dev server

```bash
scripts/dev-server.sh up       # generates secrets, builds images (5 to 10 minutes), migrates, starts
scripts/dev-server.sh seed     # demo organisations, events and accounts (safe to re-run)
scripts/dev-server.sh status   # containers, the public URL, Mailpit
scripts/dev-server.sh logs     # follow app logs (or: logs mailpit | postgres | tunnel)
scripts/dev-server.sh down     # stop everything, data is kept
```

Also available: `tunnel`, `tunnel --new`, `totp`, `build` and `reset` (which deletes the database, and asks first). Requirements are Docker Desktop or OrbStack, `cloudflared`, and about 4 GB of free memory for the first build. The server image is built from `../yuyu` (override with `YUYU_REPO`) with Yuyu's own `Dockerfile`, as it is on disk, including uncommitted changes. The database is named `yuyu_e2e_ios`, and the seed refuses any database whose name lacks `yuyu_e2e`. `NEXT_PUBLIC_BASE_URL` is inlined at build time, so the stack handles the changing tunnel URL itself (see `docs/LOCAL_SERVER.md`). The seeded accounts all use the password `Demo-pass-2026`: `organiser@example.com`, `attendee@example.com`, `mfa@example.com`, `volunteer@example.com` and `unverified@example.com`. Outbound mail goes to Mailpit at `http://127.0.0.1:8325`, and Yuyu's outbox worker delivers it within about a minute.

The compose file mirrors Yuyu's `compose.staging.yml` and sets `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1` to allow non-TLS services on its private network. Never reuse it for real data.

### Contract

`scripts/sync-contract.sh [path-to-yuyu]` copies `docs/mobile-api.openapi.yaml` and `docs/MOBILE_API.md` into `docs/contract/` and the fixtures into `Packages/YuyuKit/Tests/YuyuKitTests/Fixtures/`. `ContractTests` decodes every fixture, so a server change fails the package tests first. The rule in `AGENTS.md` is that the contract is authoritative: never invent fields or endpoints, and when the app needs something the contract lacks, raise it and change the server repository instead.

## Contributing to the apps

Both repositories follow a feature-branch flow, keep UI text UI-safe, and ask you to read their agent guidance first: `README.md` and the module map on Android, `AGENTS.md` on iOS (`CLAUDE.md` there only points to `AGENTS.md`). A change to the API contract starts in the Yuyu repository (see [Extend the APIs](/guides/extend-the-apis)), then both apps pick up the new spec and fixtures.

::: warning Differences to know about
- **Stale contract copies.** Each app keeps its own copy of the contract, and the copies lag the Yuyu repository. The Android OpenAPI file is identical to the server's, but its fixtures (in `docs/mobile-api-fixtures/` and the test resources) lack the team and judging files (`team.json`, `teams.json`, `my-team.json`, `judge-*.json`, `judging-criteria.json`, `error-team-member.json`) and several shared fixtures differ. The iOS spec and fixtures differ from the server's as well. Run the sync before you add a feature.
- **Dev-server branch check.** `scripts/dev-server.sh` expects the Yuyu checkout to be on branch `v1-design-overhaul` and only warns otherwise. Yuyu's `AGENTS.md` says that branch was retired after the V1 release, so use `main` and ignore the warning.
- **Two sets of demo accounts.** Demo mode inside the app (`demo@yuyu.app`) and the seeded dev server (`organiser@example.com` and others) are separate.
:::

## Further reading

- [Build a client app](/build/client-apps)
- [Mobile API](/api/mobile-api)
- [Auth and sessions](/architecture/auth-and-sessions)
- [Tickets and check-in](/features/tickets-and-check-in) and [Realtime check-in](/architecture/realtime)
- `yuyu-android`: `README.md`, `docs/RELEASING.md`, `docs/MOTION.md`
- `yuyu-ios`: `README.md`, `AGENTS.md`, `docs/IOS_PLAN.md`, `docs/LOCAL_SERVER.md`, `docs/RELEASING.md`, `docs/SIDELOADING.md`
