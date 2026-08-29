import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const readText = p => fs.readFileSync(p, 'utf8');
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
const saveTransaction = exists('archive/SAVE_TRANSACTION.json') ? read('archive/SAVE_TRANSACTION.json') : null;
const continuityText = exists('archive/CONTINUITY.md') ? readText('archive/CONTINUITY.md') : '';
const currentStateText = exists('archive/CURRENT_STATE.md') ? readText('archive/CURRENT_STATE.md') : '';
const readmeText = exists('README.md') ? readText('README.md') : '';

const errors = [];
const warnings = [];
const ids = new Map();
const types = new Map();

function requireText(path, text) {
  if (!text) errors.push(`缺少或无法读取文本文件：${path}`);
}

function requireMention(path, text, value, label) {
  if (!value) return;
  if (!text.includes(String(value))) errors.push(`${path} 未体现 ${label}：${value}`);
}

requireText('README.md', readmeText);
requireText('archive/CONTINUITY.md', continuityText);
requireText('archive/CURRENT_STATE.md', currentStateText);

if (!saveTransaction) {
  errors.push('缺少存档事务文件：archive/SAVE_TRANSACTION.json');
} else {
  const allowedStates = new Set(['clean', 'in_progress', 'repair_required']);
  if (!allowedStates.has(saveTransaction.state)) errors.push(`未知存档事务状态：${saveTransaction.state}`);
  if (saveTransaction.state === 'clean') {
    if (saveTransaction.activeTransaction !== null) errors.push('事务状态为 clean，但 activeTransaction 不是 null');
    if (saveTransaction.repair?.required === true) errors.push('事务状态为 clean，但 repair.required=true');
  }
  if (saveTransaction.state === 'in_progress') {
    const tx = saveTransaction.activeTransaction;
    if (!tx || !tx.id || !tx.startedAt) errors.push('事务状态为 in_progress，但缺少 activeTransaction.id/startedAt');
    if (tx && !Array.isArray(tx.targetFiles)) errors.push('进行中的事务 targetFiles 必须为数组');
    warnings.push('当前存档事务仍为 in_progress；读档必须暂停并先确认/修复该事务。');
  }
  if (saveTransaction.state === 'repair_required') {
    if (saveTransaction.repair?.required !== true) errors.push('事务状态为 repair_required，但 repair.required 不是 true');
    if (!saveTransaction.repair?.reason) errors.push('事务状态为 repair_required，但缺少 repair.reason');
    warnings.push('当前存档事务标记为 repair_required；禁止直接继续游戏。');
  }
  if (saveTransaction.protocol?.readRequiresCleanState !== true) warnings.push('事务协议未启用 readRequiresCleanState');
  if (saveTransaction.protocol?.saveSetsInProgressBeforeWrites !== true) warnings.push('事务协议未启用 saveSetsInProgressBeforeWrites');
  if (saveTransaction.protocol?.continuityWrittenNearEnd !== true) warnings.push('事务协议未启用 continuityWrittenNearEnd');
  if (saveTransaction.protocol?.cleanOnlyAfterVerification !== true) warnings.push('事务协议未启用 cleanOnlyAfterVerification');
}

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
for (const item of inventory.items ?? []) {
  if (item.sourceWorldId) ref(item.sourceWorldId, item.id, 'sourceWorldId', '世界');
  if (!Array.isArray(item.actorLinks)) errors.push(`物品 actorLinks 必须为数组：${item.id}`);
  if (!Array.isArray(item.relatedIds)) errors.push(`物品 relatedIds 必须为数组：${item.id}`);
  for (const a of item.actorLinks ?? []) {
    if (!a || !a.id) {
      errors.push(`物品人物关联缺少 id：${item.id}`);
      continue;
    }
    ref(a.id, item.id, 'actorLinks');
  }
  if (item.acquisitionEventId) ref(item.acquisitionEventId, item.id, 'acquisitionEventId', '事件');
  for (const x of item.relatedIds ?? []) ref(x, item.id, 'relatedIds');
}
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
  if (!Array.isArray(c.locationIds)) errors.push(`章节 locationIds 必须为数组：${c.id}`);
  for (const x of c.locationIds ?? []) ref(x, c.id, 'locationIds', '地点');
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

