// 统一关系展示层：所有实体卡片与详情抽屉使用同一套关系规则。

const REL_TYPE_ORDER=['player','person','location','event','chapter','ability','item','project','intel','world','currency'];
const REL_TYPE_LABELS={player:'角色',person:'人物',location:'地点',event:'事件',chapter:'章节',ability:'能力',item:'物品',project:'项目',intel:'情报',world:'世界',currency:'资源'};
const RELATION_SECTION_TITLES=new Set([
  '直接关联','反向关联','关联对象','关联人物 / 能力 / 项目','长期地点关联','长期地点',
  '相关人物','获得事件','相关能力 / 记录','参与者','所属世界','已知地点',
  '最早关联事件','相关正史章节'
]);

function relationTypeLabel(type){return REL_TYPE_LABELS[type]||TYPE_LABELS[type]||type||'其他';}
function addRelation(map,id,kind='相关'){
  if(!id||!ENTITY.has(id))return;
  const e=ENTITY.get(id);
  const cur=map.get(id)||{id,name:e.name,type:e.type,kinds:new Set()};
  if(kind)cur.kinds.add(kind);
  map.set(id,cur);
}
function collectRelations(entity){
  const r=entity.raw||{};
  const map=new Map();
  const add=(id,kind)=>{if(id!==entity.id)addRelation(map,id,kind)};

  // 统一读取结构化“前向关系”。
  if(entity.type==='player'){
    add(r.coreTalentId,'核心天赋'); add(r.currentWorldId,'当前世界');
  }
  if(entity.type==='person'){
    add(r.firstWorldId,'初次出现'); add(r.currentWorldId,'当前世界'); arr(r.worldIds).forEach(id=>add(id,'经历世界'));
  }
  if(entity.type==='ability') add(r.sourceWorldId,'来源世界');
  if(entity.type==='currency') add(r.worldId,'所属世界');
  if(entity.type==='location') add(r.parentWorldId,'所属世界');
  if(entity.type==='event'){
    add(r.worldId,'发生世界'); arr(r.locationIds).forEach(id=>add(id,'发生地')); arr(r.links).forEach(id=>add(id,'事件关联'));
  }
  if(entity.type==='chapter'){
    add(r.worldId,'所属世界'); arr(r.locationIds).forEach(id=>add(id,'章节地点')); arr(r.relatedIds).forEach(id=>add(id,'章节关联'));
  }
  if(entity.type==='item'){
    add(r.sourceWorldId,'来源世界');
    arr(r.actorLinks).forEach(x=>add(x?.id,x?.role||'相关人物'));
    add(r.acquisitionEventId,'获得事件');
    arr(r.relatedIds).forEach(id=>add(id,'相关记录'));
  }
  if(entity.type==='project'){
    add(r.worldId,'发生世界'); arr(r.participants).forEach(id=>add(id,'参与者'));
  }
  if(entity.type==='intel'){
    if(typeof r.scope==='string'&&r.scope.startsWith('world-'))add(r.scope,'情报范围');
    arr(r.relatedIds).forEach(id=>add(id,'情报关联'));
  }
  if(entity.type==='world') arr(r.knownLocations).forEach(x=>add(x.id,'长期地点'));

  // 反向关系同样进入同一张关系表。
  backlinksFor(entity.id).forEach(x=>add(x.from,x.kind||'反向关联'));
  return [...map.values()];
}
function groupedRelations(entity){
  const groups=new Map();
  collectRelations(entity).forEach(rel=>{
    if(!groups.has(rel.type))groups.set(rel.type,[]);
    groups.get(rel.type).push(rel);
  });
  return [...groups.entries()].sort((a,b)=>{
    const ai=REL_TYPE_ORDER.indexOf(a[0]),bi=REL_TYPE_ORDER.indexOf(b[0]);
    return (ai<0?999:ai)-(bi<0?999:bi);
  });
}
function preferredRole(rel){
  const meaningful=[...rel.kinds].find(k=>!['事件关联','章节关联','相关记录','情报关联','反向关联','发生世界','所属世界','来源世界','经历世界'].includes(k));
  return meaningful||'';
}
function relationSummaryHtml(entity){
  const groups=groupedRelations(entity);
  if(!groups.length)return '<div class="relation-summary"><span class="relation-summary-label">关联</span><span class="relation-count">暂无</span></div>';
  return `<div class="relation-summary"><span class="relation-summary-label">关联</span>${groups.map(([type,items])=>`<span class="relation-count">${esc(relationTypeLabel(type))} <b>${items.length}</b></span>`).join('')}</div>`;
}
function relationDrawerHtml(entity){
  const groups=groupedRelations(entity);
  if(!groups.length)return '<div class="relation-empty">暂无已记录关联。</div>';
  return `<div class="relation-groups">${groups.map(([type,items])=>`<div class="relation-group"><div class="relation-group-title">${esc(relationTypeLabel(type))} · ${items.length}</div><div class="relation-group-items">${items.map(rel=>{const role=preferredRole(rel);return `<button class="relation-link" data-entity-link="${esc(rel.id)}" title="${esc([...rel.kinds].join(' / '))}"><span>${esc(rel.name)}</span>${role?`<span class="relation-role">· ${esc(role)}</span>`:''}</button>`}).join('')}</div></div>`).join('')}</div>`;
}

