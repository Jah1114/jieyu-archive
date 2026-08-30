// 档案展示增强 v3：统一筛选式信息架构。
// 人物、世界、世界槽、旅程、能力、携带、项目、情报与市场均使用紧凑筛选条，不再用大块分类切割页面。
// 仅改变展示与游戏外偏好读取，不改变正史事实。

(() => {
  const defaultNotice = $('.notice')?.innerHTML || '';
  let WORLD_SLOT = null;
  let WORLD_SLOT_ERROR = null;
  let MARKET_FILTER = '全部';
  const FILTERS = {
    people:'全部', world:'全部', journey:'全部', abilities:'全部', inventory:'全部', projects:'全部', intel:'全部', worldslot:'全部'
  };

  TAB_TITLES.market = ['市场观察', '按对象折叠历史行情；报价、成交与以物易物保持区分'];
  TAB_TITLES.worldslot = ['世界槽', '游戏外高权重候选池；不是白名单，也不属于徐长卿第一视角正史'];

  function ensureExtraUi(){
    const nav = $('#nav');
    if(nav && !nav.querySelector('[data-tab="market"]')){
      const worldButton = nav.querySelector('[data-tab="world"]');
      worldButton?.insertAdjacentHTML('afterend', '<button data-tab="worldslot">世界槽</button><button data-tab="market">市场</button>');
    }
    const timeline = $('#timeline');
    if(timeline && !$('#market')){
      timeline.insertAdjacentHTML('beforebegin', '<section id="worldslot" class="section"><div id="worldslotContent"></div></section><section id="market" class="section"><div id="marketContent"></div></section>');
    }
  }
  ensureExtraUi();

  const baseSwitchTab = switchTab;
  switchTab = function(tab){
    baseSwitchTab(tab);
    const notice = $('.notice');
    if(!notice) return;
    notice.innerHTML = tab === 'worldslot'
      ? '<b>世界槽是游戏外偏好配置。</b> 它只提高候选权重，不属于徐长卿认知或正史，也不会阻止槽外世界出现。'
      : defaultNotice;
  };

  function peopleGroup(p){
    const text = [p.status, ...arr(p.tags), p.relationship].join(' ');
    if(/死亡|已故/.test(text)) return '死亡';
    if(/当前同行/.test(text)) return '当前同行';
    if(/暂时同行/.test(text)) return '暂时同行';
    if(/失联|去向未知/.test(text)) return '失联';
    if(/已分开/.test(text)) return '已分开';
    if(/合作|联系人|前辈/.test(text)) return '联系人';
    return '其他';
  }

  function abilityGroup(a){
    if(a.id === 'ability-wulianglinghai' || a.type === '天赋') return '核心';
    if(a.type === '功法') return '修炼';
    if(a.id === 'ability-talisman' || a.type === '技艺') return '生产';
    if(a.id === 'ability-conceal') return '辅助';
    if(['法术','技巧','武学'].includes(a.type)) return '战斗';
    return '其他';
  }

  function itemGroup(i){
    const c = String(i.category || '');
    if(/战斗|防御符箓|攻击/.test(c)) return '战斗';
    if(/制符|生产|材料|工具/.test(c)) return '生产';
    if(/储物|法器|装备/.test(c)) return '装备';
    if(/功法|资料|书|笔记/.test(c)) return '资料';
    return '其他';
  }

  function worldGroup(w){
    return (w.id === DATA.meta.currentWorldId || w.status === 'current') ? '当前访问' : '历史访问';
  }

  function journeyGroup(c){ return c.worldId === DATA.meta.currentWorldId ? '当前世界' : '历史世界'; }

  function intelGroup(i){
    const s = String(i.status || '');
    if(/高可信/.test(s)) return '高可信推测';
    if(/机制未知|未知机制/.test(s)) return '现象确认·机制未知';
    if(/已确认/.test(s)) return '已确认';
    return '其他';
  }

  function countOptions(records, grouper, preferred=[]){
    const counts = new Map();
    arr(records).forEach(x => {
      const k = grouper(x);
      counts.set(k, (counts.get(k) || 0) + 1);
    });
    const keys = [...preferred.filter(k => counts.has(k)), ...[...counts.keys()].filter(k => !preferred.includes(k))];
    return [{label:'全部', count:arr(records).length}, ...keys.map(k => ({label:k,count:counts.get(k)}))].filter(x => x.label === '全部' || x.count > 0);
  }

  function normalizeFilter(tab, options){
    const valid = new Set(options.map(x => x.label));
    if(!valid.has(FILTERS[tab])) FILTERS[tab] = '全部';
  }

  function filterBarHtml(tab, options){
    normalizeFilter(tab, options);
    return options.map(x => `<button class="${FILTERS[tab]===x.label?'active':''}" data-archive-filter-tab="${esc(tab)}" data-archive-filter-value="${esc(x.label)}"><span>${esc(x.label)}</span><span class="filter-count">${esc(x.count)}</span></button>`).join('');
  }

  function mountFilterBar(tab, target, options){
    if(!target) return;
    let bar = target.previousElementSibling;
    if(!bar || !bar.classList.contains('archive-filterbar') || bar.dataset.filterTab !== tab){
      bar = document.createElement('div');
      bar.className = 'archive-filterbar';
      bar.dataset.filterTab = tab;
      target.parentNode.insertBefore(bar, target);
    }
    bar.innerHTML = filterBarHtml(tab, options);
  }

  function setEntityCards(root, matcher){
    if(!root) return;
    root.querySelectorAll('.entity-card[data-entity]').forEach(card => {
      const entity = ENTITY.get(card.dataset.entity);
      card.hidden = !matcher(entity);
    });
  }

  const baseRenderPeopleV3 = renderPeople;
  renderPeople = function(){
    baseRenderPeopleV3();
    const root = $('#peopleGrid');
    if(!root) return;
    const records = arr(DATA.people?.people);
    const options = countOptions(records, peopleGroup, ['当前同行','暂时同行','联系人','已分开','失联','死亡','其他']);
    mountFilterBar('people', root, options);
    const current = FILTERS.people;
    setEntityCards(root, e => {
      if(!e) return false;
      if(e.type === 'player') return current === '全部';
      if(e.type !== 'person') return false;
      return current === '全部' || peopleGroup(e.raw) === current;
    });
  };

  const baseRenderAbilitiesV3 = renderAbilities;
  renderAbilities = function(){
    baseRenderAbilitiesV3();
    const root = $('#abilitiesGrid');
    if(!root) return;
    const records = arr(DATA.abilities?.abilities);
    const options = countOptions(records, abilityGroup, ['核心','修炼','战斗','辅助','生产','其他']);
    mountFilterBar('abilities', root, options);
    const current = FILTERS.abilities;
    setEntityCards(root, e => e?.type === 'ability' && (current === '全部' || abilityGroup(e.raw) === current));
  };

  const baseRenderInventoryV3 = renderInventory;
  renderInventory = function(){
    baseRenderInventoryV3();
    const root = $('#inventoryGrid');
    if(!root) return;
    const records = arr(DATA.inventory?.items);
    const options = countOptions(records, itemGroup, ['战斗','生产','装备','资料','其他']);
    mountFilterBar('inventory', root, options);
    const current = FILTERS.inventory;
    setEntityCards(root, e => e?.type === 'item' && (current === '全部' || itemGroup(e.raw) === current));
  };

  const baseRenderProjectsV3 = renderProjects;
  renderProjects = function(){
    baseRenderProjectsV3();
    const root = $('#projectsGrid');
    if(!root) return;
    const records = arr(DATA.projects?.projects);
    const options = countOptions(records, p => p.type || '其他');
    mountFilterBar('projects', root, options);
    const current = FILTERS.projects;
    setEntityCards(root, e => e?.type === 'project' && (current === '全部' || (e.raw.type || '其他') === current));
  };

  const baseRenderIntelV3 = renderIntel;
  renderIntel = function(){
    baseRenderIntelV3();
    const root = $('#intelGrid');
    if(!root) return;
    const records = arr(DATA.intel?.intel).filter(i => matchesScopeByWorld(i.scope?.startsWith('world-') ? i.scope : null, true));
    const options = countOptions(records, intelGroup, ['已确认','现象确认·机制未知','高可信推测','其他']);
    mountFilterBar('intel', root, options);
    const current = FILTERS.intel;
    setEntityCards(root, e => e?.type === 'intel' && (current === '全部' || intelGroup(e.raw) === current));
  };

  const baseRenderJourneyV3 = renderJourney;
  renderJourney = function(){
    baseRenderJourneyV3();
    const root = $('#journeyGrid');
    if(!root) return;
    const records = arr(DATA.chapters?.chapters).filter(c => matchesScopeByWorld(c.worldId, true));
    const options = countOptions(records, journeyGroup, ['当前世界','历史世界']);
    mountFilterBar('journey', root, options);
    const current = FILTERS.journey;
    setEntityCards(root, e => e?.type === 'chapter' && (current === '全部' || journeyGroup(e.raw) === current));
  };

  const baseRenderWorldV3 = renderWorld;
  renderWorld = function(){
    baseRenderWorldV3();
    const target = scopeWorldId();
    const scopedWorlds = target ? DATA.worlds.filter(w => w.id === target) : DATA.worlds;
    const options = countOptions(scopedWorlds, worldGroup, ['当前访问','历史访问']);
    const worldRoot = $('#worldGrid');
    mountFilterBar('world', worldRoot, options);
    const current = FILTERS.world;
    const selected = scopedWorlds.filter(w => current === '全部' || worldGroup(w) === current);
    const selectedIds = new Set(selected.map(w => w.id));

    setEntityCards(worldRoot, e => e?.type === 'world' && selectedIds.has(e.id));
    setEntityCards($('#locationsGrid'), e => e?.type === 'location' && selectedIds.has(e.raw.parentWorldId));

    const head = $$('#world .head').find(h => h.querySelector('h3')?.textContent.includes('已知规则'));
    if(head) head.innerHTML = '<div><h3>已知规则与市场摘要</h3><p>完整行情已移动到独立“市场”页</p></div>';
    const details = $('#worldDetails');
    if(details){
      details.innerHTML = selected.map(w => {
        const observations = typeof marketForWorld === 'function' ? marketForWorld(w.id) : [];
        const actual = observations.filter(o => ['成交','以物易物'].includes(o.priceType)).length;
        return `<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}"><div class="name">${esc(w.name)} · 已知规则</div><div class="details">${listHtml(w.knownRules)}</div></div>
        <div class="card searchable" data-search="市场 ${esc(w.name)}"><div class="name">${esc(w.name)} · 市场摘要</div><div class="details">已记录 ${observations.length} 条市场观察，其中实际成交/交换 ${actual} 条。价格历史不再在世界页全部展开。</div><button class="world-market-link" data-open-market="1">打开市场页</button></div>`;
      }).join('') || '<div class="empty" style="grid-column:1/-1">当前筛选没有世界记录。</div>';
    }
  };

  function marketRecordsForScope(){
    let list = typeof marketObservations === 'function' ? marketObservations() : [];
    const target = scopeWorldId();
    if(target) list = list.filter(o => o.worldId === target);
    return list;
  }

  function marketRecordHtml(o){
    const text = typeof marketObservationText === 'function' ? marketObservationText(o, {includeSubject:false, includeWorld:CURRENT_SCOPE === 'all'}) : (o.subjectName || '市场记录');
    return `<div class="market-record searchable" data-search="${esc([o.subjectName,o.priceType,o.observedAt,o.note,text].join(' '))}"><div class="record-main">${esc(text)}</div><div class="small muted">${esc([o.observedAt,o.note].filter(Boolean).join(' · '))}</div></div>`;
  }

  function renderMarket(){
    const root = $('#marketContent');
    if(!root) return;
    const all = marketRecordsForScope();
    const actual = all.filter(o => ['成交','以物易物'].includes(o.priceType));
    const subjects = new Set(all.map(o => o.subjectName).filter(Boolean));
    const typeCounts = new Map();
    all.forEach(o => { const k=o.priceType||'其他'; typeCounts.set(k,(typeCounts.get(k)||0)+1); });
    const types = [{label:'全部',count:all.length}, ...[...typeCounts].map(([label,count])=>({label,count}))];
    if(!types.some(x=>x.label===MARKET_FILTER)) MARKET_FILTER='全部';
    const shown = MARKET_FILTER === '全部' ? all : all.filter(o => (o.priceType||'其他') === MARKET_FILTER);
    const grouped = new Map();
    shown.forEach(o => {
      const key = o.subjectName || '未命名对象';
      if(!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(o);
    });
    root.innerHTML = `<div class="market-summary">
      <div class="card"><div class="label">当前范围</div><div class="big">${all.length}</div><div class="small muted">市场观察总数</div></div>
      <div class="card"><div class="label">已验证</div><div class="big">${actual.length}</div><div class="small muted">实际成交 / 以物易物</div></div>
      <div class="card"><div class="label">对象</div><div class="big">${subjects.size}</div><div class="small muted">独立商品 / 行情主题</div></div>
    </div>
    <div class="archive-filterbar market-filterbar">${types.map(x => `<button class="${x.label===MARKET_FILTER?'active':''}" data-market-filter="${esc(x.label)}"><span>${esc(x.label)}</span><span class="filter-count">${esc(x.count)}</span></button>`).join('')}</div>
    <div class="market-groups">${[...grouped.entries()].map(([name, records]) => {
      const latest = records[records.length - 1];
      const latestText = typeof marketObservationText === 'function' ? marketObservationText(latest,{includeSubject:false,includeWorld:false}) : '';
      return `<details class="market-group searchable" data-search="${esc([name,...records.map(x=>[x.priceType,x.observedAt,x.note].join(' '))].join(' '))}"><summary><span class="market-group-title">${esc(name)}</span><span class="market-group-meta">${records.length} 条 · 最近：${esc(latestText)}</span></summary><div class="market-records">${records.slice().reverse().map(marketRecordHtml).join('')}</div></details>`;
    }).join('') || '<div class="empty">当前筛选没有市场观察。</div>'}</div>`;
  }

  function slotCard(x, recommended=false){
    return `<div class="worldslot-card searchable" data-slot-group="${recommended?'推荐候选':'明确偏好'}" data-search="${esc([x.name,x.reason].join(' '))}"><div class="slot-name">${esc(x.name)}</div><div class="slot-meta">相对权重 ×${esc(x.weight)}${recommended?' · 推荐候选 / 未确认接触':' · 用户明确偏好'}</div>${x.reason?`<div class="slot-reason">${esc(x.reason)}</div>`:''}</div>`;
  }

  function renderWorldSlot(){
    const root = $('#worldslotContent');
    if(!root) return;
    if(WORLD_SLOT_ERROR){ root.innerHTML = `<div class="empty">世界槽读取失败：${esc(WORLD_SLOT_ERROR)}</div>`; return; }
    if(!WORLD_SLOT){ root.innerHTML = '<div class="empty">正在读取世界槽……</div>'; return; }
    const p = WORLD_SLOT.selectionPolicy || {};
    const explicit = arr(WORLD_SLOT.explicitPreferences);
    const recommended = arr(WORLD_SLOT.recommendedCandidates);
    const records = [
      ...explicit.map(x=>({...x,_group:'明确偏好'})),
      ...recommended.map(x=>({...x,_group:'推荐候选'}))
    ];
    const options = countOptions(records, x=>x._group, ['明确偏好','推荐候选']);
    normalizeFilter('worldslot', options);
    const current = FILTERS.worldslot;
    const cards = records.filter(x=>current==='全部'||x._group===current).map(x=>slotCard(x,x._group==='推荐候选')).join('');
    root.innerHTML = `<div class="worldslot-banner"><div class="name">高权重候选池，不是白名单</div><div class="details">用户明确偏好 ×${esc(p.explicitPreferenceWeight)}；推荐候选 ×${esc(p.recommendedCandidateWeight)}；槽外基线 ×${esc(p.outsidePoolBaselineWeight)}。槽外作品和原创世界始终可以出现，权重只表示相对倾向。</div></div>
    <div class="archive-filterbar">${filterBarHtml('worldslot',options)}</div>
    <div class="worldslot-grid">${cards || '<div class="empty" style="grid-column:1/-1">当前筛选没有候选世界。</div>'}</div>`;
  }

  const baseRenderAllV3 = renderAll;
  renderAll = function(){
    baseRenderAllV3();
    renderMarket();
    renderWorldSlot();
  };

  const rerender = {
    people:()=>renderPeople(), world:()=>renderWorld(), journey:()=>renderJourney(), abilities:()=>renderAbilities(),
    inventory:()=>renderInventory(), projects:()=>renderProjects(), intel:()=>renderIntel(), worldslot:()=>renderWorldSlot()
  };

  document.addEventListener('click', e => {
    const market = e.target.closest('[data-open-market]');
    if(market){ switchTab('market'); return; }

    const marketFilter = e.target.closest('[data-market-filter]');
    if(marketFilter){
      MARKET_FILTER = marketFilter.dataset.marketFilter;
      renderMarket();
      applySearch();
      return;
    }

    const filter = e.target.closest('[data-archive-filter-tab]');
    if(filter){
      const tab = filter.dataset.archiveFilterTab;
      FILTERS[tab] = filter.dataset.archiveFilterValue;
      rerender[tab]?.();
      applySearch();
    }
  });

  fetch('data/world-slot.json', {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { WORLD_SLOT = data; renderWorldSlot(); applySearch(); })
    .catch(err => { WORLD_SLOT_ERROR = err.message; renderWorldSlot(); });
})();
