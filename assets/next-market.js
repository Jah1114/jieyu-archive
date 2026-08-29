// 市场观察层：价格属于“世界 / 地点 / 时间下的第一视角观察”，不是物品永久属性。

function marketObservations(){ return arr(DATA.inventory?.marketObservations); }
function marketCurrencyName(id){
  return arr(DATA.inventory?.currencies).find(c=>c.id===id)?.name || id || '未知货币';
}
function marketLocationName(id){ return id ? resolveName(id) : '地点未细分'; }
function marketAmountText(o){
  const currency=marketCurrencyName(o.currencyId);
  if(o.amountApprox!==undefined && o.amountApprox!==null) return `约 ${o.amountApprox} ${currency}`;
  if(o.amountMinApprox!==undefined && o.amountMaxApprox!==undefined) return `约 ${o.amountMinApprox}–${o.amountMaxApprox} ${currency}`;
  if(o.barterText) return o.barterText;
  return '价格未知';
}
function marketQuantityText(o){
  const q=o.quantity??1;
  return `${q}${o.unit||''}`;
}
function marketObservationText(o,{includeSubject=true,includeWorld=false}={}){
  const parts=[];
  if(includeSubject) parts.push(o.subjectName||'未命名对象');
  if(includeWorld) parts.push(worldName(o.worldId));
  parts.push(marketLocationName(o.locationId));
  parts.push(`${marketQuantityText(o)} / ${marketAmountText(o)}`);
  if(o.priceType) parts.push(o.priceType);
  return parts.join(' · ');
}
function marketForWorld(worldId){ return marketObservations().filter(o=>o.worldId===worldId); }
function marketForItem(itemId){ return marketObservations().filter(o=>o.itemId===itemId); }
function currentMarketForItem(itemId){ return marketForItem(itemId).filter(o=>o.worldId===DATA.meta.currentWorldId); }
function latestMarketForItem(itemId){
  const current=currentMarketForItem(itemId);
  if(current.length) return {observation:current[current.length-1],scope:'current'};
  const all=marketForItem(itemId);
  return all.length?{observation:all[all.length-1],scope:'historical'}:null;
}
function itemMarketSummary(itemId){
  const hit=latestMarketForItem(itemId);
  if(!hit) return '参考行情：未知';
  if(hit.scope==='historical') return `当前世界行情：未知 · 历史记录 ${marketForItem(itemId).length} 条`;
  return `参考行情：${marketObservationText(hit.observation,{includeSubject:false})}`;
}
function marketListHtml(xs,{includeSubject=true,includeWorld=false}={}){
  const list=arr(xs);
  if(!list.length) return '<div class="muted">暂无可靠市场观察。</div>';
  return list.map(o=>`<div>• ${esc(marketObservationText(o,{includeSubject,includeWorld}))}${o.note?`<div class="small muted" style="margin-left:12px">${esc(o.note)}</div>`:''}</div>`).join('');
}

const _marketBaseBuildIndex=buildIndex;
buildIndex=function(){
  _marketBaseBuildIndex();
  marketObservations().forEach(o=>{
    if(!o.id) DIAG.warnings.push('市场观察缺少 id');
    if(!o.subjectName) DIAG.warnings.push(`市场观察 ${o.id||'未知'} 缺少 subjectName`);
    if(!o.worldId) DIAG.warnings.push(`市场观察 ${o.id||'未知'} 缺少 worldId`);
    else validateRef(o.worldId,o.id||'market');
    if(o.locationId){
      validateRef(o.locationId,o.id||'market');
      const loc=ENTITY.get(o.locationId);
      if(loc && loc.type!=='location') DIAG.warnings.push(`市场观察 ${o.id} 的 locationId 不是地点实体：${o.locationId}`);
    }
    if(o.itemId){
      validateRef(o.itemId,o.id||'market');
      const item=ENTITY.get(o.itemId);
      if(item && item.type!=='item') DIAG.warnings.push(`市场观察 ${o.id} 的 itemId 不是物品实体：${o.itemId}`);
    }
    if(o.currencyId){
      validateRef(o.currencyId,o.id||'market');
      const currency=ENTITY.get(o.currencyId);
      if(currency && currency.type!=='currency') DIAG.warnings.push(`市场观察 ${o.id} 的 currencyId 不是货币实体：${o.currencyId}`);
    }
    const hasApprox=o.amountApprox!==undefined && o.amountApprox!==null;
    const hasRange=o.amountMinApprox!==undefined && o.amountMaxApprox!==undefined;
    if(!hasApprox && !hasRange && !o.barterText) DIAG.warnings.push(`市场观察 ${o.id||'未知'} 缺少价格 / 区间 / 以物易物说明`);
  });
};

