# V2.4 需求对照表

> 对照用户 2026-11-26 提出的 V2.4 需求书整理。状态三种：**已自动化**（有测试钉住）、**仅代码级**（实现存在但没有交互断言）、**未完成交互验收**（必须真人点鼠标，尚未做）。

## 一、产品定位与循环

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 自动观察 → 沉淀 → 归类 → 关系 → 调用 → 演进 | 28-evolve.js（observeMemories / rankRecall / tidyReport）、32-knowledge.js | 已自动化（host 测试） |
| AI 记录、用户确认 | proposals + suggested 关系 + 整理中心 | 已自动化 |
| 保留来源与演进 | versions / evidence / source.label | 已自动化（A1、2.5.2 测试） |
| 固有约定不被擅改 | normalizeProtection + 409 protected + force | 已自动化（A2） |

## 二、数据模型

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| KnowledgeNode 统一结构（13 字段） | 10-normalize.js normalizeKnowledgeNode | 已自动化 |
| 8 种 nodeType + 属性 + 流程步骤 | 00-head.js KNOWLEDGE_NODE_TYPES、normalizeNodeAttributes / normalizeNodeSteps | 已自动化 |
| Memory 保留全部能力并多对多关联 | entry.nodeIds / node.relatedMemoryIds 双向 | 已自动化（node-link-memory） |
| 四维度共用底座 | KNODE 视图过滤 + scope/projectId | 已自动化（四 tab 断言） |

## 三、关系系统

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 28 种关系、五组语义 | 00-head.js RELATION_GROUPS / RELATION_TYPES / RELATION_PHRASE | 已自动化（分组断言） |
| 双端点（记忆 / 对象 / 框）与方向 | normalizeRelation + fullRelationKey | 已自动化 |
| 语义校验：自反、不适用、层级成环 | 32-knowledge.js checkRelationEndpoints + saveRelation 400 | 已自动化 |
| 自然语言预览 | NodeRelationDialog / RelationDialog 的 zw-preview | 已自动化（预览有文本） |
| 拒绝后不重建 | 既有 rejected 关系不覆盖 | 已自动化（host） |

## 四、关系图

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 对象为主节点、记忆按需展开 | 74-graph.js knowledgeNodes + 记忆节点并存 | 已自动化 |
| 四视图共用一套数据 | 77-knode.js KnowledgeView + knView | 已自动化（切换不重复节点） |
| 节点区分类型 / 状态 / 记忆 | zw-gnodeKnGlyph + candidate 虚线 | 已自动化 |
| 关系线区分类型与方向、标签悬停才显示 | relationColor + 箭头 marker + hover label | 仅代码级 |
| 节点尺寸不随正文变长 | nodeRadius 按 degree 计算 | 仅代码级 |

## 五、交互规范

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 三栏结构、左栏可折叠、右栏不挤画布 | 80-panel.js + 10-css.js 宽度 clamp | 已自动化 |
| 单击空白取消选择 | endDrag pan 分支 + onClearSelection | 已自动化 |
| 单击节点开详情 | onSelectGraphNode | 已自动化 |
| 双击聚焦对象 | onDoubleClick → onFocusNode | 已自动化 |
| 拖动节点只改布局 | layout-save + 700ms 防抖 | 已自动化 |
| Space + 拖动平移 | 74-graph keydown + startPan | 已自动化 |
| 滚轮以鼠标为中心缩放 | onWheel + toGraph | 仅代码级 |
| Shift 拖动框选 | startBox(mode box) | 已自动化 |
| Ctrl/Cmd 点击多选 | endDrag additive → graphSelection | 已自动化 |
| Esc 关最上层 / 取消选择 | Modal useEscape + 画布 keydown | 已自动化 |
| Delete 走删除/归档确认 | onRequestDeleteNode → nodeDelete 弹窗 | 已自动化 |
| 多选明显、批量入口 | zw-batchbar + graphSelection | 已自动化 |
| 展开折叠 +N、可重复执行 | collapsedNodes + gnodeKnCount | 已自动化 |
| 创建对象：必填校验、重复检测、成功后定位 | NodeDialog + saveKnowledgeNode duplicate | 已自动化 |
| 编辑：未保存离开提示、失败保留输入 | NodeDialog / EntryEditor + 失败用例 | 已自动化 |
| 关联记忆：解除关联不删记忆 | unlinkMemoryFromNode | 已自动化（host） |
| 合并对象：主 ID 保留、关系迁移、来源标记 merged | mergeKnowledgeNodes | 已自动化 |
| 搜索覆盖记忆 / 对象 / 集合 / 项目并分组 | 80-panel nodeHits / collectionHits / projectHits | 已自动化 |
| 整理中心：候选对象、重复、批量确认 | 76-tidy.js + tidyReport | 已自动化 |
| 删除与撤销区分（关联 / 归档 / 删除） | entry-restore、node-archive、relation-delete 撤销 | 已自动化 |
| 动画轻量、不使用长动画 | 10-css.js keyframes 均 ≤ 2.4s | 仅代码级 |

## 六、详情特化

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| Workflow 步骤可增删、上下移 | NodeDialog moveStep + steps | 已自动化（host steps 断言） |
| Workflow 步骤拖动排序 | NodeDialog 的 zw-stepHandle 拖拽 + onDragOver/onDrop | 已自动化（把手数量、换序结果、保存载荷顺序） |
| Preference 纠正 AI 的理解（窄化 / 放宽 / 不再适用 / 一次性） | PreferenceFixDialog + correctPreference | 仅代码级 |
| Principle / method 展示证据与冲突 | NodeDetail 关系分类展示 | 仅代码级 |

