// next.html 增强层：保持核心 next.js 稳定，在其异步数据加载完成前覆盖部分渲染/索引函数。

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
    ${locIds.length?`<div class="details" style="margin:4px 0 6px"><b>地点</b>${linkChips(locIds)}</div>`:''}
    <p>${esc(e.summary)}</p>
    ${linkChips(e.links)}
  </div>`;
};

const _baseEntityForwardLinks = entityForwardLinks;
entityForwardLinks = function(e){
  if(e?.type==='event') return [...arr(e.raw.locationIds),...arr(e.raw.links)];
  return _baseEntityForwardLinks(e);
};

const _baseRenderDrawerContent = renderDrawerContent;
renderDrawerContent = function(e){
  if(e.type!=='event') return _baseRenderDrawerContent(e);
  const r=e.raw;
  let html='';
  html+=section('事件资料',kvHtml([['时间',r.day],['世界',worldName(r.worldId)],['摘要',r.summary]]));
  html+=section('发生地点',arr(r.locationIds).length?linkChips(r.locationIds):'<div class="drawer-note">地点尚未精确归档。</div>');
  html+=section('关联人物 / 能力 / 项目',linkChips(r.links));
  html+=section('反向关联',groupedBacklinksHtml(e.id));
  return html;
};

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
};
