---
layout: home
hero:
  name: Yuyu Developer Wiki
  text: Build on, extend and integrate with Yuyu
  tagline: Code-level documentation for the self-hosted platform for free events. Covers local setup, architecture, module code maps, APIs and step-by-step recipes.
  image:
    src: /logo.svg
    alt: Yuyu dot sign
  actions:
    - theme: brand
      text: Set up locally
      link: /start/local-setup
    - theme: alt
      text: Architecture
      link: /architecture/overview
    - theme: alt
      text: How-to guides
      link: /guides/add-a-server-action
features:
  - title: Get running
    details: Clone, configure, migrate and sign in. Then learn the daily commands, branch rules and the checks a PR must pass.
    link: /start/local-setup
  - title: Mutation cores
    details: The lib/core pattern behind Server Actions and the mobile API. This is where business rules live and where your change usually goes.
    link: /architecture/mutation-cores
  - title: Tenancy & permissions
    details: Organisation roles, per-event collaborator grants and the server-side guards every read and write must call.
    link: /architecture/permissions
  - title: Feature modules
    details: For each product area, the key files, the functions that own each state transition, the invariants and the tests to run.
    link: /features/events-and-websites
  - title: APIs & webhooks
    details: The tenant-bound machine API, the user-authenticated mobile API, and signed organisation webhooks with verification code.
    link: /api/machine-api
  - title: Recipes
    details: Add a Server Action, a migration, a route, an email kind, a webhook event, an API endpoint or a config value, step by step.
    link: /guides/add-a-server-action
---

## Start here

| If you want to… | Read |
| --- | --- |
| Get a working dev environment | [Local setup](/start/local-setup) |
| Understand how a request flows through the app | [Architecture overview](/architecture/overview) |
| Find where some code lives | [Codebase tour](/start/codebase-tour) |
| Change how a feature behaves | The matching [feature module](/features/events-and-websites) page, then [Mutation cores](/architecture/mutation-cores) |
| Add a database field or model | [Change the schema](/guides/change-the-schema) |
| Integrate an external system | [Machine API](/api/machine-api) or [Webhooks](/api/webhooks) |
| Build against the mobile API | [Mobile API](/api/mobile-api) |
| Get a PR merged | [Development workflow](/start/workflow) and the [Security checklist](/reference/security-checklist) |
| Deploy or operate an instance | [Deployment](/reference/deployment) and [Configuration](/reference/configuration) |

## The stack in one line

Next.js 16 (App Router) · React 19 · TypeScript · PostgreSQL + Prisma 6 · Auth.js v5 · Tailwind CSS 4 + Radix UI · Redis · S3-compatible storage · Nodemailer · Vitest · Playwright · Docker and Helm.

Yuyu is a **multi-tenant** app where the `Organisation` is the tenant boundary. It supports free events only: payments, ticket sales and refunds are out of scope by design.

## About this wiki

This wiki was verified against [twilighty-abhi/yuyu](https://github.com/twilighty-abhi/yuyu) at commit `b223291`. File paths are relative to the repository root. Where the repository's own `docs/` handbook goes deeper, each page links to it. For data model details, `prisma/schema.prisma` is the authoritative source.