const _marketBaseRenderWorld=renderWorld;
renderWorld=function(){
  _marketBaseRenderWorld();
  const target=scopeWorldId();
  const worlds=target?DATA.worlds.filter(w=>w.id===target):DATA.worlds;
  $('#worldDetails').innerHTML=worlds.map(w=>{
    const observations=marketForWorld(w.id);
    const search=[...arr(w.knownRules),...observations.map(o=>marketObservationText(o,{includeSubject:true}))].join(' ');
    return `<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}">
      <div class="name">${esc(w.name)} · 已知规则</div>
      <div class="details">${listHtml(w.knownRules)}</div>
    </div>
    <div class="card searchable" data-search="${esc(search)}">
      <div class="name">${esc(w.name)} · 市场观察</div>
      <div class="small muted" style="margin:6px 0 10px">价格是第一视角记录，不代表固定公允价；不同世界货币不自动换算。</div>
      <div class="details">${marketListHtml(observations)}</div>
    </div>`;
  }).join('');
};

const _marketBaseRenderInventory=renderInventory;
renderInventory=function(){
  const d=DATA.inventory;
  $('#currencyGrid').innerHTML=arr(d.currencies).map(c=>`<div class="card entity-card searchable" data-entity="${esc(c.id)}" data-search="${esc([c.name,c.scope,c.note].join(' '))}"><div class="label">${esc(c.scope)}</div><div class="big">${esc(c.amountApprox)} · ${esc(c.name)}</div><div class="small muted">${esc(c.note||'')}</div></div>`).join('');
  $('#inventoryGrid').innerHTML=arr(d.items).map(i=>{
    const actors=arr(i.actorLinks);
    const market=marketForItem(i.id);
    const search=[i.name,i.category,i.location,i.source,i.acquisitionMethod,i.acquisitionNote,i.crossWorldStatus,...actors.map(a=>resolveName(a.id)),...arr(i.relatedIds).map(resolveName),...market.map(o=>marketObservationText(o,{includeWorld:true}))].join(' ');
    return `<div class="card entity-card searchable" data-entity="${esc(i.id)}" data-search="${esc(search)}">
      <div class="row"><div class="name">${esc(i.name)}</div><span class="badge">约 ${esc(i.quantityApprox)}</span></div>
      ${chips([i.category,i.location,i.acquisitionMethod])}
      <div class="details">来源：${esc(i.source)}<br>跨界状态：${esc(i.crossWorldStatus)}<br><b>${esc(itemMarketSummary(i.id))}</b></div>
      ${actors.length?`<div class="details"><b>相关人物</b>${actorRoleLinks(actors)}</div>`:''}
    </div>`;
  }).join('');
};

const _marketBaseRenderDrawerContent=renderDrawerContent;
renderDrawerContent=function(e){
  const base=_marketBaseRenderDrawerContent(e);
  if(e.type==='item'){
    const current=currentMarketForItem(e.id);
    const historical=marketForItem(e.id).filter(o=>o.worldId!==DATA.meta.currentWorldId);
    let marketHtml='';
    if(current.length) marketHtml+=`<div class="drawer-note"><b>当前世界已知行情</b></div><div class="drawer-list">${marketListHtml(current,{includeSubject:false})}</div>`;
    else marketHtml+='<div class="drawer-note">当前世界暂无可靠行情，不自动从其他世界换算。</div>';
    if(historical.length) marketHtml+=`<div class="drawer-note" style="margin-top:10px"><b>其他世界历史记录</b></div><div class="drawer-list">${marketListHtml(historical,{includeSubject:false,includeWorld:true})}</div>`;
    return base+section('市场参考',marketHtml);
  }
  if(e.type==='world'){
    return base+section('市场观察',`<div class="drawer-list">${marketListHtml(marketForWorld(e.id))}</div>`);
  }
  return base;
};
