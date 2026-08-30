import fs from 'node:fs';

const errors = [];
const warnings = [];
const mustExist = [
  'index.html',
  'assets/next.css',
  'assets/next-relations.css',
  'assets/archive-ui-v2.css',
  'assets/next.js',
  'assets/next-enhancements.js',
  'assets/next-market.js',
  'assets/next-relations.js',
  'assets/archive-ui-v2.js'
];

for (const path of mustExist) {
  if (!fs.existsSync(path)) errors.push(`缺少前端文件：${path}`);
}

if (errors.length) finish();

const html = fs.readFileSync('index.html', 'utf8');
const archiveUi = fs.readFileSync('assets/archive-ui-v2.js', 'utf8');

const ids = [...html.matchAll(/\bid="([^"]+)"/g)].map(m => m[1]);
const seen = new Set();
for (const id of ids) {
  if (seen.has(id)) errors.push(`index.html 存在重复 id：${id}`);
  seen.add(id);
}

const requiredIds = [
  'nav','pageTitle','pageSub','scope','search','syncBox',
  'overview','people','world','timeline','journey','abilities','inventory','projects','intel','diagnostics',
  'overviewCards','currentState','recentEvents','peopleGrid','worldGrid','locationsGrid','worldDetails',
  'timelineGrid','journeyGrid','abilitiesGrid','currencyGrid','inventoryGrid','projectsGrid','intelGrid',
  'drawer','drawerBackdrop','drawerClose','drawerBody'
];
for (const id of requiredIds) {
  if (!seen.has(id)) errors.push(`index.html 缺少关键挂载点：#${id}`);
}

const scriptSrcs = [...html.matchAll(/<script[^>]+src="([^"]+)"[^>]*>/g)].map(m => m[1]);
const expectedScripts = [
  'assets/next.js',
  'assets/next-enhancements.js',
  'assets/next-market.js',
  'assets/next-relations.js',
  'assets/archive-ui-v2.js'
];
if (JSON.stringify(scriptSrcs) !== JSON.stringify(expectedScripts)) {
  errors.push(`前端脚本顺序不符合契约：${scriptSrcs.join(' -> ')}`);
}

const styleHrefs = [...html.matchAll(/<link[^>]+rel="stylesheet"[^>]+href="([^"]+)"[^>]*>/g)].map(m => m[1]);
const expectedStyles = ['assets/next.css','assets/next-relations.css','assets/archive-ui-v2.css'];
if (JSON.stringify(styleHrefs) !== JSON.stringify(expectedStyles)) {
  errors.push(`样式表顺序不符合契约：${styleHrefs.join(' -> ')}`);
}

for (const path of [...scriptSrcs, ...styleHrefs]) {
  if (!/^https?:/.test(path) && !fs.existsSync(path)) errors.push(`index.html 引用了不存在的本地资源：${path}`);
}

const staticTabs = [...html.matchAll(/data-tab="([^"]+)"/g)].map(m => m[1]);
for (const tab of staticTabs) {
  if (!seen.has(tab)) errors.push(`导航 data-tab=${tab} 没有对应 section#${tab}`);
}

const dynamicContract = [
  ['世界槽动态导航','data-tab="worldslot"'],
  ['市场动态导航','data-tab="market"'],
  ['世界槽动态 section','id="worldslot"'],
  ['市场动态 section','id="market"'],
  ['分类隐藏标记','archiveFilterHidden'],
  ['搜索与分类合并','applyArchiveSearch'],
  ['页头一致性刷新','refreshActiveHeader'],
  ['不受世界范围页面声明','UNSCOPED_TABS']
];
for (const [label, token] of dynamicContract) {
  if (!archiveUi.includes(token)) errors.push(`archive-ui-v2.js 缺少 UI 契约：${label}`);
}

if (!html.includes('aria-live="polite"')) warnings.push('syncBox 未声明 aria-live="polite"');
if (!html.includes('aria-label="搜索档案"')) warnings.push('搜索框缺少明确 aria-label');

finish();

function finish(){
  if (warnings.length) {
    console.log('UI 契约警告：');
    warnings.forEach(x => console.log(`- ${x}`));
  }
  if (errors.length) {
    console.error('UI 契约验证失败：');
    errors.forEach(x => console.error(`- ${x}`));
    process.exit(1);
  }
  console.log('UI 契约验证通过。');
}