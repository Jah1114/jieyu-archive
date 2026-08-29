import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const exists = p => fs.existsSync(p);

const meta = read('data/meta.json');
const player = read('data/global/player.json');
const people = read('data/global/people.json');
const abilities = read('data/global/abilities.json');
const inventory = read('data/global/inventory.json');
const worldRegistry = read('data/worlds/index.json');
const timeline = read('data/timeline.json');
const projects = read('data/projects.json');
const intel = read('data/intel.json');
const chapters = read('data/chapters.json');
const features = exists('data/features.json') ? read('data/features.json') : { features: [] };

const errors = [];
const warnings = [];
const ids = new Map();
const types = new Map();

const worlds = [];
for (const entry of worldRegistry.worlds ?? []) {
  if (!entry.file) {
    errors.push(`世界注册项缺少 file：${entry.id ?? '未知世界'}`);
    continue;
  }
  if (!entry.settingId) errors.push(`世界注册项缺少 settingId：${entry.id ?? '未知世界'}`);
  if (!Number.isInteger(entry.visitIndex) || entry.visitIndex < 1) errors.push(`世界注册项 visitIndex 无效：${entry.id ?? '未知世界'}`);
  if (!entry.timelineId) errors.push(`世界注册项缺少 timelineId：${entry.id ?? '未知世界'}`);
  if (!exists(entry.file)) {
    errors.push(`世界文件不存在：${entry.id ?? '未知世界'} → ${entry.file}`);
    continue;
  }
  const world = read(entry.file);
  worlds.push(world);
  if (entry.id !== world.id) errors.push(`世界注册 ID 不一致：registry=${entry.id}，file=${world.id}`);
  if (entry.name && entry.name !== world.name) warnings.push(`世界名称不一致：registry=${entry.name}，file=${world.name}`);
  if (entry.settingId !== world.settingId) errors.push(`作品世界 ID 不一致：${entry.id}`);
  if (entry.visitIndex !== world.visitIndex) errors.push(`访问次数不一致：${entry.id}`);
  if (entry.timelineId !== world.timelineId) errors.push(`时间线 ID 不一致：${entry.id}`);
}

function add(id, type, name) {
  if (!id) {
    errors.push(`${type} 缺少 id：${name ?? '未命名'}`);
    return;
  }
  if (ids.has(id)) errors.push(`重复 id：${id}（${ids.get(id).type} / ${type}）`);
  else {
    ids.set(id, { type, name });
    types.set(id, type);
  }
}

add(player.id, '角色', player.name);
for (const world of worlds) {
  add(world.id, '世界', world.name);
  const seenOrders = new Set();
  for (const loc of world.knownLocations ?? []) {
    add(loc.id, '地点', loc.name);
    if (typeof loc.importance !== 'number') errors.push(`长期地点缺少 importance：${loc.id}`);
    if (!Number.isInteger(loc.firstSeenOrder)) errors.push(`长期地点缺少 firstSeenOrder：${loc.id}`);
    if (!loc.kind) warnings.push(`长期地点缺少 kind：${loc.id}`);
    if (seenOrders.has(loc.firstSeenOrder)) warnings.push(`长期地点首次到达顺序重复：${world.id} → ${loc.firstSeenOrder}`);
    seenOrders.add(loc.firstSeenOrder);
  }
}
for (const x of people.people ?? []) add(x.id, '人物', x.name);
for (const x of abilities.abilities ?? []) add(x.id, '能力', x.name);
for (const x of inventory.items ?? []) add(x.id, '物品', x.name);
for (const x of inventory.currencies ?? []) add(x.id, '货币', x.name);
for (const x of timeline.events ?? []) add(x.id, '事件', x.title);
for (const x of projects.projects ?? []) add(x.id, '项目', x.name);
for (const x of intel.intel ?? []) add(x.id, '情报', x.title);
for (const x of chapters.chapters ?? []) add(x.id, '章节', x.title);

const refs = [];
function ref(target, from, field, expectedType = null) {
  if (target) refs.push({ target, from, field, expectedType });
}

ref(player.coreTalentId, player.id, 'coreTalentId', '能力');
ref(player.currentWorldId, player.id, 'currentWorldId', '世界');
ref(meta.currentWorldId, 'meta', 'currentWorldId', '世界');

