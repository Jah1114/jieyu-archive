# jieyu-archive

界域档案：长期跨世界文字 RPG 的第一视角档案、续档、正史与结构化事实库。

## 唯一口径

本项目分为两层：

- **项目来源中的《界域长期项目_统一运行规范_GitHub事务版.md》**：长期运行协议，规定 AI 应如何读档、存档和安全操作 GitHub；
- **本 GitHub 仓库**：动态事实源，保存实际发生的正史、当前状态、人物、能力、物品、世界、项目和情报。

规则不是动态存档；聊天记忆也不是动态存档。任何新对话都不得用模型印象代替 GitHub 最新内容。

## 新对话启动方式

推荐第一句：

> 先查看项目来源里的界域运行规范，然后读档，继续游戏。

如果需要更明确：

> 查看项目来源中的《界域长期项目_统一运行规范_GitHub事务版.md》，严格按其中的 GitHub 事务规范执行。读档，继续游戏。

只说“读档，继续游戏”不再视为最稳妥的跨对话启动方式，因为新对话未必会自动检索项目来源。

## 只保留两个核心命令

### `读档`

读档是**只读操作**。

必须先检查：

1. `archive/SAVE_TRANSACTION.json`
2. `archive/CONTINUITY.md`
3. `archive/CURRENT_STATE.md`
4. `data/meta.json`

只有事务状态为 `clean`、没有活动事务且没有待修复标记时，才允许继续读取其他权威文件并恢复剧情。

如果事务为 `in_progress`、`repair_required`，或 GitHub 无法可靠读取，则禁止凭记忆继续游戏。

### `存档`

存档不是记录最后一句，而是把本轮已经发生、可以可靠确认的变化安全合并进完整档案。

基本流程：

1. 重新读取 GitHub 当前版本和目标文件最新 SHA；
2. 先比较本轮新事实与仓库现状；
3. 将 `archive/SAVE_TRANSACTION.json` 置为 `in_progress`；
4. 小范围更新真正发生变化的结构化事实、必要正史和状态摘要；
5. `archive/CONTINUITY.md` 接近最后更新；
6. 重新读取关键文件并检查 GitHub Actions；
7. 只有验证通过后，才把事务恢复为 `clean` 并宣布“存档完成”。

任何中途失败、版本冲突或自动校验失败，都不能声称存档成功。

## 权威层级

发生冲突时：

1. 用户当前明确纠正；
2. 已发生正史正文 / 章节；
3. `archive/CONTINUITY.md` 最新叙事前沿；
4. `archive/CURRENT_STATE.md`；
5. 最新结构化数据；
6. 第一视角人物 / 情报档案；
7. 后台设定；
8. 模型推测。

无法确认时保持未知，不自行补齐。

## 核心原则

- 游戏正文在 ChatGPT 对话中推进；GitHub 负责长期保存、检索和连续性。
- 公开网站只展示徐长卿当前认知，不展示 NPC 后台秘密或未获知事实。
- 原作只提供进入时的初始条件，不是强制剧情铁轨。
- 废弃开局和非正史内容不得重新混入正史。
- 同一事实尽量只保存一份，通过稳定 ID 和统一关系层在多个视图中复用。
- 网站不是任务面板、主神系统或 GM 后台。

## 仓库结构

### 存档安全与续档

- `archive/SAVE_TRANSACTION.json`：存档事务状态；读档第一检查点。
- `archive/CONTINUITY.md`：跨对话续档入口与最新叙事前沿。
- `archive/CURRENT_STATE.md`：当前角色、资源、能力和未解问题快照。
- `archive/PEOPLE.md`：第一视角人物档案。

### 结构化事实

- `data/meta.json`：当前世界与最新叙事前沿的机器可读坐标。
- `data/features.json`：长期功能注册与第一视角解锁状态。
- `data/global/player.json`：徐长卿跨世界基础档案。
- `data/global/people.json`：人物与长期联系人。
- `data/global/abilities.json`：能力、来源、限制和跨界状态。
- `data/global/inventory.json`：货币、物品、位置、获得关系和跨界状态。
- `data/worlds/index.json`：作品世界访问实例注册表。
- `data/worlds/world-*.json`：各访问实例的已知世界信息与长期地点。
- `data/timeline.json`：重要事件与稳定关联。
- `data/chapters.json`：章节索引，不复制正文。
- `data/projects.json`：长期项目 / 实验 / 资源目标。
- `data/intel.json`：带证据链的情报。

### 正史与后台设定

- `story/`：章节级正史正文。
- `lore/SETTING.md`：后台世界规则，不代表徐长卿当前认知。

### 网站

- `index.html`：**正式数据驱动 GitHub Pages 首页**。
- `next.html`：与正式版同构的备用 / 开发入口。
- `assets/next.css` / `assets/next-relations.css`：页面与统一关系层样式。
- `assets/next.js`：核心数据加载、作用域、详情和诊断。
- `assets/next-enhancements.js`：搜索、排序、访问实例、章节/物品关系等增强。
- `assets/next-relations.js`：统一关系摘要、分组与反向关联展示。

### 自动检查

- `scripts/validate-data.mjs`：事务状态、世界注册、稳定 ID、引用、数据结构及关键跨文件一致性检查。
- `.github/workflows/validate-data.yml`：相关文件变更后自动运行档案校验和前端 JavaScript 语法检查。

### 设计与研究

- `docs/UI_ARCHITECTURE.md`：多世界与统一关系界面规范。
- `docs/ROADMAP.md`：只记录当前之后仍需建设的路线，不把已完成功能继续写成未来任务。
- `docs/IMPLEMENTATION_STATUS.md`：当前真实实施状态。
- `docs/RESEARCH_REFERENCES.md`：同类长期 RPG / 世界观管理项目调研。

## 当前网站能力

正式首页已经支持：

- 数据驱动渲染；
- 当前世界 / 全部世界 / 各访问实例作用域；
- 人物、地点、事件、章节、能力、物品、项目、情报等稳定实体；
- 统一关系层与双向关联；
- 第一视角人物主体；
- 长期地点筛选与排序；
- 过滤式全局搜索；
- 详情抽屉；
- 浏览器端诊断 + GitHub Actions 仓库级诊断。

## 动态状态不要写死在说明文档

当前具体时间、地点、资源和剧情前沿应读取：

- `archive/CONTINUITY.md`
- `archive/CURRENT_STATE.md`
- `data/meta.json`

README 不作为动态状态权威源。

长期维护方向：

**游戏正文 → 安全存档事务 → 结构化事实 → 稳定关联 → 多种第一视角视图。**
