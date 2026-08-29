# 界域档案 · 实施状态

## 当前阶段

P0 数据层重构：**进行中，核心结构化数据、数据驱动预览、章节索引与自动验证均已落地。**

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
- `data/chapters.json`

这些文件已经使用稳定 ID 建立关系，例如：
- 时间线事件关联人物 / 能力 / 项目；
- 情报关联人物 / 项目 / 事件；
- 长期项目关联参与者；
- 章节索引关联人物 / 能力 / 项目 / 事件；
- 世界、人物、能力、物品之间可通过 ID 建立来源与反向关联。

## 数据驱动网页

`next.html` 已开始直接读取 `data/`，当前已经实现：

- 概览读取当前叙事日、地点、境界与离界状态；
- 人物、世界、时间线、旅程、能力、携带、长期项目、情报均从 JSON 渲染；
- 人物内部英文数据字段通过展示层映射为中文，不再直接暴露 `origin / worldCount / spiritualRoots` 等内部键名；
- 可选数组字段采用容错读取，单个字段缺失不再导致整站崩溃；
- 原本会导致 `p.unknown is not iterable` 的项目字段问题已修复；
- 时间线、章节与情报中的稳定 ID 会解析为可读名称；
- 关联标签可点击跳转到对应人物 / 能力 / 项目 / 情报 / 事件 / 章节；
- 自动生成反向关联（Backlinks）；
- 增加档案诊断：检测重复 ID、无法解析的引用等结构错误；
- 增加世界作用域切换器基础版：当前世界 / 全部世界 / 世界01。后续增加世界02时沿用同一结构，不扩张主导航。

当前 `index.html` 仍作为稳定旧版首页，`next.html` 是下一代预览。待 next 版经过实际使用验证后，再替换正式首页。

## 正文与章节

- 正史正文继续以 `story/world01_fanren/CHAPTERS.md` 为唯一权威正文来源。
- `data/chapters.json` 只保存章节索引、摘要、时间范围与关联 ID，不复制整段正文。
- 这对应“Files are truth + 索引视图”的设计，避免同一正文维护两份。

## 自动档案验证

已新增：
- `scripts/validate-data.mjs`
- `.github/workflows/validate-data.yml`

当前自动检查：
- 重复 ID；
- 事件 / 情报 / 章节 / 项目中的坏引用；
- 当前世界在 `meta / player / world` 之间是否一致；
- 人物姓名、性别等关键字段；
- 项目 `confirmed / unknown / needs` 数组结构；
- 情报证据链结构；
- 章节正文来源文件是否真实存在。

以后结构化档案修改后，GitHub Actions 会自动运行验证；这部分借鉴了 Chronicler 的 broken-link / vault diagnostics 思路。

## 项目命令

正式收敛为两个：

- `存档`：续档、当前状态、结构化数据、网站数据与必要正史章节一起保存。
- `读档`：读取续档入口及权威档案后继续游戏。

不再保留独立的“同步档案”命令。

## 下一步

### P0.5：实体详情继续增强

在已有 Backlinks 基础上继续增加：
- 人物页的共同事件 / 共同项目分类展示；
- 能力页的获得来源 / 首次实战 / 相关章节；
- 项目页的关联情报与实验事件；
- 情报证据链中的来源实体跳转；
- 后续关系图视图。

### P0.6：多世界数据加载

当前作用域切换器已经有 UI 和筛选逻辑，下一步把世界文件从固定 `world-01.json` 改为世界清单驱动：
- `data/worlds/index.json`
- 自动加载 world-01 / world-02 / ……
- 第二世界出现时只增加数据，不修改导航结构。

### P1：同步日志 / 变化记录

每次“存档”生成轻量变更记录，例如：
- 时间推进；
- 新人物 / 新能力 / 新项目；
- 灵石或关键物品变化；
- 人物关系变化；
- 新章节。

用于未来连续性争议和历史回查，不作为游戏结算面板。

## 调研吸收情况

### Obsidian RPG Manager
- “Everything is an Element” → 稳定实体 ID 与统一关系模型。

### Chronicler
- Files are truth → Markdown / JSON 文件作为长期事实层；
- Backlinks → `next.html` 已实现反向关联与跳转；
- Vault diagnostics → 浏览器诊断 + GitHub Actions 自动验证；
- 模板化字段 → 项目、情报、章节等结构开始统一。

### Chronicle Keeper
- Session → Summary → Codex → 对应为“游戏对话 → 存档 → 结构化事实 → 网站视图”；
- Timeline / Graph / Wiki 分视图 → 时间线、旅程、关联导航已落地，关系图暂未实现；
- Multiple worlds → 作用域切换器基础版已实现。

## 不改变的核心

- 游戏继续在 ChatGPT 中进行；
- 网站不成为 GM 后台或任务系统；
- 公开网站严格保持徐长卿第一视角；
- 徐长卿不知道的后台事实不进入公开结构化数据。
