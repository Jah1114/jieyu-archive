import fs from 'node:fs';

const path = 'data/world-slot.json';
const errors = [];
const warnings = [];

if (!fs.existsSync(path)) {
  console.error(`缺少世界槽文件：${path}`);
  process.exit(1);
}

const data = JSON.parse(fs.readFileSync(path, 'utf8'));
if (data.schemaVersion !== 1) errors.push(`未知 world-slot schemaVersion：${data.schemaVersion}`);
if (data.selectionPolicy?.isWhitelist !== false) errors.push('世界槽必须明确 isWhitelist=false');
if (data.selectionPolicy?.outsidePoolAllowed !== true) errors.push('世界槽必须明确 outsidePoolAllowed=true');

const explicit = Array.isArray(data.explicitPreferences) ? data.explicitPreferences : [];
const recommended = Array.isArray(data.recommendedCandidates) ? data.recommendedCandidates : [];
if (!explicit.length) errors.push('世界槽缺少用户明确偏好');

const ids = new Set();
const names = new Set();
for (const [kind, list] of [['explicit', explicit], ['recommended', recommended]]) {
  for (const entry of list) {
    if (!entry?.id || !entry?.name) errors.push(`${kind} 候选缺少 id/name`);
    if (!(typeof entry?.weight === 'number' && entry.weight > 0)) errors.push(`${entry?.id || kind} 权重无效`);
    if (ids.has(entry.id)) errors.push(`世界槽重复 id：${entry.id}`);
    ids.add(entry.id);
    if (names.has(entry.name)) warnings.push(`世界槽重复名称：${entry.name}`);
    names.add(entry.name);
  }
}

const base = data.selectionPolicy?.outsidePoolBaselineWeight;
const explicitWeight = data.selectionPolicy?.explicitPreferenceWeight;
const recWeight = data.selectionPolicy?.recommendedCandidateWeight;
if (!(typeof base === 'number' && typeof explicitWeight === 'number' && explicitWeight > base)) errors.push('用户明确偏好权重必须高于槽外基线');
if (!(typeof recWeight === 'number' && recWeight > base && recWeight < explicitWeight)) warnings.push('推荐候选权重建议位于槽外基线与用户明确偏好之间');

console.log(`世界槽：用户明确偏好 ${explicit.length} 个；推荐候选 ${recommended.length} 个。`);
if (warnings.length) {
  console.log('\n警告：');
  warnings.forEach(w => console.log(`- ${w}`));
}
if (errors.length) {
  console.error('\n世界槽验证失败：');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log('世界槽验证通过。');
