# GitHub 活操作协议

> 版本：3  
> 用途：记录 **jieyu-archive 当前仓库架构下，读档 / 存档实际要读取和维护哪些文件**。  
> 本文件不是游戏正史，也不是徐长卿认知的一部分。

## 0. 与项目来源的关系

项目“来源 / 文件”中的《界域长期项目_统一运行规范_GitHub活协议版.md》是稳定安全协议；本文件是 **GitHub 侧可随仓库架构演进而更新的操作补充**。

因此：

- 每一次 `读档`，都必须在本次操作中重新查看项目来源中的统一运行规范，并重新读取本文件；
- 每一次 `存档`，也必须在本次操作中重新查看项目来源中的统一运行规范，并重新读取本文件；
- 不得因为当前聊天早些时候已经读过规则，就假定那一份仍是最新版；
- 不得依赖聊天记忆保存仓库架构、目标文件列表或写入顺序。

如果项目来源规范与本文件发生冲突：

> 先停止写入。稳定安全原则以项目来源为上位约束；仓库具体路径 / 当前数据架构以 GitHub 最新文件为准。无法解释冲突时，不得存档。

---

## 1. 当前读档流程

### 第一步：安全状态与结构契约

读取：

1. `archive/SAVE_TRANSACTION.json`
2. 本文件 `archive/OPERATION_PROTOCOL.md`
3. `archive/PERSISTENCE_MAP.json`

只有：

- `state = clean`
- `activeTransaction = null`
- `repair.required = false`

才允许正常续档。

`PERSISTENCE_MAP.json` 是机器可读的现有持久化结构映射，**不是游戏内容白名单**。它只用于说明已经存在的数据层如何安全保存与校验，不得用来限制剧情能发生什么。

### 第二步：核心连续性

至少读取：

1. `archive/CONTINUITY.md`
2. `archive/CURRENT_STATE.md`
3. `data/meta.json`

### 第三步：按需读取完整事实层与偏好层

- `archive/PEOPLE.md`
- `data/global/player.json`
- `data/global/people.json`
- `data/global/abilities.json`
- `data/global/inventory.json`
- `data/worlds/index.json`
- 当前访问实例对应 `data/worlds/world-*.json`
- `data/timeline.json`
- `data/chapters.json`
- `story/`
- `data/projects.json`
- `data/intel.json`
- `data/features.json`
- `data/world-slot.json`（游戏外世界偏好；在需要选择/讨论后续世界或维护世界槽时读取）
- `lore/SETTING.md`

读档只读，不写 GitHub。

`data/world-slot.json` 不属于徐长卿第一视角正史。普通剧情无需反复展示它，但在需要决定新的世界访问目标时应把其中权重作为偏好参考。

---

## 2. 当前存档流程

### 2.1 每次存档都重新同步规则

用户说 `存档` 后，本次操作必须重新：

1. 查看项目来源中的统一运行规范；
2. 读取 `archive/OPERATION_PROTOCOL.md`；
3. 读取 `archive/PERSISTENCE_MAP.json`；
4. 读取 `archive/SAVE_TRANSACTION.json`；
5. 读取 `archive/CONTINUITY.md`、`archive/CURRENT_STATE.md`、`data/meta.json`；
6. 读取所有本轮预计修改的目标文件并取得最新 SHA。

**禁止使用“本聊天几小时前读过的规则 / 文件内容”直接开始写入。**

### 2.2 准备阶段

在任何事实写入之前：

- 对比 GitHub 当前事实与本轮真实新剧情；
- 根据真实变化列出 `changeDomains`，并按 `PERSISTENCE_MAP.json` 推导最低需要覆盖的 `targetFiles`；
- 列出需要变化的实体和文件；
- 确认没有把后台设定、推测或未发生内容写成正史；
- 确认引用 ID、世界访问实例、时间与地点连续；
- 确认 `SAVE_TRANSACTION.json` 当前为 `clean`。

`changeDomains` 只描述“已经决定结构化保存的变化属于哪些现有持久化领域”，不得反过来决定剧情内容。

世界槽偏好变化属于 `worldSlot` 领域，只更新 `data/world-slot.json`；不得把世界槽的候选名单写入第一视角时间线、章节或人物认知。

### 2.3 正式事务

将 `SAVE_TRANSACTION.json` 改为 `in_progress`，记录：

- 唯一事务 ID；
- `startedAt`；
- `changeDomains`；
- `targetFiles`；
- 简短原因。

声明某个 `changeDomain` 后，其在 `PERSISTENCE_MAP.json` 中登记的 `requiredTargets` / `requiredTargetPatterns` 必须被 `targetFiles` 覆盖；否则校验失败。

之后按最小变更原则写入。

推荐顺序：

1. 结构化事实；
2. 自然章节节点对应的章节 / 正史；
3. `archive/PEOPLE.md`（如需要）；
4. `archive/CURRENT_STATE.md`；
5. `data/meta.json`；
6. `archive/CONTINUITY.md` 接近最后；
7. 重新读取核心文件；
8. 等待 GitHub Actions 校验；
9. 最后将事务恢复为 `clean`。

任何关键失败都不能宣布存档完成。

---

## 3. 开放剧情与结构演化

长期原则：

> **游戏决定发生什么，档案系统负责把已经发生的事实安全保存下来。**

因此：

