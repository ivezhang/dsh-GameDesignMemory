# 数据层验收结果

- 生成时间：2026-11-26T14:49:21.726Z
- 数据来源：C:\Users\Administrator\.dsh\design-memory\memories.json（复制到临时目录后运行，线上库未被修改）
- 数据版本：迁移前 5 → 迁移后 6
- 结果：**7 / 7 通过**

> 这一页只覆盖「数据与接口层」的验收：数据的完整性、固有约定保护、跨项目召回隔离、关系可追溯性、重复率与契约。
> 真人鼠标/键盘的交互走查仍需按 [WALKTHROUGH.md](WALKTHROUGH.md) 执行——这一页不能替代它。

| 编号 | 验收项 | 预期 | 实际 | 结论 |
| --- | --- | --- | --- | --- |
| A1 | 原有记忆都有版本历史与来源证据 | 每条记忆至少 1 个版本、1 条证据，currentVersion 指向最新版本 | 记忆 34 条；缺版本 0；缺证据 0；版本号不一致 0 | 通过 |
| A2 | 固有约定不会被静默改写，用户明确修改才生效 | 静默修改被拒绝且内容不变；带 force 的修改成功并留下新版本 | 静默修改返回 409 protected；内容是否保持原样 true；force 修改 ok=true；版本数 2 | 通过 |
| A3 | 指定项目召回不会带出其他项目的记忆 | 结果不含另一个项目的记忆，全局记忆仍参与 | 命中 2 条；含他项目记忆 false；含全局记忆 true | 通过 |
| A4 | 每条关系都有来源与置信度，两端都能解析 | 关系的 source / confidence 完整，sourceId 与 targetId 都存在 | 关系 8 条；缺来源或置信度 0；端点悬空 0 | 通过 |
| A5 | 对象重复率可控 | 整理中心给出的疑似重复对象对为 0（真实库里没有需要合并的同义对象） | 知识对象 1 个；疑似重复 0 对 | 通过 |
| A6 | 迁移与读写没有静默丢数据 | 记忆增量正好等于脚本新建的 3 条，关系/集合/项目数量没有意外的减少 | 增量 {"entries":0,"relations":0,"collections":0,"projects":0} | 通过 |
| A7 | 宿主契约完整（工具 + 路由） | 6 个工具全部注册，/design-memory/api 可用 | 工具 design_memory_analyze, design_memory_observe, design_memory_recall, design_memory_search, design_memory_suggest, design_memory_write；路由 ok | 通过 |
