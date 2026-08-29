import fs from 'node:fs';

const read = p => JSON.parse(fs.readFileSync(p,'utf8'));
const text = p => fs.readFileSync(p,'utf8');
const exists = p => fs.existsSync(p);
const errors=[];
const warnings=[];

const tx=read('archive/SAVE_TRANSACTION.json');
const inventory=read('data/global/inventory.json');
const registry=read('data/worlds/index.json');
const readme=text('README.md');
const continuity=text('archive/CONTINUITY.md');
const livePath=tx.protocol?.liveProtocolPath;

if(livePath!=='archive/OPERATION_PROTOCOL.md') errors.push(`liveProtocolPath 非预期：${livePath}`);
if(tx.protocol?.rereadLiveProtocolEveryOperation!==true) errors.push('未启用 rereadLiveProtocolEveryOperation');
if(!livePath || !exists(livePath)) errors.push(`活操作协议不存在：${livePath||'未登记'}`);
else {
  const live=text(livePath);
  for(const needle of ['每一次 `读档`','每一次 `存档`','data/global/inventory.json -> marketObservations']){
    if(!live.includes(needle)) errors.push(`活操作协议缺少关键规则：${needle}`);
  }
}
for(const [path,body] of [['README.md',readme],['archive/CONTINUITY.md',continuity]]){
  if(!body.includes('archive/OPERATION_PROTOCOL.md')) errors.push(`${path} 未要求读取活操作协议`);
  if(!body.includes('项目来源')) errors.push(`${path} 未保留项目来源规则入口`);
}

const worlds=[];
const locations=new Set();
for(const entry of registry.worlds??[]){
  if(!entry.file || !exists(entry.file)){ errors.push(`世界文件缺失：${entry.id}`); continue; }
  const w=read(entry.file); worlds.push(w);
  for(const l of w.knownLocations??[]) locations.add(l.id);
}
const worldIds=new Set(worlds.map(w=>w.id));
const itemIds=new Set((inventory.items??[]).map(x=>x.id));
const currencyIds=new Set((inventory.currencies??[]).map(x=>x.id));
const observations=inventory.marketObservations;
if(!Array.isArray(observations)) errors.push('inventory.marketObservations 必须为数组');
else {
  const ids=new Set();
  for(const o of observations){
    if(!o.id) errors.push('市场观察缺少 id');
    else if(ids.has(o.id)) errors.push(`市场观察重复 id：${o.id}`);
    else ids.add(o.id);
    if(!o.subjectName) errors.push(`市场观察缺少 subjectName：${o.id}`);
    if(!worldIds.has(o.worldId)) errors.push(`市场观察世界引用无效：${o.id} → ${o.worldId}`);
    if(o.locationId && !locations.has(o.locationId)) errors.push(`市场观察地点引用无效：${o.id} → ${o.locationId}`);
    if(o.itemId && !itemIds.has(o.itemId)) errors.push(`市场观察物品引用无效：${o.id} → ${o.itemId}`);
    if(o.currencyId && !currencyIds.has(o.currencyId)) errors.push(`市场观察货币引用无效：${o.id} → ${o.currencyId}`);
    if(!Number.isFinite(o.quantity) || o.quantity<=0) errors.push(`市场观察数量无效：${o.id}`);
    const approx=Number.isFinite(o.amountApprox) && o.amountApprox>=0;
    const range=Number.isFinite(o.amountMinApprox) && Number.isFinite(o.amountMaxApprox) && o.amountMinApprox>=0 && o.amountMaxApprox>=o.amountMinApprox;
    const barter=typeof o.barterText==='string' && o.barterText.trim();
    if(!approx && !range && !barter) errors.push(`市场观察缺少有效价格 / 区间 / 以物易物说明：${o.id}`);
    if(!o.priceType) errors.push(`市场观察缺少 priceType：${o.id}`);
    if(!o.observedAt) warnings.push(`市场观察缺少 observedAt：${o.id}`);
  }
}

for(const w of worlds){
  if(w.economy?.knownPrices) errors.push(`世界文件仍保留重复 knownPrices：${w.id}`);
  if(w.economy?.primaryCurrencyId && !currencyIds.has(w.economy.primaryCurrencyId)) errors.push(`世界主货币引用无效：${w.id} → ${w.economy.primaryCurrencyId}`);
  if(w.economy?.marketObservationsPath && w.economy.marketObservationsPath!=='data/global/inventory.json#marketObservations') errors.push(`市场观察路径不一致：${w.id}`);
}

for(const file of ['assets/next-market.js','archive/OPERATION_PROTOCOL.md']) if(!exists(file)) errors.push(`缺少文件：${file}`);

console.log(`市场观察：${Array.isArray(observations)?observations.length:0}`);
console.log(`活操作协议：${livePath||'missing'}`);
if(warnings.length){ console.log('\n警告：'); warnings.forEach(x=>console.log(`- ${x}`)); }
if(errors.length){ console.error('\n市场 / 操作协议验证失败：'); errors.forEach(x=>console.error(`- ${x}`)); process.exit(1); }
console.log('\n市场 / 操作协议验证通过。');