## 七–八、自动观察 / 主动调用

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 观察区分事实 / 约定 / 习惯 / 推测 / 临时 | observeMemories + evidenceType | 已自动化（host） |
| 匹配则关联、否则给候选建议 | nodeLinks / nodeCandidates | 已自动化 |
| 先识别对象再检索记忆 | rankRecall nodeBoost | 已自动化（召回命中对象） |
| 记录任务 / 命中对象 / 路径 / 原因 | recalls.nodes + recalls.paths | 已自动化（渲染 + host） |
| 跨项目隔离 | rankRecall projectId 过滤 | 已自动化（2.5.8 测试 + A3） |

## 九–十、视觉与兼容

| 需求 | 实现位置 | 状态 |
| --- | --- | --- |
| 设计令牌、同功能按钮跨页一致 | 10-css.js 令牌 + 复用 zw-btn / zw-iconBtn | 仅代码级 |
| 旧数据 / 版本 / 证据 / 关系 / 集合 / 区域 / 布局保留 | migrateStore v3 → v4 → v5 → v6 | 已自动化（迁移 16 项 + MIGRATION-REPORT） |
| 旧六个工具兼容 | search / write / suggest / analyze / observe / recall | 已自动化（契约 8 项） |
| 不为填满图谱造低质量节点 | 迁移只补项目节点；观察才建候选 | 已自动化 |

## 十一、交互验收 11.1–11.18

| 编号 | 场景 | 状态 |
| --- | --- | --- |
| 11.1 | 导航 / 切视图不丢数据、不重复节点、不空白 | 已自动化 |
| 11.2 | 单击 / 双击 / 切节点 / 点空白 | 已自动化 |
| 11.3 | 拖节点 / 平移 / 滚轮 / 刷新后布局 | 部分自动化：拖动与平移已断言，滚轮与刷新后布局仅代码级 |
| 11.4 | Ctrl 多选 / 再点取消 / Shift 框选 / 数量 / 取消 | 已自动化（多选 + 框选），「再点取消」仅代码级 |
| 11.5 | 展开折叠重复执行与位置 | 已自动化（两轮折叠 / 展开），位置保持仅代码级 |
| 11.6 | 建对象：空名、连点保存、错误、重名 | 已自动化（空名、失败保留输入、重名提示） |
| 11.7 | 编辑：取消不保存、保存同步、未保存提示、失败保留 | 已自动化 |
| 11.8 | 关系创建：重复 / 不合理类型 / 选自己 / 取消 | 已自动化（host 三类 400） |
| 11.9 | 关联记忆：双向跳转、解除不删、一记忆多对象 | 已自动化（host） |
| 11.10 | 合并：主 ID 保留、关联不丢、关系迁移去重、留历史 | 已自动化（host） |
| 11.11 | 搜索：三类命中、筛选、点击定位、清除、空态 | 已自动化 |
| 11.12 | 整理中心：证据、改类型、确认、拒绝、批量不误伤 | 已自动化（批量确认） |
| 11.13 | 流程步骤编辑 | 已自动化（增删、上下移与拖拽排序） |
| 11.14 | 偏好纠正后召回不再作为约束 | 仅代码级 |
| 11.15 | 删除 / 归档 / 撤销 | 已自动化（归档 ≠ 删除、撤销恢复） |
| 11.16 | 四视图一致性 | 已自动化 |
| 11.17 | 键盘与弹窗 | 已自动化（Esc 逐层、Ctrl/Cmd+K、Enter、输入框不误触 Space） |
| 11.18 | 异常与反馈：失败、重复、超长、快速重复 | 已自动化（失败三条 + 超长名称截断） |

> 说明：以上「已自动化」指渲染测试（假 DOM + 真实事件派发）、host 测试或端到端演练脚本（scenario-a.mjs）钉住了对应行为。真实浏览器的鼠标轨迹、滚动容器命中、动画观感、跨浏览器差异仍属**未完成交互验收**，需要按 WALKTHROUGH.md 由人执行。

## 十二、业务场景 A–F

| 场景 | 状态 |
| --- | --- |
| A 跨系统项目关系（哥布林 / 铁剑…） | **已自动化**：tests/scenario-a.mjs 从空库搭出系统 → 副本 → 怪物 → 材料 → 装备，建 5 条带方向关系，记忆挂对象后按任务召回并检查路径；报告见 SCENARIO-A.md |
| B 同一怪物跨副本复用 | 支持复用同一对象；同名异义需人工在建对象时区分（有重复提醒） |
| C 工作流程自动识别 | Workflow 对象 + 步骤 + 观察候选已就绪；自动归纳多步流程未实现 |
| D 偏好识别与纠正 | 偏好对象 + 证据累积 + 纠正入口已就绪（纠正仅代码级） |
| E 跨项目复用（全局 Workflow） | scope=global + 项目局部补充已支持 |
| F 知识冲突 | protected 提案机制 + assistConflicts 冲突检测已就绪 |

## 十三–十五、性能与交付

| 需求 | 状态 |
| --- | --- |
| 布局与知识数据分离存储 | 已实现：layout.positions / layout.hidden 与 nodes 分开存 |
| 不为每次拖动重载整库 | 已实现：layout-save 只写布局，节点拖动 700ms 防抖 |
| 数百节点流畅 | 未实测（当前 34 记忆 + 1 对象，上限 4000 记忆 / 1200 对象） |
| 交付文档包 | 已齐：V2.4-DESIGN / CHANGELOG / UPGRADE-2.5.x / MIGRATION-REPORT / ACCEPTANCE / WALKTHROUGH / FEATURES / DETAIL |