for (const world of worlds) {
  for (const loc of world.knownLocations ?? []) ref(world.id, loc.id, 'parentWorldId', '世界');
}
for (const p of people.people ?? []) {
  ref(p.firstWorldId, p.id, 'firstWorldId', '世界');
  if (p.currentWorldId) ref(p.currentWorldId, p.id, 'currentWorldId', '世界');
  for (const x of p.worldIds ?? []) ref(x, p.id, 'worldIds', '世界');
}
for (const a of abilities.abilities ?? []) if (a.sourceWorldId) ref(a.sourceWorldId, a.id, 'sourceWorldId', '世界');
for (const item of inventory.items ?? []) if (item.sourceWorldId) ref(item.sourceWorldId, item.id, 'sourceWorldId', '世界');
for (const c of inventory.currencies ?? []) if (c.worldId) ref(c.worldId, c.id, 'worldId', '世界');
for (const e of timeline.events ?? []) {
  ref(e.worldId, e.id, 'worldId', '世界');
  if (!Array.isArray(e.locationIds)) errors.push(`事件 locationIds 必须为数组：${e.id}`);
  for (const x of e.locationIds ?? []) ref(x, e.id, 'locationIds', '地点');
  for (const x of e.links ?? []) ref(x, e.id, 'links');
}
for (const p of projects.projects ?? []) {
  ref(p.worldId, p.id, 'worldId', '世界');
  for (const x of p.participants ?? []) ref(x, p.id, 'participants');
}
for (const i of intel.intel ?? []) {
  if (typeof i.scope === 'string' && i.scope.startsWith('world-')) ref(i.scope, i.id, 'scope', '世界');
  for (const x of i.relatedIds ?? []) ref(x, i.id, 'relatedIds');
}
for (const c of chapters.chapters ?? []) {
  ref(c.worldId, c.id, 'worldId', '世界');
  for (const x of c.relatedIds ?? []) ref(x, c.id, 'relatedIds');
}

for (const r of refs) {
  if (!ids.has(r.target)) {
    errors.push(`坏引用：${r.from}.${r.field} → ${r.target}`);
    continue;
  }
  if (r.expectedType && types.get(r.target) !== r.expectedType) {
    errors.push(`引用类型错误：${r.from}.${r.field} → ${r.target}，预期 ${r.expectedType}，实际 ${types.get(r.target)}`);
  }
}

if (!worlds.some(w => w.id === meta.currentWorldId)) errors.push(`meta.currentWorldId 未注册：${meta.currentWorldId}`);
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
  if (!Array.isArray(p.participants)) errors.push(`项目 participants 必须为数组：${p.id}`);
}

for (const i of intel.intel ?? []) {
  if (!Array.isArray(i.evidenceChain)) errors.push(`情报缺少证据链数组：${i.id}`);
  if (!Array.isArray(i.unknown)) errors.push(`情报 unknown 必须为数组：${i.id}`);
  if (!Array.isArray(i.relatedIds)) errors.push(`情报 relatedIds 必须为数组：${i.id}`);
}

for (const c of chapters.chapters ?? []) {
  if (!c.sourcePath) errors.push(`章节缺少正文来源：${c.id}`);
  else if (!exists(c.sourcePath)) errors.push(`章节正文来源不存在：${c.id} → ${c.sourcePath}`);
  if (!Array.isArray(c.relatedIds)) errors.push(`章节 relatedIds 必须为数组：${c.id}`);
}

for (const f of features.features ?? []) {
  if (!f.id || !f.name) errors.push(`功能注册缺少 id/name：${JSON.stringify(f)}`);
  if (f.publicVisible === false && f.state === '已解锁') warnings.push(`功能 ${f.id} 已解锁但仍设为不可见`);
  if (f.backendSettingPath && !exists(f.backendSettingPath)) errors.push(`功能后台设定路径不存在：${f.id} → ${f.backendSettingPath}`);
}

for (const file of ['next.html','assets/next.js','assets/next-enhancements.js','assets/next.css']) {
  if (!exists(file)) errors.push(`缺少前端文件：${file}`);
}

console.log(`访问实例：${worlds.length}`);
console.log(`实体：${ids.size}`);
console.log(`引用：${refs.length}`);
console.log(`待解锁/功能注册：${(features.features ?? []).length}`);
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
