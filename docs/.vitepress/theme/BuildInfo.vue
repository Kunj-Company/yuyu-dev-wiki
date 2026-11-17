<script setup lang="ts">
// Shows which wiki commit this site was built from and which Yuyu commit it was verified against.
// The data is read from git at build time (see BUILD_INFO in config.mts).
declare const __BUILD_INFO__: {
  wiki: { hash: string; shortHash: string; committedAt: string; author: string; subject: string; dirty: boolean; url: string };
  source: { hash: string; shortHash: string; url: string };
  builtAt: string;
};
const info = __BUILD_INFO__;

// Fixed time zones (IST first, then UTC) so the server-rendered and browser output are identical.
const fmt = (iso: string) => {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "unknown";
  const part = (timeZone: string, opts: Intl.DateTimeFormatOptions) => new Intl.DateTimeFormat("en-GB", { ...opts, timeZone, hour12: false }).format(d);
  const ist = part("Asia/Kolkata", { day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const utc = part("UTC", { hour: "2-digit", minute: "2-digit" });
  return `${ist} IST (${utc} UTC)`;
};
</script>

<template>
  <section class="yy-build-info" aria-label="Documentation version">
    <h2>Documentation version</h2>
    <dl>
      <div v-if="info.wiki.hash">
        <dt>Last edited</dt>
        <dd>
          <time :datetime="info.wiki.committedAt">{{ fmt(info.wiki.committedAt) }}</time>
          <span v-if="info.wiki.author"> by {{ info.wiki.author }}</span>
        </dd>
      </div>
      <div v-if="info.wiki.hash">
        <dt>Last commit</dt>
        <dd>
          <a v-if="info.wiki.url" :href="info.wiki.url"><code>{{ info.wiki.shortHash }}</code></a>
          <code v-else>{{ info.wiki.shortHash }}</code>
          <span v-if="info.wiki.subject"> {{ info.wiki.subject }}</span>
          <span v-if="info.wiki.dirty" class="yy-build-dirty">+ uncommitted changes</span>
        </dd>
      </div>
      <div>
        <dt>Verified against Yuyu</dt>
        <dd>
          <a :href="info.source.url"><code>{{ info.source.shortHash }}</code></a>
          <span> (the Yuyu commit every page was checked against)</span>
        </dd>
      </div>
      <div>
        <dt>Site built</dt>
        <dd>
          <time :datetime="info.builtAt">{{ fmt(info.builtAt) }}</time>
        </dd>
      </div>
    </dl>
  </section>
</template>

<style scoped>
.yy-build-info {
  max-width: 1152px;
  margin: 48px auto 0;
  padding: 24px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
@media (min-width: 640px) {
  .yy-build-info {
    margin-left: 48px;
    margin-right: 48px;
  }
}
@media (min-width: 1152px) {
  .yy-build-info {
    margin-left: auto;
    margin-right: auto;
  }
}
h2 {
  margin: 0 0 16px;
  padding: 0;
  border: 0;
  font-size: 16px;
  line-height: 24px;
}
dl {
  display: grid;
  gap: 12px;
  margin: 0;
}
dl > div {
  display: grid;
  gap: 2px;
}
@media (min-width: 640px) {
  dl > div {
    grid-template-columns: 180px 1fr;
    gap: 16px;
  }
}
dt {
  font-size: 14px;
  color: var(--vp-c-text-2);
}
dd {
  margin: 0;
  font-size: 14px;
  overflow-wrap: anywhere;
}
code {
  font-family: var(--vp-font-family-mono);
  font-size: 13px;
}
.yy-build-dirty {
  margin-left: 8px;
  padding: 1px 8px;
  border-radius: 999px;
  background: var(--vp-c-warning-soft);
  color: var(--vp-c-warning-1);
  font-size: 12px;
  white-space: nowrap;
}
</style>
