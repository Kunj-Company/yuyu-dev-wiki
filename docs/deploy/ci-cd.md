# CI/CD and image publishing

The repository has three GitHub Actions workflows in `.github/workflows/`. Two run checks. The third publishes the two container images after the main check passes. None of them deploys anything or runs migrations against a server. Getting an image onto a host and migrating the database remain manual release steps. See [Docker on a single host](/deploy/docker) and [Kubernetes with Helm](/deploy/kubernetes).

## The workflows at a glance

| File | Workflow name | Triggers | Purpose |
| --- | --- | --- | --- |
| `ci.yml` | `CI` | Pull requests, pushes to `main` | Lightweight checks and a migration integrity job |
| `quality.yml` | `Quality gate` | Pull requests, pushes to `main` | The full gate: audit, migrations, tests, preflight, build, container smoke test, browser tests |
| `publish-images.yml` | `Publish Docker Hub images` | `workflow_run` of `Quality gate` completing on `main` | Builds and pushes `yuyu` and `yuyu-migrator` |

All three set `permissions: contents: read`.

Only `Quality gate` gates publishing. A green `CI` run does not trigger it.

## Quality gate (`quality.yml`)

One job, `verify`, on `ubuntu-latest` with Node 20. It starts `postgres:16-alpine` (database `yuyu_ci`) and `redis:7-alpine` as service containers and sets CI-only environment values, including `ALLOW_INSECURE_PRODUCTION_TESTS=1` (the smoke-test container adds `CI=true`). The job runs these steps in order:

| Step | Command |
| --- | --- |
| Install | `npm ci` |
| Dependency audit | `npm audit --omit=dev` (fails on any production advisory) |
| Migrate | `npm run db:deploy` |
| Schema contract | `npm run db:verify` |
| Drift check | `npx prisma migrate diff --from-url "$DATABASE_URL" --to-schema-datamodel prisma/schema.prisma --exit-code` |
| Lint | `npm run lint` |
| Types | `npx next typegen && npx tsc --noEmit` |
| Unit tests | `npm run test:unit` |
| Coverage | `npm run test:coverage` |
| Integration tests | `npm run test:integration` |
| Env preflight | `npm run production:check` |
| Build | `npm run build` |
| Docker build | `docker build` of the `runner` target with the Server Actions key as a BuildKit secret |
| Container smoke test | Runs the image with host networking, polls `/api/health` for up to 30 retries, and checks that `sharp` loads inside it |
| Browser tests | Installs Chromium and runs `npm run test:e2e:production`, with `TRUSTED_PROXY_IP_HEADER=cf-connecting-ip` and `WEBHOOKS_ALLOW_PRIVATE_TARGETS=1` |

The environment values in this workflow (`AUTH_SECRET`, `MFA_ENCRYPTION_KEY` and so on) are throwaway CI constants, not secrets. The run needs no repository secrets or variables.

The gate runs the same production preflight and schema checks you run at release time, so a green run is a reasonable precondition for deploying a commit.

## CI (`ci.yml`)

Two jobs, both on Node 20:

| Job | What it does |
| --- | --- |
| `quality` (15 min timeout) | `npm ci`, `npx prisma validate`, lint, typecheck, `npm run test:unit`, `npm run build` with placeholder values, and `npm audit --omit=dev --audit-level=high` |
| `migration-integrity` (10 min timeout) | Starts `postgres:16-alpine`, then runs `npm run db:deploy` and `npm run db:verify` against it |

This workflow overlaps with the Quality gate. It runs on the same triggers but does not feed publishing.

::: warning Node versions differ
Both check workflows run on Node 20. The `Dockerfile` builds and runs on `node:22-alpine`. The container smoke test in the Quality gate is what exercises the real runtime image.
:::

## Publish Docker Hub images (`publish-images.yml`)

### When it runs

It fires when a `Quality gate` run completes on `main`. The `publish` job runs only if the triggering run:

- concluded `success`,
- was a `push` event, so pull requests never publish, and
- came from this repository's own branch, not a fork, so credentials never reach untrusted code.

A concurrency group per commit SHA stops two publishes of the same commit running at once, without cancelling one in progress. The job has a 90 minute timeout. The workflow file must be on the default branch for `workflow_run` to fire.

### What it does

1. Checks out the exact tested commit (`workflow_run.head_sha`) without persisting credentials.
2. Validates its settings: every one of `DOCKERHUB_USERNAME`, `DOCKERHUB_NAMESPACE`, `DOCKERHUB_TOKEN`, `NEXT_PUBLIC_BASE_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` must be non-empty. The namespace must be lowercase (`^[a-z0-9][a-z0-9_-]*$`). `NEXT_PUBLIC_BASE_URL` must be an HTTPS origin with no path or trailing slash. The Server Actions key must be valid base64 for a 16, 24 or 32 byte AES key.
3. Sets up QEMU and Buildx and logs in to Docker Hub.
4. Builds and pushes the `migrator` target as `<namespace>/yuyu-migrator:<tag>` for `linux/amd64` and `linux/arm64`.
5. Builds and pushes the `runner` target as `<namespace>/yuyu:<tag>` for the same platforms. It passes `NEXT_PUBLIC_BASE_URL` as a build argument, the Server Actions key as a BuildKit secret, and `no-cache-filters: builder` so a changed secret is never served from a stale cache.
6. Writes both tags and both immutable digest references to the job summary.

