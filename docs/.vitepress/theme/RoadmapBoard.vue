<script setup lang="ts">
// A read-only kanban board of upcoming work. The cards live in roadmap.json, so editing the board
// means editing that file. Cards are grouped into one column per priority.
import { computed, ref } from "vue";
import data from "./roadmap.json";

type Priority = "high" | "medium" | "low";
const columns: { key: Priority; title: string; hint: string }[] = [
  { key: "high", title: "High priority", hint: "Security, privacy and gaps in what already ships" },
  { key: "medium", title: "Medium priority", hint: "Planned, with a clear need" },
  { key: "low", title: "Low priority", hint: "Nice to have, or only if asked" },
];

const areas = [...new Set(data.items.map((i) => i.area))].sort();
const area = ref("All");

const visible = computed(() => data.items.filter((i) => area.value === "All" || i.area === area.value));
const inColumn = (key: Priority) => visible.value.filter((i) => i.priority === key);
</script>

<template>
  <div class="yy-board">
    <div class="yy-board-filter" role="group" aria-label="Filter by area">
      <button type="button" :class="{ on: area === 'All' }" :aria-pressed="area === 'All'" @click="area = 'All'">All ({{ data.items.length }})</button>
      <button v-for="a in areas" :key="a" type="button" :class="{ on: area === a }" :aria-pressed="area === a" @click="area = a">{{ a }}</button>
    </div>

    <div class="yy-board-cols">
      <section v-for="c in columns" :key="c.key" :class="['yy-col', c.key]" :aria-label="c.title">
        <header>
          <h3>{{ c.title }} <span class="yy-count">{{ inColumn(c.key).length }}</span></h3>
          <p>{{ c.hint }}</p>
        </header>
        <ul>
          <li v-for="i in inColumn(c.key)" :key="i.title" class="yy-card">
            <strong>{{ i.title }}</strong>
            <span>{{ i.detail }}</span>
            <em>{{ i.area }}</em>
          </li>
          <li v-if="!inColumn(c.key).length" class="yy-empty">Nothing here for this area.</li>
        </ul>
      </section>
    </div>
  </div>
</template>

<style scoped>
.yy-board-filter {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 16px 0;
}
.yy-board-filter button {
  padding: 4px 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 999px;
  background: var(--vp-c-bg);
  color: var(--vp-c-text-2);
  font-size: 13px;
  cursor: pointer;
}
.yy-board-filter button.on {
  border-color: var(--vp-c-text-1);
  background: var(--vp-c-text-1);
  color: var(--vp-c-bg);
}
.yy-board-filter button:focus-visible {
  outline: 2px solid var(--vp-c-brand-1);
  outline-offset: 2px;
}
.yy-board-cols {
  display: grid;
  grid-template-columns: 1fr;
  gap: 16px;
  align-items: start;
}
@media (min-width: 900px) {
  .yy-board-cols {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}
.yy-col {
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-top-width: 4px;
  border-radius: 12px;
  background: var(--vp-c-bg-soft);
}
.yy-col.high {
  border-top-color: var(--vp-c-danger-1);
}
.yy-col.medium {
  border-top-color: var(--vp-c-warning-1);
}
.yy-col.low {
  border-top-color: var(--vp-c-text-3);
}
.yy-col h3 {
  margin: 0;
  padding: 0;
  border: 0;
  font-size: 15px;
  line-height: 24px;
  letter-spacing: 0;
}
.yy-col header p {
  margin: 0 0 12px;
  font-size: 12px;
  line-height: 18px;
  color: var(--vp-c-text-2);
}
.yy-count {
  margin-left: 4px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 12px;
  font-weight: 500;
}
ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding: 0;
  list-style: none;
}
li {
  margin: 0;
}
.yy-card {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--vp-c-divider);
  border-radius: 8px;
  background: var(--vp-c-bg);
}
.yy-card strong {
  font-size: 14px;
  line-height: 20px;
}
.yy-card span {
  font-size: 13px;
  line-height: 20px;
  color: var(--vp-c-text-2);
}
.yy-card em {
  justify-self: start;
  margin-top: 4px;
  padding: 0 8px;
  border-radius: 999px;
  background: var(--vp-c-default-soft);
  color: var(--vp-c-text-2);
  font-size: 11px;
  font-style: normal;
  line-height: 18px;
}
.yy-empty {
  padding: 12px;
  font-size: 13px;
  color: var(--vp-c-text-3);
}
</style>
