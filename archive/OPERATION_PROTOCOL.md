# GitHub 活操作协议

> 版本：1  
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

### 第一步：安全状态

读取：

1. `archive/SAVE_TRANSACTION.json`
2. 本文件 `archive/OPERATION_PROTOCOL.md`

只有：

- `state = clean`
- `activeTransaction = null`
- `repair.required = false`

才允许正常续档。

### 第二步：核心连续性

至少读取：

1. `archive/CONTINUITY.md`
2. `archive/CURRENT_STATE.md`
3. `data/meta.json`

### 第三步：按需读取完整事实层

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
- `lore/SETTING.md`

读档只读，不写 GitHub。

---

## 2. 当前存档流程

### 2.1 每次存档都重新同步规则

用户说 `存档` 后，本次操作必须重新：

1. 查看项目来源中的统一运行规范；
2. 读取 `archive/OPERATION_PROTOCOL.md`；
3. 读取 `archive/SAVE_TRANSACTION.json`；
4. 读取 `archive/CONTINUITY.md`、`archive/CURRENT_STATE.md`、`data/meta.json`；
5. 读取所有本轮预计修改的目标文件并取得最新 SHA。

**禁止使用“本聊天几小时前读过的规则 / 文件内容”直接开始写入。**

### 2.2 准备阶段

在任何事实写入之前：

- 对比 GitHub 当前事实与本轮真实新剧情；
- 列出需要变化的实体和文件；
- 确认没有把后台设定、推测或未发生内容写成正史；
- 确认引用 ID、世界访问实例、时间与地点连续；
- 确认 `SAVE_TRANSACTION.json` 当前为 `clean`。

### 2.3 正式事务

将 `SAVE_TRANSACTION.json` 改为 `in_progress`，记录：

- 唯一事务 ID；
- `startedAt`；
- `targetFiles`；
- 简短原因。

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

## 3. 当前结构化架构

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

---

## 4. 市场观察层

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

这样携带页可以显示“当前世界已知参考行情”，但物品本体不保存固定 `price`。

### 跨世界规则

- 不建立统一价值点数；
- 不自动换算不同世界货币；
- 同一物品可在多个世界拥有不同观察记录；
- 没有本地可靠行情时显示“未知”，不得由 AI 自行估价；
- 历史世界行情可以保留，但必须明确世界 / 地点 / 货币和观察类型。

---

## 5. 自动校验

当前自动校验至少检查：

- 存档事务状态；
- 活操作协议存在且与事务文件登记路径一致；
- 玩家 / 当前世界 / 当前日 / 当前地点跨文件一致性；
- 稳定 ID 与坏引用；
- 市场观察的世界、地点、物品、货币引用；
- 市场价格记录结构；
- README / CONTINUITY 仍明确要求每次操作重新读取来源和本文件；
- 前端核心文件存在。

GitHub Actions 未通过时，不得把正式存档事务视为成功。

---

## 6. 架构变化规则

以后如果维护聊天改变了：

- 文件路径；
- 存档写入顺序；
- 新增结构化层；
- 市场 / 资产 / 世界访问实例结构；
- 自动校验要求；

应同步更新本文件。

这样即使主游戏聊天很久没有参与项目维护，它在下一次 `读档` / `存档` 时重新读取本文件，也能按最新仓库架构操作。

最高原则：

> **主聊天可以不知道维护过程，但不能在操作 GitHub 时不知道当前规则。**
