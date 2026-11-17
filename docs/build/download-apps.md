# Download the mobile apps (alpha)

Yuyu has an Android app and an iOS app. Both are companion apps for a self-hosted Yuyu server, and both are at an early stage.

::: danger Alpha software. Use at your own risk.
These apps are **alpha builds and are not stable**. They can crash, behave in unexpected ways, lose locally stored data (such as an offline check-in queue) and change without notice. They come with no warranty and no support. Do not rely on them to run a real event, to check people in at a real door, or to hold tickets you cannot afford to lose. Try them against a test server first. You install and use them entirely at your own risk.
:::

## What you need

- A running Yuyu server that you can reach from the phone. The app asks for the server's address when you open it, and there is no default server. See [Deploy Yuyu](/deploy/overview) or [Local setup](/start/local-setup).
- A server version that supports the [mobile API](/api/mobile-api). The apps and the server change together, so an older or newer server may not work with a given build.

## Android

The code is in the public repository [Kunj-Company/yuyu-android](https://github.com/Kunj-Company/yuyu-android). It needs Android 8.0 (API 26) or newer.

| Build | What it is | Download |
| --- | --- | --- |
| **Yuyu 0.1.0** | The first tagged release | [Release page](https://github.com/Kunj-Company/yuyu-android/releases/tag/v0.1.0) |
| **Latest build** | A pre-release that is rebuilt from the `main` branch, so it is the newest and the least tested | [Release page](https://github.com/Kunj-Company/yuyu-android/releases/tag/latest) |

Each release page lists these files:

| File | Use it for |
| --- | --- |
| `…-release.apk` | Installing on a phone. This is the one most people want. It is about 24 MB. |
| `…-debug.apk` | Installing a debug build, which is larger (about 49 MB) and meant for developers. |
| `…-release.aab` | An Android App Bundle (about 19 MB). It is for app stores and cannot be installed directly. |
| `SHA256SUMS.txt` | Checksums, so you can check a download. |

**Install it:**

1. Download the `release.apk` file on the phone, or copy it there.
2. Open it. Android asks you to allow installs from that source (your browser or file manager). This is a setting you turn on yourself, and you can turn it off again afterwards.
3. Open Yuyu and enter your server's address.

To check a download first, compare its checksum with the one in `SHA256SUMS.txt`:

```bash
shasum -a 256 yuyu-0.1.0-release.apk
```

## iOS

The code is in the repository [Kunj-Company/yuyu-ios](https://github.com/Kunj-Company/yuyu-ios), which is **private**. Unless you have been given access, that link shows a "not found" page.

**There is no iOS build to download yet.** No release has been published. The repository has a workflow that can build an unsigned `.ipa` file when a version tag is pushed, but it has not produced a published release. The app is also not on the App Store or TestFlight.

If you have access to the repository, you can build it from source and install it on your own device. Its `docs/SIDELOADING.md` describes installing with a free Apple ID or with SideStore or AltStore. Build and test steps are in [Android and iOS apps](/build/mobile-apps#ios-yuyu-ios).

## Reporting problems

Because these are alpha builds, bugs are expected. For Android, open an issue in the [yuyu-android repository](https://github.com/Kunj-Company/yuyu-android/issues), and say which build you used and what your server's version is. Please do not include server addresses, tokens or other private details in a public issue.

## Build it yourself

If you would rather not install a prebuilt file, you can build either app from source. [Android and iOS apps](/build/mobile-apps) lists the requirements, the build commands and how each app is organised. To write a different client, see [Build a client app](/build/client-apps).
