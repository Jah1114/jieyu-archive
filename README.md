# jieyu-archive

界域档案：长期跨世界文字 RPG 的第一视角档案、续档、正史与结构化事实库。

## 唯一口径

本项目分为三层：

- **项目来源中的《界域长期项目_统一运行规范_GitHub事务版.md》**：稳定安全协议，规定 AI 如何读档、存档以及安全操作 GitHub；
- **`archive/OPERATION_PROTOCOL.md`**：GitHub 侧的活操作协议，记录当前仓库架构、实际文件路径和读写流程，可随项目维护演进；
- **GitHub 结构化档案 / 正史**：动态事实源，保存实际发生的剧情和当前状态。

最重要的操作纪律：

> **每一次 `读档` 和每一次 `存档`，都必须在本次操作中重新查看项目来源中的统一运行规范，并重新读取 `archive/OPERATION_PROTOCOL.md`。不得因为当前聊天早些时候已经读过规则，就假定旧副本仍是最新版。**

这条规则专门用于解决“主游戏聊天不知道维护聊天后来修改了仓库架构”的问题。

## 新对话启动方式

推荐第一句：

> 先查看项目来源里的界域运行规范，然后读档，继续游戏。

只说“读档，继续游戏”不视为最稳妥方式，因为新对话未必会自动检索项目来源。

## 两个核心命令

### `读档`

读档是只读操作。

本次操作先重新读取项目来源规则，然后读取：

1. `archive/SAVE_TRANSACTION.json`
2. `archive/OPERATION_PROTOCOL.md`
3. `archive/CONTINUITY.md`
4. `archive/CURRENT_STATE.md`
5. `data/meta.json`

只有事务状态为 `clean`、没有活动事务、没有待修复标记，且关键文件可以互相解释时，才允许继续读取其他权威档案并恢复剧情。

### `存档`

存档不是记录最后一句，而是把本轮已发生且可靠确认的变化安全合并进完整档案。

每一次存档都必须：

1. **重新查看项目来源中的统一运行规范**；
2. **重新读取 `archive/OPERATION_PROTOCOL.md`**，获得当前仓库架构与最新存档路径；
3. 重新读取 `SAVE_TRANSACTION.json`、核心连续性文件和所有目标文件最新版本 / SHA；
4. 比较本轮新事实与 GitHub 当前事实；
5. 把事务设为 `in_progress`；
6. 按最新活操作协议做最小范围写入；
7. 复核关键文件并等待 GitHub Actions；
8. 校验通过后才把事务恢复为 `clean` 并宣布“存档完成”。

任何中途失败、版本冲突、协议冲突或自动校验失败，都不能声称存档成功。

## 权威层级

发生事实冲突时：

1. 用户当前明确纠正；
2. 已发生正史正文 / 章节；
3. `archive/CONTINUITY.md` 最新叙事前沿；
4. `archive/CURRENT_STATE.md`；
5. 最新结构化数据；
6. 第一视角人物 / 情报档案；
7. 后台设定；
8. 模型推测。

无法确认时保持未知。

## 核心原则

- 游戏正文在 ChatGPT 对话中推进；GitHub 负责长期保存、检索和连续性。
- 公开网站只展示徐长卿当前认知。
- 原作只提供进入时的初始条件，不是强制剧情铁轨。
- 废弃开局和非正史内容不得重新混入正史。
- 同一事实尽量只保存一份，通过稳定 ID 和统一关系层在多个视图中复用。
- 网站不是任务面板、主神系统或 GM 后台。

## 仓库结构

### 存档安全与续档

- `archive/SAVE_TRANSACTION.json`：存档事务状态；安全第一检查点。
- `archive/OPERATION_PROTOCOL.md`：**每次读档 / 存档都必须重新读取的活操作协议**。
- `archive/CONTINUITY.md`：跨对话续档入口与最新叙事前沿。
- `archive/CURRENT_STATE.md`：当前角色、资源、能力和未解问题快照。
- `archive/PEOPLE.md`：第一视角人物档案。

### 结构化事实

- `data/meta.json`：当前世界与最新叙事前沿机器坐标。
- `data/features.json`：长期功能注册与第一视角解锁状态。
- `data/global/player.json`：徐长卿跨世界基础档案。
- `data/global/people.json`：人物与长期联系人。
- `data/global/abilities.json`：能力、来源、限制和跨界状态。
- `data/global/inventory.json`：私人货币、携带物、获得关系、跨界状态，以及 `marketObservations` 市场观察层。
- `data/worlds/index.json`：作品世界访问实例注册表。
- `data/worlds/world-*.json`：各访问实例的已知世界信息与长期地点。
- `data/timeline.json`：重要事件与稳定关联。
- `data/chapters.json`：章节索引，不复制正文。
- `data/projects.json`：长期项目 / 实验 / 资源目标。
- `data/intel.json`：带证据链的情报。

### 市场观察

价格不是物品永久属性。

`data/global/inventory.json -> marketObservations` 按以下维度保存行情：

- 世界；
- 地点；
- 货币；
- 数量 / 单位；
- 报价或成交区间；
- `成交` / `摊主开价` / `市场观察` / `以物易物` / `估计` 等类型；
- 观察时间与备注；
- 若和当前持有物品对应，则关联 `itemId`。

不同世界货币**不自动换算**。携带页优先显示当前世界可靠行情；没有可靠行情就显示未知，历史世界行情只作为明确标注来源的参考。

### 正史与后台设定

- `story/`：章节级正史正文。
- `lore/SETTING.md`：后台世界规则，不代表徐长卿当前认知。

### 网站

- `index.html`：正式数据驱动 GitHub Pages 首页。
- `next.html`：同构备用 / 开发入口。
- `assets/next.js`：核心数据加载、作用域、详情和诊断。
- `assets/next-enhancements.js`：搜索、排序、访问实例、章节 / 物品关系等增强。
- `assets/next-market.js`：市场观察、携带参考行情和跨世界价格展示。
- `assets/next-relations.js`：统一关系摘要、分组与反向关联展示。

### 自动检查

- `scripts/validate-data.mjs`：事务状态、活协议、世界注册、稳定 ID、引用、市场观察及关键跨文件一致性检查。
- `.github/workflows/validate-data.yml`：相关文件变更后自动运行档案校验和前端 JavaScript 语法检查。

## 动态状态不要写死在说明文档

当前具体时间、地点、资源和剧情前沿应读取：

- `archive/CONTINUITY.md`
- `archive/CURRENT_STATE.md`
- `data/meta.json`

README 不作为动态状态权威源。

长期维护方向：

**游戏正文 → 每次操作重读最新协议 → 安全存档事务 → 结构化事实 → 稳定关联 → 多种第一视角视图。**