The tag is `sha-<commit>-<run id>-<attempt>`. Every attempt gets a unique tag, and no `latest` tag is created. Treat a release as ready only when the whole job succeeds. If the second build fails, the first image may already exist.

### Required settings

In GitHub, open **Settings, Secrets and variables, Actions**.

| Kind | Name | Value |
| --- | --- | --- |
| Variable | `DOCKERHUB_USERNAME` | Docker Hub login that owns the token |
| Variable | `DOCKERHUB_NAMESPACE` | Account or organisation owning both repositories |
| Variable | `NEXT_PUBLIC_BASE_URL` | Production HTTPS origin, for example `https://events.example.com`, no trailing slash |
| Secret | `DOCKERHUB_TOKEN` | Token with Read and Write access to both repositories |
| Secret | `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` | Your instance's stable base64 AES key |

One-time setup on the registry side:

1. Create two **private** repositories, `yuyu` and `yuyu-migrator`, under the same namespace. The application image contains instance-specific Server Actions material, so restrict access to trusted operators.
2. Create a read and write token for publishing, and a separate read-only token for the deployment server.

Generate the Server Actions key once (`openssl rand -base64 32`) and store the same value in GitHub and in the deployment's runtime environment. For an existing instance reuse its key. Do not generate a new one for every build. `MFA_ENCRYPTION_KEY` is separate and is not used by this workflow. Production database, Redis, SMTP and S3 credentials stay on the server and never go into the build workflow.

### Retry and rebuild

- **Re-run failed jobs** retries a failed publication.
- To rebuild after changing a variable such as `NEXT_PUBLIC_BASE_URL`, re-run a successful `Quality gate` run that was triggered by a push to `main`. Its completion triggers publishing again. Choose the intended source commit.
- A new hostname needs a new image, because the origin is compiled in.

### Build secret handling

The Dockerfile reads the Server Actions key from a BuildKit secret mount, which keeps it out of build-argument metadata. Next.js still compiles the key into the application, so the image is not safe to publish publicly. Keep the repositories private.

## Using the published images

The workflow builds and pushes. It does not contact the server. The handoff is manual:

1. Take the tags (or the pinned digest references) from the job summary.
2. Pull both images on the host, or put the tags into your Helm values. The chart builds the image reference as `<repository>:<tag>`.
3. Run the migrator, then replace the app, as in the deployment guides.

## Adapting to GHCR or another registry

The chart's defaults already point at `ghcr.io/your-org/...`, but the workflow only knows Docker Hub. To publish somewhere else, change `publish-images.yml`. The edits below are an example. The repository does not ship a GHCR variant, and you should test it on a fork first.

| Part of the workflow | Docker Hub today | For GHCR (example) |
| --- | --- | --- |
| Job permissions | `contents: read` | Add `packages: write` |
| Login action | `docker/login-action` with `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` | Same action with `registry: ghcr.io`, <code v-pre>username: ${{ github.actor }}</code>, <code v-pre>password: ${{ secrets.GITHUB_TOKEN }}</code> |
| Tag prefix | <code v-pre>${{ env.DOCKERHUB_NAMESPACE }}/yuyu...</code> | `ghcr.io/<lowercase owner>/yuyu...` |
| Settings validation | Requires the five Docker Hub settings | Drop `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` from the check. Keep `NEXT_PUBLIC_BASE_URL` and `NEXT_SERVER_ACTIONS_ENCRYPTION_KEY` |
| Deployment pull credential | Read-only Docker Hub token | A GitHub token or deploy credential with `read:packages`, supplied as `imagePullSecrets` on Kubernetes |

A minimal example of the login and tag changes:

```yaml
# Example only
permissions:
  contents: read
  packages: write

# ...
      - name: Log in to GHCR
        uses: docker/login-action@v4
        with:
          registry: ghcr.io
          username: ${{ github.actor }}
          password: ${{ secrets.GITHUB_TOKEN }}

      - name: Build and push application image
        uses: docker/build-push-action@v7
        with:
          tags: ghcr.io/${{ github.repository_owner }}/yuyu:${{ env.IMAGE_TAG }}
          # keep context, target, platforms, build-args, secret-envs and no-cache-filters as they are
```

GHCR requires lowercase image names, so a mixed-case owner needs lowercasing. For any other registry, keep the same structure: log in, push both targets with one shared immutable tag, and record the digests.

Whatever registry you use, keep what the existing workflow gets right:

- publish only after a green `Quality gate` on `main` from the same repository,
- never publish from pull requests or forks,
- one immutable tag per attempt for both images, with no `latest`,
- the Server Actions key as a secret mount, never a build argument, and
- private repositories.

## Further reading

- [Deployment](/reference/deployment#docker-hub-publishing), [Testing](/reference/testing)
- [Docker on a single host](/deploy/docker), [Kubernetes with Helm](/deploy/kubernetes), [Production checklist](/deploy/production-checklist)
- [docs/DOCKERHUB_ACTIONS.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DOCKERHUB_ACTIONS.md)
