# 升级到 2.5.6

## 改了什么

### 1. 修 bug：对象动作只认 `id`，不认 `nodeId`

`node-archive`、`node-restore`、`node-delete` 三个动作原来只读 `input.id`，而写给 AI 的工具 schema 里字段名是 `nodeId`。界面一直传 `id`，所以人点按钮没问题；但 AI 通过 `design_memory_write` 调用时会拿到 404「知识对象不存在：undefined」。

现在两种写法都接受：`cleanLine(input.id || input.nodeId)`。

### 2. 新增一份真实数据迁移报告

新增 `tests/migration-report.mjs`：把线上库**复制一份**到临时目录，用真实的 `index.js` 跑一遍 v5 → v6 迁移，输出 `docs/MIGRATION-REPORT.md`。线上文件一个字节都不动。

报告内容：

- 迁移前后计数对比（记忆、关系、集合、记忆区、项目、知识对象）；
- 完整性核对（每条记忆是否都有版本历史 / 来源证据、关系是否都写成双端点、落盘版本是否与内存一致）；
- 迁移后的真实数据冒烟：建对象 → 关联真实记忆 → 建双端点关系 → 按任务召回 → 召回带路径 → 调用记录落盘 → 整理中心可读 → 硬删除收尾。

本次结果：记忆 34 → 34、关系 8 → 8、集合 1 → 1、记忆区 1 → 1、项目 1 → 1，知识对象 1（就是项目自动节点，说明迁移没有凭空造对象）；34/34 条记忆都有版本历史与证据；8/8 条关系都是双端点；冒烟 8/8 通过。

### 3. 顺手加固：宿主契约变化不再带崩插件

`systemPrompt` 与 `llm` 两处 `ctx.inject` 都包了 try/catch，并且在调用 `section()` 之前检查服务与签名。上一次「fiber failed → 面板 404」就是注册阶段抛错把后续路由注册全带崩了，这次提前堵住。

## 数据

数据版本仍是 6，结构没有变化，不需要重新迁移。

## 验证

- host：94 tests（新增 2 条 `nodeId` 断言）+ WORKSPACE 55 checks
- 渲染：192 checks
- 契约 8（新增「systemPrompt 服务抛错时插件照样注册工具与路由」）/ 迁移 16 / 静态审计干净

## 如何生效

- 前端：刷新页面。
- 后端：完全重启 DSH 后 `GET /design-memory/api` 应返回 `version: 6`。