function stripLegacyRelationUI(card){
  // 删除各模板历史遗留的直接关系展示。
  card.querySelectorAll('.event-locations').forEach(x=>x.remove());
  card.querySelectorAll('.linkchip').forEach(btn=>{
    const block=btn.closest('.event-locations,.details,.chips');
    if(block&&card.contains(block))block.remove();
  });
  card.querySelectorAll('.statline').forEach(line=>{
    [...line.children].forEach(x=>{
      const t=x.textContent.trim();
      if(/^关联/.test(t)||/^参与者/.test(t))x.remove();
    });
    if(!line.children.length)line.remove();
  });
  // 旧模板中特意写出的“长期地点/相关人物”也统一移除。
  card.querySelectorAll('.details').forEach(x=>{
    const t=x.textContent.trim();
    if(t.startsWith('长期地点')||t.startsWith('相关人物'))x.remove();
  });
  card.querySelector('.relation-summary')?.remove();
}
function normalizeRelationCards(root=document){
  $$('.entity-card[data-entity]',root).forEach(card=>{
    const entity=ENTITY.get(card.dataset.entity); if(!entity)return;
    stripLegacyRelationUI(card);
    card.insertAdjacentHTML('beforeend',relationSummaryHtml(entity));
  });
}

// 详情抽屉：保留实体自身资料，移除各模板自定义关系段，最后统一追加一个“关联”。
const _relationBaseDrawer=renderDrawerContent;
renderDrawerContent=function(entity){
  const wrap=document.createElement('div');
  wrap.innerHTML=_relationBaseDrawer(entity);
  [...wrap.querySelectorAll('.drawer-section')].forEach(sec=>{
    const title=sec.querySelector('h4')?.textContent.trim();
    if(RELATION_SECTION_TITLES.has(title))sec.remove();
  });
  wrap.insertAdjacentHTML('beforeend',section('关联',relationDrawerHtml(entity)));
  return wrap.innerHTML;
};

const _relationBaseRenderAll=renderAll;
renderAll=function(){
  _relationBaseRenderAll();
  normalizeRelationCards();
};

// 地点排序会单独重绘世界页，因此也要重新应用统一关系条。
const _relationBaseRenderWorld=renderWorld;
renderWorld=function(){
  _relationBaseRenderWorld();
  normalizeRelationCards($('#world'));
};

// 如果增强层已经先完成一次异步渲染，再补一次统一化。
(function ensureUnifiedRelations(){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(DATA.meta&&ENTITY.size){clearInterval(timer);normalizeRelationCards();}
    else if(tries>100)clearInterval(timer);
  },50);
})();
