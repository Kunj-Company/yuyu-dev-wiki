# Reverse proxy and TLS

The Yuyu container speaks plain HTTP on port 3000. It does not terminate TLS. In production something in front of it must: a reverse proxy on the host, a Kubernetes ingress, a CDN or a load balancer. That edge has three jobs the application depends on: terminate HTTPS, overwrite the client-IP header that `TRUSTED_PROXY_IP_HEADER` names, and leave the live ticket stream unbuffered. This page covers each, with example configurations.

::: warning The configurations below are examples
The repository ships one proxy configuration, the nginx block in `docs/DEPLOYMENT_STAGING.md`. The production nginx and Caddy files here are written for this wiki, follow the documented requirements, and have not been tested against your environment. Adapt them and verify the behaviour as shown in [Verify](#verify).
:::

## TLS

- The app does not serve TLS and the repository has no certificate tooling. Use your platform's certificate management or a tool such as Certbot (the staging host uses it).
- `AUTH_URL` and `NEXT_PUBLIC_BASE_URL` must be the same HTTPS origin. Production startup and `production:check` reject `http` and a mismatch. (The CI-only exception needs `CI=true` with `ALLOW_INSECURE_PRODUCTION_TESTS=1` and is never for deployed environments.)
- Public links are built from `NEXT_PUBLIC_BASE_URL`, not from request headers. In production that variable is required, so forwarded `Host` or `X-Forwarded-Proto` values do not decide the origin of generated links.
- Production responses carry HSTS (`max-age=63072000; includeSubDomains; preload`). Do not serve the hostname over plain HTTP other than to redirect.
- Pass the original `Host` through. Server Actions default to same-origin requests. Set `ALLOWED_ACTION_ORIGINS` (a comma-separated list of trusted hosts) only when a CDN or proxy uses a different host for Server Action requests.
- Keep the container port private. Bind it to `127.0.0.1`, or use a private network, so nobody can reach the app without passing through the proxy. See [Docker on a single host](/deploy/docker#5-start-the-application).
- Changing the public hostname needs a rebuild. Update DNS, TLS, proxy, scheduler and monitor targets together and keep an HTTPS redirect from the old host. See [Configuration](/reference/configuration).

If Cloudflare proxies the app, disable Email Address Obfuscation for the hostname. Yuyu sends `Cache-Control: no-transform` on HTML so Cloudflare does not inject its unsigned email-decoder script into pages protected by the nonce-based CSP.

## TRUSTED_PROXY_IP_HEADER

`TRUSTED_PROXY_IP_HEADER` is required in production and must be exactly one of `cf-connecting-ip`, `x-forwarded-for` or `x-real-ip`. The application reads the client address from that one header only (`getClientIpFromHeaders` in `lib/rateLimit.ts`):

| Value | How the address is read |
| --- | --- |
| `x-forwarded-for` | The **first** comma-separated entry, trimmed |
| `x-real-ip` | The whole value, trimmed |
| `cf-connecting-ip` | The whole value, trimmed |
| Header missing or empty on a request | The client is treated as `unknown` |

The address keys the per-IP rate limits: sign-in (10 attempts a minute per IP), public ticket status and event streams, short-link lookups, mobile token refresh, browser crash reports and others. See [Configuration](/reference/configuration) for the buckets.

What follows from that:

1. **The edge must overwrite the header.** Set it to the address the edge saw. Never append to a value the client sent. With `x-forwarded-for`, appending (for example nginx's `$proxy_add_x_forwarded_for`) leaves the client's own first entry in place, so a client can pick its own rate-limit identity.
2. **A header the edge does not set puts every visitor in one bucket.** Everyone then shares one per-IP identity, so real users are throttled together, and sign-in allows only 10 attempts a minute for the whole site. Pick the header your edge really sets.
3. **Block direct access to the origin.** The application trusts the header unconditionally. If clients can reach port 3000, or the pod, directly, they can send any value.

Choosing a value:

| Your edge | Use | Edge must |
| --- | --- | --- |
| Cloudflare in front (with or without a proxy behind it) | `cf-connecting-ip` | Be the only path to the origin. Cloudflare sets this header |
| nginx or Caddy as the only edge | `x-real-ip` or `x-forwarded-for` | Overwrite that header with the connecting address |
| A CDN or load balancer in front of nginx | The header the CDN overwrites | Pass it through unchanged, and still block direct access |

The Quality gate e2e run uses `cf-connecting-ip` so each browser context gets its own address. Staging uses `x-forwarded-for`.

## Live ticket stream and buffering

`GET /api/ticket/:token/events` is a Server-Sent Events stream. It tears an attendee's open ticket the moment they are checked in. What the route does (`app/api/ticket/[token]/events/route.ts`):

| Behaviour | Value |
| --- | --- |
| Content type | `text/event-stream; charset=utf-8` |
| Response headers | `Cache-Control: no-store, no-transform`, `X-Accel-Buffering: no`, `Connection: keep-alive` |
| Heartbeat | A `: ping` comment every 25 s |
| Maximum stream life | 10 minutes. The browser's `EventSource` reconnects |
| Events | An initial `state`, then one `checked-in`, then the stream closes. Already checked-in tickets get one `state` event and close |
| Rate limit | 60 connections per IP per minute (`ticketEvents`) |
| Process ceiling | 5,000 open streams per process. Over that, the route answers 503 |
| Unknown or malformed token | Empty 404 |

The requirements on your proxy:

1. **Do not buffer** `text/event-stream` responses for `/api/ticket/`. `X-Accel-Buffering: no` tells nginx not to, but configure it explicitly anyway. The source's own guidance is `proxy_buffering off` for nginx.
2. **Allow idle reads of at least 30 seconds.** The heartbeat is every 25 s, so a 60 s read timeout (what the docs and chart use) leaves headroom.
3. **Share Redis between replicas.** Check-in notifications travel between replicas through Redis pub/sub, and the subscription is keyed by registration id, not by ticket token. The repository documents no sticky-session requirement.

If any of this is wrong the site still works, but the ticket tears only at the page's 15 s status poll (`ticketStatus`, 120 reads per IP per minute).

For ingress-nginx, the chart documents `nginx.ingress.kubernetes.io/proxy-buffering: "off"` and `nginx.ingress.kubernetes.io/proxy-read-timeout: "60"`. See [Kubernetes with Helm](/deploy/kubernetes#ingress-annotations-and-the-ticket-stream). Other controllers need their own equivalents. The repository does not document them.

## Upload size

Server Actions accept bodies up to 6 MB (`bodySizeLimit: "6mb"` in `next.config.ts`). The proxy's request-body limit must be at least that, or uploads fail at the edge. nginx's default `client_max_body_size` is 1 MB. The examples below use 8 MB, which is an example choice.

## Example: nginx

An example for a host where nginx terminates TLS and the container is published on `127.0.0.1:3000`. Set `TRUSTED_PROXY_IP_HEADER=x-real-ip` in `yuyu.env`. Certificate paths and the hostname are placeholders.

```nginx
# Example only. Not shipped or tested by the Yuyu repository.
server {
    listen 80;
    server_name events.example.com;
    return 301 https://$host$request_uri;
}

server {
    listen 443 ssl;
    http2 on;
    server_name events.example.com;

    ssl_certificate     /etc/ssl/yuyu/fullchain.pem;
    ssl_certificate_key /etc/ssl/yuyu/privkey.pem;

    client_max_body_size 8m;

    # Live ticket stream: never buffer, allow idle reads longer than the 25 s heartbeat.
    location /api/ticket/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_buffering off;
        proxy_cache off;
        proxy_read_timeout 60s;
    }

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $remote_addr;
        proxy_set_header X-Forwarded-Host $host;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Notes:

- `X-Real-IP` and `X-Forwarded-For` are both set to `$remote_addr`, which replaces whatever the client sent. Either value works for `TRUSTED_PROXY_IP_HEADER`. This follows the staging block, which also sets both.
- The `/api/ticket/` location mirrors the staging configuration. `http2 on;` is the syntax for current nginx. Older versions use `listen 443 ssl http2;`. Check your version.
- Validate and reload with `sudo nginx -t && sudo systemctl reload nginx`.
- If a CDN sits in front of nginx, set `TRUSTED_PROXY_IP_HEADER` to the header the CDN overwrites (for example `cf-connecting-ip`) and make nginx pass that header through.

## Example: Caddy

An equivalent example. Caddy obtains and renews certificates automatically for a public hostname. Set `TRUSTED_PROXY_IP_HEADER=x-real-ip` in `yuyu.env`.

```txt
# Example only. Not shipped or tested by the Yuyu repository.
events.example.com {
	request_body {
		max_size 8MB
	}

	# Live ticket stream: flush immediately.
	handle /api/ticket/* {
		reverse_proxy 127.0.0.1:3000 {
			flush_interval -1
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-For {remote_host}
		}
	}

	handle {
		reverse_proxy 127.0.0.1:3000 {
			header_up X-Real-IP {remote_host}
			header_up X-Forwarded-For {remote_host}
		}
	}
}
```

Notes:

- `header_up` with a value replaces the request header sent upstream, so the client's own value is not forwarded.
- Caddy's flushing and timeout behaviour is Caddy's, not something the Yuyu source states. `flush_interval -1` asks for immediate flushing. Confirm with the test below.
- Caddy passes the original `Host` through by default.

## Verify

Register a test attendee on a staging or non-critical event to get a real ticket token, then request the stream through the public origin:

```bash
curl -N -i https://events.example.com/api/ticket/TICKET_TOKEN/events
```

You should see, immediately and without waiting for the response to complete:

- `content-type: text/event-stream; charset=utf-8`
- an `event: state` frame
- a `: ping` line roughly every 25 seconds, until the stream ends after 10 minutes or the check-in

If the body arrives only in a lump after a long delay, the proxy is buffering. Then check in the test ticket from the dashboard with the ticket page open and confirm the ticket tears at once, without waiting for 15 seconds. This is the check in step 6 of the repository's release procedure.

To confirm the client-IP header, make a few requests from two networks and check that rate limits are not shared. A symptom of the wrong header is users being throttled together, with sign-in failing for many people at once.

## Further reading

- [Configuration](/reference/configuration), [Realtime](/architecture/realtime), [Deployment](/reference/deployment)
- [Kubernetes with Helm](/deploy/kubernetes), [Staging environment](/deploy/staging), [Production checklist](/deploy/production-checklist)
- [docs/DEPLOYMENT_STAGING.md](https://github.com/twilighty-abhi/yuyu/blob/main/docs/DEPLOYMENT_STAGING.md) for the shipped nginx block
