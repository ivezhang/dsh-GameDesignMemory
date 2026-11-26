# 知微 · 数据模型

一个 JSON 文件装下全部内容。本文件说明文件的结构、每个字段是什么意思、枚举有哪些、哪些规则会被强制校验，以及旧数据怎么迁到当前版本。

## 一、顶层结构

```json
{
  "version": 6,
  "updatedAt": "2026-11-26T14:00:00.000Z",
  "projects": [],
  "entries": [],
  "relations": [],
  "collections": [],
  "nodes": [],
  "views": [],
  "layout": { "positions": {}, "hidden": [], "updatedAt": "" },
  "proposals": [],
  "recalls": []
}
```

| 键 | 含义 |
| --- | --- |
| `version` | 数据版本，当前 **6**。插件版本与它无关，升级插件时低版本数据会自动迁移 |
| `projects` | 项目空间。至少有一个默认项目，删不掉最后一个 |
| `entries` | 记忆（一条一条的事实/结论/约定） |
| `relations` | 有向关系，两端可以是记忆也可以是知识对象 |
| `collections` | 主题集合，记忆可以同时属于多个集合 |
| `nodes` | 知识对象（项目/系统/子系统/概念/流程/偏好/原则/方法） |
| `views` | 关系图里保存的视图（记住当时的筛选与折叠） |
| `layout` | 关系图坐标与隐藏列表 |
| `proposals` | AI 提出的改动建议（待接受/已接受/已拒绝） |
| `recalls` | 召回记录：谁在什么任务下取用了哪些记忆 |

## 二、记忆 entry

```json
{
  "id": "mem_xxx",
  "title": "星云勘测传送带：数值与 ID",
  "summary": "一句话摘要（自动从正文派生，可改）",
  "content": "正文，Markdown",
  "type": "decision",
  "domains": ["event", "economy"],
  "tags": ["星云勘测", "传送带"],
  "status": "active",
  "confidence": 0.85,
  "importance": 0.5,
  "protectionLevel": "normal",
  "scope": "project",
  "projectId": "prj_default",
  "source": { "kind": "manual", "label": "…" },
  "facts": [{ "label": "付费标识", "value": "isPurchase(bool)" }],
  "nodeIds": ["knd_xxx"],
  "parentNodeId": "knd_xxx",
  "relatedMemoryIds": ["mem_yyy"],
  "versions": [],
  "evidence": [],
  "createdAt": "…",
  "updatedAt": "…"
}
```

- **type**：8 类 —— `decision` 设计决策 / `rule` 设计规则 / `assumption` 设计假设 / `question` 设计问题 / `proposal` 设计方案 / `reference` 参考案例 / `metric` 数值数据 / `retro` 复盘结论 / `process` 流程约定 / `habit` 习惯 / `convention` 固有约定 / `context` 背景 / `task` 任务。旧版本里的分类会自动映射到这些类型，原分类保留在 `legacy` 字段里。
- **status**：`draft` 草稿 / `pending` 待确认 / `review` 待复核 / `active` 已生效 / `deprecated` 已废弃 / `archived` 已归档。归档的不参与日常检索与整理。
- **protectionLevel**：`normal` / `confirmed`（已确认）/ `protected`（固有约定，默认锁定）。**protected 的记忆被静默改写时接口返回 409**，必须显式 `force: true` 才改，并且会多留一个版本。
- **versions**：每次正文/标题/状态变动的快照（谁改的、为什么、什么时候）。旧数据迁移时会自动补上第 1 版与一条"迁移自旧版本数据"证据。
- **evidence**：来源与证据。可以是文件路径、对话、用户口述，或一次确认行为。
- **nodeIds / parentNodeId / relatedMemoryIds**：与知识对象的挂接，双向保持一致（写入时同步）。

## 三、知识对象 node

```json
{
  "id": "knd_xxx",
  "title": "星云勘测",
  "nodeType": "system",
  "description": "玩家在期期开放的限定玩法里投入代币换奖励",
  "steps": [{ "id": "stp_1_ab", "title": "打开配置表", "note": "" }],
  "attributes": [{ "label": "数值数据", "value": "39 格 / 30 免费" }],
  "tags": ["星云勘测", "传送带"],
  "aliases": [],
  "status": "active",
  "scope": "project",
  "projectId": "prj_default",
  "parentNodeId": "knd_parent",
  "confidence": 0.8,
  "importance": 0.6,
  "protectionLevel": "normal",
  "relatedMemoryIds": ["mem_xxx"],
  "versions": [],
  "createdAt": "…",
  "updatedAt": "…"
}
```

- **nodeType**：8 类 —— `project` 项目 / `system` 系统 / `subsystem` 子系统 / `concept` 概念 / `workflow` 流程 / `preference` 偏好 / `principle` 原则 / `method` 方法。
- **steps**：只有流程对象常用。每条步骤有序，可拖动改序。对象版本快照里也存步骤清单，回滚时步骤一起回滚。
- **parentNodeId**：层级只能成树，写入时检查成环（返回 400）。
- 记忆与对象是**多对多**：一条记忆可以挂多个对象，一个对象可以挂多条记忆。挂接是双向同步的，删对象会把记忆上的引用清掉，不会删记忆。

## 四、关系 relation

统一的双端点模型，四个端点字段：

