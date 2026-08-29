# jieyu-archive

界域档案：长期无限流文字 RPG 的第一视角档案、续档与正史存档库。

## 只保留两个核心命令

### `存档`

把当前已经发生且可可靠确认的进展完整写入项目，包括：

- `archive/CONTINUITY.md` 的最新叙事前沿；
- `archive/CURRENT_STATE.md` 的角色、资源、能力和状态；
- `data/` 下的人物、世界、时间线、能力、物品、项目、情报和章节索引；
- 若自然剧情段结束，则整理/追加对应正史章节；
- 网站所读取的数据一起更新。

**存档 = 续档 + 档案 + 网站数据一起保存。**

### `读档`

读取 `archive/CONTINUITY.md` 及其中指定的权威文件，确认当前叙事位置和关键状态后继续游戏。

新对话中只说：

> 读档，继续游戏

即可。

## 核心原则

- 网站只展示徐长卿当前认知，不展示 NPC 后台秘密或未获知事实。
- 无法可靠还原的历史细节不会硬补。
- 废弃开局不进入正史。
- 游戏正文仍在 ChatGPT 对话中推进；GitHub 项目负责长期保存、检索和连续性。
- 同一事实尽量只保存一份，通过稳定 ID 和关联索引在多个视图中复用。

## 仓库结构

### 网站
- `index.html`：当前稳定版 GitHub Pages 首页。
- `next.html`：数据驱动下一版，仅保留页面结构。
- `assets/next.css`：下一版样式。
- `assets/next.js`：数据加载、世界筛选、关联跳转、详情抽屉和浏览器端诊断。

### 续档 / 当前状态
- `archive/CONTINUITY.md`：跨对话续档入口。
- `archive/CURRENT_STATE.md`：当前角色、能力、资源与未解问题快照。
- `archive/PEOPLE.md`：人物档案（徐长卿视角）。

### 结构化数据层
- `data/meta.json`：当前世界、叙事前沿和存档状态。
- `data/global/player.json`：徐长卿跨世界基础档案。
- `data/global/people.json`：人物与长期联系人。
- `data/global/abilities.json`：能力、来源、限制与跨界状态。
- `data/global/inventory.json`：货币、携带物、位置与跨界状态。
- `data/worlds/index.json`：世界注册表；第二世界以后由这里增加入口。
- `data/worlds/world-01.json`：世界01局部信息。
- `data/timeline.json`：带稳定关联 ID 的时间线。
- `data/chapters.json`：章节索引，只保存标题、摘要和关联，不复制正文。
- `data/projects.json`：长期项目 / 实验 / 资源目标。
- `data/intel.json`：带证据链的情报。

### 正史与后台设定
- `story/world01_fanren/CHAPTERS.md`：世界01《凡人修仙传》章节级正史正文。
- `lore/SETTING.md`：界域、行者社会、无量灵海、界网与叙事原则；不代表徐长卿当前认知。

### 自动检查
- `scripts/validate-data.mjs`：检查多世界注册、重复 ID、坏引用、章节来源和数据结构。
- `.github/workflows/validate-data.yml`：每次相关提交自动运行档案校验，并用 `node --check` 检查前端 JavaScript 语法。

### 设计与研究
- `docs/UI_ARCHITECTURE.md`：多世界界面规范。
- `docs/ROADMAP.md`：长期功能路线图。
- `docs/RESEARCH_REFERENCES.md`：同类 RPG / 世界观管理项目调研。
- `docs/IMPLEMENTATION_STATUS.md`：实际实施状态。

## next.html 当前能力

- 所有面向用户的字段统一中文显示；内部 JSON 可继续使用稳定字段名。
- 世界作用域：当前世界 / 全部世界 / 世界01 / 未来世界02……
- 人物、能力、事件、项目、情报、章节使用稳定 ID 互相关联。
- 点击实体打开右侧详情抽屉，可查看完整资料、直接关联和反向关联。
- 能力详情可反查最早关联事件和相关正史章节。
- 章节索引链接回唯一 Markdown 正文来源。
- 浏览器端档案诊断 + GitHub Actions 仓库级诊断。

## 当前叙事基准

《凡人修仙传》· 太南小会时期 · 约入界第124天上午。

当前最新剧情前沿：徐长卿在太南小会摊位看到低阶持续防御符“金刚符”，确认成品约1块下品灵石、符法约50块，尚未购买。

长期维护方向：**游戏正文 → 存档 → 结构化事实 → 关联索引 → 多种网站视图。**