- 当前数据架构不是游戏规则白名单；
- 剧情可以产生当前结构完全未预见的新概念、新关系、新组织、新机制或新长期事物；
- 缺少专门 JSON 结构不得阻止剧情发生；
- 不得为了适配旧 schema 扭曲已经发生的正史事实；
- 新型事实首先保证 `story/` 正史正文无损；
- 若具有长期影响，使用当前能够合理承载它的通用事实层，并在必要时写入 `data/timeline.json`；
- 主游戏聊天不得因为一次新概念就自行设计大型永久仓库架构；
- 是否把反复出现的新概念提升为独立结构化层，由维护聊天后续决定。

因此，**正史是无损层，结构化数据是索引与当前状态层。**

---

## 4. 当前结构化架构

机器可读完整登记见：

`archive/PERSISTENCE_MAP.json`

当前主要事实层：

### 全局

- `data/global/player.json`：玩家唯一实体
- `data/global/people.json`：长期人物
- `data/global/abilities.json`：能力
- `data/global/inventory.json`：私人货币、携带物，以及 **市场观察层**

### 世界

- `data/worlds/index.json`：访问实例注册表
- `data/worlds/world-*.json`：某次访问实例的世界信息、长期地点、已知规则

### 事件与知识

- `data/timeline.json`：重要事件
- `data/chapters.json`：正史章节索引
- `story/`：正史正文
- `data/projects.json`：长期项目
- `data/intel.json`：情报证据链
- `data/features.json`：长期功能与第一视角解锁状态

### 游戏外偏好

- `data/world-slot.json`：世界槽 / 高权重候选池。它只影响未来世界选择倾向，不是白名单，不属于徐长卿认知，不应作为正史事实显示。

### 展示分类

人物、能力和物品的“当前同行 / 战斗 / 生产 / 装备 / 资料”等分组属于**展示与检索层**。当前前端根据已有 `status`、`tags`、`type`、`category` 等事实字段进行稳定归类，不要求为了界面重复维护第二份正史事实。

---

## 5. 世界槽规则

世界槽用于表达长期游戏偏好，而不是创建固定副本列表。

当前规则：

- 用户明确加入槽内的作品具有较高相对权重；
- 维护聊天可加入“推荐候选”，但必须与用户明确偏好分开，并标注为未确认接触；
- 槽外世界始终允许出现；
- 原创世界始终允许出现；
- 世界槽不提前决定下一世界，更不提前决定该世界内会发生什么；
- 已访问作品可以再次进入，但必须遵守访问实例模型，新建 visit，不覆盖历史；
- 用户明确增删作品或调整偏好时，直接维护 `data/world-slot.json`，不写入第一视角时间线。

---

## 6. 市场观察层

市场价格不是物品的永久属性。

当前市场观察记录存于：

`data/global/inventory.json -> marketObservations`

每条观察至少表达：

- `id`
- `subjectName`
- `worldId`
- `locationId`（若能对应长期地点）
- `currencyId`（若已有稳定货币实体）
- 数量与价格 / 区间
- `priceType`：例如 `成交`、`摊主开价`、`市场观察`、`以物易物`、`估计`
- `observedAt`
- `note`

若行情对应当前持有物品，可加：

- `itemId`

携带页只需显示物品的简要参考行情；完整市场历史在网站独立“市场”标签页按对象折叠展示，避免世界页长期堆积报价列表。

### 跨世界规则

- 不建立统一价值点数；
- 不自动换算不同世界货币；
- 同一物品可在多个世界拥有不同观察记录；
- 没有本地可靠行情时显示“未知”，不得由 AI 自行估价；
- 历史世界行情可以保留，但必须明确世界 / 地点 / 货币和观察类型。

---

## 7. 自动校验

当前自动校验至少检查：

- 存档事务状态；
- 活操作协议和持久化映射存在；
- `data/**/*.json` 正式数据文件全部被 `PERSISTENCE_MAP.json` 登记，防止新增数据层成为主聊天不知道的“孤岛”；
- `changeDomains` 中声明的领域，其必须目标被 `targetFiles` 完整覆盖；
- 玩家 / 当前世界 / 当前日 / 当前地点跨文件一致性；
- 稳定 ID 与坏引用；
- 市场观察的世界、地点、物品、货币引用；
- 市场价格记录结构；
- 世界槽结构、权重与“非白名单”约束；
- README / CONTINUITY 仍明确要求每次操作重新读取来源和本文件；
- 前端核心文件存在与 JavaScript 语法有效。

GitHub Actions 未通过时，不得把正式存档事务视为成功。

这里的自动校验只检查**存档结构一致性**，不评价剧情创意是否属于预设类别，也不把世界槽变成剧情许可列表。

---

## 8. 架构变化规则

以后如果维护聊天改变了：

- 文件路径；
- 存档写入顺序；
- 新增结构化层；
- 市场 / 资产 / 世界访问实例 / 世界槽结构；
- 自动校验要求；

必须同时检查并按需要更新：

1. 本文件 `archive/OPERATION_PROTOCOL.md`；
2. `archive/PERSISTENCE_MAP.json`；
3. 对应自动校验脚本。

任何新增正式 `data/**/*.json` 数据层如果没有登记进持久化映射，CI 应直接失败。

这样即使主游戏聊天很久没有参与项目维护，它在下一次 `读档` / `存档` 时重新读取本文件和持久化映射，也能按最新仓库架构操作。

最高原则：

> **主聊天可以不知道维护过程，但不能在操作 GitHub 时不知道当前规则。**
>
> **存档结构可以约束“怎么记”，不能约束“能发生什么”。**
