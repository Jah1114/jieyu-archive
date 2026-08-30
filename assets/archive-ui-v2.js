// 档案展示增强 v5：顶部世界范围 + 少量稳定大类筛选 + 最终交互收口。
// 世界 / 旅程等已经由顶部世界范围控制的页面不重复增加本地“当前/历史世界”筛选。
// 人物、能力、携带、项目、情报、世界槽与市场只保留少量长期稳定的大类。
// 本层同时负责分类筛选与搜索的最终合并、页头一致性和跨世界页面的范围提示。
// 仅改变展示与游戏外偏好读取，不改变正史事实。

(() => {
  const defaultNotice = $('.notice')?.innerHTML || '';
  let WORLD_SLOT = null;
  let WORLD_SLOT_ERROR = null;
  let MARKET_FILTER = '全部';
  const FILTERS = {
    people:'全部',
    abilities:'全部',
    inventory:'全部',
    projects:'全部',
    intel:'全部',
    worldslot:'全部'
  };
  const UNSCOPED_TABS = new Set(['worldslot','abilities','inventory','diagnostics']);

  TAB_TITLES.market = ['市场观察', '顶部世界范围负责世界切换；本页只按交易性质做少量筛选'];
  TAB_TITLES.worldslot = ['世界槽', '游戏外高权重候选池；不是白名单，也不属于徐长卿第一视角正史'];

  function ensureExtraUi(){
    const nav = $('#nav');
    if(nav && !nav.querySelector('[data-tab="market"]')){
      const worldButton = nav.querySelector('[data-tab="world"]');
      worldButton?.insertAdjacentHTML('afterend', '<button type="button" data-tab="worldslot">世界槽</button><button type="button" data-tab="market">市场</button>');
    }
    const timeline = $('#timeline');
    if(timeline && !$('#market')){
      timeline.insertAdjacentHTML('beforebegin', '<section id="worldslot" class="section"><div id="worldslotContent"></div></section><section id="market" class="section"><div id="marketContent"></div></section>');
    }
  }
  ensureExtraUi();

  function activeTab(){ return $('.section.active')?.id || 'overview'; }
  function refreshActiveHeader(){
    const tab = activeTab();
    const title = TAB_TITLES[tab] || TAB_TITLES.overview;
    $('#pageTitle').textContent = title[0];
    $('#pageSub').textContent = title[1];
    const scope = $('#scope');
    if(scope){
      const ignored = UNSCOPED_TABS.has(tab);
      scope.disabled = ignored;
      scope.title = ignored ? '当前页展示跨世界或全局信息，不受世界范围筛选' : '按世界范围筛选当前页';
      scope.setAttribute('aria-label', ignored ? '世界范围（当前页不适用）' : '世界范围');
    }
  }

  function applyArchiveSearch(){
    const input = $('#search');
    if(!input) return;
    const q = input.value.trim().toLowerCase();
    $$('.searchable').forEach(el => {
      const categoryHidden = el.dataset.archiveFilterHidden === '1';
      const match = !q || (el.dataset.search || '').toLowerCase().includes(q);
      el.hidden = categoryHidden || !match;
      el.style.opacity = '1';
    });

    const active = $('.section.active');
    if(active){
      let note = active.querySelector('.search-filter-note');
      if(!note){
        note = document.createElement('div');
        note.className = 'search-filter-note';
        active.prepend(note);
      }
      if(q){
        const count = $$('.searchable',active).filter(el => {
          if(el.hidden) return false;
          return !el.parentElement?.closest('.searchable');
        }).length;
        note.hidden = false;
        note.innerHTML = `正在筛选：<b>${esc(input.value.trim())}</b> · ${count} 条匹配`;
      }else{
        note.hidden = true;
        note.textContent = '';
      }
    }
  }

  const baseSwitchTab = switchTab;
  switchTab = function(tab){
    baseSwitchTab(tab);
    const notice = $('.notice');
    if(notice){
      notice.innerHTML = tab === 'worldslot'
        ? '<b>世界槽是游戏外偏好配置。</b> 它只提高候选权重，不属于徐长卿认知或正史，也不会阻止槽外世界出现。'
        : defaultNotice;
    }
    refreshActiveHeader();
    // next-enhancements 也会在切页后重放搜索；本层后注册，最终以分类 + 搜索的交集为准。
    setTimeout(applyArchiveSearch, 0);
  };

  function peopleGroup(p){
    const text = [p.status, ...arr(p.tags), p.relationship].join(' ');
    if(/死亡|已故/.test(text)) return '死亡';
    if(/当前同行|暂时同行/.test(text)) return '同行';
    if(/已分开|失联|去向未知/.test(text)) return '分离';
    if(/合作|联系人|可信|前辈|交易伙伴/.test(text)) return '联系';
    return '其他';
  }

  function abilityGroup(a){
    if(a.id === 'ability-wulianglinghai' || a.type === '天赋') return '核心';
    if(a.type === '功法') return '修炼';
    if(a.type === '技艺') return '技艺';
    if(['法术','技巧','武学'].includes(a.type)) return '战斗';
    return '其他';
  }

  function itemGroup(i){
    const c = String(i.category || '');
    if(/符箓|战斗|攻击|防御/.test(c)) return '战斗';
    if(/储物|法器|装备|工具|容器/.test(c)) return '装备';
    if(/材料|药材|草药|灵草|朱砂|符纸/.test(c)) return '材料';
    if(/功法|资料|书|笔记|册|知识/.test(c)) return '资料';
    return '其他';
  }

  function projectGroup(p){
    const t = String(p.type || '');
    if(/研究|实验|调查/.test(t)) return '研究';
    if(/资源|采购|建设|经营/.test(t)) return '资源';
    if(/能力|生产|发展|修炼|技艺/.test(t)) return '发展';
    return '其他';
  }

  function intelGroup(i){
    const s = String(i.status || '');
    if(/机制未知|未知机制|未解|现象/.test(s)) return '未解';
    if(/推测|可能|待验证/.test(s)) return '推测';
    if(/已确认|确认原则|确认事实/.test(s)) return '已确认';
    return '其他';
  }

  function marketGroup(o){
    const t = String(o.priceType || '');
    if(/以物易物|交换/.test(t)) return '交换';
    if(/成交/.test(t)) return '成交';
    if(/开价|报价|收购|买价|卖价/.test(t)) return '报价';
    return '观察';
  }

  function countOptions(records, grouper, preferred=[]){
    const counts = new Map();
    arr(records).forEach(x => {
      const key = grouper(x);
      counts.set(key, (counts.get(key) || 0) + 1);
    });
    const keys = [
      ...preferred.filter(k => counts.has(k)),
      ...[...counts.keys()].filter(k => !preferred.includes(k))
    ];
    return [
      {label:'全部', count:arr(records).length},
      ...keys.map(k => ({label:k, count:counts.get(k)}))
    ].filter(x => x.label === '全部' || x.count > 0);
  }

  function normalizeFilter(tab, options){
    const valid = new Set(options.map(x => x.label));
    if(!valid.has(FILTERS[tab])) FILTERS[tab] = '全部';
  }

  function filterBarHtml(tab, options){
    normalizeFilter(tab, options);
    return options.map(x => {
      const active = FILTERS[tab] === x.label;
      return `<button type="button" class="${active?'active':''}" aria-pressed="${active?'true':'false'}" data-archive-filter-tab="${esc(tab)}" data-archive-filter-value="${esc(x.label)}"><span>${esc(x.label)}</span><span class="filter-count">${esc(x.count)}</span></button>`;
    }).join('');
  }

  function mountFilterBar(tab, target, options){
    if(!target) return;
    let bar = target.previousElementSibling;
    if(options.length <= 2){
      if(bar?.classList.contains('archive-filterbar') && bar.dataset.filterTab === tab) bar.remove();
      FILTERS[tab] = '全部';
      return;
    }
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
      const categoryHidden = !matcher(entity);
      card.dataset.archiveFilterHidden = categoryHidden ? '1' : '0';
      card.hidden = categoryHidden;
    });
  }

  function recordsFromCards(root, type){
    if(!root) return [];
    return [...root.querySelectorAll('.entity-card[data-entity]')]
      .map(card => ENTITY.get(card.dataset.entity))
      .filter(e => e?.type === type)
      .map(e => e.raw);
  }

  const baseRenderOverviewV5 = renderOverview;
  renderOverview = function(){
    baseRenderOverviewV5();
    const w = currentWorld();
    const narrative = DATA.meta?.currentNarrative || {};
    const state = DATA.player?.currentState || {};
    const core = arr(DATA.abilities?.abilities).find(a => a.id === DATA.player?.coreTalentId);
    $('#overviewCards').innerHTML = [
      ['当前世界',w?.name || '未知',w?.phase || ''],
      ['时间',narrative.worldDay ? `第 ${narrative.worldDay} 天` : '未知',`${narrative.dayPart || ''}${narrative.location ? ` · ${narrative.location}` : ''}`],
      ['境界',state.realm || '未知',state.spiritualRoots || ''],
      ['离界窗口',state.exitWindow || '未知','以当前角色状态记录为准']
    ].map(x=>`<div class="card searchable" data-search="${esc(x.join(' '))}"><div class="label">${esc(x[0])}</div><div class="big">${esc(x[1])}</div><div class="small muted">${esc(x[2])}</div></div>`).join('');

    $('#currentState').innerHTML = [
      ['核心天赋',core?.name || resolveName(DATA.player?.coreTalentId),arr(core?.effects)[0] || '详见能力页'],
      ['身体 / 法力',`${state.body || '未知'} / ${state.mana || '未知'}`,state.realm ? `当前境界：${state.realm}` : ''],
      ['当前叙事前沿',narrative.location || '未知',narrative.frontier || '暂无记录']
    ].map(x=>`<div class="card searchable" data-search="${esc(x.join(' '))}"><div class="label">${esc(x[0])}</div><div class="big">${esc(x[1])}</div><div class="small muted">${esc(x[2])}</div></div>`).join('');
  };

  const baseRenderPeopleV5 = renderPeople;
  renderPeople = function(){
    baseRenderPeopleV5();
    const root = $('#peopleGrid');
    if(!root) return;
    const records = recordsFromCards(root, 'person');
    const options = countOptions(records, peopleGroup, ['同行','联系','分离','死亡','其他']);
    if(options[0] && root.querySelector(`[data-entity="${CSS.escape(DATA.player?.id || '')}"]`)) options[0].count += 1;
    mountFilterBar('people', root, options);
    const current = FILTERS.people;
    setEntityCards(root, e => {
      if(!e) return false;
      if(e.type === 'player') return current === '全部';
      if(e.type !== 'person') return false;
      return current === '全部' || peopleGroup(e.raw) === current;
    });
  };

  const baseRenderAbilitiesV5 = renderAbilities;
  renderAbilities = function(){
    baseRenderAbilitiesV5();
    const root = $('#abilitiesGrid');
    if(!root) return;
    const records = recordsFromCards(root, 'ability');
    const options = countOptions(records, abilityGroup, ['核心','修炼','战斗','技艺','其他']);
    mountFilterBar('abilities', root, options);
    const current = FILTERS.abilities;
    setEntityCards(root, e => e?.type === 'ability' && (current === '全部' || abilityGroup(e.raw) === current));
  };

  const baseRenderInventoryV5 = renderInventory;
  renderInventory = function(){
    baseRenderInventoryV5();
    const root = $('#inventoryGrid');
    if(!root) return;
    const records = recordsFromCards(root, 'item');
    const options = countOptions(records, itemGroup, ['战斗','装备','材料','资料','其他']);
    mountFilterBar('inventory', root, options);
    const current = FILTERS.inventory;
    setEntityCards(root, e => e?.type === 'item' && (current === '全部' || itemGroup(e.raw) === current));
  };

  const baseRenderProjectsV5 = renderProjects;
  renderProjects = function(){
    baseRenderProjectsV5();
    const root = $('#projectsGrid');
    if(!root) return;
    const records = recordsFromCards(root, 'project');
    const options = countOptions(records, projectGroup, ['研究','发展','资源','其他']);
    mountFilterBar('projects', root, options);
    const current = FILTERS.projects;
    setEntityCards(root, e => e?.type === 'project' && (current === '全部' || projectGroup(e.raw) === current));
  };

  const baseRenderIntelV5 = renderIntel;
  renderIntel = function(){
    baseRenderIntelV5();
    const root = $('#intelGrid');
    if(!root) return;
    const records = recordsFromCards(root, 'intel');
    const options = countOptions(records, intelGroup, ['已确认','推测','未解','其他']);
    mountFilterBar('intel', root, options);
    const current = FILTERS.intel;
    setEntityCards(root, e => e?.type === 'intel' && (current === '全部' || intelGroup(e.raw) === current));
  };

  // 世界页和旅程页已经由顶部“世界范围”完整控制，不再叠加重复的当前/历史筛选。
  const baseRenderWorldV5 = renderWorld;
  renderWorld = function(){
    baseRenderWorldV5();
    const target = scopeWorldId();
    const worlds = target ? DATA.worlds.filter(w => w.id === target) : DATA.worlds;
    const head = $$('#world .head').find(h => h.querySelector('h3')?.textContent.includes('已知规则'));
    if(head) head.innerHTML = '<div><h3>已知规则与市场摘要</h3><p>完整行情已移动到独立“市场”页；世界范围由页面顶部统一控制</p></div>';
    const details = $('#worldDetails');
    if(!details) return;
    details.innerHTML = worlds.map(w => {
      const observations = typeof marketForWorld === 'function' ? marketForWorld(w.id) : [];
      const actual = observations.filter(o => ['成交','交换'].includes(marketGroup(o))).length;
      return `<div class="card searchable" data-search="${esc(arr(w.knownRules).join(' '))}"><div class="name">${esc(w.name)} · 已知规则</div><div class="details">${listHtml(w.knownRules)}</div></div>
      <div class="card searchable" data-search="市场 ${esc(w.name)}"><div class="name">${esc(w.name)} · 市场摘要</div><div class="details">已记录 ${observations.length} 条市场观察，其中实际成交/交换 ${actual} 条。完整价格历史在“市场”页查看。</div><button type="button" class="world-market-link" data-open-market="1">打开市场页</button></div>`;
    }).join('');
  };

  function marketRecordsForScope(){
    let list = typeof marketObservations === 'function' ? marketObservations() : [];
    const target = scopeWorldId();
    if(target) list = list.filter(o => o.worldId === target);
    return list;
  }

  function marketRecordHtml(o){
    const text = typeof marketObservationText === 'function'
      ? marketObservationText(o, {includeSubject:false, includeWorld:CURRENT_SCOPE === 'all'})
      : (o.subjectName || '市场记录');
    return `<div class="market-record searchable" data-search="${esc([o.subjectName,o.priceType,o.observedAt,o.note,text].join(' '))}"><div class="record-main">${esc(text)}</div><div class="small muted">${esc([o.observedAt,o.note].filter(Boolean).join(' · '))}</div></div>`;
  }

  function renderMarket(){
    const root = $('#marketContent');
    if(!root) return;
    const all = marketRecordsForScope();
    const actual = all.filter(o => ['成交','交换'].includes(marketGroup(o)));
    const subjects = new Set(all.map(o => o.subjectName).filter(Boolean));
    const options = countOptions(all, marketGroup, ['成交','报价','交换','观察']);
    const valid = new Set(options.map(x => x.label));
    if(!valid.has(MARKET_FILTER)) MARKET_FILTER = '全部';
    const shown = MARKET_FILTER === '全部' ? all : all.filter(o => marketGroup(o) === MARKET_FILTER);

    const grouped = new Map();
    shown.forEach(o => {
      const key = o.subjectName || '未命名对象';
      if(!grouped.has(key)) grouped.set(key, []);
      grouped.get(key).push(o);
    });

    const filterBar = options.length > 2
      ? `<div class="archive-filterbar market-filterbar">${options.map(x => {
          const active = x.label === MARKET_FILTER;
          return `<button type="button" class="${active?'active':''}" aria-pressed="${active?'true':'false'}" data-market-filter="${esc(x.label)}"><span>${esc(x.label)}</span><span class="filter-count">${esc(x.count)}</span></button>`;
        }).join('')}</div>`
      : '';

    root.innerHTML = `<div class="market-summary">
      <div class="card"><div class="label">当前范围</div><div class="big">${all.length}</div><div class="small muted">市场观察总数</div></div>
      <div class="card"><div class="label">已验证</div><div class="big">${actual.length}</div><div class="small muted">实际成交 / 交换</div></div>
      <div class="card"><div class="label">对象</div><div class="big">${subjects.size}</div><div class="small muted">独立商品 / 行情主题</div></div>
    </div>
    ${filterBar}
    <div class="market-groups">${[...grouped.entries()].map(([name, records]) => {
      const latest = records[records.length - 1];
      const latestText = typeof marketObservationText === 'function'
        ? marketObservationText(latest,{includeSubject:false,includeWorld:false})
        : '';
      return `<details class="market-group searchable" data-search="${esc([name,...records.map(x=>[x.priceType,x.observedAt,x.note].join(' '))].join(' '))}"><summary><span class="market-group-title">${esc(name)}</span><span class="market-group-meta">${records.length} 条 · 最近：${esc(latestText)}</span></summary><div class="market-records">${records.slice().reverse().map(marketRecordHtml).join('')}</div></details>`;
    }).join('') || '<div class="empty">当前筛选没有市场观察。</div>'}</div>`;
  }

  function slotCardHtml(x, kind){
    const description = x.description || x.reason || '暂无介绍。';
    const label = kind === 'explicit' ? '明确偏好' : '推荐候选';
    return `<div class="worldslot-card searchable" data-slot-kind="${kind}" data-search="${esc([x.name,description,label].join(' '))}"><div class="slot-name">${esc(x.name)}</div><div class="slot-meta">相对权重 ×${esc(x.weight)} · ${label}${kind==='recommended'?' / 未确认接触':''}</div><div class="slot-reason">${esc(description)}</div></div>`;
  }

  function renderWorldSlot(){
    const root = $('#worldslotContent');
    if(!root) return;
    if(WORLD_SLOT_ERROR){
      root.innerHTML = `<div class="empty">世界槽读取失败：${esc(WORLD_SLOT_ERROR)}</div>`;
      return;
    }
    if(!WORLD_SLOT){
      root.innerHTML = '<div class="empty">正在读取世界槽……</div>';
      return;
    }
    const p = WORLD_SLOT.selectionPolicy || {};
    const explicit = arr(WORLD_SLOT.explicitPreferences).map(x => ({...x,_kind:'explicit'}));
    const recommended = arr(WORLD_SLOT.recommendedCandidates).map(x => ({...x,_kind:'recommended'}));
    const all = [...explicit, ...recommended];
    const options = [
      {label:'全部', count:all.length},
      {label:'明确偏好', count:explicit.length},
      {label:'推荐候选', count:recommended.length}
    ];
    if(!options.some(x => x.label === FILTERS.worldslot)) FILTERS.worldslot = '全部';
    const shown = FILTERS.worldslot === '全部'
      ? all
      : all.filter(x => FILTERS.worldslot === '明确偏好' ? x._kind === 'explicit' : x._kind === 'recommended');

    root.innerHTML = `<div class="worldslot-banner"><div class="name">高权重候选池，不是白名单</div><div class="details">用户明确偏好 ×${esc(p.explicitPreferenceWeight)}；推荐候选 ×${esc(p.recommendedCandidateWeight)}；槽外基线 ×${esc(p.outsidePoolBaselineWeight)}。顶部“世界范围”不影响本页，因为世界槽是游戏外偏好配置。</div></div>
    <div class="archive-filterbar">${options.map(x => {
      const active = FILTERS.worldslot === x.label;
      return `<button type="button" class="${active?'active':''}" aria-pressed="${active?'true':'false'}" data-archive-filter-tab="worldslot" data-archive-filter-value="${esc(x.label)}"><span>${esc(x.label)}</span><span class="filter-count">${esc(x.count)}</span></button>`;
    }).join('')}</div>
    <div class="worldslot-grid">${shown.map(x => slotCardHtml(x,x._kind)).join('')}</div>`;
  }

  const baseRenderAllV5 = renderAll;
  renderAll = function(){
    baseRenderAllV5();
    renderMarket();
    renderWorldSlot();
    refreshActiveHeader();
    applyArchiveSearch();
  };

  document.addEventListener('click', e => {
    const openMarket = e.target.closest('[data-open-market]');
    if(openMarket){
      switchTab('market');
      return;
    }

    const filter = e.target.closest('[data-archive-filter-tab]');
    if(filter){
      const tab = filter.dataset.archiveFilterTab;
      const value = filter.dataset.archiveFilterValue;
      if(tab === 'worldslot'){
        FILTERS.worldslot = value;
        renderWorldSlot();
      }else if(Object.prototype.hasOwnProperty.call(FILTERS, tab)){
        FILTERS[tab] = value;
        const renderers = {
          people:renderPeople,
          abilities:renderAbilities,
          inventory:renderInventory,
          projects:renderProjects,
          intel:renderIntel
        };
        renderers[tab]?.();
      }
      applyArchiveSearch();
      return;
    }

    const marketFilter = e.target.closest('[data-market-filter]');
    if(marketFilter){
      MARKET_FILTER = marketFilter.dataset.marketFilter;
      renderMarket();
      applyArchiveSearch();
    }
  });

  // 核心层与增强层都监听搜索输入；本层最后注册，确保最终结果始终是“页面大类筛选 ∩ 搜索词”。
  $('#search')?.addEventListener('input', applyArchiveSearch);

  fetch('data/world-slot.json', {cache:'no-store'})
    .then(r => { if(!r.ok) throw new Error(`HTTP ${r.status}`); return r.json(); })
    .then(data => { WORLD_SLOT = data; renderWorldSlot(); applyArchiveSearch(); })
    .catch(err => { WORLD_SLOT_ERROR = err.message; renderWorldSlot(); applyArchiveSearch(); });
})();