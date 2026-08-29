# 界域档案 · 实施状态

## 当前阶段

P0 数据层重构：**进行中，第一批结构化文件与数据驱动预览已经落地。**

已完成数据文件：
- `data/meta.json`
- `data/global/player.json`
- `data/global/people.json`
- `data/global/abilities.json`
- `data/global/inventory.json`
- `data/worlds/world-01.json`
- `data/timeline.json`
- `data/projects.json`
- `data/intel.json`

这些文件已经使用稳定 ID 建立关系，例如：
- 时间线事件关联人物 / 能力 / 项目；
- 情报关联人物 / 项目 / 事件；
- 长期项目关联参与者；
- 世界、人物、能力、物品之间可通过 ID 建立来源与反向关联。

## 数据驱动网页

`next.html` 已开始直接读取 `data/`，当前已经实现：

- 概览读取当前叙事日、地点、境界与离界状态；
- 人物、世界、时间线、能力、携带、长期项目、情报均从 JSON 渲染；
- 可选数组字段采用容错读取，单个字段缺失不再导致整站崩溃；
- 原本会导致 `p.unknown is not iterable` 的项目字段问题已修复；
- 时间线和情报中的稳定 ID 会解析为可读名称；
- 关联标签可点击跳转到对应人物 / 能力 / 项目 / 情报 / 事件；
- 自动生成反向关联（Backlinks）；
- 增加档案诊断：检测重复 ID、无法解析的引用等结构错误。

当前 `index.html` 仍作为稳定旧版首页，`next.html` 是下一代预览。待 next 版经过实际使用验证后，再替换正式首页。

## 项目命令

已经正式收敛为两个：

- `存档`：续档、当前状态、结构化数据、网站数据与必要正史章节一起保存。
- `读档`：读取续档入口及权威档案后继续游戏。

不再保留独立的“同步档案”命令。

## 下一步

### P0.2：章节索引结构化

当前正史正文仍以 Markdown 为权威格式。

未来增加轻量章节索引 JSON，只保存：
- 章节 ID；
- 标题；
- 世界；
- 摘要；
- 人物 / 地点 / 能力 / 物品关联。

不复制整段正文，避免维护两份正文。

### P0.3：关联视图继续增强

在已有 Backlinks 基础上继续增加：
- 人物页的共同事件 / 共同项目；
- 能力页的首次获得 / 首次实战；
- 项目页的关联情报与实验事件；
- 情报页的证据链来源跳转；
- 后续关系图视图。

### P0.4：多世界作用域

第二世界开始前实现统一世界作用域切换器：
- 当前世界；
- 全部世界；
- 世界01 / 世界02 / ……

主导航不会随着世界数量增长。

## 调研吸收情况

已完成 `docs/RESEARCH_REFERENCES.md`。

已经开始实际吸收：

### Obsidian RPG Manager
- “Everything is an Element” → 稳定实体 ID 与统一关系模型。

### Chronicler
- Files are truth → Markdown / JSON 文件作为长期事实层；
- Backlinks → `next.html` 已实现第一版反向关联；
- Vault diagnostics → 已实现重复 ID / 坏引用检查；
- 模板化字段 → 项目等结构开始统一可选字段。

### Chronicle Keeper
- Session → Summary → Codex → 对应为“游戏对话 → 存档 → 结构化事实 → 网站视图”；
- Timeline / Graph / Wiki 分视图 → 时间线与关联导航已开始落地，关系图暂未实现；
- Multiple worlds → 已在 UI 架构层预留。

## 不改变的核心

- 游戏继续在 ChatGPT 中进行；
- 网站不成为 GM 后台或任务系统；
- 公开网站严格保持徐长卿第一视角；
- 徐长卿不知道的后台事实不进入公开结构化数据。
