import fs from 'node:fs';
import path from 'node:path';

const read = p => JSON.parse(fs.readFileSync(p, 'utf8'));
const text = p => fs.readFileSync(p, 'utf8');
const exists = p => fs.existsSync(p);
const errors = [];
const warnings = [];

const MAP_PATH = 'archive/PERSISTENCE_MAP.json';
const PROTOCOL_PATH = 'archive/OPERATION_PROTOCOL.md';
const TX_PATH = 'archive/SAVE_TRANSACTION.json';

if (!exists(MAP_PATH)) errors.push(`缺少持久化映射：${MAP_PATH}`);
if (!exists(PROTOCOL_PATH)) errors.push(`缺少活操作协议：${PROTOCOL_PATH}`);
if (!exists(TX_PATH)) errors.push(`缺少存档事务文件：${TX_PATH}`);

if (errors.length) {
  console.error(errors.join('\n'));
  process.exit(1);
}

const map = read(MAP_PATH);
const protocol = text(PROTOCOL_PATH);
const tx = read(TX_PATH);

if (map.schemaVersion !== 1) errors.push(`未知 PERSISTENCE_MAP schemaVersion：${map.schemaVersion}`);
if (map.principles?.schemaMustNotLimitNarrative !== true) errors.push('持久化映射必须明确 schemaMustNotLimitNarrative=true');
if (map.principles?.unknownConceptsMayEnterCanon !== true) errors.push('持久化映射必须允许未知新概念进入正史');
if (!protocol.includes('archive/PERSISTENCE_MAP.json')) errors.push('活操作协议未要求读取 PERSISTENCE_MAP.json');
if (!protocol.includes('存档结构可以约束“怎么记”，不能约束“能发生什么”')) errors.push('活操作协议缺少开放剧情边界声明');

function walk(dir) {
  const out = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.posix.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*');
  return new RegExp(`^${escaped}$`);
}

function matches(file, pattern) {
  return globToRegExp(pattern).test(file);
}

const exact = new Set(map.authoritativeData?.exactFiles ?? []);
const patterns = map.authoritativeData?.patterns ?? [];
const dataJsonFiles = walk('data').filter(p => p.endsWith('.json'));

for (const p of exact) {
  if (!exists(p)) errors.push(`持久化映射登记了不存在的数据文件：${p}`);
}
for (const file of dataJsonFiles) {
  const registered = exact.has(file) || patterns.some(pattern => matches(file, pattern));
  if (!registered) errors.push(`发现未登记的正式数据层：${file}。新增 data/**/*.json 必须先登记到 ${MAP_PATH}`);
}

const domains = map.domains ?? {};
for (const [domain, spec] of Object.entries(domains)) {
  if (!spec.description) warnings.push(`持久化领域缺少说明：${domain}`);
  for (const target of spec.requiredTargets ?? []) {
    if (!exists(target)) errors.push(`领域 ${domain} 要求的目标不存在：${target}`);
  }
}

if (tx.state === 'in_progress') {
  const active = tx.activeTransaction;
  if (!active) {
    errors.push('事务为 in_progress 但 activeTransaction 缺失');
  } else {
    if (!Array.isArray(active.changeDomains)) errors.push('进行中的事务必须包含 changeDomains 数组');
    if (!Array.isArray(active.targetFiles)) errors.push('进行中的事务必须包含 targetFiles 数组');

    if (Array.isArray(active.changeDomains) && Array.isArray(active.targetFiles)) {
      const targets = new Set(active.targetFiles);
      for (const domain of active.changeDomains) {
        const spec = domains[domain];
        if (!spec) {
          errors.push(`事务声明了未知 changeDomain：${domain}`);
          continue;
        }
        for (const required of spec.requiredTargets ?? []) {
          if (!targets.has(required)) errors.push(`事务领域 ${domain} 缺少必须 targetFile：${required}`);
        }
        for (const pattern of spec.requiredTargetPatterns ?? []) {
          if (![...targets].some(t => matches(t, pattern))) {
            errors.push(`事务领域 ${domain} 缺少匹配目标：${pattern}`);
          }
        }
      }
    }
  }
}

console.log(`持久化领域：${Object.keys(domains).length}`);
console.log(`已登记数据文件：${dataJsonFiles.length}`);
console.log(`事务状态：${tx.state}`);
if (warnings.length) {
  console.log('\n警告：');
  warnings.forEach(w => console.log(`- ${w}`));
}
if (errors.length) {
  console.error('\n持久化映射验证失败：');
  errors.forEach(e => console.error(`- ${e}`));
  process.exit(1);
}
console.log('\n持久化映射验证通过。');
