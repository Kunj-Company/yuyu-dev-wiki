<script setup lang="ts">
// Lists the people with commits in the Yuyu repositories. The data is contributors.json,
// refreshed from GitHub with `npm run contributors`.
import data from "./contributors.json";

const plural = (n: number) => `${n} ${n === 1 ? "commit" : "commits"}`;
</script>

<template>
  <div class="yy-people">
    <ul>
      <li v-for="p in data.contributors" :key="p.login" class="yy-person">
        <a :href="p.url" class="yy-avatar-link" :aria-label="`${p.name} on GitHub`">
          <img :src="p.avatar" :alt="`${p.name}'s GitHub avatar`" width="72" height="72" loading="lazy" />
        </a>
        <div>
          <h3>{{ p.name }}</h3>
          <p class="yy-handle"><a :href="p.url">@{{ p.login }}</a></p>
          <p class="yy-total">{{ plural(p.total) }} in total</p>
          <ul class="yy-repos">
            <li v-for="r in p.repos" :key="r.repo">{{ r.repo }}: {{ plural(r.commits) }}</li>
          </ul>
        </div>
      </li>
    </ul>
    <p class="yy-updated">Counts from GitHub on <time :datetime="data.updated">{{ data.updated }}</time>.</p>
  </div>
</template>

<style scoped>
.yy-people > ul {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 16px;
  margin: 16px 0;
  padding: 0;
  list-style: none;
}
.yy-person {
  display: flex;
  gap: 16px;
  margin: 0;
  padding: 16px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.yy-avatar-link {
  flex: none;
  align-self: flex-start;
}
.yy-person img {
  display: block;
  width: 72px;
  height: 72px;
  border-radius: 50%;
  background: var(--vp-c-default-soft);
  object-fit: cover;
}
h3 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 18px;
  line-height: 26px;
  letter-spacing: 0;
}
p {
  margin: 0;
  font-size: 14px;
  line-height: 22px;
}
.yy-handle {
  color: var(--vp-c-text-2);
}
.yy-total {
  margin-top: 8px;
  font-weight: 600;
}
.yy-repos {
  margin: 4px 0 0;
  padding: 0;
  list-style: none;
  font-size: 13px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}
.yy-repos li {
  margin: 0;
}
.yy-updated {
  font-size: 13px;
  color: var(--vp-c-text-2);
}
</style>
