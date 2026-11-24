window.__ModuleLoader__.load({
  id: '@local/design-memory',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useCallback, useRef } = React

    const NS = 'designMemory'
    const PANEL_ID = 'design-memory'
    const API = 'design-memory/api'

    const CATEGORIES = [
      { id: 'system', labelKey: 'rail.system', hintKey: 'empty.system.hint' },
      { id: 'numbers', labelKey: 'rail.numbers', hintKey: 'empty.numbers.hint' },
      { id: 'workflow', labelKey: 'rail.workflow', hintKey: 'empty.workflow.hint' },
      { id: 'other', labelKey: 'rail.other', hintKey: 'empty.other.hint' }
    ]
    const STATUSES = [
      { id: 'draft', labelKey: 'status.draft' },
      { id: 'confirmed', labelKey: 'status.confirmed' },
      { id: 'deprecated', labelKey: 'status.deprecated' }
    ]

    const ZH = {
      'panel.label': '策划记忆',
      'head.title': '策划记忆',
      'head.subtitle': '系统规则、数值口径、工作流与设计约定的长期记忆库',
      'view.list': '列表',
      'view.graph': '关系网',
      'search.placeholder': '搜索标题、要点或正文',
      'search.clear': '清除搜索',
      'action.new': '新建记忆',
      'action.refresh': '刷新',
      'action.save': '保存',
      'action.saving': '保存中…',
      'action.cancel': '取消',
      'action.edit': '编辑',
      'action.delete': '删除',
      'action.retry': '重试',
      'action.close': '关闭',
      'rail.label': '记忆分类',
      'rail.all': '全部',
      'rail.system': '系统',
      'rail.numbers': '数值',
      'rail.workflow': '工作流',
      'rail.other': '其他',
      'rail.status': '状态',
      'status.all': '全部',
      'status.draft': '待确认',
      'status.confirmed': '已确认',
      'status.deprecated': '已废弃',
      'status.confirm': '确认',
      'status.deprecate': '废弃',
      'status.reopen': '恢复为已确认',
      'status.draftExplain':
        '待确认 = 从对话或文档里先记下、还没经你确认的结论。确认后 AI 才会把它当既定口径使用；废弃表示这条结论已作废。',
      'status.deprecatedExplain': '这条已废弃：AI 不会再把它的内容当成当前口径。若结论重新有效，可以恢复为已确认。',
      'list.label': '记忆列表',
      'list.count': '条',
      'list.links': '关联',
      'list.loading': '正在读取记忆库…',
      'list.noMatch': '没有匹配的记忆',
      'list.noMatchHint': '换个关键词，或切换分类 / 状态。',
      'detail.updated': '更新于',
      'detail.source': '来源',
      'detail.id': '编号',
      'detail.facts': '关键要点',
      'detail.pin': '置顶',
      'detail.unpin': '取消置顶',
      'detail.history': '改动记录',
      'detail.historyNoNote': '（未填写说明）',
      'detail.deleteConfirm': '删除后不可恢复，确认？',
      'detail.selectTitle': '选择一条记忆',
      'detail.selectHint': '从列表里点开一条，或新建一条。这里会显示规则、数值、工作流和改动记录。',
      'detail.links': '关联记忆',
      'detail.backlinks': '被关联',
      'detail.noLinks': '还没有关联。把相关的记忆串起来，关系网里就能看到它们。',
      'detail.linkPick': '选择要关联的记忆',
      'detail.linkLabel': '关系说明（可选）',
      'detail.linkAdd': '添加关联',
      'detail.linkRemove': '移除关联',
      'detail.linkNothing': '没有可关联的记忆了',
      'empty.title': '还没有策划记忆',
      'empty.hint': '把已经确认的规则、数值和约定记在这里，开新会话时 AI 也能查到。',
      'empty.cta': '新建第一条',
      'empty.system.hint': '玩法规则、模块边界、异常口径',
      'empty.numbers.hint': '产出消耗、概率阈值、平衡结论',
      'empty.workflow.hint': '翻译、找竞品、目录与交付约定',
      'empty.other.hint': '其他设计约定',
      'editor.mode.create': '新建记忆',
      'editor.mode.edit': '编辑记忆',
      'editor.hint': 'Esc 取消 · Ctrl/⌘ + Enter 保存',
      'editor.fields.title': '标题',
      'editor.fields.category': '分类',
      'editor.fields.status': '状态',
      'editor.fields.summary': '摘要',
      'editor.fields.tags': '标签',
      'editor.fields.note': '改动说明',
      'editor.title.placeholder': '标题，例如「周末活动场地效果入口」',
      'editor.summary.placeholder': '一句话说明这条记忆解决什么问题',
      'editor.facts.title': '关键要点',
      'editor.facts.hint': '名称 = 值，例如「随机皮肤放大器 = 20」',
      'editor.facts.add': '添加一项',
      'editor.facts.remove': '删除这一项',
      'editor.facts.label': '名称',
      'editor.facts.value': '值',
      'editor.body.title': '详细说明',
      'editor.body.hint': '支持 - 列表与 ### 小标题',
      'editor.body.placeholder': '规则、口径、数值、代码位置、结论…',
      'editor.tags.placeholder': '标签，用逗号分隔',
      'editor.source.placeholder': '来源：会话、文档或配置表（可选）',
      'editor.note.placeholder': '本次改动说明（可选，写入改动记录）',
      'editor.saveHint': '保存后会记录更新时间与改动说明',
      'notice.created': '已新建记忆',
      'notice.saved': '已保存修改',
      'notice.deleted': '已删除记忆',
      'notice.confirmed': '已确认为既定口径',
      'notice.reopened': '已恢复为已确认',
      'notice.deprecated': '已标记为废弃',
      'notice.linked': '已添加关联',
      'notice.unlinked': '已移除关联',
      'ai.hint': 'AI 可读写：design_memory_search / design_memory_write',
      'storage.label': '存储位置',
      'error.load': '读取记忆库失败',
      'error.offline': '无法连接插件后台',
      'graph.nodes': '个节点',
      'graph.links': '条关联',
      'graph.empty': '关系网里还没有节点',
      'graph.emptyHint': '先新建几条记忆，或在详情里用「关联记忆」把它们串起来。',
      'graph.hint': '拖动节点 · 滚轮缩放 · 拖空白平移 · 单击查看',
      'graph.zoomIn': '放大',
      'graph.zoomOut': '缩小',
      'graph.fit': '适应窗口',
      'graph.relayout': '重新排版',
      'graph.auto': '自动关联',
      'graph.autoHint': '按共同标签自动补虚线，仅显示用，不写入数据',
      'graph.isolate': '只看这一条',
      'graph.isolateOn': '显示全部',
      'graph.title': '关系网',
      'graph.sharedTags': '共同标签'
    }

    const EN = {
      'panel.label': 'Design memory',
      'head.title': 'Design memory',
      'head.subtitle': 'System rules, numeric decisions, workflows, and project conventions',
      'view.list': 'List',
      'view.graph': 'Network',
      'search.placeholder': 'Search title, facts, or body',
      'search.clear': 'Clear search',
      'action.new': 'New entry',
      'action.refresh': 'Refresh',
      'action.save': 'Save',
      'action.saving': 'Saving…',
      'action.cancel': 'Cancel',
      'action.edit': 'Edit',
      'action.delete': 'Delete',
      'action.retry': 'Retry',
      'action.close': 'Close',
      'rail.label': 'Categories',
      'rail.all': 'All',
      'rail.system': 'Systems',
      'rail.numbers': 'Numbers',
      'rail.workflow': 'Workflows',
      'rail.other': 'Other',
      'rail.status': 'Status',
      'status.all': 'All',
      'status.draft': 'Draft',
      'status.confirmed': 'Confirmed',
      'status.deprecated': 'Deprecated',
      'status.confirm': 'Confirm',
      'status.deprecate': 'Deprecate',
      'status.reopen': 'Restore as confirmed',
      'status.draftExplain':
        'Draft = noted from a session or document but not confirmed by you yet. Only confirmed entries are treated as settled rules; deprecated means the conclusion no longer applies.',
      'status.deprecatedExplain':
        'This entry is deprecated: the agent no longer treats it as a current rule. Restore it as confirmed if the conclusion applies again.',
      'list.label': 'Entries',
      'list.count': 'entries',
      'list.links': 'links',
      'list.loading': 'Loading memories…',
      'list.noMatch': 'No matching entries',
      'list.noMatchHint': 'Try another keyword, or switch category / status.',
      'detail.updated': 'Updated',
      'detail.source': 'Source',
      'detail.id': 'ID',
      'detail.facts': 'Key facts',
      'detail.pin': 'Pin',
      'detail.unpin': 'Unpin',
      'detail.history': 'Change log',
      'detail.historyNoNote': '(no note)',
      'detail.deleteConfirm': 'This cannot be undone. Delete?',
      'detail.selectTitle': 'Select an entry',
      'detail.selectHint': 'Open an entry from the list, or create one. Rules, numbers, workflows, and change notes appear here.',
      'detail.links': 'Linked entries',
      'detail.backlinks': 'Linked from',
      'detail.noLinks': 'No links yet. Connect related entries and they show up in the network view.',
      'detail.linkPick': 'Pick an entry to link',
      'detail.linkLabel': 'Relation note (optional)',
      'detail.linkAdd': 'Add link',
      'detail.linkRemove': 'Remove link',
      'detail.linkNothing': 'Nothing left to link',
      'empty.title': 'No design memories yet',
      'empty.hint': 'Record confirmed rules, numbers, and conventions here so the agent can find them in later sessions.',
      'empty.cta': 'Create the first entry',
      'empty.system.hint': 'Rules, module boundaries, edge cases',
      'empty.numbers.hint': 'Outputs, costs, chances, thresholds',
      'empty.workflow.hint': 'Translation, competitor lookup, folders, delivery',
      'empty.other.hint': 'Other design conventions',
      'editor.mode.create': 'New entry',
      'editor.mode.edit': 'Edit entry',
      'editor.hint': 'Esc cancels · Ctrl/⌘ + Enter saves',
      'editor.fields.title': 'Title',
      'editor.fields.category': 'Category',
      'editor.fields.status': 'Status',
      'editor.fields.summary': 'Summary',
      'editor.fields.tags': 'Tags',
      'editor.fields.note': 'Change note',
      'editor.title.placeholder': 'Title, e.g. “Weekend event field effects”',
      'editor.summary.placeholder': 'One line: what problem does this entry answer?',
      'editor.facts.title': 'Key facts',
      'editor.facts.hint': 'Name = value, e.g. “Random skin amplifier = 20”',
      'editor.facts.add': 'Add a fact',
      'editor.facts.remove': 'Remove this fact',
      'editor.facts.label': 'Name',
      'editor.facts.value': 'Value',
      'editor.body.title': 'Details',
      'editor.body.hint': 'Supports - lists and ### headings',
      'editor.body.placeholder': 'Rules, numbers, file locations, conclusions…',
      'editor.tags.placeholder': 'Tags, comma separated',
      'editor.source.placeholder': 'Source: session, document, or table (optional)',
      'editor.note.placeholder': 'What changed (optional, saved to the change log)',
      'editor.saveHint': 'Saving records the time and your change note',
      'notice.created': 'Entry created',
      'notice.saved': 'Changes saved',
      'notice.deleted': 'Entry deleted',
      'notice.confirmed': 'Marked as confirmed',
      'notice.reopened': 'Restored as confirmed',
      'notice.deprecated': 'Marked as deprecated',
      'notice.linked': 'Link added',
      'notice.unlinked': 'Link removed',
      'ai.hint': 'Agent tools: design_memory_search / design_memory_write',
      'storage.label': 'Storage',
      'error.load': 'Could not load memories',
      'error.offline': 'Cannot reach the plugin host',
      'graph.nodes': 'nodes',
      'graph.links': 'links',
      'graph.empty': 'The network has no nodes yet',
      'graph.emptyHint': 'Create a few entries first, or connect them from an entry detail.',
      'graph.hint': 'Drag nodes · wheel to zoom · drag the canvas to pan · click to inspect',
      'graph.zoomIn': 'Zoom in',
      'graph.zoomOut': 'Zoom out',
      'graph.fit': 'Fit to window',
      'graph.relayout': 'Relayout',
      'graph.auto': 'Auto links',
      'graph.autoHint': 'Dashed edges derived from shared tags (display only)',
      'graph.isolate': 'Isolate',
      'graph.isolateOn': 'Show all',
      'graph.title': 'Network',
      'graph.sharedTags': 'shared tags'
    }

    const CSS = `
.dm-root {
  --dm-surface: var(--dsw-alias-bg-base, #ffffff);
  --dm-surface-1: var(--dsw-alias-bg-layer-1, #f7f8fa);
  --dm-surface-2: var(--dsw-alias-bg-layer-2, #f1f2f5);
  --dm-card: var(--dsw-alias-card-fill, var(--dsw-alias-bg-layer-1, #f7f8fa));
  --dm-skeleton: var(--dsw-alias-bg-skeleton, rgba(0, 0, 0, 0.05));
  --dm-border: var(--dsw-alias-border-l1, rgba(0, 0, 0, 0.06));
  --dm-border-strong: var(--dsw-alias-border-l2, rgba(0, 0, 0, 0.12));
  --dm-text: var(--dsw-alias-label-primary, #1b1b1c);
  --dm-text-2: var(--dsw-alias-label-secondary, #6b7280);
  --dm-hover: var(--dsw-alias-interactive-bg-hover, rgba(0, 0, 0, 0.04));
  --dm-active: var(--dsw-alias-interactive-bg-active, rgba(0, 0, 0, 0.06));
  --dm-accent: var(--dsw-alias-brand-primary, #4176e6);
  --dm-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.08);
  --dm-shadow: 0 10px 30px rgba(15, 23, 42, 0.12);
  --dm-toolbar-fill: color-mix(in srgb, var(--dm-surface) 88%, transparent);
  --dm-graph-bg: var(--dsw-alias-bg-base, #ffffff);
  --dm-grid: rgba(15, 23, 42, 0.05);
  --dm-edge: rgba(15, 23, 42, 0.3);
  --dm-edge-auto: rgba(15, 23, 42, 0.16);
  --dm-node-ring: var(--dsw-alias-bg-base, #ffffff);
  --dm-cat-system: var(--dsw-alias-link, #3b82f6);
  --dm-cat-numbers: var(--dsw-alias-state-success-primary, #22c55e);
  --dm-cat-workflow: var(--dsw-alias-state-info-primary, #7c6cd6);
  --dm-cat-other: var(--dsw-alias-state-warn-primary, #f59e0b);
  display:flex; flex-direction:column; height:100%; min-height:0; background:var(--dm-surface); color:var(--dm-text); font-size:13px; line-height:1.5;
}
.dm-root[data-dm-theme='dark'] {
  --dm-surface-1: var(--dsw-alias-bg-layer-1, #232324);
  --dm-surface-2: var(--dsw-alias-bg-layer-2, #2c2c2e);
  --dm-card: var(--dsw-alias-card-fill, rgba(255, 255, 255, 0.05));
  --dm-skeleton: var(--dsw-alias-bg-skeleton, rgba(255, 255, 255, 0.08));
  --dm-text: var(--dsw-alias-label-primary, #f3f4f6);
  --dm-text-2: var(--dsw-alias-label-secondary, #a1a1aa);
  --dm-hover: var(--dsw-alias-interactive-bg-hover, rgba(255, 255, 255, 0.06));
  --dm-active: var(--dsw-alias-interactive-bg-active, rgba(255, 255, 255, 0.1));
  --dm-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
  --dm-shadow: 0 14px 36px rgba(0, 0, 0, 0.55);
  --dm-grid: rgba(255, 255, 255, 0.055);
  --dm-edge: rgba(228, 232, 240, 0.36);
  --dm-edge-auto: rgba(228, 232, 240, 0.18);
  --dm-node-ring: var(--dsw-alias-bg-base, #151517);
}
.dm-root[data-dm-theme='light'] { color-scheme: light; }
.dm-root[data-dm-theme='dark'] { color-scheme: dark; }
.dm-root *, .dm-root *::before, .dm-root *::after { box-sizing:border-box; }
.dm-root button { font:inherit; color:inherit; }
.dm-head { flex:none; display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:22px 28px 16px; border-bottom:.5px solid var(--dm-border); }
html[data-platform='darwin'] .dm-head { padding-top:calc(22px + var(--dsh-frame-top-clearance, 0px)); }
.dm-title { margin:0; font-size:20px; line-height:28px; font-weight:500; letter-spacing:.2px; }
.dm-sub { margin:4px 0 0; font-size:12px; color:var(--dm-text-2); }
.dm-headActions { flex:none; display:flex; align-items:center; gap:8px; }
.dm-segment { display:inline-flex; gap:2px; padding:2px; border:1px solid var(--dm-border); border-radius:9px; background:var(--dm-surface-1); }
.dm-segmentBtn { display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 10px; border:0; border-radius:7px; background:transparent; color:var(--dm-text-2); font-size:12px; cursor:pointer; }
.dm-segmentBtn:hover { color:var(--dm-text); }
.dm-segmentBtnOn { background:var(--dm-surface); color:var(--dm-text); box-shadow:var(--dm-shadow-sm); }
.dm-search { position:relative; display:flex; align-items:center; }
.dm-search > svg { position:absolute; left:9px; color:var(--dm-text-2); pointer-events:none; }
.dm-search input { width:220px; height:32px; padding:0 30px; border:1px solid var(--dm-border); border-radius:8px; background:var(--dm-surface-1); color:var(--dm-text); font:inherit; outline:none; }
.dm-search input:focus-visible { border-color:var(--dm-accent); }
.dm-search input::placeholder { color:var(--dm-text-2); opacity:.8; }
.dm-searchClear { position:absolute; right:4px; display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--dm-text-2); cursor:pointer; }
.dm-searchClear:hover { background:var(--dm-active); color:var(--dm-text); }
.dm-notice { flex:none; display:flex; align-items:center; gap:8px; margin:10px 28px 0; padding:8px 12px; border-radius:8px; font-size:12px; background:var(--dm-hover); color:var(--dm-text-2); }
.dm-notice-success { color:var(--dsw-alias-state-success-primary, #16a34a); }
.dm-notice-error { color:var(--dsw-alias-state-error-primary, #ef4444); }
.dm-body { display:grid; grid-template-columns:196px minmax(260px, 320px) minmax(0, 1fr); flex:1; min-height:0; }
.dm-body-graph { grid-template-columns:196px minmax(0, 1fr); }
.dm-rail { display:flex; flex-direction:column; gap:2px; min-height:0; padding:12px 10px; overflow-y:auto; border-right:.5px solid var(--dm-border); }
.dm-railRow { display:flex; align-items:center; gap:8px; height:32px; padding:0 10px; border:0; border-radius:8px; background:transparent; color:var(--dm-text-2); cursor:pointer; text-align:left; }
.dm-railRow:hover { background:var(--dm-hover); color:var(--dm-text); }
.dm-railRowActive { background:var(--dm-active); color:var(--dm-text); font-weight:500; }
.dm-railLabel { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-railCount { flex:none; font-size:11px; color:var(--dm-text-2); font-variant-numeric:tabular-nums; }
.dm-dot { flex:none; width:7px; height:7px; border-radius:50%; background:var(--dm-text-2); opacity:.65; }
.dm-dot-system { background:var(--dm-cat-system); }
.dm-dot-numbers { background:var(--dm-cat-numbers); }
.dm-dot-workflow { background:var(--dm-cat-workflow); }
.dm-dot-other { background:var(--dm-cat-other); }
.dm-dot-system, .dm-dot-numbers, .dm-dot-workflow, .dm-dot-other { opacity:1; }
.dm-railDivider { height:1px; margin:10px 6px; background:var(--dm-border); }
.dm-railSection { padding:0 10px 6px; font-size:11px; letter-spacing:.04em; color:var(--dm-text-2); }
.dm-statusFilter { display:flex; flex-wrap:wrap; gap:6px; padding:0 8px; }
.dm-chip { height:24px; padding:0 9px; border:1px solid var(--dm-border); border-radius:999px; background:transparent; color:var(--dm-text-2); font-size:11px; cursor:pointer; }
.dm-chip:hover { background:var(--dm-hover); }
.dm-chipOn { border-color:var(--dm-accent); color:var(--dm-accent); }
.dm-railFoot { display:flex; flex-direction:column; gap:4px; margin-top:auto; padding:12px 10px 4px; font-size:11px; color:var(--dm-text-2); }
.dm-storage { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:.8; }
.dm-list { display:flex; flex-direction:column; min-height:0; border-right:.5px solid var(--dm-border); }
.dm-listHead { flex:none; display:flex; align-items:center; gap:8px; padding:14px 14px 10px; }
.dm-listTitle { font-weight:500; }
.dm-listCount { font-size:12px; color:var(--dm-text-2); }
.dm-listHead .dm-iconBtn { margin-left:auto; }
.dm-rows { flex:1; min-height:0; display:flex; flex-direction:column; gap:2px; padding:0 8px 12px; overflow-y:auto; }
.dm-row { display:flex; flex-direction:column; gap:5px; width:100%; padding:10px 12px; border:0; border-radius:10px; background:transparent; text-align:left; cursor:pointer; }
.dm-row:hover:not(:disabled) { background:var(--dm-hover); }
.dm-rowActive { background:var(--dm-active); box-shadow:inset 2px 0 0 var(--dm-accent); }
.dm-row:disabled { cursor:default; opacity:.65; }
.dm-rowTop { display:flex; align-items:center; gap:8px; }
.dm-rowTitle { flex:1; min-width:0; display:flex; align-items:center; gap:4px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-pinMark { display:inline-flex; flex:none; color:var(--dsw-alias-state-warn-primary, #f59e0b); }
.dm-statusPill { flex:none; padding:0 6px; border-radius:999px; background:var(--dm-hover); color:var(--dm-text-2); font-size:10px; line-height:16px; }
.dm-status-confirmed { color:var(--dsw-alias-state-success-primary, #16a34a); }
.dm-status-draft { color:var(--dsw-alias-state-warn-primary, #d97706); }
.dm-status-deprecated { color:var(--dm-text-2); opacity:.85; }
.dm-rowSummary { display:-webkit-box; overflow:hidden; color:var(--dm-text-2); font-size:12px; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.dm-rowMeta { display:flex; align-items:center; gap:6px; color:var(--dm-text-2); font-size:11px; }
.dm-rowMetaLinks { display:inline-flex; align-items:center; gap:3px; margin-left:auto; }
.dm-dotSep { opacity:.5; }
.dm-detail { min-width:0; min-height:0; overflow-y:auto; }
.dm-detailInner { max-width:720px; padding:26px 32px 48px; }
.dm-detailMeta { display:flex; align-items:center; gap:8px; color:var(--dm-text-2); font-size:11px; }
.dm-catChip { display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 8px; border-radius:999px; background:var(--dm-hover); font-size:11px; }
.dm-catChip::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--dm-text-2); }
.dm-cat-system::before { background:var(--dm-cat-system); }
.dm-cat-numbers::before { background:var(--dm-cat-numbers); }
.dm-cat-workflow::before { background:var(--dm-cat-workflow); }
.dm-cat-other::before { background:var(--dm-cat-other); }
.dm-detailDate { margin-left:auto; }
.dm-detailHead { display:flex; align-items:flex-start; gap:12px; margin:10px 0 6px; }
.dm-detailTitle { flex:1; min-width:0; margin:0; font-size:19px; line-height:28px; font-weight:600; word-break:break-word; }
.dm-detailSummary { margin:0 0 18px; color:var(--dm-text-2); font-size:13px; line-height:1.7; }
.dm-statusNote { display:flex; align-items:flex-start; gap:10px; margin:12px 0 18px; padding:10px 12px; border:1px solid var(--dm-border); border-radius:10px; background:var(--dm-surface-1); color:var(--dm-text-2); font-size:12px; line-height:1.65; }
.dm-statusNote-warn { border-color:color-mix(in srgb, var(--dsw-alias-state-warn-primary, #d97706) 42%, var(--dm-border)); }
.dm-statusNote-dim { border-style:dashed; }
.dm-statusNoteIcon { flex:none; margin-top:1px; color:var(--dsw-alias-state-warn-primary, #d97706); }
.dm-statusNoteBody { flex:1; min-width:0; }
.dm-statusNoteActions { display:flex; flex:none; align-items:center; gap:6px; }
.dm-section { margin:20px 0 0; }
.dm-sectionTitle { margin:0 0 8px; color:var(--dm-text-2); font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; }
.dm-facts { border-top:.5px solid var(--dm-border); }
.dm-factRow { display:grid; grid-template-columns:minmax(90px,180px) minmax(0,1fr); gap:12px; padding:8px 2px; border-bottom:.5px solid var(--dm-border); }
.dm-factLabel { color:var(--dm-text-2); }
.dm-factValue { font-variant-numeric:tabular-nums; white-space:pre-wrap; word-break:break-word; }
.dm-bodyText { font-size:13px; line-height:1.85; word-break:break-word; }
.dm-bodyP { margin:0 0 10px; white-space:pre-wrap; }
.dm-bodyList { margin:0 0 10px; padding-left:18px; }
.dm-bodyList li { margin:3px 0; }
.dm-bodyH { margin:16px 0 8px; font-size:13px; font-weight:600; }
.dm-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:18px; }
.dm-tag { padding:2px 7px; border-radius:6px; background:var(--dm-hover); color:var(--dm-text-2); font-size:11px; }
.dm-links { display:flex; flex-direction:column; gap:6px; }
.dm-linkRow { display:flex; align-items:center; gap:8px; padding:7px 10px; border:1px solid var(--dm-border); border-radius:9px; background:transparent; text-align:left; cursor:pointer; }
.dm-linkRow:hover { border-color:var(--dm-border-strong); background:var(--dm-hover); }
.dm-linkRowMain { flex:1; min-width:0; display:flex; flex-direction:column; gap:2px; }
.dm-linkRowTitle { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; font-weight:500; }
.dm-linkRowNote { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; color:var(--dm-text-2); font-size:11px; }
.dm-linkRowCat { flex:none; }
.dm-linkAdd { display:flex; flex-wrap:wrap; align-items:center; gap:6px; margin-top:8px; }
.dm-linkAdd select, .dm-linkAdd input { height:30px; padding:0 8px; border:1px solid var(--dm-border); border-radius:8px; background:var(--dm-surface-1); color:var(--dm-text); font:inherit; font-size:12px; outline:none; }
.dm-linkAdd select { flex:1 1 180px; min-width:140px; }
.dm-linkAdd input { flex:1 1 140px; min-width:120px; }
.dm-linkEmpty { color:var(--dm-text-2); font-size:12px; }
.dm-detailFoot { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-top:28px; padding-top:14px; border-top:.5px solid var(--dm-border); }
.dm-footMeta { display:flex; flex-direction:column; gap:3px; min-width:0; color:var(--dm-text-2); font-size:11px; }
.dm-footLine { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-footActions { flex:none; display:flex; gap:8px; }
.dm-footBtns { display:flex; gap:8px; }
.dm-confirm { display:flex; align-items:center; gap:8px; }
.dm-confirmText { color:var(--dsw-alias-state-error-primary, #ef4444); font-size:11px; }
.dm-history { margin-top:18px; padding-top:10px; border-top:.5px solid var(--dm-border); }
.dm-historySummary { color:var(--dm-text-2); font-size:11px; cursor:pointer; }
.dm-historyList { display:flex; flex-direction:column; gap:6px; margin:8px 0 0; padding:0; list-style:none; }
.dm-historyItem { display:flex; gap:10px; color:var(--dm-text-2); font-size:11px; }
.dm-historyDate { flex:none; font-variant-numeric:tabular-nums; opacity:.85; }
.dm-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:30px; padding:0 12px; border:1px solid var(--dm-border-strong); border-radius:8px; background:var(--dm-surface-1); color:var(--dm-text); white-space:nowrap; cursor:pointer; }
.dm-btn:hover:not(:disabled) { background:var(--dm-hover); }
.dm-btn:disabled { opacity:.55; cursor:default; }
.dm-btnPrimary { border-color:var(--dm-accent); background:var(--dm-accent); color:var(--dsw-alias-label-primary-foreground, #ffffff); }
.dm-btnPrimary:hover:not(:disabled) { border-color:var(--dsw-alias-button-primary-hover, var(--dm-accent)); background:var(--dsw-alias-button-primary-hover, var(--dm-accent)); filter:none; }
.dm-btnDanger { border-color:var(--dsw-alias-state-error-primary, #ef4444); color:var(--dsw-alias-state-error-primary, #ef4444); }
.dm-btnGhostDanger { color:var(--dsw-alias-state-error-primary, #ef4444); }
.dm-btnSmall { height:26px; padding:0 10px; font-size:12px; }
.dm-iconBtn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; padding:0; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dm-text-2); cursor:pointer; }
.dm-iconBtn:hover:not(:disabled) { background:var(--dm-hover); color:var(--dm-text); }
.dm-iconBtnOn { color:var(--dsw-alias-state-warn-primary, #f59e0b); }
.dm-btn:focus-visible, .dm-iconBtn:focus-visible, .dm-row:focus-visible, .dm-railRow:focus-visible, .dm-chip:focus-visible, .dm-segmentBtn:focus-visible, .dm-linkRow:focus-visible, .dm-search input:focus-visible, .dm-input:focus-visible { outline:2px solid var(--dm-accent); outline-offset:2px; }
.dm-editor { display:flex; flex-direction:column; gap:12px; max-width:760px; padding:22px 32px 48px; }
.dm-editorTop { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.dm-editorMode { color:var(--dm-accent); font-size:11px; font-weight:500; letter-spacing:.08em; }
.dm-editorHint { color:var(--dm-text-2); font-size:11px; }
.dm-input { width:100%; height:34px; padding:0 10px; border:1px solid var(--dm-border); border-radius:8px; background:var(--dm-surface-1); color:var(--dm-text); font:inherit; outline:none; }
.dm-input::placeholder { color:var(--dm-text-2); opacity:.75; }
.dm-titleInput { height:40px; font-size:16px; font-weight:500; }
.dm-textarea { height:auto; min-height:170px; padding:10px; line-height:1.7; resize:vertical; }
.dm-select { padding:0 8px; }
.dm-editorRow { display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px; }
.dm-field { display:flex; flex:1; flex-direction:column; gap:5px; min-width:150px; }
.dm-fieldLabel { color:var(--dm-text-2); font-size:11px; letter-spacing:.04em; }
.dm-fieldHint { color:var(--dm-text-2); font-size:11px; opacity:.8; }
.dm-check { display:inline-flex; align-items:center; gap:6px; height:34px; color:var(--dm-text-2); font-size:12px; }
.dm-editorSection { display:flex; flex-direction:column; gap:7px; }
.dm-editorSectionHead { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.dm-factsEdit { display:flex; flex-direction:column; gap:6px; }
.dm-factEditRow { display:grid; grid-template-columns:minmax(110px,220px) minmax(0,1fr) 30px; align-items:center; gap:8px; }
.dm-textBtn { align-self:flex-start; display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 8px; border:1px dashed var(--dm-border-strong); border-radius:7px; background:transparent; color:var(--dm-text-2); font-size:12px; cursor:pointer; }
.dm-textBtn:hover { background:var(--dm-hover); color:var(--dm-text); }
.dm-editorActions { display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:6px; }
.dm-saveHint { margin-right:auto; color:var(--dm-text-2); font-size:11px; }
.dm-formError { color:var(--dsw-alias-state-error-primary, #ef4444); font-size:12px; }
.dm-blank { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; height:100%; padding:32px; color:var(--dm-text-2); text-align:center; }
.dm-blank > svg { margin-bottom:4px; opacity:.55; }
.dm-blankTitle { margin:0; color:var(--dm-text); font-size:15px; font-weight:500; }
.dm-blankHint { max-width:360px; margin:0; font-size:12px; line-height:1.7; }
.dm-onboard { display:flex; flex-direction:column; gap:20px; max-width:640px; padding:40px 32px 48px; }
.dm-onboardHead { display:flex; flex-direction:column; gap:6px; }
.dm-onboardIcon { color:var(--dm-accent); }
.dm-onboardTitle { margin:0; font-size:18px; font-weight:600; }
.dm-onboardHint { max-width:480px; margin:0; color:var(--dm-text-2); font-size:12px; line-height:1.7; }
.dm-onboardCards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
.dm-onboardCard { display:flex; flex-direction:column; gap:5px; padding:12px; border:1px solid var(--dm-border); border-radius:10px; background:var(--dm-card); }
.dm-onboardCardTitle { display:flex; align-items:center; gap:6px; font-weight:500; }
.dm-onboardCardHint { color:var(--dm-text-2); font-size:11px; line-height:1.6; }
.dm-skeleton { height:52px; margin:0 8px 6px; border-radius:10px; background:var(--dm-skeleton); }
.dm-graphArea { position:relative; min-width:0; min-height:0; overflow:hidden; background:var(--dm-graph-bg); }
.dm-graphWrap { position:absolute; inset:0; }
.dm-graphSvg { display:block; width:100%; height:100%; touch-action:none; cursor:grab; }
.dm-graphSvg:active { cursor:grabbing; }
.dm-graphGrid { stroke:var(--dm-grid); stroke-width:1; }
.dm-gedge { stroke:var(--dm-edge); stroke-width:1.3; fill:none; }
.dm-gedgeSel { stroke:var(--dm-accent); stroke-width:2; }
.dm-gedgeAuto { stroke:var(--dm-edge-auto); stroke-dasharray:5 5; stroke-width:1.1; }
.dm-gedgeDim { opacity:.16; }
.dm-gedgeArrow { fill:var(--dm-edge); }
.dm-gedgeArrowSel { fill:var(--dm-accent); }
.dm-gedgeLabel { font-size:10px; fill:var(--dm-text-2); text-anchor:middle; pointer-events:none; }
.dm-gnode { cursor:pointer; }
.dm-gnodeDot { stroke:var(--dm-node-ring); stroke-width:3; }
.dm-gnodeDotSel { stroke:var(--dm-accent); stroke-width:4; }
.dm-gnodeLabel { font-size:11px; fill:var(--dm-text-2); text-anchor:middle; pointer-events:none; }
.dm-gnodeLabelSel { fill:var(--dm-text); font-weight:600; }
.dm-gnodeStar { fill:var(--dsw-alias-state-warn-primary, #f59e0b); }
.dm-gnodeDim { opacity:.2; }
.dm-gnode .dm-gnodeDraft { stroke-dasharray:4 3; }
.dm-gnode .dm-gnodeDeprecated { opacity:.55; }
.dm-graphToolbar { position:absolute; top:12px; left:12px; z-index:2; display:flex; align-items:center; gap:4px; padding:5px; border:1px solid var(--dm-border); border-radius:10px; background:var(--dm-toolbar-fill); backdrop-filter:blur(10px); }
.dm-graphToolbar .dm-graphCount { padding:0 8px; color:var(--dm-text-2); font-size:11px; font-variant-numeric:tabular-nums; }
.dm-graphToggle { display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 8px; border:0; border-radius:7px; background:transparent; color:var(--dm-text-2); font-size:11px; cursor:pointer; }
.dm-graphToggle:hover { background:var(--dm-hover); color:var(--dm-text); }
.dm-graphToggleOn { background:var(--dm-active); color:var(--dm-text); }
.dm-graphHint { position:absolute; left:14px; bottom:12px; z-index:2; color:var(--dm-text-2); font-size:11px; opacity:.75; pointer-events:none; }
.dm-graphLegend { position:absolute; right:14px; bottom:12px; z-index:2; display:flex; gap:12px; align-items:center; color:var(--dm-text-2); font-size:11px; opacity:.8; pointer-events:none; }
.dm-legendItem { display:inline-flex; gap:5px; align-items:center; }
.dm-legendSample { display:inline-block; width:16px; height:0; border-top:1px solid var(--dm-edge); }
.dm-legendSample.dm-legendDashed { border-top:1px dashed var(--dm-edge-auto); }
.dm-drawer { position:absolute; top:0; right:0; bottom:0; z-index:3; display:flex; flex-direction:column; width:min(420px, 48%); border-left:1px solid var(--dm-border); background:var(--dm-surface); box-shadow:var(--dm-shadow); }
.dm-drawerHead { flex:none; display:flex; align-items:center; gap:8px; padding:10px 12px; border-bottom:.5px solid var(--dm-border); color:var(--dm-text-2); font-size:11px; letter-spacing:.04em; }
.dm-drawerHead .dm-iconBtn { margin-left:auto; }
.dm-drawerScroll { flex:1; min-height:0; overflow-y:auto; }
.dm-drawerScroll .dm-detailInner { padding:18px 20px 36px; }
@media (max-width:1080px) {
  .dm-body { grid-template-columns:168px minmax(240px, 300px) minmax(0, 1fr); }
  .dm-body-graph { grid-template-columns:168px minmax(0, 1fr); }
  .dm-search input { width:170px; }
  .dm-onboardCards { grid-template-columns:repeat(2, minmax(0, 1fr)); }
}
`

    const ICONS = {
      search: [['circle', { cx: 11, cy: 11, r: 6.5 }], ['path', { d: 'M20 20l-3.6-3.6' }]],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      refresh: [['path', { d: 'M20 11a8 8 0 1 0-2.3 6.3' }], ['path', { d: 'M20 5v6h-6' }]],
      edit: [['path', { d: 'M4 20h4l10-10-4-4L4 16v4Z' }], ['path', { d: 'M13.5 6.5l4 4' }]],
      trash: [['path', { d: 'M4 7h16' }], ['path', { d: 'M9 7V5h6v2' }], ['path', { d: 'M6.5 7l1 12h9l1-12' }]],
      star: [['path', { d: 'M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.8L12 4.5Z' }]],
      close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
      book: [['path', { d: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5V5.5Z' }], ['path', { d: 'M5 20.5A2.5 2.5 0 0 1 7.5 18H19' }]],
      graph: [
        ['circle', { cx: 6, cy: 17, r: 2.6 }],
        ['circle', { cx: 12, cy: 6.5, r: 2.6 }],
        ['circle', { cx: 18.5, cy: 15, r: 2.6 }],
        ['path', { d: 'M7.6 14.7 10.6 8.8M13.9 8.4l3.1 4.2M8.6 16.4l7.4-1.1' }]
      ],
      check: [['path', { d: 'M5 12.5l4.5 4.5L19 7.5' }]],
      ban: [['circle', { cx: 12, cy: 12, r: 8 }], ['path', { d: 'M7 17 17 7' }]],
      undo: [['path', { d: 'M4 10h9a5 5 0 1 1 0 10H8' }], ['path', { d: 'M8 6l-4 4 4 4' }]],
      zoomIn: [['circle', { cx: 11, cy: 11, r: 6.5 }], ['path', { d: 'M20 20l-3.6-3.6M11 8.5v5M8.5 11h5' }]],
      zoomOut: [['circle', { cx: 11, cy: 11, r: 6.5 }], ['path', { d: 'M20 20l-3.6-3.6M8.5 11h5' }]],
      frame: [['path', { d: 'M4 9V5.5A1.5 1.5 0 0 1 5.5 4H9' }], ['path', { d: 'M15 4h3.5A1.5 1.5 0 0 1 20 5.5V9' }], ['path', { d: 'M20 15v3.5a1.5 1.5 0 0 1-1.5 1.5H15' }], ['path', { d: 'M9 20H5.5A1.5 1.5 0 0 1 4 18.5V15' }]],
      shuffle: [['path', { d: 'M4 7h4l8 10h4' }], ['path', { d: 'M4 17h4l8-10h4' }], ['path', { d: 'M17 4l3 3-3 3M17 14l3 3-3 3' }]],
      link: [['path', { d: 'M9.5 14.5 14.5 9.5' }], ['path', { d: 'M13 6.5 14.8 4.7a3.8 3.8 0 0 1 5.4 5.4L18.4 12' }], ['path', { d: 'M11 17.5 9.2 19.3a3.8 3.8 0 0 1-5.4-5.4L5.6 12' }]],
      info: [['circle', { cx: 12, cy: 12, r: 8.5 }], ['path', { d: 'M12 11v5' }], ['path', { d: 'M12 8.2h.01' }]]
    }

    function Icon(props) {
      const name = props.name
      const size = props.size || 16
      const paths = ICONS[name] || []
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: props.filled ? 'currentColor' : 'none',
          stroke: 'currentColor',
          strokeWidth: 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false'
        },
        paths.map((entry, index) => h(entry[0], Object.assign({ key: index }, entry[1])))
      )
    }

    function SidebarIcon(props) {
      const size = props.size || 16
      return h(
        'svg',
        {
          viewBox: '0 0 24 24',
          width: size,
          height: size,
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.active ? 1.8 : 1.6,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': true,
          focusable: 'false'
        },
        h('rect', { x: 6.5, y: 3, width: 14, height: 14, rx: 2.5, opacity: 0.45 }),
        h('rect', { x: 3.5, y: 6.5, width: 14, height: 14, rx: 2.5 }),
        h('path', { d: 'M7 11.5h7M7 15h4.5' })
      )
    }

    const dayFormat = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' })
    const shortFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit' })
    const timeFormat = new Intl.DateTimeFormat(undefined, { month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit' })

    function toDate(value) {
      const date = new Date(value)
      return Number.isNaN(date.getTime()) ? null : date
    }

    function formatDay(value) {
      const date = toDate(value)
      return date ? dayFormat.format(date) : ''
    }

    function formatShort(value) {
      const date = toDate(value)
      return date ? shortFormat.format(date) : ''
    }

    function formatTime(value) {
      const date = toDate(value)
      return date ? timeFormat.format(date) : ''
    }

    function shortenPath(value) {
      if (typeof value !== 'string' || !value) return ''
      return value.length > 44 ? '…' + value.slice(-42) : value
    }

    function splitTags(value) {
      return String(value || '')
        .split(/[,，;；、]/)
        .map((item) => item.trim().replace(/^#/, ''))
        .filter(Boolean)
        .slice(0, 20)
    }

    function entryHaystack(entry) {
      const facts = (entry.facts || []).map((fact) => fact.label + ' ' + fact.value).join(' ')
      const links = (entry.links || []).map((link) => link.label).join(' ')
      return [entry.title, entry.summary, entry.body, entry.source, (entry.tags || []).join(' '), facts, links].join(' ').toLowerCase()
    }

    function compareEntries(left, right) {
      const pinned = (right.pinned ? 1 : 0) - (left.pinned ? 1 : 0)
      if (pinned !== 0) return pinned
      return String(right.updatedAt).localeCompare(String(left.updatedAt))
    }

    function truncate(text, max) {
      const value = String(text || '')
      return value.length > max ? value.slice(0, max) + '…' : value
    }

    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max)
    }

    function emptyDraft(category) {
      return {
        category: category === 'all' ? 'system' : category,
        title: '',
        summary: '',
        body: '',
        tags: '',
        facts: [],
        status: 'draft',
        pinned: false,
        source: '',
        note: ''
      }
    }

    function draftFrom(entry) {
      return {
        category: entry.category,
        title: entry.title,
        summary: entry.summary || '',
        body: entry.body || '',
        tags: (entry.tags || []).join('，'),
        facts: (entry.facts || []).map((fact) => ({ label: fact.label, value: fact.value })),
        status: entry.status,
        pinned: entry.pinned === true,
        source: entry.source || '',
        note: ''
      }
    }

    function isOfflineError(error) {
      if (!error) return false
      if (error.offline === true) return true
      const text = String(error.message || error)
      return /failed to fetch|network ?error|load failed|econnrefused|networkerror|无法连接插件后台/i.test(text)
    }

    function errorText(error, t) {
      if (!error) return ''
      if (isOfflineError(error)) return t('error.offline')
      return error.message || String(error)
    }

    async function request(url, options) {
      let response
      try {
        response = await fetch(url, options)
      } catch (error) {
        const wrapped = new Error(error && error.message ? error.message : String(error))
        wrapped.offline = true
        throw wrapped
      }
      let payload = null
      try {
        payload = await response.json()
      } catch (error) {
        payload = null
      }
      if (!response.ok || !payload || payload.ok !== true) {
        const message =
          payload && payload.error && payload.error.message
            ? payload.error.message
            : '请求失败（HTTP ' + response.status + '）'
        throw new Error(message)
      }
      return payload
    }

    function loadEntries() {
      return request(API, { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' })
    }

    function mutateEntries(payload) {
      return request(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    function renderBody(text) {
      const blocks = []
      let list = []
      const flush = () => {
        if (!list.length) return
        blocks.push(
          h(
            'ul',
            { key: 'ul-' + blocks.length, className: 'dm-bodyList' },
            list.map((item, index) => h('li', { key: index }, item))
          )
        )
        list = []
      }
      const lines = String(text || '').split(/\r?\n/)
      lines.forEach((raw, index) => {
        const line = raw.replace(/\s+$/, '')
        if (!line.trim()) {
          flush()
          return
        }
        if (/^#{1,4}\s+/.test(line)) {
          flush()
          blocks.push(h('h4', { key: 'h-' + index, className: 'dm-bodyH' }, line.replace(/^#{1,4}\s+/, '')))
          return
        }
        if (/^[-*•]\s+/.test(line)) {
          list.push(line.replace(/^[-*•]\s+/, ''))
          return
        }
        flush()
        blocks.push(h('p', { key: 'p-' + index, className: 'dm-bodyP' }, line))
      })
      flush()
      return blocks
    }

    /**
     * The host flips dark mode with body[data-ds-dark-theme]; older shells used
     * html[data-theme] / data-dsw-theme. Probe all of them and keep listening, so a
     * live theme switch repaints the panel and the graph without a reload.
     */
    function readThemeMode() {
      if (typeof document === 'undefined') return 'light'
      const html = document.documentElement
      const body = document.body
      if (body && body.hasAttribute('data-ds-dark-theme')) return 'dark'
      const attributeTheme =
        (body && body.getAttribute('data-theme')) ||
        (html && html.getAttribute('data-theme')) ||
        (html && html.getAttribute('data-dsw-theme')) ||
        (body && body.getAttribute('data-dsw-theme'))
      if (attributeTheme === 'dark' || attributeTheme === 'light') return attributeTheme
      const source = html && html.dataset ? html.dataset.dsThemeSource : ''
      if (source === 'dark') return 'dark'
      if (source === 'light') return 'light'
      try {
        if (typeof window !== 'undefined' && window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      } catch {
        /* matchMedia unavailable */
      }
      return 'light'
    }

    function useThemeMode() {
      const [mode, setMode] = useState(readThemeMode)
      useEffect(() => {
        const sync = () => setMode(readThemeMode())
        sync()
        const observer = typeof MutationObserver === 'function' ? new MutationObserver(sync) : null
        if (observer && document.body) {
          observer.observe(document.body, { attributes: true, attributeFilter: ['data-ds-dark-theme', 'data-theme', 'data-dsw-theme', 'style'] })
        }
        if (observer && document.documentElement) {
          observer.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'data-dsw-theme', 'data-ds-theme-source', 'class', 'style'] })
        }
        let media = null
        try {
          media = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null
          if (media) {
            if (typeof media.addEventListener === 'function') media.addEventListener('change', sync)
            else if (typeof media.addListener === 'function') media.addListener(sync)
          }
        } catch {
          media = null
        }
        return () => {
          if (observer) observer.disconnect()
          try {
            if (media) {
              if (typeof media.removeEventListener === 'function') media.removeEventListener('change', sync)
              else if (typeof media.removeListener === 'function') media.removeListener(sync)
            }
          } catch {
            /* listener already gone */
          }
        }
      }, [])
      return mode
    }

    function CategoryRow(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'dm-railRow' + (props.active ? ' dm-railRowActive' : ''),
          'aria-pressed': props.active,
          onClick: () => props.onSelect(props.id)
        },
        h('span', { className: 'dm-dot' + (props.id === 'all' ? '' : ' dm-dot-' + props.id) }),
        h('span', { className: 'dm-railLabel' }, props.label),
        h('span', { className: 'dm-railCount' }, String(props.count || 0))
      )
    }

    function MemoryRow(props) {
      const entry = props.entry
      const linkCount = (entry.links || []).length
      return h(
        'button',
        {
          type: 'button',
          className: 'dm-row' + (props.active ? ' dm-rowActive' : ''),
          disabled: props.disabled,
          'aria-current': props.active ? 'true' : undefined,
          onClick: props.onSelect
        },
        h(
          'span',
          { className: 'dm-rowTop' },
          h(
            'span',
            { className: 'dm-rowTitle' },
            entry.pinned ? h('span', { className: 'dm-pinMark' }, h(Icon, { name: 'star', size: 12, filled: true })) : null,
            entry.title
          ),
          h('span', { className: 'dm-statusPill dm-status-' + entry.status }, props.t('status.' + entry.status))
        ),
        entry.summary ? h('span', { className: 'dm-rowSummary' }, entry.summary) : null,
        h(
          'span',
          { className: 'dm-rowMeta' },
          h('span', { className: 'dm-dot dm-dot-' + entry.category }),
          h('span', null, props.t('rail.' + entry.category)),
          h('span', { className: 'dm-dotSep' }, '·'),
          h('span', null, formatShort(entry.updatedAt)),
          linkCount
            ? h('span', { className: 'dm-rowMetaLinks' }, h(Icon, { name: 'link', size: 11 }), linkCount + ' ' + props.t('list.links'))
            : null
        )
      )
    }

    function FactsEditor(props) {
      const facts = props.facts || []
      const t = props.t
      return h(
        'div',
        { className: 'dm-factsEdit' },
        facts.map((fact, index) =>
          h(
            'div',
            { className: 'dm-factEditRow', key: index },
            h('input', {
              className: 'dm-input',
              value: fact.label,
              placeholder: t('editor.facts.label'),
              'aria-label': t('editor.facts.label'),
              onChange: (event) => {
                const next = facts.slice()
                next[index] = Object.assign({}, fact, { label: event.target.value })
                props.onChange(next)
              }
            }),
            h('input', {
              className: 'dm-input',
              value: fact.value,
              placeholder: t('editor.facts.value'),
              'aria-label': t('editor.facts.value'),
              onChange: (event) => {
                const next = facts.slice()
                next[index] = Object.assign({}, fact, { value: event.target.value })
                props.onChange(next)
              }
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'dm-iconBtn',
                title: t('editor.facts.remove'),
                'aria-label': t('editor.facts.remove'),
                onClick: () => props.onChange(facts.filter((_item, position) => position !== index))
              },
              h(Icon, { name: 'trash', size: 15 })
            )
          )
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'dm-textBtn',
            onClick: () => props.onChange(facts.concat([{ label: '', value: '' }])),
            'data-testid': 'dm-add-fact'
          },
          h(Icon, { name: 'plus', size: 13 }),
          t('editor.facts.add')
        )
      )
    }

    function StatusNote(props) {
      const entry = props.entry
      const t = props.t
      if (entry.status === 'draft') {
        return h(
          'div',
          { className: 'dm-statusNote dm-statusNote-warn', role: 'note' },
          h('span', { className: 'dm-statusNoteIcon' }, h(Icon, { name: 'info', size: 15 })),
          h('span', { className: 'dm-statusNoteBody' }, t('status.draftExplain')),
          h(
            'span',
            { className: 'dm-statusNoteActions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dm-btn dm-btnPrimary dm-btnSmall',
                disabled: props.busy,
                title: t('status.confirm'),
                onClick: () => props.onSetStatus('confirmed')
              },
              h(Icon, { name: 'check', size: 13 }),
              t('status.confirm')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dm-btn dm-btnGhostDanger dm-btnSmall',
                disabled: props.busy,
                title: t('status.deprecate'),
                onClick: () => props.onSetStatus('deprecated')
              },
              h(Icon, { name: 'ban', size: 13 }),
              t('status.deprecate')
            )
          )
        )
      }
      if (entry.status === 'deprecated') {
        return h(
          'div',
          { className: 'dm-statusNote dm-statusNote-dim', role: 'note' },
          h('span', { className: 'dm-statusNoteIcon' }, h(Icon, { name: 'info', size: 15 })),
          h('span', { className: 'dm-statusNoteBody' }, t('status.deprecatedExplain')),
          h(
            'span',
            { className: 'dm-statusNoteActions' },
            h(
              'button',
              {
                type: 'button',
                className: 'dm-btn dm-btnSmall',
                disabled: props.busy,
                title: t('status.reopen'),
                onClick: () => props.onSetStatus('confirmed')
              },
              h(Icon, { name: 'undo', size: 13 }),
              t('status.reopen')
            )
          )
        )
      }
      return null
    }

    function LinkSection(props) {
      const entry = props.entry
      const t = props.t
      const links = entry.links || []
      const [target, setTarget] = useState('')
      const [label, setLabel] = useState('')
      const all = props.entries || []
      const byId = useMemo(() => new Map(all.map((item) => [item.id, item])), [all])
      const linkedIds = new Set(links.map((link) => link.to))
      const candidates = all.filter((item) => item.id !== entry.id && !linkedIds.has(item.id))
      const backlinks = all.filter((item) => item.id !== entry.id && (item.links || []).some((link) => link.to === entry.id))
      const submit = () => {
        if (!target) return
        props.onAdd(target, label.trim())
        setTarget('')
        setLabel('')
      }
      return h(
        'section',
        { className: 'dm-section' },
        h('h3', { className: 'dm-sectionTitle' }, t('detail.links') + (links.length ? ' (' + links.length + ')' : '')),
        links.length
          ? h(
              'div',
              { className: 'dm-links' },
              links.map((link) => {
                const item = byId.get(link.to)
                return h(
                  'div',
                  { className: 'dm-linkRow', key: link.to },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dm-linkRowMain',
                      onClick: () => (item ? props.onSelect(item.id) : null),
                      title: item ? item.title : link.to
                    },
                    h('span', { className: 'dm-linkRowTitle' }, item ? item.title : '（已删除）'),
                    h(
                      'span',
                      { className: 'dm-linkRowNote' },
                      item ? t('rail.' + item.category) + (link.label ? ' · ' + link.label : '') : link.to
                    )
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dm-iconBtn',
                      title: t('detail.linkRemove'),
                      'aria-label': t('detail.linkRemove'),
                      disabled: props.busy,
                      onClick: () => props.onRemove(link.to)
                    },
                    h(Icon, { name: 'close', size: 13 })
                  )
                )
              })
            )
          : h('div', { className: 'dm-linkEmpty' }, t('detail.noLinks')),
        candidates.length
          ? h(
              'div',
              { className: 'dm-linkAdd' },
              h(
                'select',
                {
                  value: target,
                  'aria-label': t('detail.linkPick'),
                  onChange: (event) => setTarget(event.target.value)
                },
                h('option', { value: '' }, t('detail.linkPick')),
                candidates.map((item) => h('option', { key: item.id, value: item.id }, '【' + t('rail.' + item.category) + '】' + item.title))
              ),
              h('input', {
                value: label,
                placeholder: t('detail.linkLabel'),
                'aria-label': t('detail.linkLabel'),
                onChange: (event) => setLabel(event.target.value)
              }),
              h(
                'button',
                { type: 'button', className: 'dm-btn dm-btnSmall', disabled: props.busy || !target, onClick: submit },
                h(Icon, { name: 'link', size: 13 }),
                t('detail.linkAdd')
              )
            )
          : h('p', { className: 'dm-linkEmpty' }, t('detail.linkNothing')),
        backlinks.length
          ? h(
              'div',
              { className: 'dm-section' },
              h('h3', { className: 'dm-sectionTitle' }, t('detail.backlinks') + ' (' + backlinks.length + ')'),
              h(
                'div',
                { className: 'dm-links' },
                backlinks.map((item) =>
                  h(
                    'button',
                    { type: 'button', className: 'dm-linkRow', key: item.id, onClick: () => props.onSelect(item.id) },
                    h(
                      'span',
                      { className: 'dm-linkRowMain' },
                      h('span', { className: 'dm-linkRowTitle' }, item.title),
                      h('span', { className: 'dm-linkRowNote' }, t('rail.' + item.category))
                    ),
                    h(Icon, { name: 'link', size: 13 })
                  )
                )
              )
            )
          : null
      )
    }

    function MemoryDetail(props) {
      const entry = props.entry
      const t = props.t
      return h(
        'article',
        { className: 'dm-detailInner' },
        h(
          'div',
          { className: 'dm-detailMeta' },
          h('span', { className: 'dm-catChip dm-cat-' + entry.category }, t('rail.' + entry.category)),
          h('span', { className: 'dm-statusPill dm-status-' + entry.status }, t('status.' + entry.status)),
          h('span', { className: 'dm-detailDate' }, t('detail.updated') + ' ' + formatDay(entry.updatedAt))
        ),
        h(
          'div',
          { className: 'dm-detailHead' },
          h('h2', { className: 'dm-detailTitle' }, entry.title),
          h(
            'button',
            {
              type: 'button',
              className: 'dm-iconBtn' + (entry.pinned ? ' dm-iconBtnOn' : ''),
              title: entry.pinned ? t('detail.unpin') : t('detail.pin'),
              'aria-label': entry.pinned ? t('detail.unpin') : t('detail.pin'),
              'aria-pressed': entry.pinned === true,
              disabled: props.busy,
              onClick: props.onTogglePin
            },
            h(Icon, { name: 'star', size: 16, filled: entry.pinned === true })
          )
        ),
        entry.summary ? h('p', { className: 'dm-detailSummary' }, entry.summary) : null,
        h(StatusNote, { entry, t, busy: props.busy, onSetStatus: props.onSetStatus }),
        entry.facts && entry.facts.length
          ? h(
              'section',
              { className: 'dm-section' },
              h('h3', { className: 'dm-sectionTitle' }, t('detail.facts')),
              h(
                'div',
                { className: 'dm-facts' },
                entry.facts.map((fact, index) =>
                  h(
                    'div',
                    { className: 'dm-factRow', key: index },
                    h('span', { className: 'dm-factLabel' }, fact.label || '—'),
                    h('span', { className: 'dm-factValue' }, fact.value)
                  )
                )
              )
            )
          : null,
        entry.body
          ? h(
              'section',
              { className: 'dm-section' },
              h('h3', { className: 'dm-sectionTitle' }, t('editor.body.title')),
              h('div', { className: 'dm-bodyText' }, renderBody(entry.body))
            )
          : null,
        h(LinkSection, {
          entry,
          entries: props.entries,
          t,
          busy: props.busy,
          onAdd: props.onAddLink,
          onRemove: props.onRemoveLink,
          onSelect: props.onSelectEntry
        }),
        entry.tags && entry.tags.length
          ? h(
              'div',
              { className: 'dm-tags' },
              entry.tags.map((tag, index) => h('span', { className: 'dm-tag', key: index }, '#' + tag))
            )
          : null,
        h(
          'div',
          { className: 'dm-detailFoot' },
          h(
            'div',
            { className: 'dm-footMeta' },
            entry.source ? h('div', { className: 'dm-footLine' }, t('detail.source') + ' · ' + entry.source) : null,
            h('div', { className: 'dm-footLine' }, t('detail.id') + ' · ' + entry.id)
          ),
          h(
            'div',
            { className: 'dm-footActions' },
            props.confirmDelete
              ? h(
                  'span',
                  { className: 'dm-confirm' },
                  h('span', { className: 'dm-confirmText' }, t('detail.deleteConfirm')),
                  h(
                    'button',
                    { type: 'button', className: 'dm-btn dm-btnDanger', disabled: props.busy, onClick: props.onConfirmDelete },
                    t('action.delete')
                  ),
                  h('button', { type: 'button', className: 'dm-btn', onClick: props.onCancelDelete }, t('action.cancel'))
                )
              : h(
                  'span',
                  { className: 'dm-footBtns' },
                  h(
                    'button',
                    { type: 'button', className: 'dm-btn', disabled: props.busy, onClick: props.onEdit },
                    h(Icon, { name: 'edit', size: 15 }),
                    t('action.edit')
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'dm-btn dm-btnGhostDanger',
                      disabled: props.busy,
                      onClick: props.onRequestDelete
                    },
                    h(Icon, { name: 'trash', size: 15 }),
                    t('action.delete')
                  )
                )
          )
        ),
        entry.history && entry.history.length
          ? h(
              'details',
              { className: 'dm-history' },
              h('summary', { className: 'dm-historySummary' }, t('detail.history') + ' (' + entry.history.length + ')'),
              h(
                'ul',
                { className: 'dm-historyList' },
                entry.history
                  .slice()
                  .reverse()
                  .map((item, index) =>
                    h(
                      'li',
                      { className: 'dm-historyItem', key: index },
                      h('span', { className: 'dm-historyDate' }, formatTime(item.at)),
                      h('span', { className: 'dm-historyNote' }, item.note || t('detail.historyNoNote'))
                    )
                  )
              )
            )
          : null
      )
    }

    function MemoryEditor(props) {
      const draft = props.draft
      const t = props.t
      const update = (patch) => props.onChange(Object.assign({}, draft, patch))
      return h(
        'div',
        {
          className: 'dm-editor',
          onKeyDown: (event) => {
            if ((event.metaKey || event.ctrlKey) && event.key === 'Enter') {
              event.preventDefault()
              props.onSave()
            }
          }
        },
        h(
          'div',
          { className: 'dm-editorTop' },
          h('span', { className: 'dm-editorMode' }, props.mode === 'create' ? t('editor.mode.create') : t('editor.mode.edit')),
          h('span', { className: 'dm-editorHint' }, t('editor.hint'))
        ),
        h('input', {
          className: 'dm-input dm-titleInput',
          value: draft.title,
          placeholder: t('editor.title.placeholder'),
          'aria-label': t('editor.fields.title'),
          autoFocus: true,
          onChange: (event) => update({ title: event.target.value })
        }),
        h(
          'div',
          { className: 'dm-editorRow' },
          h(
            'label',
            { className: 'dm-field' },
            h('span', { className: 'dm-fieldLabel' }, t('editor.fields.category')),
            h(
              'select',
              {
                className: 'dm-input dm-select',
                value: draft.category,
                onChange: (event) => update({ category: event.target.value })
              },
              CATEGORIES.map((item) => h('option', { key: item.id, value: item.id }, t(item.labelKey)))
            )
          ),
          h(
            'label',
            { className: 'dm-field' },
            h('span', { className: 'dm-fieldLabel' }, t('editor.fields.status')),
            h(
              'select',
              {
                className: 'dm-input dm-select',
                value: draft.status,
                onChange: (event) => update({ status: event.target.value })
              },
              STATUSES.map((item) => h('option', { key: item.id, value: item.id }, t(item.labelKey)))
            )
          ),
          h(
            'label',
            { className: 'dm-check' },
            h('input', {
              type: 'checkbox',
              checked: draft.pinned === true,
              onChange: (event) => update({ pinned: event.target.checked })
            }),
            t('detail.pin')
          )
        ),
        h('input', {
          className: 'dm-input',
          value: draft.summary,
          placeholder: t('editor.summary.placeholder'),
          'aria-label': t('editor.fields.summary'),
          onChange: (event) => update({ summary: event.target.value })
        }),
        h(
          'div',
          { className: 'dm-editorSection' },
          h(
            'div',
            { className: 'dm-editorSectionHead' },
            h('span', { className: 'dm-fieldLabel' }, t('editor.facts.title')),
            h('span', { className: 'dm-fieldHint' }, t('editor.facts.hint'))
          ),
          h(FactsEditor, { facts: draft.facts, onChange: (facts) => update({ facts }), t })
        ),
        h(
          'div',
          { className: 'dm-editorSection' },
          h(
            'div',
            { className: 'dm-editorSectionHead' },
            h('span', { className: 'dm-fieldLabel' }, t('editor.body.title')),
            h('span', { className: 'dm-fieldHint' }, t('editor.body.hint'))
          ),
          h('textarea', {
            className: 'dm-input dm-textarea',
            value: draft.body,
            placeholder: t('editor.body.placeholder'),
            'aria-label': t('editor.body.title'),
            onChange: (event) => update({ body: event.target.value })
          })
        ),
        h('input', {
          className: 'dm-input',
          value: draft.tags,
          placeholder: t('editor.tags.placeholder'),
          'aria-label': t('editor.fields.tags'),
          onChange: (event) => update({ tags: event.target.value })
        }),
        h('input', {
          className: 'dm-input',
          value: draft.source,
          placeholder: t('editor.source.placeholder'),
          'aria-label': t('detail.source'),
          onChange: (event) => update({ source: event.target.value })
        }),
        props.mode === 'edit'
          ? h('input', {
              className: 'dm-input',
              value: draft.note,
              placeholder: t('editor.note.placeholder'),
              'aria-label': t('editor.fields.note'),
              onChange: (event) => update({ note: event.target.value })
            })
          : null,
        props.error ? h('div', { className: 'dm-formError', role: 'alert' }, props.error) : null,
        h(
          'div',
          { className: 'dm-editorActions' },
          h('span', { className: 'dm-saveHint' }, t('editor.saveHint')),
          h('button', { type: 'button', className: 'dm-btn', disabled: props.busy, onClick: props.onCancel }, t('action.cancel')),
          h(
            'button',
            { type: 'button', className: 'dm-btn dm-btnPrimary', disabled: props.busy, onClick: props.onSave },
            props.busy ? t('action.saving') : t('action.save')
          )
        )
      )
    }

    function pairKey(left, right) {
      return left < right ? left + '|' + right : right + '|' + left
    }

    function buildGraph(entries, includeAuto) {
      const nodes = entries.map((entry) => ({ id: entry.id, entry }))
      const index = new Map(nodes.map((node, position) => [node.id, position]))
      const byPair = new Map()
      const degree = new Map(nodes.map((node) => [node.id, 0]))
      for (const entry of entries) {
        for (const link of entry.links || []) {
          if (!index.has(link.to) || link.to === entry.id) continue
          const key = pairKey(entry.id, link.to)
          let edge = byPair.get(key)
          if (!edge) {
            edge = { key, a: entry.id, b: link.to, manual: true, labels: [], auto: false, tags: [] }
            byPair.set(key, edge)
            degree.set(entry.id, (degree.get(entry.id) || 0) + 1)
            degree.set(link.to, (degree.get(link.to) || 0) + 1)
          }
          edge.manual = true
          if (link.label && edge.labels.indexOf(link.label) === -1) edge.labels.push(link.label)
          if (entry.id === edge.a) edge.dirAB = true
          if (entry.id === edge.b) edge.dirBA = true
        }
      }
      if (includeAuto) {
        for (let i = 0; i < entries.length; i += 1) {
          for (let j = i + 1; j < entries.length; j += 1) {
            const left = entries[i]
            const right = entries[j]
            const key = pairKey(left.id, right.id)
            if (byPair.has(key)) continue
            const shared = []
            for (const tag of left.tags || []) {
              if ((right.tags || []).some((item) => item.toLowerCase() === tag.toLowerCase())) shared.push(tag)
            }
            if (shared.length < 2) continue
            byPair.set(key, { key, a: left.id, b: right.id, manual: false, labels: [], auto: true, tags: shared })
            degree.set(left.id, (degree.get(left.id) || 0) + 1)
            degree.set(right.id, (degree.get(right.id) || 0) + 1)
          }
        }
      }
      const edges = Array.from(byPair.values())
      for (const node of nodes) node.degree = degree.get(node.id) || 0
      return { nodes, edges }
    }

    function nodeRadius(degree) {
      return 20 + Math.min(degree || 0, 8) * 1.6
    }

    function layoutNodes(count, edges, indexById, startPositions, iterations) {
      const positions = new Map()
      const golden = Math.PI * (3 - Math.sqrt(5))
      for (let i = 0; i < count; i += 1) {
        const id = Array.from(indexById.keys())[i]
        const previous = startPositions && startPositions.get(id)
        if (previous) {
          positions.set(id, { x: previous.x, y: previous.y })
        } else {
          const radius = 120 + 46 * Math.sqrt(i)
          const angle = i * golden
          positions.set(id, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
        }
      }
      const ids = Array.from(indexById.keys())
      const damping = startPositions && startPositions.size ? 0.22 : 0.4
      for (let step = 0; step < iterations; step += 1) {
        const disp = new Map(ids.map((id) => [id, { x: 0, y: 0 }]))
        for (let i = 0; i < ids.length; i += 1) {
          for (let j = i + 1; j < ids.length; j += 1) {
            const left = positions.get(ids[i])
            const right = positions.get(ids[j])
            let dx = left.x - right.x
            let dy = left.y - right.y
            let distanceSquared = dx * dx + dy * dy
            if (distanceSquared < 1) {
              dx = (i - j || 1) * 0.6
              dy = 0.9
              distanceSquared = dx * dx + dy * dy
            }
            const distance = Math.sqrt(distanceSquared)
            const force = 16000 / distanceSquared
            const ux = dx / distance
            const uy = dy / distance
            const leftDisp = disp.get(ids[i])
            const rightDisp = disp.get(ids[j])
            leftDisp.x += ux * force
            leftDisp.y += uy * force
            rightDisp.x -= ux * force
            rightDisp.y -= uy * force
          }
        }
        for (const edge of edges) {
          const left = positions.get(edge.a)
          const right = positions.get(edge.b)
          if (!left || !right) continue
          const dx = right.x - left.x
          const dy = right.y - left.y
          const distance = Math.hypot(dx, dy) || 1
          const target = edge.auto ? 300 : 230
          const force = (distance - target) * (edge.auto ? 0.02 : 0.05)
          const ux = dx / distance
          const uy = dy / distance
          const leftDisp = disp.get(edge.a)
          const rightDisp = disp.get(edge.b)
          leftDisp.x += ux * force
          leftDisp.y += uy * force
          rightDisp.x -= ux * force
          rightDisp.y -= uy * force
        }
        for (const id of ids) {
          const point = positions.get(id)
          const delta = disp.get(id)
          point.x += clamp(delta.x * damping, -36, 36)
          point.y += clamp(delta.y * damping, -36, 36)
          point.x *= 0.997
          point.y *= 0.997
        }
      }
      return positions
    }

    function GraphView(props) {
      const t = props.t
      const entries = props.entries
      const wrapRef = useRef(null)
      const svgRef = useRef(null)
      const positionsRef = useRef(new Map())
      const viewRef = useRef({ scale: 1, x: 0, y: 0 })
      const dragRef = useRef(null)
      const [tick, setTick] = useState(0)
      const [showAuto, setShowAuto] = useState(true)
      const [isolate, setIsolate] = useState(false)

      const graph = useMemo(() => buildGraph(entries, showAuto), [entries, showAuto])
      const nodes = graph.nodes
      const edges = graph.edges
      const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
      const nodeKey = nodes.map((node) => node.id).join('|')
      const edgeKey = edges.map((edge) => edge.key + (edge.manual ? 'm' : 'a')).join('|')

      const bump = () => setTick((value) => value + 1)

      useEffect(() => {
        const indexById = new Map(nodes.map((node) => [node.id, node]))
        const positioned = layoutNodes(nodes.length, edges, indexById, null, 320)
        positionsRef.current = positioned
        bump()
        const timer = setTimeout(() => fitToWindow(), 30)
        return () => clearTimeout(timer)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [nodeKey])

      useEffect(() => {
        if (!nodeKey) return
        const indexById = new Map(nodes.map((node) => [node.id, node]))
        const next = layoutNodes(nodes.length, edges, indexById, positionsRef.current, 90)
        positionsRef.current = next
        bump()
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [edgeKey])

      function viewportSize() {
        const rect = wrapRef.current ? wrapRef.current.getBoundingClientRect() : null
        return { width: (rect && rect.width) || 960, height: (rect && rect.height) || 620 }
      }

      function fitToWindow() {
        const positions = positionsRef.current
        if (!positions.size) return
        const size = viewportSize()
        const xs = []
        const ys = []
        positions.forEach((point) => {
          xs.push(point.x)
          ys.push(point.y)
        })
        const minX = Math.min.apply(null, xs) - 90
        const maxX = Math.max.apply(null, xs) + 90
        const minY = Math.min.apply(null, ys) - 80
        const maxY = Math.max.apply(null, ys) + 80
        const width = Math.max(maxX - minX, 1)
        const height = Math.max(maxY - minY, 1)
        const scale = clamp(Math.min(size.width / width, size.height / height), 0.18, 1.5)
        viewRef.current = {
          scale,
          x: (size.width - width * scale) / 2 - minX * scale,
          y: (size.height - height * scale) / 2 - minY * scale
        }
        bump()
      }

      function relayout() {
        const indexById = new Map(nodes.map((node) => [node.id, node]))
        positionsRef.current = layoutNodes(nodes.length, edges, indexById, null, 320)
        bump()
        setTimeout(() => fitToWindow(), 10)
      }

      function zoomBy(factor) {
        const size = viewportSize()
        const view = viewRef.current
        const next = clamp(view.scale * factor, 0.15, 3)
        const ratio = next / view.scale
        viewRef.current = {
          scale: next,
          x: size.width / 2 - (size.width / 2 - view.x) * ratio,
          y: size.height / 2 - (size.height / 2 - view.y) * ratio
        }
        bump()
      }

      function toGraph(clientX, clientY) {
        const rect = svgRef.current.getBoundingClientRect()
        const view = viewRef.current
        return {
          x: (clientX - rect.left - view.x) / view.scale,
          y: (clientY - rect.top - view.y) / view.scale
        }
      }

      useEffect(() => {
        const svg = svgRef.current
        if (!svg) return undefined
        const onWheel = (event) => {
          event.preventDefault()
          const rect = svg.getBoundingClientRect()
          const view = viewRef.current
          const factor = Math.exp(-event.deltaY * 0.0016)
          const next = clamp(view.scale * factor, 0.15, 3)
          const ratio = next / view.scale
          const px = event.clientX - rect.left
          const py = event.clientY - rect.top
          viewRef.current = {
            scale: next,
            x: px - (px - view.x) * ratio,
            y: py - (py - view.y) * ratio
          }
          bump()
        }
        svg.addEventListener('wheel', onWheel, { passive: false })
        return () => svg.removeEventListener('wheel', onWheel)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [nodes.length])

      const startPan = (event) => {
        if (event.button !== 0) return
        const svg = svgRef.current
        dragRef.current = {
          kind: 'pan',
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: viewRef.current.x,
          originY: viewRef.current.y,
          moved: false
        }
        try {
          svg.setPointerCapture(event.pointerId)
        } catch {
          /* pointer capture unsupported */
        }
      }

      const startNodeDrag = (event, node) => {
        if (event.button !== 0) return
        event.stopPropagation()
        const svg = svgRef.current
        const point = toGraph(event.clientX, event.clientY)
        const current = positionsRef.current.get(node.id) || { x: 0, y: 0 }
        dragRef.current = {
          kind: 'node',
          id: node.id,
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          offsetX: current.x - point.x,
          offsetY: current.y - point.y,
          moved: false
        }
        try {
          svg.setPointerCapture(event.pointerId)
        } catch {
          /* pointer capture unsupported */
        }
      }

      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        const dx = event.clientX - drag.startX
        const dy = event.clientY - drag.startY
        if (!drag.moved && Math.hypot(dx, dy) > 4) drag.moved = true
        if (drag.kind === 'pan') {
          viewRef.current = {
            scale: viewRef.current.scale,
            x: drag.originX + dx,
            y: drag.originY + dy
          }
          bump()
          return
        }
        const point = toGraph(event.clientX, event.clientY)
        positionsRef.current.set(drag.id, { x: point.x + drag.offsetX, y: point.y + drag.offsetY })
        bump()
      }

      const endDrag = (event) => {
        const drag = dragRef.current
        if (!drag || drag.pointerId !== event.pointerId) return
        dragRef.current = null
        try {
          svgRef.current.releasePointerCapture(event.pointerId)
        } catch {
          /* already released */
        }
        if (drag.kind === 'node' && !drag.moved) props.onSelect(drag.id)
      }

      const selectedId = props.selectedId
      const neighbors = useMemo(() => {
        const set = new Set()
        if (!selectedId) return set
        for (const edge of edges) {
          if (edge.a === selectedId) set.add(edge.b)
          if (edge.b === selectedId) set.add(edge.a)
        }
        return set
      }, [edges, selectedId])

      const isolated = isolate && selectedId ? neighbors : null

      if (!nodes.length) {
        return h(
          'section',
          { className: 'dm-graphArea' },
          h(
            'div',
            { className: 'dm-blank' },
            h(Icon, { name: 'graph', size: 24 }),
            h('h2', { className: 'dm-blankTitle' }, t('graph.empty')),
            h('p', { className: 'dm-blankHint' }, t('graph.emptyHint'))
          )
        )
      }

      const view = viewRef.current
      const positions = positionsRef.current
      const nodeList = nodes.filter((node) => !isolated || node.id === selectedId || isolated.has(node.id))

      const edgeElements = edges
        .filter((edge) => !isolated || edge.a === selectedId || edge.b === selectedId)
        .map((edge) => {
          const from = positions.get(edge.a)
          const to = positions.get(edge.b)
          if (!from || !to) return null
          const fromNode = nodeById.get(edge.a)
          const toNode = nodeById.get(edge.b)
          const radiusA = nodeRadius(fromNode ? fromNode.degree : 0)
          const radiusB = nodeRadius(toNode ? toNode.degree : 0)
          const dx = to.x - from.x
          const dy = to.y - from.y
          const distance = Math.hypot(dx, dy) || 1
          const ux = dx / distance
          const uy = dy / distance
          const startX = from.x + ux * radiusA
          const startY = from.y + uy * radiusA
          const endX = to.x - ux * radiusB
          const endY = to.y - uy * radiusB
          const touchesSelection = selectedId && (edge.a === selectedId || edge.b === selectedId)
          const dimmed = selectedId && !touchesSelection
          const classes = ['dm-gedge']
          if (edge.auto) classes.push('dm-gedgeAuto')
          if (touchesSelection) classes.push('dm-gedgeSel')
          if (dimmed) classes.push('dm-gedgeDim')
          const midX = (startX + endX) / 2
          const midY = (startY + endY) / 2
          const arrow = (x, y, dx, dy, key) => {
            const size = 7
            const spread = size * 0.62
            return h('polygon', {
              key,
              className: 'dm-gedgeArrow' + (touchesSelection ? ' dm-gedgeArrowSel' : ''),
              points:
                `${x},${y} ` +
                `${x - dx * size + dy * spread},${y - dy * size - dx * spread} ` +
                `${x - dx * size - dy * spread},${y - dy * size + dx * spread}`
            })
          }
          return h(
            'g',
            { key: edge.key },
            h('line', { className: classes.join(' '), x1: startX, y1: startY, x2: endX, y2: endY }),
            edge.manual && edge.dirAB ? arrow(endX, endY, ux, uy, 'ab') : null,
            edge.manual && edge.dirBA ? arrow(startX, startY, -ux, -uy, 'ba') : null,
            touchesSelection && edge.labels.length
              ? h('text', { className: 'dm-gedgeLabel', x: midX, y: midY - 6 }, truncate(edge.labels[0], 18))
              : null,
            touchesSelection && edge.auto && edge.tags.length
              ? h('text', { className: 'dm-gedgeLabel', x: midX, y: midY - 6 }, truncate('# ' + edge.tags.join(' #'), 20))
              : null
          )
        })

      const nodeElements = nodeList.map((node) => {
        const point = positions.get(node.id)
        if (!point) return null
        const radius = nodeRadius(node.degree)
        const selected = node.id === selectedId
        const dimmed = selectedId && !selected && !neighbors.has(node.id)
        const dotClasses = ['dm-gnodeDot']
        if (selected) dotClasses.push('dm-gnodeDotSel')
        if (node.entry.status === 'draft') dotClasses.push('dm-gnodeDraft')
        if (node.entry.status === 'deprecated') dotClasses.push('dm-gnodeDeprecated')
        return h(
          'g',
          {
            key: node.id,
            className: 'dm-gnode' + (dimmed ? ' dm-gnodeDim' : ''),
            transform: `translate(${point.x},${point.y})`,
            'data-node-id': node.id,
            onPointerDown: (event) => startNodeDrag(event, node),
            role: 'button',
            tabIndex: 0,
            'aria-label': node.entry.title,
            onKeyDown: (event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault()
                props.onSelect(node.id)
              }
            }
          },
          h('circle', {
            className: dotClasses.join(' '),
            r: radius,
            style: { fill: 'var(--dm-cat-' + node.entry.category + ')' }
          }),
          selected
            ? h('circle', { r: radius + 5, fill: 'none', stroke: 'var(--dm-accent)', strokeWidth: 1.4, opacity: 0.55 })
            : null,
          node.entry.pinned
            ? h('text', { className: 'dm-gnodeStar', x: radius * 0.62, y: -radius * 0.55, fontSize: 12 }, '★')
            : null,
          h(
            'text',
            { className: 'dm-gnodeLabel' + (selected ? ' dm-gnodeLabelSel' : ''), y: radius + 15 },
            truncate(node.entry.title, 11)
          )
        )
      })

      return h(
        'section',
        { className: 'dm-graphArea', ref: wrapRef },
        h(
          'div',
          { className: 'dm-graphWrap' },
          h(
            'svg',
            {
              className: 'dm-graphSvg',
              ref: svgRef,
              onPointerDown: startPan,
              onPointerMove,
              onPointerUp: endDrag,
              onPointerCancel: endDrag,
              role: 'application',
              'aria-label': t('graph.title')
            },
            h(
              'g',
              { transform: `translate(${view.x},${view.y}) scale(${view.scale})` },
              edgeElements,
              nodeElements
            )
          )
        ),
        h(
          'div',
          { className: 'dm-graphToolbar' },
          h('span', { className: 'dm-graphCount' }, nodes.length + ' ' + t('graph.nodes') + ' · ' + edges.length + ' ' + t('graph.links')),
          h(
            'button',
            { type: 'button', className: 'dm-iconBtn', title: t('graph.zoomIn'), 'aria-label': t('graph.zoomIn'), onClick: () => zoomBy(1.25) },
            h(Icon, { name: 'zoomIn', size: 15 })
          ),
          h(
            'button',
            { type: 'button', className: 'dm-iconBtn', title: t('graph.zoomOut'), 'aria-label': t('graph.zoomOut'), onClick: () => zoomBy(0.8) },
            h(Icon, { name: 'zoomOut', size: 15 })
          ),
          h(
            'button',
            { type: 'button', className: 'dm-iconBtn', title: t('graph.fit'), 'aria-label': t('graph.fit'), onClick: fitToWindow },
            h(Icon, { name: 'frame', size: 15 })
          ),
          h(
            'button',
            { type: 'button', className: 'dm-iconBtn', title: t('graph.relayout'), 'aria-label': t('graph.relayout'), onClick: relayout },
            h(Icon, { name: 'shuffle', size: 15 })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dm-graphToggle' + (showAuto ? ' dm-graphToggleOn' : ''),
              title: t('graph.autoHint'),
              'aria-pressed': showAuto,
              onClick: () => setShowAuto((value) => !value)
            },
            h(Icon, { name: 'link', size: 13 }),
            t('graph.auto')
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'dm-graphToggle' + (isolate ? ' dm-graphToggleOn' : ''),
              title: t('graph.isolate'),
              'aria-pressed': isolate,
              disabled: !selectedId,
              onClick: () => setIsolate((value) => !value)
            },
            h(Icon, { name: 'graph', size: 13 }),
            isolate ? t('graph.isolateOn') : t('graph.isolate')
          )
        ),
        h('div', { className: 'dm-graphHint' }, t('graph.hint')),
        showAuto
          ? h(
              'div',
              { className: 'dm-graphLegend' },
              h(
                'span',
                { className: 'dm-legendItem' },
                h('span', { className: 'dm-legendSample dm-legendDashed' }),
                t('graph.sharedTags')
              )
            )
          : null,
        props.selectedEntry
          ? h(
              'aside',
              { className: 'dm-drawer', 'aria-label': t('graph.title') },
              h(
                'div',
                { className: 'dm-drawerHead' },
                h(Icon, { name: 'book', size: 13 }),
                props.selectedEntry.title,
                h(
                  'button',
                  { type: 'button', className: 'dm-iconBtn', title: t('action.close'), 'aria-label': t('action.close'), onClick: props.onClose },
                  h(Icon, { name: 'close', size: 14 })
                )
              ),
              h('div', { className: 'dm-drawerScroll' }, props.drawer)
            )
          : null
      )
    }

    function DesignMemoryPanel(props) {
      const t = useCallback(
        (key) => {
          if (typeof props.t === 'function') {
            const value = props.t(key)
            if (value && value !== key) return value
          }
          return ZH[key] || key
        },
        [props.t]
      )
      const themeMode = useThemeMode()
      const [data, setData] = useState({ status: 'loading', entries: [], error: null, storagePath: '' })
      const [category, setCategory] = useState('all')
      const [statusFilter, setStatusFilter] = useState('all')
      const [query, setQuery] = useState('')
      const [selectedId, setSelectedId] = useState(null)
      const [composer, setComposer] = useState(null)
      const [confirmDelete, setConfirmDelete] = useState(false)
      const [busy, setBusy] = useState(false)
      const [formError, setFormError] = useState(null)
      const [notice, setNotice] = useState(null)
      const [view, setView] = useState('list')
      const mounted = useRef(true)

      useEffect(
        () => () => {
          mounted.current = false
        },
        []
      )

      const load = useCallback(async () => {
        try {
          const payload = await loadEntries()
          if (!mounted.current) return
          setData({
            status: 'ready',
            entries: payload.entries || [],
            error: null,
            storagePath: payload.storagePath || ''
          })
        } catch (error) {
          if (!mounted.current) return
          setData((previous) =>
            Object.assign({}, previous, {
              status: previous.entries.length ? 'stale' : 'error',
              offline: isOfflineError(error),
              error: errorText(error, t)
            })
          )
        }
      }, [t])

      useEffect(() => {
        load()
      }, [load])

      useEffect(() => {
        const onFocus = () => {
          if (!composer) load()
        }
        window.addEventListener('focus', onFocus)
        return () => window.removeEventListener('focus', onFocus)
      }, [load, composer])

      useEffect(() => {
        if (!notice) return undefined
        const timer = setTimeout(() => setNotice(null), 3600)
        return () => clearTimeout(timer)
      }, [notice])

      const entries = data.entries || []
      const editing = composer !== null

      const counts = useMemo(() => {
        const next = { all: entries.length, system: 0, numbers: 0, workflow: 0, other: 0 }
        for (const entry of entries) next[entry.category] = (next[entry.category] || 0) + 1
        return next
      }, [entries])

      const visible = useMemo(() => {
        const needle = query.trim().toLowerCase()
        return entries
          .filter((entry) => {
            if (category !== 'all' && entry.category !== category) return false
            if (statusFilter !== 'all' && entry.status !== statusFilter) return false
            if (!needle) return true
            return entryHaystack(entry).includes(needle)
          })
          .sort(compareEntries)
      }, [entries, category, statusFilter, query])

      const selected = entries.find((entry) => entry.id === selectedId) || null

      const notify = (tone, text) => setNotice({ tone, text })

      const applyResult = (result) => {
        setData({
          status: 'ready',
          entries: result.entries || [],
          error: null,
          storagePath: result.storagePath || data.storagePath
        })
      }

      const selectEntry = (id) => {
        if (editing) return
        setSelectedId(id)
        setConfirmDelete(false)
      }

      const startCreate = () => {
        if (editing) return
        setComposer({ mode: 'create', id: null, draft: emptyDraft(category) })
        setFormError(null)
        setConfirmDelete(false)
      }

      const startEdit = (entry) => {
        if (editing) return
        setComposer({ mode: 'edit', id: entry.id, draft: draftFrom(entry) })
        setFormError(null)
        setConfirmDelete(false)
      }

      const cancelComposer = () => {
        setComposer(null)
        setFormError(null)
      }

      const saveDraft = async () => {
        if (!composer || busy) return
        const draft = composer.draft
        const title = String(draft.title || '').trim()
        if (!title) {
          setFormError('标题不能为空')
          return
        }
        setBusy(true)
        setFormError(null)
        try {
          const payload = {
            action: composer.mode === 'create' ? 'save' : 'update',
            id: composer.id,
            category: draft.category,
            title,
            summary: draft.summary,
            body: draft.body,
            tags: splitTags(draft.tags),
            facts: (draft.facts || [])
              .filter((fact) => String(fact.label || '').trim() || String(fact.value || '').trim())
              .map((fact) => ({ label: String(fact.label || '').trim(), value: String(fact.value || '').trim() })),
            status: draft.status,
            pinned: draft.pinned === true,
            source: draft.source,
            note: draft.note
          }
          const result = await mutateEntries(payload)
          applyResult(result)
          if (result.entry) setSelectedId(result.entry.id)
          setComposer(null)
          setConfirmDelete(false)
          notify('success', composer.mode === 'create' ? t('notice.created') : t('notice.saved'))
        } catch (error) {
          setFormError(errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const deleteSelected = async () => {
        if (!selected || busy) return
        setBusy(true)
        try {
          const result = await mutateEntries({ action: 'delete', id: selected.id })
          applyResult(result)
          setSelectedId(null)
          setConfirmDelete(false)
          notify('success', t('notice.deleted'))
        } catch (error) {
          notify('error', errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const togglePin = async () => {
        if (!selected || busy) return
        setBusy(true)
        try {
          const result = await mutateEntries({
            action: 'update',
            id: selected.id,
            pinned: !selected.pinned,
            note: selected.pinned ? t('detail.unpin') : t('detail.pin')
          })
          applyResult(result)
        } catch (error) {
          notify('error', errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const setStatus = async (entry, status) => {
        if (!entry || busy || entry.status === status) return
        setBusy(true)
        try {
          const note =
            status === 'confirmed' ? t('notice.confirmed') : status === 'deprecated' ? t('notice.deprecated') : t('notice.reopened')
          const result = await mutateEntries({ action: 'status', id: entry.id, status, note })
          applyResult(result)
          notify(
            'success',
            status === 'confirmed' ? t('notice.confirmed') : status === 'deprecated' ? t('notice.deprecated') : t('notice.reopened')
          )
        } catch (error) {
          notify('error', errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const addLink = async (entry, targetId, label) => {
        if (!entry || !targetId || busy) return
        setBusy(true)
        try {
          const result = await mutateEntries({ action: 'link', id: entry.id, targetId, label, note: t('notice.linked') })
          applyResult(result)
          notify('success', t('notice.linked'))
        } catch (error) {
          notify('error', errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const removeLink = async (entry, targetId) => {
        if (!entry || !targetId || busy) return
        setBusy(true)
        try {
          const result = await mutateEntries({ action: 'unlink', id: entry.id, targetId, note: t('notice.unlinked') })
          applyResult(result)
          notify('success', t('notice.unlinked'))
        } catch (error) {
          notify('error', errorText(error, t))
        } finally {
          setBusy(false)
        }
      }

      const handleKeyDown = (event) => {
        if (event.key !== 'Escape') return
        if (composer) {
          event.stopPropagation()
          cancelComposer()
        } else if (confirmDelete) {
          event.stopPropagation()
          setConfirmDelete(false)
        }
      }

      const rail = h(
        'nav',
        { className: 'dm-rail', 'aria-label': t('rail.label') },
        h(CategoryRow, {
          id: 'all',
          label: t('rail.all'),
          count: counts.all,
          active: category === 'all',
          onSelect: setCategory
        }),
        CATEGORIES.map((item) =>
          h(CategoryRow, {
            key: item.id,
            id: item.id,
            label: t(item.labelKey),
            count: counts[item.id],
            active: category === item.id,
            onSelect: setCategory
          })
        ),
        h('div', { className: 'dm-railDivider' }),
        h('div', { className: 'dm-railSection' }, t('rail.status')),
        h(
          'div',
          { className: 'dm-statusFilter' },
          h(
            'button',
            {
              type: 'button',
              className: 'dm-chip' + (statusFilter === 'all' ? ' dm-chipOn' : ''),
              'aria-pressed': statusFilter === 'all',
              onClick: () => setStatusFilter('all')
            },
            t('status.all')
          ),
          STATUSES.map((item) =>
            h(
              'button',
              {
                key: item.id,
                type: 'button',
                className: 'dm-chip' + (statusFilter === item.id ? ' dm-chipOn' : ''),
                'aria-pressed': statusFilter === item.id,
                onClick: () => setStatusFilter(item.id)
              },
              t(item.labelKey)
            )
          )
        ),
        h(
          'div',
          { className: 'dm-railFoot' },
          h('span', null, t('ai.hint')),
          data.storagePath ? h('span', { className: 'dm-storage', title: data.storagePath }, t('storage.label') + ' · ' + shortenPath(data.storagePath)) : null
        )
      )

      const listTitle =
        category === 'all'
          ? t('rail.all')
          : t((CATEGORIES.find((item) => item.id === category) || CATEGORIES[CATEGORIES.length - 1]).labelKey)

      const list = h(
        'section',
        { className: 'dm-list', 'aria-label': t('list.label') },
        h(
          'div',
          { className: 'dm-listHead' },
          h('span', { className: 'dm-listTitle' }, listTitle),
          h('span', { className: 'dm-listCount' }, visible.length + ' ' + t('list.count')),
          h(
            'button',
            {
              type: 'button',
              className: 'dm-iconBtn',
              title: t('action.refresh'),
              'aria-label': t('action.refresh'),
              onClick: () => load()
            },
            h(Icon, { name: 'refresh', size: 15 })
          )
        ),
        data.status === 'loading'
          ? h(
              'div',
              { className: 'dm-rows' },
              h('div', { className: 'dm-skeleton' }),
              h('div', { className: 'dm-skeleton' }),
              h('div', { className: 'dm-skeleton' })
            )
          : visible.length
            ? h(
                'div',
                { className: 'dm-rows' },
                visible.map((entry) =>
                  h(MemoryRow, {
                    key: entry.id,
                    entry,
                    active: entry.id === selectedId,
                    disabled: editing,
                    t,
                    onSelect: () => selectEntry(entry.id)
                  })
                )
              )
            : h(
                'div',
                { className: 'dm-blank' },
                h(Icon, { name: 'book', size: 22 }),
                h('h2', { className: 'dm-blankTitle' }, entries.length ? t('list.noMatch') : t('empty.title')),
                h('p', { className: 'dm-blankHint' }, entries.length ? t('list.noMatchHint') : t('empty.hint'))
              )
      )

      let detail
      if (composer) {
        detail = h(MemoryEditor, {
          mode: composer.mode,
          draft: composer.draft,
          t,
          busy,
          error: formError,
          onChange: (draft) => setComposer(Object.assign({}, composer, { draft })),
          onCancel: cancelComposer,
          onSave: saveDraft
        })
      } else if (selected) {
        detail = h(MemoryDetail, {
          entry: selected,
          entries,
          t,
          busy,
          confirmDelete,
          onEdit: () => startEdit(selected),
          onRequestDelete: () => setConfirmDelete(true),
          onCancelDelete: () => setConfirmDelete(false),
          onConfirmDelete: deleteSelected,
          onTogglePin: togglePin,
          onSetStatus: (status) => setStatus(selected, status),
          onAddLink: (targetId, label) => addLink(selected, targetId, label),
          onRemoveLink: (targetId) => removeLink(selected, targetId),
          onSelectEntry: selectEntry
        })
      } else if (data.status === 'error') {
        detail = h(
          'div',
          { className: 'dm-blank' },
          h(Icon, { name: 'book', size: 22 }),
          h('h2', { className: 'dm-blankTitle' }, data.offline ? t('error.offline') : t('error.load')),
          h('p', { className: 'dm-blankHint' }, data.error || ''),
          h(
            'button',
            { type: 'button', className: 'dm-btn', onClick: () => load() },
            t('action.retry')
          )
        )
      } else if (data.status === 'loading') {
        detail = h(
          'div',
          { className: 'dm-blank' },
          h('p', { className: 'dm-blankHint' }, t('list.loading'))
        )
      } else if (!entries.length) {
        detail = h(
          'div',
          { className: 'dm-onboard' },
          h(
            'div',
            { className: 'dm-onboardHead' },
            h('span', { className: 'dm-onboardIcon' }, h(Icon, { name: 'book', size: 24 })),
            h('h2', { className: 'dm-onboardTitle' }, t('empty.title')),
            h('p', { className: 'dm-onboardHint' }, t('empty.hint'))
          ),
          h(
            'div',
            { className: 'dm-onboardCards' },
            CATEGORIES.map((item) =>
              h(
                'div',
                { className: 'dm-onboardCard', key: item.id },
                h(
                  'div',
                  { className: 'dm-onboardCardTitle' },
                  h('span', { className: 'dm-dot dm-dot-' + item.id }),
                  t(item.labelKey)
                ),
                h('div', { className: 'dm-onboardCardHint' }, t(item.hintKey))
              )
            )
          ),
          h(
            'button',
            { type: 'button', className: 'dm-btn dm-btnPrimary', onClick: startCreate },
            h(Icon, { name: 'plus', size: 15 }),
            t('empty.cta')
          )
        )
      } else {
        detail = h(
          'div',
          { className: 'dm-blank' },
          h(Icon, { name: 'book', size: 22 }),
          h('h2', { className: 'dm-blankTitle' }, t('detail.selectTitle')),
          h('p', { className: 'dm-blankHint' }, t('detail.selectHint'))
        )
      }

      const graphMode = view === 'graph'

      const graph = graphMode
        ? h(GraphView, {
            entries: visible,
            t,
            selectedId,
            selectedEntry: selected,
            onSelect: selectEntry,
            onClose: () => setSelectedId(null),
            onIsolate: (id) => selectEntry(id),
            drawer: selected
              ? h(MemoryDetail, {
                  entry: selected,
                  entries,
                  t,
                  busy,
                  confirmDelete,
                  onEdit: () => startEdit(selected),
                  onRequestDelete: () => setConfirmDelete(true),
                  onCancelDelete: () => setConfirmDelete(false),
                  onConfirmDelete: deleteSelected,
                  onTogglePin: togglePin,
                  onSetStatus: (status) => setStatus(selected, status),
                  onAddLink: (targetId, label) => addLink(selected, targetId, label),
                  onRemoveLink: (targetId) => removeLink(selected, targetId),
                  onSelectEntry: selectEntry
                })
              : null
          })
        : null

      return h(
        'div',
        { className: 'dm-root', 'data-dm-theme': themeMode, onKeyDown: handleKeyDown },
        h('style', null, CSS),
        h(
          'header',
          { className: 'dm-head' },
          h(
            'div',
            { className: 'dm-headText' },
            h('h1', { className: 'dm-title' }, t('head.title')),
            h('p', { className: 'dm-sub' }, t('head.subtitle'))
          ),
          h(
            'div',
            { className: 'dm-headActions' },
            h(
              'div',
              { className: 'dm-segment', role: 'group', 'aria-label': t('head.title') },
              h(
                'button',
                {
                  type: 'button',
                  className: 'dm-segmentBtn' + (graphMode ? '' : ' dm-segmentBtnOn'),
                  'aria-pressed': !graphMode,
                  onClick: () => setView('list')
                },
                h(Icon, { name: 'book', size: 13 }),
                t('view.list')
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'dm-segmentBtn' + (graphMode ? ' dm-segmentBtnOn' : ''),
                  'aria-pressed': graphMode,
                  onClick: () => setView('graph')
                },
                h(Icon, { name: 'graph', size: 13 }),
                t('view.graph')
              )
            ),
            h(
              'div',
              { className: 'dm-search' },
              h(Icon, { name: 'search', size: 15 }),
              h('input', {
                type: 'text',
                value: query,
                placeholder: t('search.placeholder'),
                'aria-label': t('search.placeholder'),
                onChange: (event) => setQuery(event.target.value)
              }),
              query
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'dm-searchClear',
                      title: t('search.clear'),
                      'aria-label': t('search.clear'),
                      onClick: () => setQuery('')
                    },
                    h(Icon, { name: 'close', size: 12 })
                  )
                : null
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'dm-btn dm-btnPrimary',
                disabled: editing,
                onClick: startCreate
              },
              h(Icon, { name: 'plus', size: 15 }),
              t('action.new')
            )
          )
        ),
        notice ? h('div', { className: 'dm-notice dm-notice-' + notice.tone, role: 'status' }, notice.text) : null,
        data.error && data.status !== 'error'
          ? h('div', { className: 'dm-notice dm-notice-error', role: 'status' }, data.error)
          : null,
        graphMode
          ? h('div', { className: 'dm-body dm-body-graph' }, rail, graph)
          : h('div', { className: 'dm-body' }, rail, list, h('section', { className: 'dm-detail' }, detail))
      )
    }

    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'design-memory: zh dictionary')
      ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'design-memory: en dictionary')
      ctx.slots.inject('sidebar.panellist', () =>
        ctx.slots.register(
          {
            name: 'sidebar.panellist',
            id: PANEL_ID,
            order: 4,
            locale: NS,
            label: () => t('panel.label')
          },
          SidebarIcon
        )
      )
      ctx.slots.inject('main', () =>
        ctx.slots.register(
          {
            name: 'main',
            key: PANEL_ID,
            locale: NS
          },
          DesignMemoryPanel
        )
      )
    }

    return { inject: ['slots', 'locale'], apply }
  }
})
