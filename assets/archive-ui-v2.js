// 档案展示增强 v2：市场独立页、世界槽、人物/能力/携带分类。
// 仅改变展示与游戏外偏好读取，不改变正史事实。

(() => {
  const defaultNotice = $('.notice')?.innerHTML || '';
  let WORLD_SLOT = null;
  let WORLD_SLOT_ERROR = null;
  let MARKET_FILTER = '全部';

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
    if(tab === 'worldslot'){
      notice.innerHTML = '<b>世界槽是游戏外偏好配置。</b> 它只提高候选权重，不属于徐长卿认知或正史，也不会阻止槽外世界出现。';
    }else{
      notice.innerHTML = defaultNotice;
    }
  };

  function groupShell(title, cards, cls=''){
    if(!cards.length) return '';
    return `<div class="archive-group ${cls}"><div class="archive-group-head"><h3>${esc(title)}</h3><span class="count">${cards.length}</span></div><div class="archive-group-grid ${cls}">${cards.join('')}</div></div>`;
  }

  function peopleGroup(p){
    const text = [p.status, ...arr(p.tags)].join(' ');
    if(/死亡|已故/.test(text)) return '死亡';
    if(/当前同行/.test(text)) return '当前同行';
    if(/暂时同行/.test(text)) return '暂时同行';
    if(/失联|去向未知/.test(text)) return '失联';
    if(/已分开/.test(text)) return '已分开';
    if(/合作|联系人/.test(text)) return '联系人';
    return '其他人物';
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

  function cardMap(container){
    const map = new Map();
    [...container.querySelectorAll('.entity-card[data-entity]')].forEach(card => map.set(card.dataset.entity, card.outerHTML));
    return map;
  }

  const baseRenderPeopleV2 = renderPeople;
  renderPeople = function(){
    baseRenderPeopleV2();
    const root = $('#peopleGrid');
    if(!root) return;
    const cards = cardMap(root);
    const self = cards.get(DATA.player?.id);
    const order = ['当前同行','暂时同行','联系人','已分开','失联','死亡','其他人物'];
    const groups = Object.fromEntries(order.map(k => [k, []]));
    arr(DATA.people?.people).forEach(p => {
      const html = cards.get(p.id);
      if(html) (groups[peopleGroup(p)] ||= []).push(html);
    });
    root.innerHTML = `${self ? `<div class="archive-group self"><div class="archive-group-grid">${self}</div></div>` : ''}${order.map(k => groupShell(k, groups[k] || [], 'people')).join('')}`;
  };

  const baseRenderAbilitiesV2 = renderAbilities;
  renderAbilities = function(){
    baseRenderAbilitiesV2();
    const root = $('#abilitiesGrid');
    if(!root) return;
    const cards = cardMap(root);
    const order = ['核心','修炼','战斗','辅助','生产','其他'];
    const groups = Object.fromEntries(order.map(k => [k, []]));
    arr(DATA.abilities?.abilities).forEach(a => {
      const html = cards.get(a.id);
      if(html) groups[abilityGroup(a)].push(html);
    });
    root.innerHTML = order.map(k => groupShell(k, groups[k] || [])).join('');
  };

  const baseRenderInventoryV2 = renderInventory;
  renderInventory = function(){
    baseRenderInventoryV2();
    const root = $('#inventoryGrid');
    if(!root) return;
    const cards = cardMap(root);
    const order = ['战斗','生产','装备','资料','其他'];
    const groups = Object.fromEntries(order.map(k => [k, []]));
    arr(DATA.inventory?.items).forEach(i => {
      const html = cards.get(i.id);
      if(html) groups[itemGroup(i)].push(html);
    });
    root.innerHTML = order.map(k => groupShell(k, groups[k] || [])).join('');
  };

  const baseRenderWorldV2 = renderWorld;
  renderWorld = function(){
    baseRenderWorldV2();
    const target = scopeWorldId();
    const worlds = target ? DATA.worlds.filter(w => w.id === target) : DATA.worlds;
    const head = $$('#world .head').find(h => h.querySelector('h3')?.textContent.includes('已知规则'));
    if(head) head.innerHTML = '<div><h3>已知规则与市场摘要</h3><p>完整行情已移动到独立“市场”页</p></div>';
    const details = $('#worldDetails');
    if(!details) return;
    details.innerHTML = worlds.map(w => {
      const observations = typeof marketForWorld === 'function' ? marketForWorld(w.id) : [];
      const actual = observations.filter(o => ['成交','以物易物'].includes(o.priceType)).length;
      return `<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}"><div class="name">${esc(w.name)} · 已知规则</div><div class="details">${listHtml(w.knownRules)}</div></div>
      <div class="card searchable" data-search="市场 ${esc(w.name)}"><div class="name">${esc(w.name)} · 市场摘要</div><div class="details">已记录 ${observations.length} 条市场观察，其中实际成交/交换 ${actual} 条。价格历史不再在世界页全部展开。</div><button class="world-market-link" data-open-market="1">打开市场页</button></div>`;
    }).join('');
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
    const types = ['全部', ...new Set(all.map(o => o.priceType).filter(Boolean))];
    const shown = MARKET_FILTER === '全部' ? all : all.filter(o => o.priceType === MARKET_FILTER);
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
    <div class="market-filterbar">${types.map(t => `<button class="${t===MARKET_FILTER?'active':''}" data-market-filter="${esc(t)}">${esc(t)}</button>`).join('')}</div>
    <div class="market-groups">${[...grouped.entries()].map(([name, records]) => {
      const latest = records[records.length - 1];
      const latestText = typeof marketObservationText === 'function' ? marketObservationText(latest,{includeSubject:false,includeWorld:false}) : '';
      return `<details class="market-group searchable" data-search="${esc([name,...records.map(x=>[x.priceType,x.observedAt,x.note].join(' '))].join(' '))}"><summary><span class="market-group-title">${esc(name)}</span><span class="market-group-meta">${records.length} 条 · 最近：${esc(latestText)}</span></summary><div class="market-records">${records.slice().reverse().map(marketRecordHtml).join('')}</div></details>`;
    }).join('') || '<div class="empty">当前筛选没有市场观察。</div>'}</div>`;
  }

  function slotCards(list, recommended=false){
    return arr(list).map(x => `<div class="worldslot-card searchable" data-search="${esc([x.name,x.reason].join(' '))}"><div class="slot-name">${esc(x.name)}</div><div class="slot-meta">相对权重 ×${esc(x.weight)}${recommended?' · 推荐候选 / 未确认接触':' · 用户明确偏好'}</div>${x.reason?`<div class="slot-reason">${esc(x.reason)}</div>`:''}</div>`).join('');
  }

  function renderWorldSlot(){
    const root = $('#worldslotContent');
    if(!root) return;
    if(WORLD_SLOT_ERROR){ root.innerHTML = `<div class="empty">世界槽读取失败：${esc(WORLD_SLOT_ERROR)}</div>`; return; }
    if(!WORLD_SLOT){ root.innerHTML = '<div class="empty">正在读取世界槽……</div>'; return; }
    const p = WORLD_SLOT.selectionPolicy || {};
    root.innerHTML = `<div class="worldslot-banner"><div class="name">高权重候选池，不是白名单</div><div class="details">用户明确偏好 ×${esc(p.explicitPreferenceWeight)}；推荐候选 ×${esc(p.recommendedCandidateWeight)}；槽外基线 ×${esc(p.outsidePoolBaselineWeight)}。槽外作品和原创世界始终可以出现，权重只表示相对倾向。</div></div>
    <div class="head"><div><h3>用户明确偏好</h3><p>${arr(WORLD_SLOT.explicitPreferences).length} 个作品 / 系列</p></div></div>
    <div class="worldslot-grid">${slotCards(WORLD_SLOT.explicitPreferences)}</div>
    <div class="head"><div><h3>推荐候选</h3><p>根据现有偏好推测；不代表已经看过或玩过</p></div></div>
    <div class="worldslot-grid">${slotCards(WORLD_SLOT.recommendedCandidates,true)}</div>`;
  }

  const baseRenderAllV2 = renderAll;
  renderAll = function(){
    baseRenderAllV2();
    renderMarket();
    renderWorldSlot();
  };

  document.addEventListener('click', e => {
    const market = e.target.closest('[data-open-market]');
    if(market){ switchTab('market'); return; }
    const filter = e.target.closest('[data-market-filter]');
    if(filter){ MARKET_FILTER = filter.dataset.marketFilter; renderMarket(); applySearch(); }
  });

  fetch('data/world-slot.json', {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { WORLD_SLOT = data; renderWorldSlot(); applySearch(); })
    .catch(err => { WORLD_SLOT_ERROR = err.message; renderWorldSlot(); });
})();
