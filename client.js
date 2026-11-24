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
      'head.subtitle': '系统规则、数值口径与流程约定的长期记忆库',
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
      'rail.label': '记忆分类',
      'rail.all': '全部',
      'rail.system': '系统',
      'rail.numbers': '数值',
      'rail.other': '其他',
      'rail.status': '状态',
      'status.all': '全部',
      'status.draft': '待确认',
      'status.confirmed': '已确认',
      'status.deprecated': '已废弃',
      'list.label': '记忆列表',
      'list.count': '条',
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
      'detail.selectHint': '从列表里点开一条，或新建一条。这里会显示规则、数值和改动记录。',
      'empty.title': '还没有策划记忆',
      'empty.hint': '把已经确认的规则、数值和约定记在这里，开新会话时 AI 也能查到。',
      'empty.cta': '新建第一条',
      'empty.system.hint': '玩法规则、模块边界、异常口径',
      'empty.numbers.hint': '产出消耗、概率阈值、平衡结论',
      'empty.other.hint': '流程约定、I18N、工具链',
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
      'ai.hint': 'AI 可读写：design_memory_search / design_memory_write',
      'storage.label': '存储位置',
      'error.load': '读取记忆库失败',
      'error.offline': '无法连接插件后台'
    }

    const EN = {
      'panel.label': 'Design memory',
      'head.title': 'Design memory',
      'head.subtitle': 'System rules, numeric decisions, and project conventions',
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
      'rail.label': 'Categories',
      'rail.all': 'All',
      'rail.system': 'Systems',
      'rail.numbers': 'Numbers',
      'rail.other': 'Other',
      'rail.status': 'Status',
      'status.all': 'All',
      'status.draft': 'Draft',
      'status.confirmed': 'Confirmed',
      'status.deprecated': 'Deprecated',
      'list.label': 'Entries',
      'list.count': 'entries',
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
      'detail.selectHint': 'Open an entry from the list, or create one. Rules, numbers, and change notes appear here.',
      'empty.title': 'No design memories yet',
      'empty.hint': 'Record confirmed rules, numbers, and conventions here so the agent can find them in later sessions.',
      'empty.cta': 'Create the first entry',
      'empty.system.hint': 'Rules, module boundaries, edge cases',
      'empty.numbers.hint': 'Outputs, costs, chances, thresholds',
      'empty.other.hint': 'Process, I18N, tooling',
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
      'ai.hint': 'Agent tools: design_memory_search / design_memory_write',
      'storage.label': 'Storage',
      'error.load': 'Could not load memories',
      'error.offline': 'Cannot reach the plugin host'
    }

    const CSS = `
.dm-root { display:flex; flex-direction:column; height:100%; min-height:0; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); font-size:13px; line-height:1.5; }
.dm-root *, .dm-root *::before, .dm-root *::after { box-sizing:border-box; }
.dm-root button { font:inherit; color:inherit; }
.dm-head { flex:none; display:flex; align-items:flex-end; justify-content:space-between; gap:24px; padding:22px 28px 16px; border-bottom:.5px solid var(--dsw-alias-border-l1); }
html[data-platform='darwin'] .dm-head { padding-top:calc(22px + var(--dsh-frame-top-clearance, 0px)); }
.dm-title { margin:0; font-size:20px; line-height:28px; font-weight:500; letter-spacing:.2px; }
.dm-sub { margin:4px 0 0; font-size:12px; color:var(--dsw-alias-label-secondary); }
.dm-headActions { flex:none; display:flex; align-items:center; gap:8px; }
.dm-search { position:relative; display:flex; align-items:center; }
.dm-search > svg { position:absolute; left:9px; color:var(--dsw-alias-label-secondary); pointer-events:none; }
.dm-search input { width:232px; height:32px; padding:0 30px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; outline:none; }
.dm-search input:focus-visible { border-color:var(--dsw-alias-brand-primary); }
.dm-search input::placeholder { color:var(--dsw-alias-label-secondary); opacity:.8; }
.dm-searchClear { position:absolute; right:4px; display:inline-flex; align-items:center; justify-content:center; width:22px; height:22px; padding:0; border:0; border-radius:6px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
.dm-searchClear:hover { background:var(--dsw-alias-interactive-bg-active); color:var(--dsw-alias-label-primary); }
.dm-notice { flex:none; display:flex; align-items:center; gap:8px; margin:10px 28px 0; padding:8px 12px; border-radius:8px; font-size:12px; background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-secondary); }
.dm-notice-success { color:var(--dsw-alias-state-success-primary); }
.dm-notice-error { color:var(--dsw-alias-state-error-primary); }
.dm-body { display:grid; grid-template-columns:196px minmax(260px, 320px) minmax(0, 1fr); flex:1; min-height:0; }
.dm-rail { display:flex; flex-direction:column; gap:2px; min-height:0; padding:12px 10px; overflow-y:auto; border-right:.5px solid var(--dsw-alias-border-l1); }
.dm-railRow { display:flex; align-items:center; gap:8px; height:32px; padding:0 10px; border:0; border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; text-align:left; }
.dm-railRow:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dm-railRowActive { background:var(--dsw-alias-interactive-bg-active); color:var(--dsw-alias-label-primary); font-weight:500; }
.dm-railLabel { flex:1; min-width:0; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-railCount { flex:none; font-size:11px; color:var(--dsw-alias-label-secondary); font-variant-numeric:tabular-nums; }
.dm-dot { flex:none; width:7px; height:7px; border-radius:50%; background:var(--dsw-alias-label-secondary); opacity:.65; }
.dm-dot-system { background:var(--dsw-alias-link); }
.dm-dot-numbers { background:var(--dsw-alias-state-success-primary); }
.dm-dot-other { background:var(--dsw-alias-state-warn-primary); }
.dm-dot-system, .dm-dot-numbers, .dm-dot-other { opacity:1; }
.dm-railDivider { height:1px; margin:10px 6px; background:var(--dsw-alias-border-l1); }
.dm-railSection { padding:0 10px 6px; font-size:11px; letter-spacing:.04em; color:var(--dsw-alias-label-secondary); }
.dm-statusFilter { display:flex; flex-wrap:wrap; gap:6px; padding:0 8px; }
.dm-chip { height:24px; padding:0 9px; border:1px solid var(--dsw-alias-border-l1); border-radius:999px; background:transparent; color:var(--dsw-alias-label-secondary); font-size:11px; cursor:pointer; }
.dm-chip:hover { background:var(--dsw-alias-interactive-bg-hover); }
.dm-chipOn { border-color:var(--dsw-alias-brand-primary); color:var(--dsw-alias-brand-primary); }
.dm-railFoot { display:flex; flex-direction:column; gap:4px; margin-top:auto; padding:12px 10px 4px; font-size:11px; color:var(--dsw-alias-label-secondary); }
.dm-storage { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; opacity:.8; }
.dm-list { display:flex; flex-direction:column; min-height:0; border-right:.5px solid var(--dsw-alias-border-l1); }
.dm-listHead { flex:none; display:flex; align-items:center; gap:8px; padding:14px 14px 10px; }
.dm-listTitle { font-weight:500; }
.dm-listCount { font-size:12px; color:var(--dsw-alias-label-secondary); }
.dm-listHead .dm-iconBtn { margin-left:auto; }
.dm-rows { flex:1; min-height:0; display:flex; flex-direction:column; gap:2px; padding:0 8px 12px; overflow-y:auto; }
.dm-row { display:flex; flex-direction:column; gap:5px; width:100%; padding:10px 12px; border:0; border-radius:10px; background:transparent; text-align:left; cursor:pointer; }
.dm-row:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); }
.dm-rowActive { background:var(--dsw-alias-interactive-bg-active); box-shadow:inset 2px 0 0 var(--dsw-alias-brand-primary); }
.dm-row:disabled { cursor:default; opacity:.65; }
.dm-rowTop { display:flex; align-items:center; gap:8px; }
.dm-rowTitle { flex:1; min-width:0; display:flex; align-items:center; gap:4px; font-weight:500; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-pinMark { display:inline-flex; flex:none; color:var(--dsw-alias-state-warn-primary); }
.dm-statusPill { flex:none; padding:0 6px; border-radius:999px; background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-secondary); font-size:10px; line-height:16px; }
.dm-status-confirmed { color:var(--dsw-alias-state-success-primary); }
.dm-status-draft { color:var(--dsw-alias-state-warn-primary); }
.dm-status-deprecated { color:var(--dsw-alias-label-secondary); opacity:.85; }
.dm-rowSummary { display:-webkit-box; overflow:hidden; color:var(--dsw-alias-label-secondary); font-size:12px; -webkit-line-clamp:2; -webkit-box-orient:vertical; }
.dm-rowMeta { display:flex; align-items:center; gap:6px; color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-dotSep { opacity:.5; }
.dm-detail { min-width:0; min-height:0; overflow-y:auto; }
.dm-detailInner { max-width:720px; padding:26px 32px 48px; }
.dm-detailMeta { display:flex; align-items:center; gap:8px; color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-catChip { display:inline-flex; align-items:center; gap:5px; height:22px; padding:0 8px; border-radius:999px; background:var(--dsw-alias-interactive-bg-hover); font-size:11px; }
.dm-catChip::before { content:''; width:6px; height:6px; border-radius:50%; background:var(--dsw-alias-label-secondary); }
.dm-cat-system::before { background:var(--dsw-alias-link); }
.dm-cat-numbers::before { background:var(--dsw-alias-state-success-primary); }
.dm-cat-other::before { background:var(--dsw-alias-state-warn-primary); }
.dm-detailDate { margin-left:auto; }
.dm-detailHead { display:flex; align-items:flex-start; gap:12px; margin:10px 0 6px; }
.dm-detailTitle { flex:1; min-width:0; margin:0; font-size:19px; line-height:28px; font-weight:600; word-break:break-word; }
.dm-detailSummary { margin:0 0 18px; color:var(--dsw-alias-label-secondary); font-size:13px; line-height:1.7; }
.dm-section { margin:20px 0 0; }
.dm-sectionTitle { margin:0 0 8px; color:var(--dsw-alias-label-secondary); font-size:11px; font-weight:500; letter-spacing:.06em; text-transform:uppercase; }
.dm-facts { border-top:.5px solid var(--dsw-alias-border-l1); }
.dm-factRow { display:grid; grid-template-columns:minmax(90px,180px) minmax(0,1fr); gap:12px; padding:8px 2px; border-bottom:.5px solid var(--dsw-alias-border-l1); }
.dm-factLabel { color:var(--dsw-alias-label-secondary); }
.dm-factValue { font-variant-numeric:tabular-nums; white-space:pre-wrap; word-break:break-word; }
.dm-bodyText { font-size:13px; line-height:1.85; word-break:break-word; }
.dm-bodyP { margin:0 0 10px; white-space:pre-wrap; }
.dm-bodyList { margin:0 0 10px; padding-left:18px; }
.dm-bodyList li { margin:3px 0; }
.dm-bodyH { margin:16px 0 8px; font-size:13px; font-weight:600; }
.dm-tags { display:flex; flex-wrap:wrap; gap:6px; margin-top:18px; }
.dm-tag { padding:2px 7px; border-radius:6px; background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-detailFoot { display:flex; align-items:flex-end; justify-content:space-between; gap:16px; margin-top:28px; padding-top:14px; border-top:.5px solid var(--dsw-alias-border-l1); }
.dm-footMeta { display:flex; flex-direction:column; gap:3px; min-width:0; color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-footLine { overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
.dm-footActions { flex:none; display:flex; gap:8px; }
.dm-footBtns { display:flex; gap:8px; }
.dm-confirm { display:flex; align-items:center; gap:8px; }
.dm-confirmText { color:var(--dsw-alias-state-error-primary); font-size:11px; }
.dm-history { margin-top:18px; padding-top:10px; border-top:.5px solid var(--dsw-alias-border-l1); }
.dm-historySummary { color:var(--dsw-alias-label-secondary); font-size:11px; cursor:pointer; }
.dm-historyList { display:flex; flex-direction:column; gap:6px; margin:8px 0 0; padding:0; list-style:none; }
.dm-historyItem { display:flex; gap:10px; color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-historyDate { flex:none; font-variant-numeric:tabular-nums; opacity:.85; }
.dm-btn { display:inline-flex; align-items:center; justify-content:center; gap:6px; height:30px; padding:0 12px; border:1px solid var(--dsw-alias-border-l2); border-radius:8px; background:var(--dsw-alias-bg-base); color:var(--dsw-alias-label-primary); white-space:nowrap; cursor:pointer; }
.dm-btn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); }
.dm-btn:disabled { opacity:.55; cursor:default; }
.dm-btnPrimary { border-color:var(--dsw-alias-brand-primary); background:var(--dsw-alias-brand-primary); color:var(--dsw-alias-label-primary-foreground); }
.dm-btnPrimary:hover:not(:disabled) { border-color:var(--dsw-alias-button-primary-hover); background:var(--dsw-alias-button-primary-hover); filter:none; }
.dm-btnDanger { border-color:var(--dsw-alias-state-error-primary); color:var(--dsw-alias-state-error-primary); }
.dm-btnGhostDanger { color:var(--dsw-alias-state-error-primary); }
.dm-iconBtn { display:inline-flex; align-items:center; justify-content:center; width:30px; height:30px; padding:0; border:1px solid transparent; border-radius:8px; background:transparent; color:var(--dsw-alias-label-secondary); cursor:pointer; }
.dm-iconBtn:hover:not(:disabled) { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dm-iconBtnOn { color:var(--dsw-alias-state-warn-primary); }
.dm-btn:focus-visible, .dm-iconBtn:focus-visible, .dm-row:focus-visible, .dm-railRow:focus-visible, .dm-chip:focus-visible, .dm-search input:focus-visible, .dm-input:focus-visible { outline:2px solid var(--dsw-alias-brand-primary); outline-offset:2px; }
.dm-editor { display:flex; flex-direction:column; gap:12px; max-width:760px; padding:22px 32px 48px; }
.dm-editorTop { display:flex; align-items:center; justify-content:space-between; gap:12px; }
.dm-editorMode { color:var(--dsw-alias-brand-primary); font-size:11px; font-weight:500; letter-spacing:.08em; }
.dm-editorHint { color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-input { width:100%; height:34px; padding:0 10px; border:1px solid var(--dsw-alias-border-l1); border-radius:8px; background:var(--dsw-alias-bg-layer-1); color:var(--dsw-alias-label-primary); font:inherit; outline:none; }
.dm-input::placeholder { color:var(--dsw-alias-label-secondary); opacity:.75; }
.dm-titleInput { height:40px; font-size:16px; font-weight:500; }
.dm-textarea { height:auto; min-height:170px; padding:10px; line-height:1.7; resize:vertical; }
.dm-select { padding:0 8px; }
.dm-editorRow { display:flex; flex-wrap:wrap; align-items:flex-end; gap:12px; }
.dm-field { display:flex; flex:1; flex-direction:column; gap:5px; min-width:150px; }
.dm-fieldLabel { color:var(--dsw-alias-label-secondary); font-size:11px; letter-spacing:.04em; }
.dm-fieldHint { color:var(--dsw-alias-label-secondary); font-size:11px; opacity:.8; }
.dm-check { display:inline-flex; align-items:center; gap:6px; height:34px; color:var(--dsw-alias-label-secondary); font-size:12px; }
.dm-editorSection { display:flex; flex-direction:column; gap:7px; }
.dm-editorSectionHead { display:flex; align-items:baseline; justify-content:space-between; gap:12px; }
.dm-factsEdit { display:flex; flex-direction:column; gap:6px; }
.dm-factEditRow { display:grid; grid-template-columns:minmax(110px,220px) minmax(0,1fr) 30px; align-items:center; gap:8px; }
.dm-textBtn { align-self:flex-start; display:inline-flex; align-items:center; gap:5px; height:26px; padding:0 8px; border:1px dashed var(--dsw-alias-border-l2); border-radius:7px; background:transparent; color:var(--dsw-alias-label-secondary); font-size:12px; cursor:pointer; }
.dm-textBtn:hover { background:var(--dsw-alias-interactive-bg-hover); color:var(--dsw-alias-label-primary); }
.dm-editorActions { display:flex; align-items:center; justify-content:flex-end; gap:10px; margin-top:6px; }
.dm-saveHint { margin-right:auto; color:var(--dsw-alias-label-secondary); font-size:11px; }
.dm-formError { color:var(--dsw-alias-state-error-primary); font-size:12px; }
.dm-blank { display:flex; flex-direction:column; align-items:center; justify-content:center; gap:6px; height:100%; padding:32px; color:var(--dsw-alias-label-secondary); text-align:center; }
.dm-blank > svg { margin-bottom:4px; opacity:.55; }
.dm-blankTitle { margin:0; color:var(--dsw-alias-label-primary); font-size:15px; font-weight:500; }
.dm-blankHint { max-width:360px; margin:0; font-size:12px; line-height:1.7; }
.dm-onboard { display:flex; flex-direction:column; gap:20px; max-width:640px; padding:40px 32px 48px; }
.dm-onboardHead { display:flex; flex-direction:column; gap:6px; }
.dm-onboardIcon { color:var(--dsw-alias-brand-primary); }
.dm-onboardTitle { margin:0; font-size:18px; font-weight:600; }
.dm-onboardHint { max-width:480px; margin:0; color:var(--dsw-alias-label-secondary); font-size:12px; line-height:1.7; }
.dm-onboardCards { display:grid; grid-template-columns:repeat(3, minmax(0, 1fr)); gap:10px; }
.dm-onboardCard { display:flex; flex-direction:column; gap:5px; padding:12px; border:1px solid var(--dsw-alias-border-l1); border-radius:10px; background:var(--dsw-alias-card-fill); }
.dm-onboardCardTitle { display:flex; align-items:center; gap:6px; font-weight:500; }
.dm-onboardCardHint { color:var(--dsw-alias-label-secondary); font-size:11px; line-height:1.6; }
.dm-skeleton { height:52px; margin:0 8px 6px; border-radius:10px; background:var(--dsw-alias-bg-skeleton); }
@media (max-width:1080px) { .dm-body { grid-template-columns:168px minmax(240px, 300px) minmax(0, 1fr); } }
`

    const ICONS = {
      search: [['circle', { cx: 11, cy: 11, r: 6.5 }], ['path', { d: 'M20 20l-3.6-3.6' }]],
      plus: [['path', { d: 'M12 5v14M5 12h14' }]],
      refresh: [['path', { d: 'M20 11a8 8 0 1 0-2.3 6.3' }], ['path', { d: 'M20 5v6h-6' }]],
      edit: [['path', { d: 'M4 20h4l10-10-4-4L4 16v4Z' }], ['path', { d: 'M13.5 6.5l4 4' }]],
      trash: [['path', { d: 'M4 7h16' }], ['path', { d: 'M9 7V5h6v2' }], ['path', { d: 'M6.5 7l1 12h9l1-12' }]],
      star: [['path', { d: 'M12 4.5l2.3 4.7 5.2.8-3.8 3.7.9 5.2-4.6-2.5-4.6 2.5.9-5.2L4.5 10l5.2-.8L12 4.5Z' }]],
      close: [['path', { d: 'M6 6l12 12M18 6L6 18' }]],
      book: [['path', { d: 'M5 5.5A2.5 2.5 0 0 1 7.5 3H19v15H7.5A2.5 2.5 0 0 0 5 20.5V5.5Z' }], ['path', { d: 'M5 20.5A2.5 2.5 0 0 1 7.5 18H19' }]]
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
      return [entry.title, entry.summary, entry.body, entry.source, (entry.tags || []).join(' '), facts].join(' ').toLowerCase()
    }

    function compareEntries(left, right) {
      const pinned = (right.pinned ? 1 : 0) - (left.pinned ? 1 : 0)
      if (pinned !== 0) return pinned
      return String(right.updatedAt).localeCompare(String(left.updatedAt))
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

    async function request(url, options) {
      let response
      try {
        response = await fetch(url, options)
      } catch (error) {
        throw new Error('无法连接插件后台：' + (error && error.message ? error.message : String(error)))
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
          h('span', null, formatShort(entry.updatedAt))
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
            onClick: () => props.onChange(facts.concat([{ label: '', value: '' }]))
          },
          h(Icon, { name: 'plus', size: 13 }),
          t('editor.facts.add')
        )
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

    function DesignMemoryPanel(props) {
      const t = typeof props.t === 'function' ? props.t : (key) => ZH[key] || key
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
              error: error.message
            })
          )
        }
      }, [])

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
        const next = { all: entries.length, system: 0, numbers: 0, other: 0 }
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
          setData({
            status: 'ready',
            entries: result.entries || [],
            error: null,
            storagePath: result.storagePath || data.storagePath
          })
          if (result.entry) setSelectedId(result.entry.id)
          setComposer(null)
          setConfirmDelete(false)
          notify('success', composer.mode === 'create' ? t('notice.created') : t('notice.saved'))
        } catch (error) {
          setFormError(error.message)
        } finally {
          setBusy(false)
        }
      }

      const deleteSelected = async () => {
        if (!selected || busy) return
        setBusy(true)
        try {
          const result = await mutateEntries({ action: 'delete', id: selected.id })
          setData({
            status: 'ready',
            entries: result.entries || [],
            error: null,
            storagePath: result.storagePath || data.storagePath
          })
          setSelectedId(null)
          setConfirmDelete(false)
          notify('success', t('notice.deleted'))
        } catch (error) {
          notify('error', error.message)
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
          setData({
            status: 'ready',
            entries: result.entries || [],
            error: null,
            storagePath: result.storagePath || data.storagePath
          })
        } catch (error) {
          notify('error', error.message)
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
          : t((CATEGORIES.find((item) => item.id === category) || CATEGORIES[2]).labelKey)

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
          t,
          busy,
          confirmDelete,
          onEdit: () => startEdit(selected),
          onRequestDelete: () => setConfirmDelete(true),
          onCancelDelete: () => setConfirmDelete(false),
          onConfirmDelete: deleteSelected,
          onTogglePin: togglePin
        })
      } else if (data.status === 'error') {
        detail = h(
          'div',
          { className: 'dm-blank' },
          h(Icon, { name: 'book', size: 22 }),
          h('h2', { className: 'dm-blankTitle' }, t('error.load')),
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

      return h(
        'div',
        { className: 'dm-root', onKeyDown: handleKeyDown },
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
        h('div', { className: 'dm-body' }, rail, list, h('section', { className: 'dm-detail' }, detail))
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
