# 知微 V2.4 交付验收记录

> 生成时间：2026-11-26 22:55，最后一次全量复跑 2026-11-26 23:00（Asia/Shanghai）
> 本文件是「需求 → 实现 → 自动化证据 → 人工待办」的汇总入口。逐条对照见 [TRACEABILITY.md](TRACEABILITY.md)，人工走查表见 [WALKTHROUGH.md](WALKTHROUGH.md)。

## 一、当前交付版本

| 项 | 值 |
|---|---|
| 插件版本 | **2.6.9** |
| 部署位置 | `D:\unity code\N2-main\project-n2\.dsh-plugins\design-memory` |
| 数据版本 | 6（v5 及更早自动迁移，`docs/MIGRATION-REPORT.md`） |
| 构建产物 | `index.js` 6548 行 / 283,232 B；`client.js` 14760 行 / 583,292 B |
| 三处产物一致性 | 构建目录 / 插件目录 / gh 克隆的 `index.js` `client.js` `package.json` SHA256 前 12 位完全相同 |
| 运行中宿主 | **仍是旧版**（`GET /design-memory/api` 返回 `version=5`、`nodes=0`），需要完全重启 DSH 才会加载 2.6.9 |

## 二、自动化测试结果（部署目录内复跑）

| 套件 | 命令 | 结果 |
|---|---|---|
| 宿主单测 + 工作区 | `node tests/host-test.mjs` | **102 tests / 102 passed**（WORKSPACE 55 checks） |
| 渲染冒烟 + 交互断言 | `node tests/render-smoke.mjs` | **243 checks / 243 passed** |
| DSH 宿主契约 | `node tests/dsh-contract.mjs` | **8 / 8** |
| 数据迁移 | `node tests/migrate-live.mjs` | **16 / 16** |
| 数据层验收 | `node tests/acceptance.mjs` | **7 / 7**（`docs/ACCEPTANCE.md`） |
| 场景 A 端到端 | `node tests/scenario-a.mjs` | **6 / 6**（`docs/SCENARIO-A.md`） |
| 数据层性能 | `node tests/perf.mjs` | **7 / 7 在预算内**（`docs/PERF.md`） |
| 静态审计 | `node tests/static-audit.mjs` | **clean**（仅两条既有 CSS 未用警告） |

性能实测（300 对象 / 1000 记忆 / 300 关系）：首次加载 48.8ms、再次读取 15.7ms、搜索 2.0ms、召回 56.9ms、整理中心 68.9ms（修前 7837ms）、区域检索 0.5ms、保存 300 节点布局 45.7ms。

## 三、版本与提交（本地 gh 克隆，尚未推送）

远端 `origin/main` 仍停在 `29f879f`（2.3.2）；本地领先 **12 条**：

```
259f075 docs: v2.6.9 走查表第 17 条写明 Ctrl/Cmd+Z
129ead2 feat: v2.6.9 全局撤销（Ctrl/Cmd+Z，栈深 5 步）
60e3419 fix: v2.6.8 导出补上知识对象，支持按项目导出
3a5c5ec feat: v2.6.7 按步骤重合识别疑似重复的流程对象
74ef7dd docs: v2.6.6 架构说明 / 数据模型 / 界面变更 / 未完成清单
6cb5814 feat: v2.6.5 同一条流程跨对话逐步补全并记版本
ca238ea perf: v2.6.4 整理中心 7.8s -> 0.07s，新增数据层压测
9dde84b test: v2.6.3 偏好纠正交互断言
8d7e689 feat: v2.6.2 观察时自动归纳工作流程
90c02ea test: v2.6.1 场景 A 端到端演练
9b0f15a feat: v2.6.0 流程步骤支持拖动排序
5a06918 feat!: v2.5.9 知微 — 知识对象多维知识网络（V2.4）
```

推送需要用户明确同意（需求书要求「测试通过且经同意再推」）。

## 四、需要人做的三件事

1. **完全重启 DSH**：当前运行中的宿主还是 2.5.7 时代的内存状态，重启后才会看到知识对象层（`nodes` 非 0）、全局撤销与 2.6.x 全部改动。
2. **按 `docs/WALKTHROUGH.md` 走查 20 条**：真实鼠标轨迹、滚动命中、动画观感、跨浏览器差异只能人看；第 17 条现在可直接验「删记忆 → Ctrl+Z → 回来」。
3. **点头后推 GitHub**：打 tag `v2.6.9`，推 `ivezhang/dsh-GameDesignMemory`。

## 五、还没做到的部分（详见 OPEN-ITEMS.md）

- 撤销栈只有 5 步且不跨重启；拖动节点的布局保存不进栈。
- 真人走查未回填；浏览器绘制耗时未在 DevTools 实测（只有数据层压测）。
- 真实项目数据上的完整演练未做（场景 A 是合成数据）。
- 对象聚类与流程重复判断仍是确定性启发式，不是语义模型。
- 画布超过 120 个对象只有折叠徽章，没有自动聚合簇。
- 导入仍只支持整库 merge / replace，没有「只导入某个项目并逐条确认」。
