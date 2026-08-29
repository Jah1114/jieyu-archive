const $ = (s, root = document) => root.querySelector(s);
const $$ = (s, root = document) => [...root.querySelectorAll(s)];
const esc = (s) => String(s ?? '').replace(/[&<>"']/g, (m) => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]));
const arr = (x) => Array.isArray(x) ? x : [];

const FIELD_LABELS = {
  origin:'出身', worldCount:'世界经历', realm:'境界', spiritualRoots:'灵根', abilities:'能力 / 功法', combat:'当前战斗能力',
  arrival:'入界情况', worldIdentity:'本世界身份', realWorldExperience:'现实经历', previousWorlds:'已知前序世界', skills:'技能',
  items:'已知特殊物品', identity:'身份', lastKnownLocation:'最后已知地点', helpedWith:'曾提供帮助', knowledgeOfPlayer:'对徐长卿的了解',
  exitWindow:'离界窗口', status:'状态', relationship:'关系', informationSource:'信息来源'
};
const TYPE_LABELS = {
  player:'角色', world:'世界', location:'地点', person:'人物', ability:'能力', item:'物品', currency:'货币', project:'项目', intel:'情报', event:'事件', chapter:'章节'
};
const TABS_BY_TYPE = {
  player:'people', world:'world', location:'world', person:'people', ability:'abilities', item:'inventory', currency:'inventory', project:'projects', intel:'intel', event:'timeline', chapter:'journey'
};
const TAB_TITLES = {
  overview:['系统概述','当前状态、叙事前沿与最近事件'], people:['人物档案','人物、关系与反向关联'], world:['世界档案','当前世界与已确认局部信息'],
  timeline:['时间线','事件与关联对象'], journey:['旅程','正史章节索引；正文仍以 Markdown 为权威来源'], abilities:['能力与技艺','来源、限制、实战与跨界状态'],
  inventory:['携带与资源','货币、物品、位置与跨界状态'], projects:['长期项目','研究、生产、资源目标与能力发展'], intel:['情报与证据链','确认事实、来源与仍未知内容'], diagnostics:['档案诊断','重复 ID、坏引用与结构完整性']
};

const DATA = {meta:null, player:null, people:null, abilities:null, inventory:null, timeline:null, projects:null, intel:null, chapters:null, worldRegistry:null, worlds:[]};
let ENTITY = new Map();
let BACKLINKS = new Map();
let DIAG = {duplicates:[], broken:[], warnings:[], entityCount:0, referenceCount:0};
let CURRENT_SCOPE = 'current';
let DRAWER_HISTORY = [];

function fieldLabel(key){ return FIELD_LABELS[key] || '补充信息'; }
function valueText(v){
  if (Array.isArray(v)) return v.map(valueText).join('；');
  if (v && typeof v === 'object') return Object.values(v).map(valueText).join('；');
  return String(v ?? '未知');
}
function chip(text, cls=''){ return `<span class="chip ${cls}">${esc(text)}</span>`; }
function chips(xs=[]){ return `<div class="chips">${arr(xs).filter(Boolean).map(x=>chip(x)).join('')}</div>`; }
function listHtml(xs=[]){ const a=arr(xs); return a.length ? a.map(x=>`<div>• ${esc(x)}</div>`).join('') : '<div class="muted">暂无</div>'; }
function kvHtml(rows=[]){ return `<div class="drawer-kv">${rows.filter(r=>r && r[1]!==undefined && r[1]!==null && String(r[1])!=='').map(([k,v])=>`<div class="k">${esc(k)}</div><div class="v">${typeof v==='string' && v.startsWith('<') ? v : esc(v)}</div>`).join('')}</div>`; }

async function loadJson(path){
  const r = await fetch(path, {cache:'no-store'});
  if (!r.ok) throw new Error(`${path}: HTTP ${r.status}`);
  return r.json();
}

async function load(){
  try{
    const [meta,player,people,abilities,inventory,timeline,projects,intel,chapters,worldRegistry] = await Promise.all([
      loadJson('data/meta.json'), loadJson('data/global/player.json'), loadJson('data/global/people.json'), loadJson('data/global/abilities.json'),
      loadJson('data/global/inventory.json'), loadJson('data/timeline.json'), loadJson('data/projects.json'), loadJson('data/intel.json'), loadJson('data/chapters.json'), loadJson('data/worlds/index.json')
    ]);
    Object.assign(DATA,{meta,player,people,abilities,inventory,timeline,projects,intel,chapters,worldRegistry});
    DATA.worlds = await Promise.all(arr(worldRegistry.worlds).map(w=>loadJson(w.file)));
    buildIndex();
    buildScope();
    renderAll();
  }catch(e){
    $('#syncBox').classList.add('error');
    $('#syncBox').innerHTML = `<span>数据读取失败：${esc(e.message)}</span><span class="badge bad">错误</span>`;
  }
}

function currentWorld(){ return DATA.worlds.find(w=>w.id===DATA.meta.currentWorldId) || DATA.worlds[0]; }
function worldById(id){ return DATA.worlds.find(w=>w.id===id); }
function worldName(id){ return worldById(id)?.name || id || '跨世界'; }
function scopeWorldId(){ return CURRENT_SCOPE==='current' ? DATA.meta.currentWorldId : (CURRENT_SCOPE==='all' ? null : CURRENT_SCOPE); }

function register(id,name,type,worldId,raw){
  if(!id) return;
  if(ENTITY.has(id)) DIAG.duplicates.push(id);
  ENTITY.set(id,{id,name:name||id,type,tab:TABS_BY_TYPE[type]||'overview',worldId:worldId||null,raw});
}
function addBack(ref,from,kind='引用'){
  if(!ref || !from) return;
  DIAG.referenceCount++;
  if(!BACKLINKS.has(ref)) BACKLINKS.set(ref,[]);
  BACKLINKS.get(ref).push({from,kind});
}
function validateRef(ref,from){ if(ref && !ENTITY.has(ref)) DIAG.broken.push(`${from} → ${ref}`); }

function buildIndex(){
  ENTITY = new Map(); BACKLINKS = new Map(); DIAG={duplicates:[],broken:[],warnings:[],entityCount:0,referenceCount:0};
  register(DATA.player.id,DATA.player.name,'player',DATA.player.currentWorldId,DATA.player);
  DATA.worlds.forEach(w=>{
    register(w.id,w.name,'world',w.id,w);
    arr(w.knownLocations).forEach(l=>register(l.id,l.name,'location',w.id,{...l,parentWorldId:w.id}));
  });
  arr(DATA.people.people).forEach(x=>register(x.id,x.name,'person',x.currentWorldId||x.firstWorldId,x));
  arr(DATA.abilities.abilities).forEach(x=>register(x.id,x.name,'ability',x.sourceWorldId,x));
  arr(DATA.inventory.items).forEach(x=>register(x.id,x.name,'item',x.sourceWorldId||x.worldId,x));
  arr(DATA.inventory.currencies).forEach(x=>register(x.id,x.name,'currency',x.worldId,x));
  arr(DATA.projects.projects).forEach(x=>register(x.id,x.name,'project',x.worldId,x));
  arr(DATA.intel.intel).forEach(x=>register(x.id,x.title,'intel',x.scope?.startsWith('world-')?x.scope:null,x));
  arr(DATA.timeline.events).forEach(x=>register(x.id,x.title,'event',x.worldId,x));
  arr(DATA.chapters.chapters).forEach(x=>register(x.id,x.title,'chapter',x.worldId,x));
  DIAG.entityCount=ENTITY.size;

  // 世界与地点
  DATA.worlds.forEach(w=>arr(w.knownLocations).forEach(l=>addBack(w.id,l.id,'地点属于')));
  // 人物、能力、物品等的来源世界
  arr(DATA.people.people).forEach(x=>{ if(x.firstWorldId) addBack(x.firstWorldId,x.id,'初次出现'); });
  arr(DATA.abilities.abilities).forEach(x=>{ if(x.sourceWorldId) addBack(x.sourceWorldId,x.id,'能力来源'); });
  arr(DATA.inventory.items).forEach(x=>{ if(x.sourceWorldId) addBack(x.sourceWorldId,x.id,'物品来源'); });
  arr(DATA.inventory.currencies).forEach(x=>{ if(x.worldId) addBack(x.worldId,x.id,'货币归属'); });
  // 时间线
  arr(DATA.timeline.events).forEach(e=>{
    if(e.worldId) addBack(e.worldId,e.id,'事件发生于');
    arr(e.links).forEach(ref=>addBack(ref,e.id,'事件关联'));
  });
  // 项目
  arr(DATA.projects.projects).forEach(p=>{
    if(p.worldId) addBack(p.worldId,p.id,'项目发生于');
    arr(p.participants).forEach(ref=>addBack(ref,p.id,'项目参与'));
  });
  // 情报
  arr(DATA.intel.intel).forEach(i=>{
    if(i.scope?.startsWith('world-')) addBack(i.scope,i.id,'情报范围');
    arr(i.relatedIds).forEach(ref=>addBack(ref,i.id,'情报关联'));
  });
  // 章节
  arr(DATA.chapters.chapters).forEach(c=>{
    if(c.worldId) addBack(c.worldId,c.id,'章节归属');
    arr(c.relatedIds).forEach(ref=>addBack(ref,c.id,'章节关联'));
  });

  for(const [ref,links] of BACKLINKS){
    links.forEach(l=>validateRef(ref,l.from));
  }
  // 还要检查所有“前向引用”，包括引用源本身是否存在
  arr(DATA.timeline.events).forEach(e=>arr(e.links).forEach(ref=>validateRef(ref,e.id)));
  arr(DATA.projects.projects).forEach(p=>arr(p.participants).forEach(ref=>validateRef(ref,p.id)));
  arr(DATA.intel.intel).forEach(i=>arr(i.relatedIds).forEach(ref=>validateRef(ref,i.id)));
  arr(DATA.chapters.chapters).forEach(c=>arr(c.relatedIds).forEach(ref=>validateRef(ref,c.id)));

  if(!ENTITY.has(DATA.meta.currentWorldId)) DIAG.broken.push(`meta.currentWorldId → ${DATA.meta.currentWorldId}`);
  arr(DATA.people.people).forEach(p=>{ if(!p.name||!p.gender) DIAG.warnings.push(`人物 ${p.id} 缺少姓名或性别`); });
  arr(DATA.projects.projects).forEach(p=>{
    ['confirmed','unknown','needs'].forEach(k=>{ if(!Array.isArray(p[k])) DIAG.warnings.push(`项目 ${p.id} 的 ${k} 不是数组`); });
  });
  arr(DATA.intel.intel).forEach(i=>{ if(!Array.isArray(i.evidenceChain)) DIAG.warnings.push(`情报 ${i.id} 缺少证据链数组`); });
  arr(DATA.chapters.chapters).forEach(c=>{ if(!c.sourcePath) DIAG.warnings.push(`章节 ${c.id} 缺少正文来源路径`); });
}

function resolveName(id){ return ENTITY.get(id)?.name || id; }
function resolveType(id){ return ENTITY.get(id)?.type || 'unknown'; }
function linkChips(ids=[]){
  const valid=arr(ids).filter(Boolean);
  if(!valid.length) return '';
  return `<div class="chips">${valid.map(id=>`<button class="linkchip" data-entity-link="${esc(id)}">${esc(resolveName(id))}</button>`).join('')}</div>`;
}
function backlinksFor(id){ return arr(BACKLINKS.get(id)); }
function backlinksGrouped(id){
  const groups={};
  backlinksFor(id).forEach(({from,kind})=>{
    const e=ENTITY.get(from); if(!e) return;
    const key=TYPE_LABELS[e.type]||e.type;
    (groups[key] ||= []).push({id:from,name:e.name,kind});
  });
  return groups;
}

function buildScope(){
  const s=$('#scope');
  s.innerHTML=`<option value="current">当前世界</option><option value="all">全部世界</option>` + arr(DATA.worldRegistry.worlds).sort((a,b)=>a.order-b.order).map(w=>`<option value="${esc(w.id)}">世界 ${String(w.order).padStart(2,'0')} · ${esc(w.name)}</option>`).join('');
  s.value=CURRENT_SCOPE;
}

function entityWorldId(e){
  if(!e) return null;
  if(e.type==='ability'||e.type==='item'||e.type==='currency'||e.type==='player') return null; // 跨世界资产页不因世界筛选隐藏
  return e.worldId || null;
}
function matchesScopeByWorld(worldId, allowCross=true){
  const target=scopeWorldId();
  if(!target) return true;
  if(!worldId) return allowCross;
  return worldId===target;
}
function entityMatchesScope(entity){ return matchesScopeByWorld(entityWorldId(entity),true); }
function sourceWorldChip(id){ return id ? chip(`来源：${worldName(id)}`) : chip('跨世界'); }

function renderAll(){
  const w=currentWorld();
  $('#brandPlayer').textContent=`${DATA.player.name} · 第一视角长期存档终端`;
  $('#pageSub').textContent=`《${w.name}》· 约第${DATA.meta.currentNarrative.worldDay}天 ${DATA.meta.currentNarrative.dayPart} · ${DATA.meta.currentNarrative.location}`;
  $('#syncBox').innerHTML=`<span><b>存档前沿：</b>${esc(DATA.meta.currentNarrative.frontier)}</span><span class="badge good">存档 · 已读取</span>`;
  renderOverview();renderPeople();renderWorld();renderTimeline();renderJourney();renderAbilities();renderInventory();renderProjects();renderIntel();renderDiagnostics();applySearch();
}

function renderOverview(){
  const w=currentWorld();
  $('#overviewCards').innerHTML=[
    ['当前世界',w.name,w.phase],['时间',`第 ${DATA.meta.currentNarrative.worldDay} 天`,`${DATA.meta.currentNarrative.dayPart} · ${DATA.meta.currentNarrative.location}`],
    ['境界',DATA.player.currentState.realm,DATA.player.currentState.spiritualRoots],['离界窗口','已开启',DATA.player.currentState.exitWindow]
  ].map(x=>`<div class="card searchable" data-search="${esc(x.join(' '))}"><div class="label">${esc(x[0])}</div><div class="big">${esc(x[1])}</div><div class="small muted">${esc(x[2])}</div></div>`).join('');
  $('#currentState').innerHTML=[
    ['核心天赋','无量灵海','完整周天永久增加法力上限与自然回复'],['身体 / 法力',`${DATA.player.currentState.body} / ${DATA.player.currentState.mana}`,'经脉、控制、境界仍是瞬时输出瓶颈'],['当前前沿','金刚符路线','储物袋仍是近期资源优先级；金刚符是长期防御方向']
  ].map(x=>`<div class="card searchable" data-search="${esc(x.join(' '))}"><div class="label">${esc(x[0])}</div><div class="big">${esc(x[1])}</div><div class="small muted">${esc(x[2])}</div></div>`).join('');
  const es=filteredEvents().slice(-4);
  $('#recentEvents').innerHTML=es.length?es.map(eventHtml).join(''):'<div class="empty">当前范围没有事件。</div>';
  const health=DIAG.broken.length+DIAG.duplicates.length+DIAG.warnings.length;
  $('#overviewDiagnostics').innerHTML=[
    ['实体',DIAG.entityCount,'人物 / 能力 / 事件 / 项目 / 章节等'],['关联',DIAG.referenceCount,'已建立的前向/反向关系'],['诊断',health?`${health} 项待检查`:'通过',health?'进入“诊断”查看详情':'当前未发现结构问题']
  ].map((x,i)=>`<div class="card"><div class="label">${x[0]}</div><div class="big">${x[1]}</div><div class="small muted">${x[2]}</div></div>`).join('');
}

function renderKnown(known={}){
  return `<div class="info-grid">${Object.entries(known).map(([k,v])=>`<div class="k">${esc(fieldLabel(k))}</div><div class="v">${esc(valueText(v))}</div>`).join('')}</div>`;
}
function renderPeople(){
  const ps=arr(DATA.people.people).filter(p=>matchesScopeByWorld(p.currentWorldId||p.firstWorldId,true));
  $('#peopleGrid').innerHTML=ps.length?ps.map(p=>{
    const bc=backlinksFor(p.id).length;
    return `<div class="card entity-card searchable" data-entity="${esc(p.id)}" data-search="${esc([p.name,p.status,p.kind,p.relationship,valueText(p.known)].join(' '))}"><div class="row"><div><div class="name">${esc(p.name)}</div>${chips([p.gender,p.age,p.kind])}</div><span class="badge">${esc(p.status)}</span></div><div class="details">${esc(p.relationship||'')}</div>${renderKnown(Object.fromEntries(Object.entries(p.known||{}).slice(0,5)))}<div class="statline"><span class="statpill">关联记录 ${bc}</span></div></div>`;
  }).join(''):'<div class="empty">当前范围没有人物档案。</div>';
}

function renderWorld(){
  const target=scopeWorldId();
  const worlds=target?DATA.worlds.filter(w=>w.id===target):DATA.worlds;
  $('#worldGrid').innerHTML=worlds.map(w=>`<div class="card entity-card searchable" data-entity="${esc(w.id)}" data-search="${esc([w.name,w.phase,w.status,w.identity,w.currentLocation].join(' '))}"><div class="label">${esc(w.status)}</div><div class="big">${esc(w.name)}</div><div class="small muted">${esc(w.phase)} · ${esc(w.currentLocation)}</div><div class="statline"><span class="statpill">约第 ${esc(w.currentDayApprox)} 天</span><span class="statpill">${arr(w.knownLocations).length} 个已知地点</span></div></div>`).join('');
  const locs=worlds.flatMap(w=>arr(w.knownLocations).map(l=>({...l,parentWorldId:w.id})));
  $('#locationsGrid').innerHTML=locs.length?locs.map(l=>`<div class="card entity-card searchable" data-entity="${esc(l.id)}" data-search="${esc([l.name,l.status,l.note].join(' '))}"><div class="name">${esc(l.name)}</div>${chips([l.status,worldName(l.parentWorldId)])}<div class="details">${esc(l.note)}</div></div>`).join(''):'<div class="empty">暂无已知地点。</div>';
  $('#worldDetails').innerHTML=worlds.map(w=>`<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}"><div class="name">${esc(w.name)} · 已知规则</div><div class="details">${listHtml(w.knownRules)}</div></div><div class="card searchable" data-search="${esc(arr(w.economy?.knownPrices).join(' '))}"><div class="name">${esc(w.name)} · 已知价格</div><div class="details">${listHtml(w.economy?.knownPrices)}</div></div>`).join('');
}

function filteredEvents(){ return arr(DATA.timeline.events).filter(e=>matchesScopeByWorld(e.worldId,true)); }
function eventHtml(e){
  return `<div class="event entity-card searchable" data-entity="${esc(e.id)}" data-search="${esc(`${e.day} ${e.title} ${e.summary} ${arr(e.links).map(resolveName).join(' ')}`)}"><div class="label">${esc(e.day)} · ${esc(worldName(e.worldId))}</div><h4>${esc(e.title)}</h4><p>${esc(e.summary)}</p>${linkChips(e.links)}</div>`;
}
function renderTimeline(){ const es=filteredEvents(); $('#timelineGrid').innerHTML=es.length?es.map(eventHtml).join(''):'<div class="empty">当前范围没有时间线事件。</div>'; }

function renderJourney(){
  const cs=arr(DATA.chapters.chapters).filter(c=>matchesScopeByWorld(c.worldId,true));
  $('#journeyGrid').innerHTML=cs.length?cs.map(c=>`<div class="card entity-card searchable" data-entity="${esc(c.id)}" data-search="${esc([c.volume,c.title,c.range,c.summary,...arr(c.relatedIds).map(resolveName)].join(' '))}"><div class="chapter-no">${esc(c.volume)} · 第 ${esc(c.number)} 章 · ${esc(c.range)}</div><div class="chapter-title">${esc(c.title)}</div><div class="details">${esc(c.summary)}</div><div class="statline"><span class="statpill">关联 ${arr(c.relatedIds).length}</span><span class="statpill">正文：Markdown</span></div></div>`).join(''):'<div class="empty">当前范围没有已归档章节。</div>';
}

function renderAbilities(){
  const as=arr(DATA.abilities.abilities);
  $('#abilitiesGrid').innerHTML=as.map(a=>`<div class="card entity-card searchable" data-entity="${esc(a.id)}" data-search="${esc([a.name,a.type,a.source,a.mastery,...arr(a.effects),...arr(a.limits)].join(' '))}"><div class="row"><div class="name">${esc(a.name)}</div><span class="badge">${esc(a.type)}</span></div><div class="chips">${chip(a.mastery)}${sourceWorldChip(a.sourceWorldId)}</div><div class="details"><b>效果</b><br>${listHtml(a.effects)}<br><br><b>限制</b><br>${listHtml(a.limits)}</div><div class="statline"><span class="statpill">关联记录 ${backlinksFor(a.id).length}</span></div></div>`).join('');
}

function renderInventory(){
  const d=DATA.inventory;
  $('#currencyGrid').innerHTML=arr(d.currencies).map(c=>`<div class="card entity-card searchable" data-entity="${esc(c.id)}" data-search="${esc([c.name,c.scope,c.note].join(' '))}"><div class="label">${esc(c.scope)}</div><div class="big">${esc(c.amountApprox)} · ${esc(c.name)}</div><div class="small muted">${esc(c.note||'')}</div></div>`).join('');
  $('#inventoryGrid').innerHTML=arr(d.items).map(i=>`<div class="card entity-card searchable" data-entity="${esc(i.id)}" data-search="${esc([i.name,i.category,i.location,i.source,i.crossWorldStatus].join(' '))}"><div class="row"><div class="name">${esc(i.name)}</div><span class="badge">约 ${esc(i.quantityApprox)}</span></div>${chips([i.category,i.location])}<div class="details">来源：${esc(i.source)}<br>跨界状态：${esc(i.crossWorldStatus)}</div></div>`).join('');
}

function renderProjects(){
  const ps=arr(DATA.projects.projects).filter(p=>matchesScopeByWorld(p.worldId,true));
  $('#projectsGrid').innerHTML=ps.length?ps.map(p=>`<div class="card entity-card searchable" data-entity="${esc(p.id)}" data-search="${esc([p.name,p.type,p.status,p.goal,...arr(p.confirmed),...arr(p.unknown),...arr(p.needs)].join(' '))}"><div class="row"><div class="name">${esc(p.name)}</div><span class="badge">${esc(p.status)}</span></div>${chips([p.type,worldName(p.worldId)])}<div class="details"><b>目标</b>：${esc(p.goal)}<br><br><b>已确认</b><br>${listHtml(p.confirmed)}<br><br><b>仍未知</b><br>${listHtml(p.unknown)}</div><div class="statline"><span class="statpill">参与者 ${arr(p.participants).length}</span><span class="statpill">关联记录 ${backlinksFor(p.id).length}</span></div></div>`).join(''):'<div class="empty">当前范围没有长期项目。</div>';
}

function renderIntel(){
  const xs=arr(DATA.intel.intel).filter(i=>i.scope==='cross-world' || matchesScopeByWorld(i.scope?.startsWith('world-')?i.scope:null,true));
  $('#intelGrid').innerHTML=xs.length?xs.map(i=>`<div class="card entity-card searchable" data-entity="${esc(i.id)}" data-search="${esc([i.title,i.status,i.claim,...arr(i.unknown),...arr(i.evidenceChain).map(e=>`${e.source} ${e.result}`)].join(' '))}"><div class="row"><div class="name">${esc(i.title)}</div><span class="badge">${esc(i.status)}</span></div><div class="details">${esc(i.claim)}</div><div class="statline"><span class="statpill">证据 ${arr(i.evidenceChain).length}</span><span class="statpill">仍未知 ${arr(i.unknown).length}</span></div></div>`).join(''):'<div class="empty">当前范围没有情报。</div>';
}

function renderDiagnostics(){
  const total=DIAG.duplicates.length+DIAG.broken.length+DIAG.warnings.length;
  $('#diagnosticsSummary').innerHTML=[
    ['实体总数',DIAG.entityCount,'稳定 ID'],['引用总数',DIAG.referenceCount,'前向 + 反向关系'],['检查结果',total?`${total} 项`:'通过',total?'存在待检查项':'没有发现结构错误']
  ].map(x=>`<div class="card"><div class="label">${x[0]}</div><div class="big">${x[1]}</div><div class="small muted">${x[2]}</div></div>`).join('');
  const rows=[];
  DIAG.duplicates.forEach(x=>rows.push(`<div class="diag-item bad">重复 ID：${esc(x)}</div>`));
  DIAG.broken.forEach(x=>rows.push(`<div class="diag-item bad">坏引用：${esc(x)}</div>`));
  DIAG.warnings.forEach(x=>rows.push(`<div class="diag-item">结构提醒：${esc(x)}</div>`));
  if(!rows.length) rows.push('<div class="diag-item good">浏览器端结构诊断通过。仓库提交后还会再运行 GitHub Actions 校验。</div>');
  $('#diagnosticsList').innerHTML=rows.join('');
}

function entityForwardLinks(e){
  const r=e.raw;
  if(e.type==='event') return arr(r.links);
  if(e.type==='project') return arr(r.participants);
  if(e.type==='intel') return arr(r.relatedIds);
  if(e.type==='chapter') return arr(r.relatedIds);
  if(e.type==='world') return arr(r.knownLocations).map(l=>l.id);
  return [];
}
function groupedBacklinksHtml(id){
  const groups=backlinksGrouped(id);
  const entries=Object.entries(groups);
  if(!entries.length) return '<div class="drawer-note">暂无反向关联。</div>';
  return entries.map(([type,items])=>`<div class="backlink-group"><div class="backlink-title">${esc(type)} · ${items.length}</div><div class="chips">${items.map(x=>`<button class="linkchip" data-entity-link="${esc(x.id)}" title="${esc(x.kind)}">${esc(x.name)}</button>`).join('')}</div></div>`).join('');
}
function firstLinkedEvent(id){
  return arr(DATA.timeline.events).find(e=>arr(e.links).includes(id));
}
function linkedChapters(id){ return arr(DATA.chapters.chapters).filter(c=>arr(c.relatedIds).includes(id)); }

function renderDrawerContent(e){
  const r=e.raw;
  let html='';
  if(e.type==='player'){
    html+=section('当前状态',kvHtml([['境界',r.currentState?.realm],['灵根',r.currentState?.spiritualRoots],['身体',r.currentState?.body],['法力',r.currentState?.mana],['离界窗口',r.currentState?.exitWindow]]));
    html+=section('现实背景',kvHtml([['教育',r.origin?.education],['职业',r.origin?.occupation],['生活状态',r.origin?.living],['技能',valueText(r.origin?.skills)],['兴趣',valueText(r.origin?.interests)]]));
    html+=section('性格倾向',`<div class="drawer-list">${listHtml(r.personality)}</div>`);
  } else if(e.type==='person'){
    html+=section('人物资料',kvHtml([['性别',r.gender],['年龄',r.age],['类别',r.kind],['状态',r.status],['关系',r.relationship],['信息来源',valueText(r.informationSource)]]));
    html+=section('已知信息',`<div class="drawer-kv">${Object.entries(r.known||{}).map(([k,v])=>`<div class="k">${esc(fieldLabel(k))}</div><div class="v">${esc(valueText(v))}</div>`).join('')}</div>`);
  } else if(e.type==='ability'){
    const first=firstLinkedEvent(e.id);
    html+=section('能力资料',kvHtml([['类型',r.type],['掌握程度',r.mastery],['来源',r.source],['来源世界',r.sourceWorldId?worldName(r.sourceWorldId):'与生俱来 / 跨世界'],['证据',r.evidence],['跨界状态',r.crossWorldStatus]]));
    html+=section('效果',`<div class="drawer-list">${listHtml(r.effects)}</div>`);
    html+=section('限制',`<div class="drawer-list">${listHtml(r.limits)}</div>`);
    if(first) html+=section('最早关联事件',linkChips([first.id]));
    const cs=linkedChapters(e.id); if(cs.length) html+=section('相关正史章节',linkChips(cs.map(c=>c.id)));
  } else if(e.type==='project'){
    html+=section('项目资料',kvHtml([['类型',r.type],['状态',r.status],['世界',worldName(r.worldId)],['目标',r.goal],['风险',r.risk]]));
    html+=section('参与者',linkChips(r.participants));
    html+=section('已确认',`<div class="drawer-list">${listHtml(r.confirmed)}</div>`);
    html+=section('仍未知',`<div class="drawer-list">${listHtml(r.unknown)}</div>`);
    html+=section('缺少条件',`<div class="drawer-list">${listHtml(r.needs)}</div>`);
  } else if(e.type==='intel'){
    html+=section('情报结论',kvHtml([['状态',r.status],['范围',r.scope==='cross-world'?'跨世界':worldName(r.scope)],['当前说法',r.claim]]));
    html+=section('证据链',arr(r.evidenceChain).map(step=>`<div class="evidence-step"><div class="small"><b>${esc(step.order)} · ${esc(step.source)}</b></div><div class="details">${esc(step.result)}</div>${chips([step.confidence])}</div>`).join(''));
    html+=section('仍未知',`<div class="drawer-list">${listHtml(r.unknown)}</div>`);
    html+=section('关联对象',linkChips(r.relatedIds));
  } else if(e.type==='event'){
    html+=section('事件资料',kvHtml([['时间',r.day],['世界',worldName(r.worldId)],['摘要',r.summary]]));
    html+=section('关联对象',linkChips(r.links));
  } else if(e.type==='chapter'){
    html+=section('章节资料',kvHtml([['卷',r.volume],['章节',`第 ${r.number} 章`],['时间范围',r.range],['世界',worldName(r.worldId)],['摘要',r.summary]]));
    html+=section('关联对象',linkChips(r.relatedIds));
    html+=section('正文来源',`<a class="source-link" href="${esc(r.sourcePath)}" target="_blank" rel="noopener">${esc(r.sourcePath)}</a><div class="details">索引只保存摘要和关联；正文仍只维护一份。</div>`);
  } else if(e.type==='world'){
    html+=section('世界资料',kvHtml([['阶段',r.phase],['状态',r.status],['当前地点',r.currentLocation],['身份',r.identity],['离界窗口',r.exitWindow],['原作记忆边界',r.originalMemoryBoundary]]));
    html+=section('已知地点',linkChips(arr(r.knownLocations).map(l=>l.id)));
    html+=section('已知规则',`<div class="drawer-list">${listHtml(r.knownRules)}</div>`);
    html+=section('已知价格',`<div class="drawer-list">${listHtml(r.economy?.knownPrices)}</div>`);
  } else if(e.type==='location'){
    html+=section('地点资料',kvHtml([['世界',worldName(r.parentWorldId)],['状态',r.status],['备注',r.note]]));
    html+=section('所属世界',linkChips([r.parentWorldId]));
  } else if(e.type==='item'){
    html+=section('物品资料',kvHtml([['分类',r.category],['数量',`约 ${r.quantityApprox}`],['位置',r.location],['来源',r.source],['来源世界',worldName(r.sourceWorldId)],['跨界状态',r.crossWorldStatus]]));
  } else if(e.type==='currency'){
    html+=section('资源资料',kvHtml([['数量',r.amountApprox],['范围',r.scope],['世界',worldName(r.worldId)],['备注',r.note||''] ]));
  }
  const fw=entityForwardLinks(e); if(fw.length && !['event','project','intel','chapter','world'].includes(e.type)) html+=section('直接关联',linkChips(fw));
  html+=section('反向关联',groupedBacklinksHtml(e.id));
  return html;
}
function section(title,content){ return `<div class="drawer-section"><h4>${esc(title)}</h4>${content||'<div class="muted small">暂无</div>'}</div>`; }

function openEntity(id, push=true){
  const e=ENTITY.get(id); if(!e) return;
  if(push){ if(DRAWER_HISTORY[DRAWER_HISTORY.length-1]!==id) DRAWER_HISTORY.push(id); if(DRAWER_HISTORY.length>8) DRAWER_HISTORY.shift(); }
  $('#drawerKicker').textContent=`${TYPE_LABELS[e.type]||e.type}${e.worldId?` · ${worldName(e.worldId)}`:''}`;
  $('#drawerTitle').textContent=e.name;
  $('#drawerBody').innerHTML=`<div class="breadcrumbs">${DRAWER_HISTORY.map((hid,i)=>`<button class="crumb" data-drawer-history="${esc(hid)}">${esc(resolveName(hid))}</button>${i<DRAWER_HISTORY.length-1?'<span class="crumb-sep">›</span>':''}`).join('')}</div>${renderDrawerContent(e)}`;
  document.body.classList.add('drawer-open');
}
function closeDrawer(){ document.body.classList.remove('drawer-open'); }

function switchTab(tab){
  $$('#nav button').forEach(x=>x.classList.toggle('active',x.dataset.tab===tab));
  $$('.section').forEach(x=>x.classList.toggle('active',x.id===tab));
  $('#pageTitle').textContent=TAB_TITLES[tab][0];
  $('#pageSub').textContent=TAB_TITLES[tab][1];
  window.scrollTo({top:0,behavior:'smooth'});
}
function focusEntity(id){
  const e=ENTITY.get(id); if(!e) return;
  switchTab(e.tab);
  setTimeout(()=>{
    const card=$(`[data-entity="${CSS.escape(id)}"]`);
    if(card){ card.scrollIntoView({behavior:'smooth',block:'center'}); card.classList.add('highlight'); setTimeout(()=>card.classList.remove('highlight'),1600); }
    openEntity(id);
  },80);
}
function applySearch(){
  const q=$('#search').value.trim().toLowerCase();
  $$('.searchable').forEach(el=>{ el.style.opacity=!q || (el.dataset.search||'').toLowerCase().includes(q) ? '1' : '.15'; });
}

$('#nav').addEventListener('click',e=>{ const b=e.target.closest('button[data-tab]'); if(b) switchTab(b.dataset.tab); });
$('#scope').addEventListener('change',e=>{ CURRENT_SCOPE=e.target.value; renderAll(); });
$('#search').addEventListener('input',applySearch);
document.addEventListener('click',e=>{
  const direct=e.target.closest('[data-entity-link]');
  if(direct){ e.stopPropagation(); focusEntity(direct.dataset.entityLink); return; }
  const hist=e.target.closest('[data-drawer-history]');
  if(hist){ openEntity(hist.dataset.drawerHistory,false); return; }
  const card=e.target.closest('[data-entity]');
  if(card){ openEntity(card.dataset.entity); }
});
$('#drawerClose').addEventListener('click',closeDrawer);
$('#drawerBackdrop').addEventListener('click',closeDrawer);
document.addEventListener('keydown',e=>{ if(e.key==='Escape') closeDrawer(); });

load();
