// next.html 增强层：在核心 next.js 之上实现第一视角档案的长期交互规则。

let LOCATION_SORT = 'importance';

const _baseBuildIndex = buildIndex;
buildIndex = function(){
  _baseBuildIndex();
  arr(DATA.timeline.events).forEach(e=>{
    arr(e.locationIds).forEach(locId=>{
      addBack(locId,e.id,'事件发生地');
      validateRef(locId,e.id);
      const target=ENTITY.get(locId);
      if(target && target.type!=='location') DIAG.warnings.push(`事件 ${e.id} 的地点引用不是地点实体：${locId}`);
    });
  });
};

const _baseBuildScope = buildScope;
buildScope = function(){
  _baseBuildScope();
  const s=$('#scope');
  const entries=arr(DATA.worldRegistry?.worlds).sort((a,b)=>a.order-b.order);
  s.innerHTML=`<option value="current">当前世界</option><option value="all">全部世界</option>` + entries.map(w=>{
    const visit=w.visitIndex?` · 第${w.visitIndex}次访问`:'';
    return `<option value="${esc(w.id)}">记录 ${String(w.order).padStart(2,'0')} · ${esc(w.name)}${visit}</option>`;
  }).join('');
  s.value=CURRENT_SCOPE;
};

const _baseRenderPeople = renderPeople;
renderPeople = function(){
  _baseRenderPeople();
  const rest=$('#peopleGrid').innerHTML;
  const p=DATA.player;
  const state=p.currentState||{};
  const self=`<div class="card entity-card searchable" data-entity="${esc(p.id)}" data-search="${esc([p.name,p.gender,p.age,state.realm,state.spiritualRoots,valueText(p.personality)].join(' '))}" style="grid-column:1/-1;border-color:#496052;background:#121b17">
    <div class="row">
      <div>
        <div class="label">第一视角档案主体</div>
        <div class="name" style="font-size:18px;margin-top:4px">${esc(p.name)}</div>
        ${chips([p.gender,`${p.age}岁`,'我 / 行者'])}
      </div>
      <span class="badge good">本人</span>
    </div>
    <div class="info-grid" style="margin-top:12px">
      <div class="k">境界</div><div class="v">${esc(state.realm)}</div>
      <div class="k">灵根</div><div class="v">${esc(state.spiritualRoots)}</div>
      <div class="k">身体 / 法力</div><div class="v">${esc(state.body)} / ${esc(state.mana)}</div>
      <div class="k">离界窗口</div><div class="v">${esc(state.exitWindow)}</div>
      <div class="k">核心天赋</div><div class="v">${esc(resolveName(p.coreTalentId))}</div>
    </div>
    <div class="statline"><span class="statpill">关联记录 ${backlinksFor(p.id).length}</span><span class="statpill">点击查看完整个人档案</span></div>
  </div>`;
  $('#peopleGrid').innerHTML=self+rest;
};

const _baseEventHtml = eventHtml;
eventHtml = function(e){
  const locIds=arr(e.locationIds);
  const search=[e.day,e.title,e.summary,...arr(e.links).map(resolveName),...locIds.map(resolveName)].join(' ');
  return `<div class="event entity-card searchable" data-entity="${esc(e.id)}" data-search="${esc(search)}">
    <div class="label">${esc(e.day)} · ${esc(worldName(e.worldId))}</div>
    <h4>${esc(e.title)}</h4>
    ${locIds.length?`<div class="details event-locations"><b>地点</b>${linkChips(locIds)}</div>`:''}
    <p>${esc(e.summary)}</p>
    ${linkChips(e.links)}
  </div>`;
};

const _baseEntityForwardLinks = entityForwardLinks;
entityForwardLinks = function(e){
  if(e?.type==='event') return [...arr(e.raw.locationIds),...arr(e.raw.links)];
  return _baseEntityForwardLinks(e);
};

function sortedLocations(worlds){
  const list=worlds.flatMap(w=>arr(w.knownLocations).map(l=>({...l,parentWorldId:w.id})));
  return list.sort((a,b)=>{
    if(LOCATION_SORT==='first') return (a.firstSeenOrder??9999)-(b.firstSeenOrder??9999) || a.name.localeCompare(b.name,'zh-CN');
    if(LOCATION_SORT==='name') return a.name.localeCompare(b.name,'zh-CN');
    return (b.importance??0)-(a.importance??0) || (a.firstSeenOrder??9999)-(b.firstSeenOrder??9999);
  });
}

