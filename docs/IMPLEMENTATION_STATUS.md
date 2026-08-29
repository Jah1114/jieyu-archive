# 界域档案 · 实施状态

## 当前阶段

P0 数据层重构：**已开始，第一批结构化文件已落地。**

已完成：
- `data/meta.json`
- `data/global/player.json`
- `data/global/people.json`
- `data/global/abilities.json`
- `data/global/inventory.json`
- `data/worlds/world-01.json`
- `data/timeline.json`
- `data/projects.json`
- `data/intel.json`

这些文件已经开始使用稳定 ID 建立关系，例如：
- 时间线事件关联人物 / 能力 / 项目
- 情报关联人物 / 项目 / 事件
- 长期项目关联参与者

## 尚未完成

### P0.1：网页读取数据文件
当前 `index.html` 仍有旧版硬编码内容。

下一步：
1. 建立统一 `loadData()`。
2. 优先让概览、人物、能力、携带、时间线读取 `data/`。
3. 若读取失败，页面显示明确错误，而不是静默使用过期值。
4. 数据驱动版本稳定后，删除 HTML 内重复事实。

### P0.2：章节结构化
当前正史正文仍以 Markdown 为权威格式。

未来可增加轻量章节索引 JSON，只保存：章节 ID、标题、世界、摘要、人物/地点/能力关联，不复制整段正文。

### P0.3：同步状态
让 `data/meta.json` 驱动网站上的：
- 当前叙事日
- 当前叙事前沿
- 网站是否落后续档
- 最近一次同步类型

## 调研吸收情况

已完成 `docs/RESEARCH_REFERENCES.md`。

当前明确吸收：
- Obsidian RPG Manager：统一 Element / 关系模型思想。
- Chronicler：文件是真相、Wikilink/Backlink、模板、诊断思路。
- Chronicle Keeper：剧情/会话 → 摘要 → Codex 更新流水线、多世界、关系图/时间线/地图分视图思想。

不改变的核心：
- 游戏继续在 ChatGPT 中进行。
- 网站不成为 GM 后台或任务系统。
- 公开网站严格保持徐长卿第一视角。