```json
{
  "id": "rel_xxx",
  "sourceType": "memory",
  "sourceId": "mem_a",
  "targetType": "node",
  "targetId": "knd_b",
  "relationType": "appears_in",
  "description": "自然语言描述，可留空自动生成",
  "status": "confirmed",
  "confidence": 0.8,
  "origin": "rule",
  "createdAt": "…"
}
```

- **28 种关系分五组**：
  - 层级：`contains` / `belongs_to` / `part_of`
  - 业务：`appears_in` / `uses` / `drops` / `requires` / `crafted_from` / `affects` / `depends_on` / `balanced_against`
  - 流程：`follows` / `precedes` / `next_step` / `triggers` / `produces` / `exception_to`
  - 偏好与原则：`prefers` / `avoids` / `applies_to` / `guides` / `constrains`
  - 知识：`related_to` / `derived_from` / `references` / `conflicts_with` / `supersedes` / `refines`
- **status**：`suggested` 建议中 / `confirmed` 已确认 / `rejected` 已忽略。界面上"建议"与"确认"分开，未确认的不参与"上下游"分析。
- 写入时校验三件事：不能自指；关系类型与两端类型必须匹配（例如 `drops` 只能从对象指向对象或记忆）；层级关系不能成环。任何一条不满足返回 400，消息直接说明原因。
- 旧数据的 `links: [{ to, label }]` 会迁移成 `related_to` 关系，`label` 存进 `description`。

## 五、集合与视图

```json
{ "id": "col_xxx", "name": "星云勘测", "description": "", "color": "blue",
  "memoryIds": ["mem_a", "mem_b"], "tags": [], "createdAt": "…" }
```

- 集合是主题聚类，一条记忆可属于多个集合；删集合不删记忆。
- 合并集合时被并入方的记忆全部转移过去，来源记一条改动日志。

```json
{ "id": "view_xxx", "name": "看星云勘测", "kind": "graph",
  "config": { "domain": "", "type": "", "collapsed": [], "hidden": [] } }
```

- 保存的视图只记筛选与折叠状态，不是数据快照；数据变了视图还是活的。

## 六、布局 layout

```json
{ "positions": { "mem_a": { "x": 120, "y": 40 }, "knd_b": { "x": 300, "y": 80 } },
  "hidden": ["knd_c"], "updatedAt": "…" }
```

- `positions` 只保存**手动摆过**的节点坐标；没摆过的由前端按力导向自动排布。
- `hidden` 是"从视图隐藏"的节点 id，数据本身不删。
- 只改隐藏状态时不要传 `positions`，否则会把已有坐标洗掉；宿主侧对这一点做了保护（沿用旧坐标）。
- 规范化时会清掉指向已删除节点的坐标与隐藏项，避免脏数据越积越多。

## 七、上限与校验

| 项 | 上限 |
| --- | --- |
| 记忆条数 | 4000 |
| 知识对象 | 1200 |
| 关系 | 4000 |
| 单条正文 | 40000 字 |
| 单条标题 | 160 字 |
| 标签数 / 单个标签 | 20 / 40 字 |
| 领域数 | 10 |
| 集合成员 | 2000 |
| 版本快照 / 证据 | 每对象 60 / 每记忆 40 |
| 布局节点 | 4000（隐藏项另计 4000） |

读入时所有字段都过一遍规范化：超长截断、枚举越界回落默认值、指向不存在对象的引用被清掉。所以手改 JSON 也不会把界面弄崩，只会丢掉不合法的部分。

## 附：导出格式

整库导出是 `{ version, projects, entries, nodes, relations, collections, views, proposals, recalls, frames, layout }`；2.6.8 起 `nodes` 才真正写进来（之前漏了，导入也从不恢复对象）。

按项目导出（`export` 带 `projectId`）额外带 `scope: "project"` 与 `projectId`，`projects` 只含该项目，`entries/nodes/relations/collections/frames/layout` 都裁到该项目的范围，`views/proposals/recalls` 为空数组。

## 附：撤销栈（运行时，不落库）

无论数据版本是多少，内存里始终只有最近 5 份「写操作前的整库快照」：`{state, action, at}`。它不写进 `memories.json`，也不参与迁移；重启即清空。撤销时把快照整体换回 state，再走一次正常 `persist`（`prune` 与 `.bak` 照旧），因此撤销本身也是一次可追溯的写盘。

## 八、版本迁移

| 文件版本 | 变化 | 迁移动作 |
| --- | --- | --- |
| 1 → 2 | 加项目空间与关系图布局 | 建默认项目，旧记忆归入 |
| 2 → 3 | 记忆类型/领域/状态重做，加集合 | 旧分类映射到新类型，`links` 转关系，`regions` 转记忆区 |
| 3 → 4 | 加版本、证据、保护级别、提案、召回记录 | 为每条记忆补第 1 版与"迁移自旧版本数据"证据 |
| 4 → 5 | 加知识对象与对象关系 | 按项目补 project 节点，不凭空造业务对象 |
| 5 → 6 | 关系改双端点，对象加版本 | 旧 `sourceMemoryId` 转 `sourceType/sourceId`，对象补版本 |

迁移是**加法式**的：只补不删，原有记忆的 id、标题、正文、时间戳全部保留。迁移前会在同目录留一份带时间戳的备份；迁移结果可对照 `MIGRATION-REPORT.md`，数据层验收脚本 `tests/acceptance.mjs` 的 A6 项专门检查"迁移与读写不静默丢数据"。