renderWorld = function(){
  const target=scopeWorldId();
  const worlds=target?DATA.worlds.filter(w=>w.id===target):DATA.worlds;
  $('#worldGrid').innerHTML=worlds.map(w=>`<div class="card entity-card searchable" data-entity="${esc(w.id)}" data-search="${esc([w.name,w.phase,w.status,w.identity,w.currentLocation,w.timelineRelation].join(' '))}">
    <div class="label">${esc(w.status)}</div>
    <div class="big">${esc(w.name)}</div>
    <div class="small muted">${esc(w.phase)} · ${esc(w.currentLocation)}</div>
    <div class="statline"><span class="statpill">第 ${esc(w.visitIndex||1)} 次访问</span><span class="statpill">约第 ${esc(w.currentDayApprox)} 天</span><span class="statpill">${arr(w.knownLocations).length} 个长期地点</span></div>
  </div>`).join('');

  const locHead=$$('#world .head').find(h=>h.querySelector('h3')?.textContent.trim()==='已知地点');
  if(locHead){
    locHead.innerHTML=`<div><h3>已知地点</h3><p>只收录可反复进入、重大事件或长期有价值的地点</p></div>
      <select id="locationSort" class="scope compact-sort" aria-label="地点排序">
        <option value="importance">重要度</option>
        <option value="first">首次到达</option>
        <option value="name">名称</option>
      </select>`;
    $('#locationSort').value=LOCATION_SORT;
    $('#locationSort').addEventListener('change',e=>{ LOCATION_SORT=e.target.value; renderWorld(); applyFilterSearch(); });
  }

  const locs=sortedLocations(worlds);
  $('#locationsGrid').innerHTML=locs.length?locs.map(l=>`<div class="card entity-card searchable" data-entity="${esc(l.id)}" data-search="${esc([l.name,l.status,l.kind,l.note,worldName(l.parentWorldId)].join(' '))}">
    <div class="name">${esc(l.name)}</div>
    ${chips([l.status,l.kind,worldName(l.parentWorldId)])}
    <div class="details">${esc(l.note)}</div>
  </div>`).join(''):'<div class="empty">当前范围暂无需要长期保留的地点。</div>';

  $('#worldDetails').innerHTML=worlds.map(w=>`<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}"><div class="name">${esc(w.name)} · 已知规则</div><div class="details">${listHtml(w.knownRules)}</div></div><div class="card searchable" data-search="${esc(arr(w.economy?.knownPrices).join(' '))}"><div class="name">${esc(w.name)} · 已知价格</div><div class="details">${listHtml(w.economy?.knownPrices)}</div></div>`).join('');
};

const _baseRenderDrawerContent = renderDrawerContent;
renderDrawerContent = function(e){
  if(e.type==='event'){
    const r=e.raw;
    let html='';
    html+=section('事件资料',kvHtml([['时间',r.day],['世界',worldName(r.worldId)],['摘要',r.summary]]));
    if(arr(r.locationIds).length) html+=section('长期地点关联',linkChips(r.locationIds));
    html+=section('关联人物 / 能力 / 项目',linkChips(r.links));
    html+=section('反向关联',groupedBacklinksHtml(e.id));
    return html;
  }
  if(e.type==='world'){
    const r=e.raw;
    let html='';
    html+=section('访问记录',kvHtml([['作品世界',r.name],['本次访问',`第 ${r.visitIndex||1} 次`],['当前阶段',r.phase],['当前地点',r.currentLocation],['本地身份',r.identity],['离界窗口',r.exitWindow]]));
    html+=section('时间线关系',`<div class="drawer-note">${esc(r.timelineRelation||'当前尚未记录与其他访问实例的时间线关系。')}</div>`);
    html+=section('长期地点',linkChips(arr(r.knownLocations).map(l=>l.id)));
    html+=section('已知规则',`<div class="drawer-list">${listHtml(r.knownRules)}</div>`);
    html+=section('反向关联',groupedBacklinksHtml(e.id));
    return html;
  }
  if(e.type==='location'){
    const r=e.raw;
    let html='';
    html+=section('地点资料',kvHtml([['世界',worldName(r.parentWorldId)],['类型',r.kind],['状态',r.status],['备注',r.note]]));
    html+=section('相关事件',groupedBacklinksHtml(e.id));
    return html;
  }
  return _baseRenderDrawerContent(e);
};

function applyFilterSearch(){
  const q=$('#search').value.trim().toLowerCase();
  $$('.searchable').forEach(el=>{
    const match=!q || (el.dataset.search||'').toLowerCase().includes(q);
    el.hidden=!match;
    el.style.opacity='1';
  });

  const active=$('.section.active');
  if(active){
    let note=active.querySelector('.search-filter-note');
    if(!note){
      note=document.createElement('div');
      note.className='search-filter-note';
      active.prepend(note);
    }
    if(q){
      const count=$$('.searchable',active).filter(el=>!el.hidden).length;
      note.hidden=false;
      note.innerHTML=`正在筛选：<b>${esc($('#search').value.trim())}</b> · ${count} 条匹配`;
    }else{
      note.hidden=true;
      note.textContent='';
    }
  }
}

const _baseRenderAll = renderAll;
renderAll = function(){
  _baseRenderAll();
  const counts={
    people:arr(DATA.people.people).length+1,
    events:arr(DATA.timeline.events).length,
    chapters:arr(DATA.chapters.chapters).length,
    abilities:arr(DATA.abilities.abilities).length,
    projects:arr(DATA.projects.projects).length,
    intel:arr(DATA.intel.intel).length
  };
  $('#syncBox').innerHTML=`<div>
    <div><b>完整存档：</b>${counts.people} 人物 · ${counts.events} 事件 · ${counts.chapters} 正史章节 · ${counts.abilities} 能力 · ${counts.projects} 项目 · ${counts.intel} 情报</div>
    <div class="small muted" style="margin-top:4px"><b>最新叙事前沿：</b>${esc(DATA.meta.currentNarrative.frontier)}</div>
  </div><span class="badge good">存档 · 已读取</span>`;
  applyFilterSearch();
};

// 核心脚本原有搜索使用“变暗”；增强层改为真正过滤隐藏，并在每次输入后覆盖旧行为。
$('#search').addEventListener('input',applyFilterSearch);

// 切换页面时维持当前搜索词的过滤结果。
$('#nav').addEventListener('click',()=>setTimeout(applyFilterSearch,0));

// 即使浏览器缓存极快、核心脚本已经先完成一次渲染，也重新应用增强索引与界面。
(function ensureEnhancedRender(){
  let tries=0;
  const timer=setInterval(()=>{
    tries++;
    if(DATA.meta && DATA.player && DATA.timeline){
      clearInterval(timer);
      buildIndex();
      buildScope();
      renderAll();
    }else if(tries>100){
      clearInterval(timer);
    }
  },50);
})();
