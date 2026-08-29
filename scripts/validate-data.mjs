import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);

const meta = read('data/meta.json');
const player = read('data/global/player.json');
const people = read('data/global/people.json');
const abilities = read('data/global/abilities.json');
const inventory = read('data/global/inventory.json');
const world = read('data/worlds/world-01.json');
const timeline = read('data/timeline.json');
const projects = read('data/projects.json');
const intel = read('data/intel.json');
const chapters = read('data/chapters.json');

const errors = [];
const warnings = [];
const ids = new Map();

function add(id, type, name) {
  if (!id) {
    errors.push(`${type} 缺少 id：${name ?? '未命名'}`);
    return;
  }
  if (ids.has(id)) errors.push(`重复 id：${id}（${ids.get(id).type} / ${type}）`);
  else ids.set(id, { type, name });
}

add(player.id, '角色', player.name);
add(world.id, '世界', world.name);
for (const x of people.people ?? []) add(x.id, '人物', x.name);
for (const x of abilities.abilities ?? []) add(x.id, '能力', x.name);
for (const x of inventory.items ?? []) add(x.id, '物品', x.name);
for (const x of inventory.currencies ?? []) add(x.id, '货币', x.name);
for (const x of timeline.events ?? []) add(x.id, '事件', x.title);
for (const x of projects.projects ?? []) add(x.id, '项目', x.name);
for (const x of intel.intel ?? []) add(x.id, '情报', x.title);
for (const x of chapters.chapters ?? []) add(x.id, '章节', x.title);

const refs = [];
function ref(target, from, field) {
  if (target) refs.push({ target, from, field });
}

ref(player.coreTalentId, player.id, 'coreTalentId');
for (const e of timeline.events ?? []) for (const x of e.links ?? []) ref(x, e.id, 'links');
for (const p of projects.projects ?? []) for (const x of p.participants ?? []) ref(x, p.id, 'participants');
for (const i of intel.intel ?? []) for (const x of i.relatedIds ?? []) ref(x, i.id, 'relatedIds');
for (const c of chapters.chapters ?? []) for (const x of c.relatedIds ?? []) ref(x, c.id, 'relatedIds');

for (const r of refs) {
  if (!ids.has(r.target)) errors.push(`坏引用：${r.from}.${r.field} → ${r.target}`);
}

if (meta.currentWorldId !== world.id) errors.push(`当前世界不一致：meta=${meta.currentWorldId}，world=${world.id}`);
if (player.currentWorldId !== meta.currentWorldId) errors.push(`角色当前世界不一致：player=${player.currentWorldId}，meta=${meta.currentWorldId}`);

for (const p of people.people ?? []) {
  if (!p.gender) errors.push(`人物缺少性别：${p.id}`);
  if (!p.name) errors.push(`人物缺少姓名：${p.id}`);
  if (!p.status) warnings.push(`人物缺少状态：${p.id}`);
}

for (const p of projects.projects ?? []) {
  for (const field of ['confirmed', 'unknown', 'needs']) {
    if (!Array.isArray(p[field])) errors.push(`项目字段必须为数组：${p.id}.${field}`);
  }
}

for (const i of intel.intel ?? []) {
  if (!Array.isArray(i.evidenceChain)) errors.push(`情报缺少证据链数组：${i.id}`);
  if (!Array.isArray(i.unknown)) errors.push(`情报 unknown 必须为数组：${i.id}`);
}

for (const c of chapters.chapters ?? []) {
  if (!c.sourcePath) errors.push(`章节缺少正文来源：${c.id}`);
  else if (!exists(c.sourcePath)) errors.push(`章节正文来源不存在：${c.id} → ${c.sourcePath}`);
}

for (const e of timeline.events ?? []) {
  if (e.worldId && !ids.has(e.worldId)) errors.push(`事件世界引用不存在：${e.id} → ${e.worldId}`);
}

console.log(`实体：${ids.size}`);
console.log(`引用：${refs.length}`);
if (warnings.length) {
  console.log('\n警告：');
  for (const w of warnings) console.log(`- ${w}`);
}
if (errors.length) {
  console.error('\n档案验证失败：');
  for (const e of errors) console.error(`- ${e}`);
  process.exit(1);
}
console.log('\n档案验证通过。');
