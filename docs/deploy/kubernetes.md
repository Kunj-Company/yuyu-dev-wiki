# Kubernetes with Helm

The chart in `charts/yuyu/` (chart `0.1.0`, `kubeVersion >=1.25.0-0`) deploys the Yuyu application as a Deployment with a Service, optional Ingress, HPA and PodDisruptionBudget, and a Helm hook Job that runs database migrations. It does not deploy PostgreSQL, Redis, storage or SMTP, and it creates no Secret and no NetworkPolicy. The value table is in [Deployment](/reference/deployment#helm-chart). This page walks through an install and an upgrade.

## What the chart renders

| Template | Object | Condition |
| --- | --- | --- |
| `deployment.yaml` | Deployment `<release>-yuyu`, one container on port 3000 | Always |
| `service.yaml` | Service, `ClusterIP`, port 80 to the named port `http` | Always |
| `ingress.yaml` | Ingress | `ingress.enabled` |
| `hpa.yaml` | HorizontalPodAutoscaler (`autoscaling/v2`), CPU and memory | `autoscaling.enabled` |
| `poddisruptionbudget.yaml` | PodDisruptionBudget (`policy/v1`) | `podDisruptionBudget.enabled` |
| `migration-job.yaml` | Job `<release>-yuyu-migrate`, a `pre-install,pre-upgrade` hook | `migration.enabled` (default `true`) |

Object names are `<release>-yuyu` unless you set `fullnameOverride`. With release name `yuyu` the Deployment is `yuyu-yuyu`. Set `fullnameOverride: yuyu` for shorter names.

Pods run as uid 1001 (`runAsNonRoot`, `seccompProfile: RuntimeDefault`), with privilege escalation off and all capabilities dropped. The chart sets only `NODE_ENV`, `PORT` and `HOSTNAME` itself. Everything else comes from the runtime Secret.

## 1. Images

Publish two images from one commit with one immutable tag: the `runner` target (application) and the `migrator` target. See [Docker on a single host](/deploy/docker#1-get-the-images) for build commands, or [CI/CD](/deploy/ci-cd) for automated publishing. The chart defaults point at `ghcr.io/your-org/...` placeholders and a blank tag falls back to the chart `appVersion` (`0.1.0`), so always set both repositories and both tags.

If the registry is private, create a pull secret and list it under `imagePullSecrets`. It applies to the app pods and the migration Job.

## 2. The runtime Secret

Create the namespace and a Secret outside Helm. It must hold every production variable. The chart mounts it with `envFrom` on the app pods and on the migration Job, so they all share one `MFA_ENCRYPTION_KEY`.

```bash
kubectl create namespace yuyu
kubectl -n yuyu create secret generic yuyu-runtime --from-env-file=/secure/path/yuyu.env
```

`yuyu-runtime` is the chart's default `existingSecret`. For a real cluster prefer External Secrets or Sealed Secrets, and never commit the manifest. The variables are the same as in [Docker on a single host](/deploy/docker#2-write-the-environment-file). Two differences:

- The Secret must contain `HEALTHCHECK_SECRET`, because the readiness probe reads it from the container environment.
- `--from-env-file` takes `KEY=value` lines. Check how your tooling treats quotes before reusing a file written for another tool.

`envFrom` is read once at pod start. After changing the Secret, restart every pod together (`kubectl -n yuyu rollout restart deployment/yuyu-yuyu`). A pod holding a different `MFA_ENCRYPTION_KEY` still starts and passes probes, but email, Google sign-in, alerts and MFA fail on it.

SMTP, Google sign-in and the alert webhook saved in Super admin, Settings are stored in PostgreSQL and read on each send or sign-in, so they reach every replica with no rollout.

## 3. A values file

Keep `values-production.yaml` outside source control. This is an example, adapted from the chart README. Replace the registry, tag and host:

```yaml
# Example only
fullnameOverride: yuyu

image:
  repository: registry.example.com/yuyu
  tag: "VERSION"
migration:
  image:
    repository: registry.example.com/yuyu-migrator
    tag: "VERSION"
  checkInstanceSecrets: true

imagePullSecrets:
  - name: registry-pull

ingress:
  enabled: true
  className: nginx
  annotations:
    # The live ticket stream must not be buffered.
    nginx.ingress.kubernetes.io/proxy-buffering: "off"
    nginx.ingress.kubernetes.io/proxy-read-timeout: "60"
  hosts:
    - host: events.example.com
      paths:
        - path: /
          pathType: Prefix
  tls:
    - secretName: events-example-com-tls
      hosts: [events.example.com]

autoscaling:
  enabled: true
  minReplicas: 2
  maxReplicas: 6

podDisruptionBudget:
  enabled: true
  minAvailable: 1
```

The default `ingress.hosts` is `events.dev.idliapps.com`. Overriding `hosts` replaces the whole list. `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` in the Secret must be the same HTTPS origin as the ingress host. The chart does not provision TLS certificates. `tls[].secretName` must exist, for example through cert-manager.

### Ingress annotations and the ticket stream

`GET /api/ticket/:token/events` is a long-lived `text/event-stream`. The route sends `X-Accel-Buffering: no` and a heartbeat comment every 25 s, but the ingress must not buffer it and must allow idle reads of at least 30 s. Otherwise an open ticket tears only on its 15 s status poll.

The chart's `ingress.annotations` is empty by default. The two ingress-nginx annotations above are the ones the chart documents. They apply to every path on the host, which is harmless for Yuyu's other responses. To scope them, serve `/api/ticket/` from a separate Ingress object. Other controllers (Traefik, cloud load balancers) need their own unbuffered-streaming and idle-timeout settings, and the repository does not document those. More in [Reverse proxy and TLS](/deploy/reverse-proxy).

The chart does not configure the trusted client-IP header. Your ingress controller or the edge in front of it must overwrite the header named by `TRUSTED_PROXY_IP_HEADER`. See [Reverse proxy and TLS](/deploy/reverse-proxy#trusted-proxy-ip-header).

## 4. Install

```bash
helm lint charts/yuyu
helm upgrade --install yuyu charts/yuyu \
  --namespace yuyu --create-namespace \
  --values /secure/path/values-production.yaml \
  --wait --timeout 10m

kubectl -n yuyu rollout status deployment/yuyu-yuyu
```

On a first install the hook Job runs before the Deployment exists. A failed migration therefore blocks the install.

## Migration hook

`templates/migration-job.yaml` is a Helm hook with these annotations:

| Annotation | Value |
| --- | --- |
| `helm.sh/hook` | `pre-install,pre-upgrade` |
| `helm.sh/hook-weight` | `-5` |
| `helm.sh/hook-delete-policy` | `before-hook-creation,hook-succeeded` |

It uses the `migration.image`, runs as uid 1001 with capabilities dropped, and gets the same `envFrom` Secret. `backoffLimit` is `1` and `activeDeadlineSeconds` is `300`.

| Setting | Command the Job runs |
| --- | --- |
| `migration.checkInstanceSecrets: false` (default) | `npx prisma migrate deploy` |
| `migration.checkInstanceSecrets: true` | `sh -c "npx prisma migrate deploy && node scripts/check-instance-secrets.mjs"` |

Turn `checkInstanceSecrets` on. The release then fails before any pod rolls if `MFA_ENCRYPTION_KEY` cannot decrypt secrets already saved in the panel. It needs a migrator image built from this repository's Dockerfile at a version that copies the script.

A successful Job is deleted. A failed one stays so you can read its logs:

```bash
kubectl -n yuyu get jobs
kubectl -n yuyu logs job/yuyu-yuyu-migrate
```

The Job needs only PostgreSQL and DNS egress. Set `migration.enabled: false` only if you run migrations some other way.

::: warning One Secret means one DATABASE_URL
The release notes for some upgrades suggest a lock timeout on the migrator's `DATABASE_URL` only (see [Operations](/deploy/operations#upgrades-and-rollback)). The chart gives the Job and the app pods the same Secret and has no per-Job environment override, so it cannot do this. To use a lock timeout, set `migration.enabled: false` and run the migrator yourself as a one-off Job with its own Secret, before `helm upgrade`. The repository does not ship that manifest.
:::

## Probes

| Probe | Check | Timing |
| --- | --- | --- |
| Startup | `GET /api/health` | every 5 s, up to 30 failures |
| Liveness | `GET /api/health` | every 20 s, timeout 3 s, 3 failures |
| Readiness | `exec`: `node -e` fetches `http://127.0.0.1:3000/api/health/db` with `Authorization: Bearer ${HEALTHCHECK_SECRET}` | every 15 s, timeout 5 s, 3 failures |

Liveness has no dependencies. Readiness checks PostgreSQL. A pod whose database check fails leaves the Service without being restarted. Redis health is not part of any probe, so monitor it separately.

## Replicas, HPA and PDB

- With `autoscaling.enabled: true` the HPA owns the replica count and the Deployment omits `replicas`, so upgrades do not reset it. Defaults: 2 to 6 replicas, 70% CPU, 75% memory (both targets are always set). The HPA needs a metrics source in the cluster.
- Multiple replicas need one shared `REDIS_URL` (`rediss://`). Rate limits and live check-in pub/sub go through it.
- Every pod runs its own outbox worker. Row claims make that safe.
- `podDisruptionBudget.minAvailable: 1` only helps with two or more replicas. With one replica it blocks voluntary evictions such as node drains.
- Default resources are requests 500m CPU and 1Gi memory, limits 2 CPU and 4Gi. The release notes advise keeping the 4 GiB limit: large-event dashboards can peak around 1.4 GB under concurrent load.
- `nodeSelector`, `tolerations` and `affinity` are passed straight through to the pod spec. The chart sets no default anti-affinity.

## Egress

The chart creates no NetworkPolicy. Under a default-deny egress policy, allow app pods to reach:

- PostgreSQL, Redis and object storage
- the SMTP relay (typically TCP 465 or 587)
- `accounts.google.com`, `oauth2.googleapis.com` and `www.googleapis.com` over HTTPS, when Google sign-in is enabled
- the alert webhook host (HTTPS 443)
- organisation webhook receivers (443 and 8443)
- DNS

## Upgrade

1. Complete the [production checklist](/deploy/production-checklist) items that apply, and read the release's migration notes.
2. Back up the database and record the current image tag and Helm revision (`helm -n yuyu history yuyu`).
3. Update the image tags in your values file.
4. Run the upgrade:

   ```bash
   helm upgrade --install yuyu charts/yuyu --namespace yuyu \
     --values /secure/path/values-production.yaml --wait --timeout 10m
   ```

5. Verify readiness, the outbox heartbeat, a test email and error rates.

The default strategy is `RollingUpdate` with `maxUnavailable: 0` and `maxSurge: 1`, so for a short time the old and new release run together.

::: warning Old and new releases side by side
For a release whose notes forbid overlap, deploy with `--set updateStrategy.type=Recreate --set updateStrategy.rollingUpdate=null`. This causes a short outage. Helm merges maps, so `rollingUpdate` must be cleared explicitly. The previous release's outbox worker marks email kinds it does not know as `FAILED`. The new release requeues such rows once, for those created in the last 7 days.
:::

## Rollback

```bash
helm -n yuyu rollback yuyu REVISION --wait
```

This restores the previous manifests and image. The chart defines only `pre-install` and `pre-upgrade` hooks, so a rollback runs no migration Job and reverses nothing in the database. Image-only rollback is safe only while the database holds no data the old release cannot read. Otherwise restore the pre-upgrade backup. Details are in [Operations](/deploy/operations#upgrades-and-rollback).

A failed migration is not a rollback case. It rolled back atomically. Fix the cause and run the upgrade again.

## Further reading

- [Reverse proxy and TLS](/deploy/reverse-proxy), [Operations runbook](/deploy/operations), [Production checklist](/deploy/production-checklist)
- [Deployment](/reference/deployment), [Configuration](/reference/configuration)
- `charts/yuyu/README.md` and `charts/yuyu/values.yaml` in the repository
