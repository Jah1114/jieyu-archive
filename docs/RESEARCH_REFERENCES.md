# 同类项目调研与可借鉴设计

> 目的：借鉴已有 RPG / 世界观管理工具的成熟思路，但不照搬其产品形态。界域档案仍保持“游戏在 ChatGPT 对话中进行，网站负责徐长卿第一视角档案与正史沉淀”。

## 1. carlonicora/obsidian-rpg-manager

GitHub: https://github.com/carlonicora/obsidian-rpg-manager

### 值得借鉴
- **统一 Element 思维**：人物、地点、事件、章节、物品、势力、线索等都视为结构化元素，而不是互不相干的页面。
- **元素之间建立关系**：人物可以关联事件、地点、章节、物品；这非常适合我们的长期连续性。
- **系统无关**：不把数据模型绑死在 D&D 等单一规则上，适合无限流多 IP、多力量体系。
- **模板 / 自定义属性**：不同类型元素共享基础字段，也允许按需要扩展。
- **Campaign → Adventure / Chapter / Event 等层级结构**：可借鉴到“世界 → 卷/章 → 事件”。

### 不直接照搬
- 我们不需要 GM 备团式的大量“预先剧情/线索/怪物”编辑功能。
- 我们严格区分后台设定与徐长卿第一视角，不能把所有元素都公开展示。

---

## 2. mak-kirkland/chronicler

GitHub: https://github.com/mak-kirkland/chronicler

### 值得借鉴
- **文件是真相**：内容最终保存为普通 Markdown / 可读文件，不依赖封闭数据库。
- **Wikilinks 与 Backlinks**：从人物反查事件、从事件反查人物、从能力反查第一次使用记录，非常适合长期游戏。
- **模板 / Infobox**：人物、地点、物品等可以有稳定结构，不会玩久后格式越来越乱。
- **自动索引与重命名更新**：对长期项目很重要，尤其是这次角色改名已经说明“单点文本替换”很容易漏。
- **Broken-link / Vault diagnostics 思路**：未来可以转化成我们的自动连续性检查。
- **数据所有权与可迁移性**：即使未来不使用当前网页，也应能继续读取 Markdown / JSON。

### 不直接照搬
- 不需要独立桌面应用，目前 GitHub + ChatGPT 已足够。
- 不需要为了展示效果把每种内容都做成 Wiki 百科；当前世界即时信息仍应更轻量。

---

## 3. aronjanosch/chronicle-keeper

GitHub: https://github.com/aronjanosch/chronicle-keeper

### 值得借鉴
- **Session notes → World / Codex 的流水线**：这和我们的“聊天剧情 → 存档 → 章节摘要 → 当前档案”高度一致。
- **Files are truth**：AI 可以帮助更新，但最终权威内容落在文件里，而不是依赖 AI 记忆。
- **Timeline / Graph / Atlas 分视图**：同一份数据可以用时间、关系、地点三种方式查看，不需要重复保存事实。
- **Multiple worlds**：每个世界是独立可携带数据单元，同时保留跨世界全局层。
- **Backlinks / typed relations / broken-link diagnostics**：未来可直接启发我们的关系索引和校验规则。
- **Import existing notes → distill into wiki pages**：对应我们未来把历史聊天/章节继续结构化。
- **AI 更新档案时有 grounding / undo 的理念**：对应我们“先以正文事实为证据，无法确认就不写死”的规则。

### 不直接照搬
- 我们不需要语音转写、音频 Session 管线。
- 不需要网站内部再嵌一个 AI 助手；游戏和维护 AI 就是当前 ChatGPT 对话。

---

## 4. 综合后形成的界域档案原则

### A. 一份事实，多种视图
不要为了首页、人物页、时间线各复制一份相同信息。

目标：
- 人物、能力、物品、事件、地点、项目各有唯一 ID。
- 页面只是把这些数据组合展示。
- 时间线中的 `links` 可链接到人物/能力/项目。

### B. 文件是真相，网页只是渲染层
权威顺序建议长期稳定为：
1. 正史章节 / 已发生事实
2. 结构化 JSON 当前数据
3. 续档摘要
4. 网页展示

网页出现错误时应修数据或渲染逻辑，而不是单独在页面里再维护一份事实。

### C. 建立反向索引
未来点击人物“陆明远”时，可自动列出：
- 第一次出现事件
- 相关章节
- 灵力—电子响应研究
- 保护伞模块情报

点击“火弹术”可列出：
- 来源：韩立
- 第85天斗法
- 火弹符制符路线

### D. 多世界采用独立作用域
世界本地数据放 `data/worlds/world-XX.json`；跨界人物、能力、资产放全局层。

### E. 自动诊断比更多 UI 更重要
未来优先检测：
- 无效引用 ID
- 时间线晚于当前日
- 人物状态互相冲突
- 已留在旧世界的物品仍显示随身
- 世界已离开但仍标记当前
- 同一个固定字段在多文件不一致

### F. AI 只提出基于事实的更新
“同步档案”应类似 Chronicle Keeper 的 update-the-codex：
- 先识别这一段发生了什么
- 再提出/执行档案变化
- 不知道的信息保持 unknown
- 重要事实可以保留来源/证据链

---

## 5. 当前已落实

本次已经新建结构化数据层第一批文件：

```text
data/
  meta.json
  global/
    player.json
    people.json
    abilities.json
    inventory.json
  worlds/
    world-01.json
  timeline.json
  projects.json
```

下一阶段是让 `index.html` **真正读取这些数据来渲染页面**，逐步删除 HTML 内重复硬编码数据。

之后再实现：
- 反向关联
- 世界作用域切换
- 项目页
- 同步状态
- 自动校验