for (const item of inventory.items ?? []) {
  for (const a of item.actorLinks ?? []) {
    const t = types.get(a.id);
    if (t && !['人物','角色'].includes(t)) errors.push(`物品人物关联类型错误：${item.id} → ${a.id}，实际 ${t}`);
    if (!a.role) warnings.push(`物品人物关联缺少角色说明：${item.id} → ${a.id}`);
  }
}

// 跨文件语义一致性：机器可读当前状态优先作为摘要对齐基准。
if (meta.playerName !== player.name) errors.push(`玩家姓名不一致：meta=${meta.playerName}，player=${player.name}`);
if (!worlds.some(w => w.id === meta.currentWorldId)) errors.push(`meta.currentWorldId 未注册：${meta.currentWorldId}`);
if (player.currentWorldId !== meta.currentWorldId) errors.push(`角色当前世界不一致：player=${player.currentWorldId}，meta=${meta.currentWorldId}`);

const currentRegistryEntries = (worldRegistry.worlds ?? []).filter(w => w.status === 'current');
if (currentRegistryEntries.length !== 1) {
  errors.push(`世界注册表必须且只能有一个 current 访问实例，当前数量=${currentRegistryEntries.length}`);
} else if (currentRegistryEntries[0].id !== meta.currentWorldId) {
  errors.push(`注册表 current 与 meta.currentWorldId 不一致：registry=${currentRegistryEntries[0].id}，meta=${meta.currentWorldId}`);
}

const narrative = meta.currentNarrative ?? {};
if (!Number.isInteger(narrative.worldDay) || narrative.worldDay < 1) errors.push('meta.currentNarrative.worldDay 必须为正整数');
if (!narrative.dayPart) errors.push('meta.currentNarrative.dayPart 缺失');
if (!narrative.location) errors.push('meta.currentNarrative.location 缺失');
if (!narrative.frontier) errors.push('meta.currentNarrative.frontier 缺失');

if (Number.isInteger(narrative.worldDay)) {
  const dayMarker = `第${narrative.worldDay}天`;
  requireMention('archive/CONTINUITY.md', continuityText, dayMarker, '当前世界日');
  requireMention('archive/CURRENT_STATE.md', currentStateText, dayMarker, '当前世界日');
}
requireMention('archive/CONTINUITY.md', continuityText, narrative.dayPart, '当前时段');
requireMention('archive/CURRENT_STATE.md', currentStateText, narrative.dayPart, '当前时段');
requireMention('archive/CONTINUITY.md', continuityText, narrative.location, '当前地点');
requireMention('archive/CURRENT_STATE.md', currentStateText, narrative.location, '当前地点');

requireMention('README.md', readmeText, 'archive/SAVE_TRANSACTION.json', '事务第一检查点');
requireMention('README.md', readmeText, '先查看项目来源', '新对话来源检索提示');
requireMention('archive/CONTINUITY.md', continuityText, 'archive/SAVE_TRANSACTION.json', '事务第一检查点');
requireMention('archive/CONTINUITY.md', continuityText, '先查看项目来源', '新对话来源检索提示');

if (Number.isInteger(narrative.worldDay)) {
  for (const e of timeline.events ?? []) {
    if (e.worldId !== meta.currentWorldId || typeof e.day !== 'string') continue;
    const match = e.day.match(/第\s*(\d+)\s*天/);
    if (!match) continue;
    const eventDay = Number(match[1]);
    if (eventDay > narrative.worldDay) errors.push(`时间线事件晚于当前世界日：${e.id}=${eventDay} > ${narrative.worldDay}`);
  }
}

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

for (const file of ['index.html','next.html','assets/next.js','assets/next-enhancements.js','assets/next-relations.js','assets/next.css','assets/next-relations.css']) {
  if (!exists(file)) errors.push(`缺少前端文件：${file}`);
}

console.log(`存档事务：${saveTransaction?.state ?? 'missing'}`);
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
