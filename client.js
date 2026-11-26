window.__ModuleLoader__.load({
  id: '@local/design-memory',
  factory(require) {
    const React = require('react')
    const h = React.createElement
    const { useState, useEffect, useMemo, useCallback, useRef } = React

    /* ------------------------------------------------------------------ *
     * 知微 · 策划知识工作台
     * 一个面向游戏策划的 AI 知识管理与记忆探索系统：
     *   AI 负责理解 / 提取 / 分类 / 推荐关系 / 归纳主题，
     *   人负责确认 / 修正 / 决策。
     * ------------------------------------------------------------------ */

    const NS = 'zhiwei'
    const PANEL_ID = 'design-memory'
    const API = 'design-memory/api'

    const TYPE_COLOR = {
      decision: '#6366f1',
      rule: '#3b82f6',
      assumption: '#f59e0b',
      question: '#ec4899',
      proposal: '#8b5cf6',
      reference: '#14b8a6',
      metric: '#22c55e',
      retro: '#64748b',
      process: '#06b6d4'
    }

    const RELATION_COLOR = {
      belongs_to: '#94a3b8',
      depends_on: '#f97316',
      affects: '#ef4444',
      derived_from: '#a855f7',
      references: '#0ea5e9',
      conflicts_with: '#e11d48',
      supersedes: '#64748b',
      refines: '#22c55e'
    }

    const RELATION_DASH = {
      belongs_to: '1 5',
      depends_on: '7 4',
      affects: '',
      derived_from: '2 4',
      references: '9 5',
      conflicts_with: '3 3',
      supersedes: '10 3 2 3',
      refines: '6 4'
    }

    const COLLECTION_COLORS = ['violet', 'blue', 'teal', 'amber', 'rose', 'lime']

    const DEFAULT_META = {
      entryTypes: [
        { id: 'decision', label: '设计决策', hint: '已经拍板的选择与理由' },
        { id: 'rule', label: '设计规则', hint: '系统规则、数值口径、计算公式' },
        { id: 'assumption', label: '设计假设', hint: '还没验证的判断与前提' },
        { id: 'question', label: '设计问题', hint: '待解决的疑问与风险点' },
        { id: 'proposal', label: '设计方案', hint: '可执行的方案与备选' },
        { id: 'reference', label: '参考案例', hint: '竞品拆解、外部资料' },
        { id: 'metric', label: '数值数据', hint: '产出、消耗、概率、留存' },
        { id: 'retro', label: '复盘结论', hint: '上线结果与经验总结' },
        { id: 'process', label: '流程约定', hint: '工作方式、协作约定、目录规范' }
      ],
      domains: [
        { id: 'combat', label: '战斗' },
        { id: 'growth', label: '成长' },
        { id: 'economy', label: '经济' },
        { id: 'level', label: '关卡' },
        { id: 'event', label: '活动' },
        { id: 'uiux', label: '界面交互' },
        { id: 'monetization', label: '商业化' },
        { id: 'social', label: '社交' },
        { id: 'operation', label: '运营' },
        { id: 'tech', label: '技术' }
      ],
      statuses: [
        { id: 'draft', label: '草稿', hint: '刚记下来，还没整理' },
        { id: 'pending', label: '待确认', hint: 'AI 整理过，等人拍板' },
        { id: 'active', label: '已生效', hint: '已确认，可作为依据' },
        { id: 'deprecated', label: '已废弃', hint: '被推翻，保留追溯' },
        { id: 'archived', label: '已归档', hint: '不再活跃，留档' }
      ],
      relationTypes: [
        { id: 'belongs_to', label: '归属于', hint: '是某个系统/模块的一部分' },
        { id: 'depends_on', label: '依赖于', hint: '前置条件或上游依赖' },
        { id: 'affects', label: '影响', hint: '改动会波及对方' },
        { id: 'derived_from', label: '来源于', hint: '由对方推导而来' },
        { id: 'references', label: '参考', hint: '作为依据或对照' },
        { id: 'conflicts_with', label: '冲突', hint: '两者互斥或互相矛盾' },
        { id: 'supersedes', label: '替代', hint: '取代了对方的旧结论' },
        { id: 'refines', label: '细化', hint: '是对方更具体的延伸' }
      ],
      relationStatuses: [
        { id: 'suggested', label: '待确认' },
        { id: 'confirmed', label: '已确认' },
        { id: 'rejected', label: '已拒绝' }
      ],
      sourceKinds: [
        { id: 'manual', label: '手动' },
        { id: 'conversation', label: '对话' },
        { id: 'import', label: '导入' },
        { id: 'ai', label: 'AI 整理' }
      ]
    }

    const ZH = {
      'panel.label': '知微',
      'app.name': '知微',
      'app.badge': 'AI 知识工作台',

      'nav.overview': '工作台',
      'nav.all': '全部记忆',
      'nav.inbox': '待整理',
      'nav.collections': '主题集合',
      'nav.favorites': '收藏',
      'nav.recent': '最近访问',
      'nav.graph': '关系图',
      'nav.projects': '项目空间',
      'nav.savedViews': '保存的视图',
      'nav.deleteView': '删除这个视图',
      'nav.savedViewsEmpty': '在关系图里可以保存当前视角',
      'nav.collapse': '收起导航',
      'nav.expand': '展开导航',

      'action.new': '新建记忆',
      'action.save': '保存',
      'action.cancel': '取消',
      'action.delete': '删除',
      'action.rename': '重命名',
      'project.namePlaceholder': '项目空间名称',
      'graph.saveLayout': '保存布局',
      'graph.layoutSaved': '已保存当前布局',
      'toast.projectSaved': '已保存项目',
      'toast.projectDeleted': '已删除项目',
      'toast.projectMoved': '已调整项目顺序',
      'project.newTitle': '新建项目',
      'project.editTitle': '编辑项目',
      'project.name': '项目名称',
      'project.namePlaceholder': '例如：N2 · 猎星者',
      'project.description': '项目说明',
      'project.descriptionPlaceholder': '这个项目的背景、约束或目标（可留空）',
      'project.needName': '项目名称不能为空',
      'project.deleteTitle': '删除项目',
      'project.deleteText': '删除后，项目里的记忆与集合会移动到第一个项目，记忆本身不会丢。',
      'project.deleteConfirm': '确认删除',

      'settings.modelTitle': '整理用的模型',
      'settings.modelHint': '选定后，AI 整理、摘要与归类会先走这个模型；模型不可用时自动回退到本地启发式整理。',
      'settings.modelUnavailable': '当前环境没有可用的模型服务，只能使用本地整理。',
      'settings.modelName': '模型',
      'settings.modelEnable': '使用模型来整理',
      'settings.modelSaved': '已保存模型设置',
      'settings.modelNone': '不指定（只用本地整理）',
      'settings.needPath': '先填一个存储路径',
      'settings.modelOn': '正在用这个模型整理',
      'settings.importFailed': '导入失败：',
      'settings.sectionLabel': '知微',
      'settings.storage': '存储位置',
      'settings.switchTitle': '切换记忆存储区域',
      'settings.switchHint': '填一个目录或 .json 文件路径，知微会把当前记忆写到那里并从那儿读取。原位置的数据会保留一份备份，随时可以切回来。',
      'settings.switchApply': '切换到这里',
      'settings.exportTitle': '导出',
      'settings.exportHint': '导出为 JSON 文件，包含记忆、关系、集合、记忆框与布局，可用于备份或迁移到另一台电脑。',
      'settings.export': '导出 JSON',
      'settings.importTitle': '导入',
      'settings.importHint': '选择之前导出的 JSON：合并只补充缺失的记忆，覆盖会用文件内容替换当前库。',
      'settings.importMerge': '合并（只补充）',
      'settings.importReplace': '覆盖（替换现有库）',
      'settings.switched': '已切换存储位置',
      'settings.imported': '已导入',
      'settings.exported': '已导出',
      'graph.saveLayout': '保存布局',
      'graph.layoutSaved': '已保存当前布局',
      'graph.frameName': '记忆框',
      'graph.frameSaved': '已把这个范围归到一个框里',
      'graph.frameNodeHint': '记忆框也是节点：可以拖动，也可以拖线连到别的记忆或别的框',
      'graph.frameRenameTitle': '重命名记忆框',
      'graph.frameRenamed': '记忆框已重命名',
      'graph.frameCreateTitle': '给这个记忆区起个名字',
      'graph.frameDrawn': '框画好了，起个名字它就是一块记忆区',
      'graph.frames': '记忆区',
      'graph.framePick': '选中这个记忆区里的记忆',
      'graph.frameDelete': '删除记忆区（记忆本身保留）',
      'graph.frameDeleted': '记忆区已删除，里面的记忆都还在',
      'graph.searchArea': '在这块记忆区里找',
      'graph.noFrames': '还没有记忆区：选「圈区」在画布上画一个框',
      'action.edit': '编辑',
      'action.close': '关闭',
      'action.confirm': '确认',
      'action.reset': '重置',
      'action.retry': '重试',
      'action.accept': '采纳',
      'action.ignore': '忽略',
      'action.open': '打开',
      'action.selectAll': '全选',

      'common.all': '全部',
      'common.empty': '这里还没有内容',
      'common.items': '条',

      'type.decision': '设计决策',
      'type.rule': '设计规则',
      'type.assumption': '设计假设',
      'type.question': '设计问题',
      'type.proposal': '设计方案',
      'type.reference': '参考案例',
      'type.metric': '数值数据',
      'type.retro': '复盘结论',
      'type.process': '流程约定',

      'domain.combat': '战斗',
      'domain.growth': '成长',
      'domain.economy': '经济',
      'domain.level': '关卡',
      'domain.event': '活动',
      'domain.uiux': '界面交互',
      'domain.monetization': '商业化',
      'domain.social': '社交',
      'domain.operation': '运营',
      'domain.tech': '技术',

      'status.draft': '草稿',
      'status.pending': '待确认',
      'status.active': '已生效',
      'status.deprecated': '已废弃',
      'status.archived': '已归档',

      'relation.belongs_to': '归属于',
      'relation.depends_on': '依赖于',
      'relation.affects': '影响',
      'relation.derived_from': '来源于',
      'relation.references': '参考',
      'relation.conflicts_with': '冲突',
      'relation.supersedes': '替代',
      'relation.refines': '细化',

      'relStatus.suggested': '待确认',
      'relStatus.confirmed': '已确认',
      'relStatus.rejected': '已拒绝',

      'source.manual': '手动',
      'source.conversation': '对话',
      'source.import': '导入',
      'source.ai': 'AI 整理',

      'sort.updated': '最近更新',
      'layout.list': '列表',
      'layout.cards': '卡片',

      'overview.stat.total': '全部记忆',
      'overview.stat.inbox': '待整理',
      'overview.stat.collections': '主题集合',
      'overview.stat.relations': '关联',
      'overview.stat.recalls': '调用',
      'overview.recent': '最近更新',
      'overview.inbox': '待整理',
      'overview.decisions': '最近确认的设计决策',
      'overview.favorites': '收藏',
      'overview.suggestedRelations': 'AI 建议的关系',
      'overview.empty': '还没有记忆，从右上角「新建记忆」开始',

      'list.empty': '没有符合条件的记忆',
      'list.emptyHint': '放宽筛选，或者新建一条',
      'list.filters': '筛选',
      'list.searchPlaceholder': '搜索标题、正文、标签（按 / 聚焦）',

      'filter.type': '类型',
      'filter.domain': '领域',
      'filter.status': '状态',
      'filter.tag': '标签',
      'filter.clearAll': '清除筛选',

      'detail.created': '创建于',
      'detail.content': '正文',
      'detail.tags': '标签',
      'detail.facts': '关键数值',
      'detail.collections': '所属集合',
      'detail.relations': '关联记忆',
      'detail.noRelations': '还没有关联。可以手动建立，也可以等 AI 建议。',
      'detail.history': '改动记录',
      'detail.favorite': '收藏',
      'detail.unfavorite': '取消收藏',
      'detail.expand': '展开',
      'detail.collapse': '收起',

      'editor.title': '标题',
      'editor.titlePlaceholder': '一句话说清这条记忆',
      'editor.content': '正文',
      'editor.contentPlaceholder': '细节、依据、边界条件…支持 - 列表和 ### 小标题',
      'editor.type': '类型',
      'editor.status': '状态',
      'editor.domains': '业务领域',
      'editor.tags': '标签',
      'editor.tagsPlaceholder': '回车或逗号分隔',
      'editor.project': '项目',
      'editor.source': '来源',
      'editor.facts': '关键数值',
      'editor.factLabel': '名称',
      'editor.factValue': '数值',
      'editor.addFact': '加一条',

      'quick.title': '记一条',
      'quick.subtitle': '先丢下原始想法，知微替你整理成记忆',
      'quick.placeholder': '例如：战令经验曲线改为前 30 级线性、后 20 级指数，30 级前日均可升 1.2 级…',
      'quick.analyze': 'AI 整理并保存',
      'quick.proposal': 'AI 的整理结果',
      'quick.related': '可能相关',
      'quick.collections': '可能属于',

      'relation.title': '建立关联',
      'relation.editTitle': '编辑关联',
      'relation.from': '起点',
      'relation.to': '终点',
      'relation.type': '关系类型',
      'relation.desc': '说明',
      'relation.descPlaceholder': '为什么建立这条关系？',
      'relation.status': '状态',
      'relation.swap': '交换方向',
      'relation.save': '保存关联',
      'relation.created': '已建立关联',
      'relation.confirm': '确认',
      'relation.reject': '拒绝',
      'relation.delete': '删除关联',
      'relation.self': '不能和自己建立关联',
      'relation.duplicate': '这条关联已经存在',
      'relation.pick': '选择一条记忆',
      'relation.pickSearch': '搜索目标记忆',
      'relation.noTarget': '还没有其他记忆可以关联',
      'relation.suggestedHint': 'AI 建议的关联，确认后才会成为正式关系',
      'relation.confirmedHint': '已确认的关系',
      'relation.more': '展开全部',
      'relation.less': '收起',

      'collections.subtitle': '把讲同一件事的记忆放在一起，一条记忆可以属于多个集合',
      'collections.new': '新建集合',
      'collections.name': '集合名称',
      'collections.descPlaceholder': '这个集合收的是什么？',
      'collections.color': '颜色',
      'collections.members': '成员',
      'collections.memberCount': '条记忆',
      'collections.newName': '新集合名称',
      'collections.createAndPick': '新建并加入',
      'collections.created': '已新建集合',
      'collections.empty': '还没有集合',
      'collections.emptyHint': '可以手动新建，也可以让 AI 从现有记忆里聚类',
      'collections.suggestAi': '让 AI 找主题',
      'collections.aiFound': '找到的主题',
      'collections.aiSource': 'AI 建议',
      'collections.accept': '采纳为集合',
      'collections.addMembers': '添加记忆',
      'collections.removeMember': '移出集合',
      'collections.noMembers': '集合里还没有记忆',
      'collections.mergeInto': '合并到…',
      'collections.reasons': '为什么这样归类',

      'graph.subtitle': '拖动探索，点击查看，Shift 拖拽建关系，Alt 拖拽框选',
      'graph.zoomIn': '放大',
      'graph.zoomOut': '缩小',
      'graph.fit': '适应窗口',
      'graph.relayout': '重新布局',
      'graph.collapse': '折叠集合',
      'graph.searchPlaceholder': '在图中定位记忆…',
      'graph.saveView': '保存当前视图',
      'graph.viewName': '视图名称',
      'graph.clusterHint': '同一集合的节点会被气泡包住',

      'batch.clear': '取消选择',
        'batch.archive': '归档',
        'batch.tag': '加标签',
        'batch.delete': '删除',
        'batch.tagTitle': '批量加标签',
        'batch.tagHint': '选中的记忆都会加上这个标签，不会覆盖已有标签。',
        'batch.tagPlaceholder': '标签名',
        'batch.tagApply': '加上',
        'batch.deleteTitle': '删除选中的记忆',
        'batch.deleteText': '会删除这些记忆本身，以及它们的关系；被删记忆里的内容会保留在撤销记录里一会儿，想恢复请在提示里点撤销。',
        'toast.tagged': '已加上标签',
        'toast.archived': '已归档',

      'toast.saved': '已保存',
      'toast.deleted': '已删除',
      'toast.collectionSaved': '已保存到集合',
      'toast.relationCreated': '已建立关联',
      'toast.relationDeleted': '关联已删除',
      'toast.viewSaved': '视图已保存',

      'error.load': '加载失败',
      'error.offline': '连不上知微的后端服务，试试重启 DSH',
      'error.write': '保存失败',

      'view.overview': '工作台',
      'view.all': '全部记忆',
      'view.inbox': '待整理',
      'view.collections': '主题集合',
      'view.favorites': '收藏',
      'view.recent': '最近访问',
      'view.graph': '关系图',
      'app.title': '知微 · AI 知识工作台',
      'app.loading': '加载中…',
      'common.close': '关闭',
      'common.cancel': '取消',
      'common.name': '名称',

      'action.star': '收藏',
      'action.unstar': '取消收藏',
      'action.deleteConfirm': '确认删除',

      'detail.status': '状态',
      'detail.meta': '元信息',
      'detail.legacy': '这条记忆来自旧版分类，内容已按新类型保留。',
      'detail.noCollections': '还没有归入任何集合',
      'detail.emptyTitle': '还没有选中记忆',
      'detail.emptyText': '从中间列表点一条记忆，或者按「新建记忆」记下第一条设计结论。',

      'editor.newTitle': '新建记忆',
      'editor.editTitle': '编辑记忆',
      'editor.needContent': '正文不能为空',
      'editor.contentHint': '写清背景、结论和具体数字，Markdown 可用。',
      'editor.factsHint': '每行一条「名称=值」，例如 随机皮肤放大器=20',
      'editor.collections': '所属集合',
      'editor.collectionsHint': '一条记忆可以同时属于多个集合。',
      'editor.noCollections': '还没有集合',
      'editor.sourceLabel': '来源说明',
      'editor.sourceLabelPlaceholder': '例：N2 周会 / 竞品拆解 / 数值表',
      'editor.favorite': '收藏这条记忆',
      'editor.pin': '置顶显示',

      'quick.needText': '先写下这条记忆的内容',
      'quick.sourceLabel': '来源说明',
      'quick.saveRaw': '直接保存',
      'quick.confirm': '保存并整理',
      'quick.subtitleHint': '随便写，AI 会自动整理成标题、类型、领域和关联。',

      'relation.create': '建立关联',
      'relation.suggested': '建议中',
      'relation.needTarget': '先选一条要关联的记忆',
      'relation.searchPlaceholder': '搜索记忆标题或正文',
      'relation.description': '说明',
      'relation.descriptionPlaceholder': '为什么相关？例：同属战斗数值，被这条规则约束',
      'relation.preview': '关联方向',
      'relation.previewSelf': '起点和终点不能是同一条记忆',

      'collections.needName': '先给集合起个名字',
      'collections.description': '简介',
      'collections.project': '所属项目',
      'collections.selected': '已选择',
      'collections.deleted': '集合已删除',
      'collections.manage': '管理集合',
      'collections.editTitle': '编辑集合',
      'collections.manageHint': '在这里改名、调成员、合并或删除集合',
      'collections.open': '打开集合',
      'collections.mergeAction': '合并',
      'collections.mergeConfirm': '确认合并',
      'collections.membersChanged': '集合成员已更新',
      'toast.viewDeleted': '视图已删除',

      'graph.toolSelect': '选择',
      'graph.toolLink': '划线',
      'graph.toolBox': '圈选',
      'graph.toolArea': '记忆区',
      'graph.linkNeedTarget': '把线拖到另一条记忆上才能建立关联',
      'graph.linkSelf': '不能连到自己',
      'graph.linkDone': '已建立关联',
      'graph.filters': '筛选',
      'graph.byType': '按类型',
      'graph.byRelation': '按关系类型',
      'graph.byProject': '按项目',
      'graph.byDomain': '按领域',
      'graph.byCollection': '按集合',
      'graph.suggestedOnly': '只看 AI 建议',
      'graph.collapsed': '已折叠',
      'graph.noCollections': '还没有集合',
      'graph.viewNamePlaceholder': '例：战斗数值全景',

      'batch.selected': '已选中',
      'batch.addToCollection': '加入集合',
      'batch.setStatus': '设为已生效',
      'batch.pickCollection': '选择要加入的集合',
      'nav.newProject': '新建项目空间',
      'toast.created': '已创建',
      'toast.status': '已更新状态',
      'toast.membersAdded': '已加入集合',
      'toast.merged': '已合并',
      'toast.suggested': '已生成建议',
      'toast.restored': '已恢复',
      'toast.segmentAdded': '已拆成新记忆',

      'assist.title': 'AI 辅助',
      'assist.organize': '整理这条',
      'assist.similar': '找相似',
      'assist.relations': '推荐关联',
      'assist.summary': '生成总结',
      'assist.conflicts': '查冲突',
      'assist.impact': '上下游',
      'assist.running': '正在分析…',
      'assist.done': '分析完成',
      'assist.empty': '没有发现需要处理的内容',
      'assist.apply': '应用建议',
      'assist.applied': '已应用建议',
      'assist.reason': '理由',
      'assist.titleSug': '建议标题',
      'assist.typeSug': '建议类型',
      'assist.domainSug': '建议领域',
      'assist.tagSug': '关键词',
      'assist.summarySug': '建议摘要',
      'assist.segments': '可拆分出的原子记忆',
      'assist.splitOne': '拆出这条',
      'assist.segmentCount': '条',
      'assist.similarCount': '条相似',
      'assist.keepBoth': '都保留，稍后再定',
      'assist.supersede': '新内容替代旧的',
      'assist.bothApply': '两条分别适用不同场景',
      'assist.noConflict': '确认不冲突',
      'assist.confirmed': '已记录你的判断',
      'assist.themes': '主题',
      'assist.members': '涉及记忆',
      'assist.needSelection': '先选中一条记忆或一个集合',
      'assist.upstream': '上游（影响它的）',
      'assist.downstream': '下游（受它影响的）',
      'assist.notApplied': '仅供参考，不会自动写入',
      'action.undo': '撤销',
      'common.none': '无',

      'type.habit': '用户习惯',
      'type.convention': '通用约定',
      'type.context': '项目背景',
      'type.task': '临时事项',
      'protection.normal': '普通',
      'protection.confirmed': '已确认',
      'protection.protected': '固有约定',
      'change.create': '新建',
      'change.refine': '细化',
      'change.augment': '补充',
      'change.correct': '纠正',
      'change.conflict': '冲突',
      'change.merge': '合并',
      'change.protect': '保护级别',
      'change.status': '状态',
      'change.restore': '回滚',
      'evidence.statement': '用户陈述',
      'evidence.confirmation': '多次确认',
      'evidence.behavior': '行为推断',
      'evidence.inference': 'AI 推测',
      'evidence.temporary': '临时上下文',
      'scope.global': '跨项目',
      'nav.knowledge': '知识网络',
      'kn.saved': '知识对象已更新',
      'kn.created': '知识对象已创建',
      'kn.archived': '已归档，可以随时恢复',
      'kn.restored': '已恢复',
      'kn.linked': '已关联这条记忆',
      'kn.unlinked': '已解除关联，记忆本身还在',
      'kn.merged': '已合并到主对象',
      'kn.new': '新建知识对象',
      'kn.edit': '编辑知识对象',
      'kn.objects': '知识对象',
      'search.collections': '主题集合',
      'search.projects': '项目',
      'kn.tab.project': '项目视图',
      'kn.tab.work': '工作视图',
      'kn.tab.preference': '偏好视图',
      'kn.tab.global': '全局视图',
      'common.saving': '保存中',
      'kn.title': '名称',
      'kn.titlePlaceholder': '例如：哥布林',
      'kn.type': '类型',
      'kn.parent': '上级对象',
      'kn.noParent': '不指定上级',
      'kn.scope': '适用范围',
      'kn.description': '描述',
      'kn.descriptionHint': '说清它是什么、管什么',
      'kn.descriptionPlaceholder': '写清这个对象的定义和约束',
      'kn.aliases': '别名',
      'kn.aliasesHint': '逗号分隔，用于自动识别和搜索',
      'kn.aliasesPlaceholder': '例如：Goblin, 哥布',
      'kn.attributes': '属性',
      'kn.attrKey': '属性名',
      'kn.attrValue': '属性值',
      'kn.addAttr': '添加属性',
      'kn.steps': '流程步骤',
      'kn.addStep': '添加步骤',
      'kn.stepTitle': '步骤名称',
      'kn.stepNote': '说明',
      'kn.noSteps': '还没有步骤',
      'kn.structure': '结构',
      'kn.archive': '归档 / 恢复',
      'kn.noAttributes': '还没有属性',
      'kn.memories': '关联记忆',
      'kn.linkMemory': '关联记忆',
      'kn.unlinkHint': '仅解除关联，不会删除记忆',
      'kn.noMemories': '还没有关联记忆',
      'kn.relations': '关系',
      'kn.createRelation': '建立关系',
      'kn.noRelations': '还没有关系',
      'kn.needTitle': '请先填写名称',
      'kn.duplicate': '可能已经存在相似对象：',
      'kn.useExisting': '用这个',
      'kn.createAnyway': '确认没问题就再点一次保存，会新建一个对象。',
      'kn.merge': '合并到其他对象',
      'kn.versionRestored': '已回滚到选中的版本，旧内容也留在历史里',
      'kn.restore': '回到这一版',
      'kn.versionCurrent': '当前',
      'change.create': '新建',
      'change.edit': '修改',
      'change.renamed': '改名',
      'change.retyped': '改类型',
      'change.status': '改状态',
      'change.archived': '归档',
      'change.restore': '回滚',
      'change.merge': '合并',
      'change.merged': '被合并',
      'kn.versionsHint': '对象的每次改名、改描述、改类型、改状态都留一版，可回滚',
      'kn.versions': '历史版本',
      'kn.mergeTitle': '合并相似的知识对象',
      'kn.mergeHint': '合并后保留主对象的 ID 与历史，另一边的关联记忆和关系会迁过来；被合并的对象标记为已合并，不会真的被删掉。',
      'kn.mergeTarget': '保留哪个对象',
      'kn.mergeNone': '没有同类型的可合并对象',
      'kn.mergePreview': '合并后的主对象：',
      'kn.mergeKeep': '合并前请确认上面两列内容；合并后可以在历史里查到操作记录。',
      'kn.mergeConfirm': '确认合并',
      'kn.title2': '名称',
      'kn.status': '状态',
      'kn.typeChangeTitle': '修改类型会影响已有关系',
      'kn.typeChangeText': '改成新类型后，下面这些关系可能不再符合语义。确认的话会保留关系，但需要你之后检查一遍。',
      'kn.typeChangeConfirm': '仍然修改',
      'kn.stepUp': '上移',
      'kn.stepDown': '下移',
      'kn.correct': '纠正 AI 的理解',
      'kn.correctHint': 'AI 对你的判断可能不准：你可以缩小范围、标记不再适用，或说明这只是一次性要求。',
      'kn.narrow': '缩小适用范围',
      'kn.widen': '扩大适用范围',
      'kn.obsolete': '标记不再适用',
      'kn.oneOff': '这只是一次性要求',
      'kn.correctNote': '补充说明（会记进这条知识对象）',
      'kn.correctNotePlaceholder': '例如：只在某一个项目里这样要求，其他项目不必遵守。',
      'kn.correctDone': '已按你的纠正更新',
      'kn.deleteTitle': '处理这个知识对象',
      'kn.deleteText': '归档后它不再出现在默认视图里，但关系、关联记忆和历史都保留；彻底删除会同时移除它的关系和关联（历史记录仍写进日志）。',
      'kn.deleteArchiveHint': '想保留就先归档：随时可以恢复。',
      'kn.archiveAction': '归档',
      'kn.deleteHard': '彻底删除',
      'kn.deleted': '知识对象已删除',
      'kn.start': '起点',
      'kn.end': '终点',
      'kn.target': '目标',
      'kn.searchPlaceholder': '搜索对象或记忆',
      'relGroup.hierarchy': '层级',
      'relGroup.business': '业务',
      'relGroup.workflow': '流程',
      'relGroup.principle': '偏好与原则',
      'relGroup.knowledge': '知识',
      'graph.expandAll': '展开全部',
      'graph.expandLimit': '节点比较多，已展开全部；建议用「记忆区」或筛选收窄范围。',
      'tidy.confirmAllNodes': '全部确认',
      'tidy.confirmAllDone': '已确认候选对象',
      'kn.hide': '从视图隐藏',
      'kn.show': '取消隐藏',
      'kn.shown': '已恢复显示',
      'kn.hiddenDone': '已从视图隐藏，可在关系图右上角恢复',
      'graph.hiddenCount': '已隐藏',
      'graph.restoreHidden': '恢复全部隐藏节点',
      'graph.showHidden': '显示隐藏节点',
      'kn.relationType': '关系类型',
      'kn.preview': '预览',
      'kn.swap': '反向',
      'kn.note': '说明',
      'kn.notePlaceholder': '为什么要建立这条关系',
      'action.search': '搜索',
      'search.openHint': 'Ctrl/Cmd + K 搜索',
      'detail.protection': '保护级别',
      'detail.protectionLocked': '固有约定不会被自动改动，修改需你明确要求',
      'detail.confidence': '置信度',
      'detail.importance': '重要程度',
      'detail.usage': '被调用',
      'detail.recallTimes': '次',
      'detail.lastUsed': '最近调用',
      'detail.neverUsed': '尚未调用',
      'detail.evidenceCount': '证据',
      'detail.proposal': '修改建议',
      'detail.protected': '受保护',
      'detail.accept': '接受修改',
      'detail.reject': '保留原样',
      'detail.evidence': '来源与证据',
      'detail.evidenceHint': '每条记忆都保留原始出处',
      'detail.noEvidence': '还没有证据记录',
      'detail.evidencePlaceholder': '补充一条来源或证据…',
      'detail.addEvidence': '记下',
      'detail.versions': '版本历史',
      'detail.restore': '回滚到这一版',
      'common.collapse': '收起',
      'common.expand': '展开',
      'tidy.title': '整理中心',
      'tidy.sub': 'AI 自动整理的结果与待确认事项',
      'tidy.duplicates': '疑似重复',
      'tidy.duplicatesHint': '内容高度相似的记忆，可合并为一条',
      'tidy.orphans': '孤立记忆',
      'tidy.orphansHint': '没有任何关联，考虑补关系或归档',
      'tidy.proposals': '待确认的修改建议',
      'tidy.proposalsHint': '受保护记忆或冲突场景，需要你决定',
      'tidy.pending': '待整理的新记忆',
      'tidy.pendingHint': '自动观察得到的候选，确认后才会生效',
      'tidy.review': '待复核',
      'tidy.reviewHint': '被新信息影响，需要复核是否仍有效',
      'tidy.relations': '待确认的关系',
      'tidy.relationsHint': 'AI 依据语义发现，确认后进入关系网',
      'tidy.empty': '目前没有需要整理的内容',
      'tidy.nodeCandidates': '候选知识对象',
      'tidy.nodeCandidatesHint': '自动观察识别到的新对象，确认后成为正式知识对象。',
      'tidy.duplicateNodes': '疑似重复的知识对象',
      'tidy.duplicateNodesHint': '同类且名称/描述高度重合，建议合并主对象。',
      'tidy.confirmNode': '确认',
      'tidy.merge': '合并',
      'tidy.protectedCount': '固有约定',
      'tidy.openEntry': '查看',
      'recall.title': '调用记录',
      'recall.sub': 'AI 在新对话里真实取用过哪些记忆',
      'recall.empty': '还没有调用记录，下次对话里需要时会自动留下痕迹',
      'recall.outcome.served': '已提供',
      'recall.outcome.ignored': '未采用',
      'recall.outcome.conflict': '有冲突',
      'recall.path': '召回路径',
      'recall.items': '取用记忆',
      'recall.nodes': '命中的知识对象',
      'nav.tidy': '整理中心',
      'nav.recall': '调用记录',
      'toast.merged': '已合并记忆',
      'toast.restoredVersion': '已回滚到该版本',
      'toast.protected': '已设为固有约定',
      'toast.proposalAccepted': '已应用修改建议',
      'toast.proposalRejected': '已保留原样',
      'toast.evidenceAdded': '已记下证据',
      'toast.tidyRefreshed': '整理结果已更新',
      'toast.observed': '已整理这段内容',
      'action.observe': '整理这段内容',
      'action.refresh': '重新分析',
      'action.merge': '合并',
      'observe.title': '粘贴一段对话或笔记',
      'observe.hint': 'AI 会判断是新增记忆、补充已有记忆，还是与固有约定冲突',
      'observe.placeholder': '把原始内容贴进来…',
      'observe.conversationId': '来源对话（可选）',
      'observe.run': '交给 AI 整理',
      'observe.result': '整理结果',
      'observe.created': '新建记忆',
      'observe.updated': '更新已有记忆',
      'observe.proposed': '生成修改建议',
      'observe.reinforced': '只补充了证据',
      'observe.skipped': '已跳过',
      'observe.relations': '新发现的关系',
      'graph.confidence': '置信度',
      'graph.weak': '弱连接（待确认）',
      'graph.suggested': 'AI 建议',
      'graph.confirmedRel': '已确认',
      'graph.rejected': '已否决',
      'graph.tidyHint': '在整理中心批量处理 AI 建议',
      'graph.focus': '高亮上下游',
      'graph.impact': '上下游',
      'action.reject': '否决',
      'common.loading': '加载中',
    }

    const EN = {
      'panel.label': 'Zhiwei',
      'app.name': 'Zhiwei',
      'app.badge': 'AI knowledge workbench',

      'nav.overview': 'Workbench',
      'nav.all': 'All memories',
      'nav.inbox': 'Inbox',
      'nav.collections': 'Collections',
      'nav.favorites': 'Favorites',
      'nav.recent': 'Recent',
      'nav.graph': 'Graph',
      'nav.projects': 'Projects',
      'nav.savedViews': 'Saved views',
      'nav.deleteView': 'Delete this view',
      'nav.savedViewsEmpty': 'Save a view from the graph',
      'nav.collapse': 'Collapse navigation',
      'nav.expand': 'Expand navigation',

      'action.new': 'New memory',
      'action.save': 'Save',
      'action.cancel': 'Cancel',
      'action.delete': 'Delete',
      'action.rename': 'Rename',
      'project.namePlaceholder': 'Project space name',
      'graph.saveLayout': 'Save layout',
      'graph.layoutSaved': 'Layout saved',
      'toast.projectSaved': 'Project saved',
      'toast.projectDeleted': 'Project deleted',
      'toast.projectMoved': 'Project order updated',
      'project.newTitle': 'New project',
      'project.editTitle': 'Edit project',
      'project.name': 'Project name',
      'project.namePlaceholder': 'e.g. N2 · Starhunter',
      'project.description': 'Description',
      'project.descriptionPlaceholder': 'Background, constraints or goals (optional)',
      'project.needName': 'Project name is required',
      'project.deleteTitle': 'Delete project',
      'project.deleteText': 'Memories and collections in this project move to the first project; nothing is lost.',
      'project.deleteConfirm': 'Delete',

      'settings.modelTitle': 'Model for organizing',
      'settings.modelHint': 'Once picked, AI organize, summaries and grouping go through this model first; if it fails, Zhiwei falls back to local heuristics.',
      'settings.modelUnavailable': 'No model service is available here, so only local organizing works.',
      'settings.modelName': 'Model',
      'settings.modelEnable': 'Use the model to organize',
      'settings.modelSaved': 'Model settings saved',
      'settings.modelNone': 'None (local only)',
      'settings.needPath': 'Enter a storage path first',
      'settings.modelOn': 'This model is used for organizing',
      'settings.importFailed': 'Import failed: ',
      'settings.sectionLabel': 'Zhiwei',
      'settings.storage': 'Storage',
      'settings.switchTitle': 'Switch memory storage',
      'settings.switchHint': 'Point at a folder or a .json file; Zhiwei will write there and read from there. The previous location keeps a backup, so you can switch back anytime.',
      'settings.switchApply': 'Switch here',
      'settings.exportTitle': 'Export',
      'settings.exportHint': 'Export a JSON file with memories, relations, collections, frames and layout — for backup or moving to another machine.',
      'settings.export': 'Export JSON',
      'settings.importTitle': 'Import',
      'settings.importHint': 'Pick a JSON exported earlier: merge only adds missing memories, replace overwrites the current store.',
      'settings.importMerge': 'Merge (add only)',
      'settings.importReplace': 'Replace (overwrite)',
      'settings.switched': 'Storage switched',
      'settings.imported': 'Imported',
      'settings.exported': 'Exported',
      'graph.saveLayout': 'Save layout',
      'graph.layoutSaved': 'Layout saved',
      'graph.frameName': 'Frame',
      'graph.frameSaved': 'Grouped this area into a frame',
      'graph.frameNodeHint': 'A frame is a node too: drag it, or drag a line from it to another memory or frame',
      'graph.frameRenameTitle': 'Rename frame',
      'graph.frameRenamed': 'Frame renamed',
      'graph.frameCreateTitle': 'Name this memory area',
      'graph.frameDrawn': 'Box drawn — name it and it becomes a memory area',
      'graph.frames': 'Memory areas',
      'graph.framePick': 'Select the memories in this area',
      'graph.frameDelete': 'Delete this area (the memories stay)',
      'graph.frameDeleted': 'Area deleted, its memories are still here',
      'graph.searchArea': 'Search inside this memory area',
      'graph.noFrames': 'No memory areas yet: pick "Frame" and draw a box on the canvas',
      'action.edit': 'Edit',
      'action.close': 'Close',
      'action.confirm': 'Confirm',
      'action.reset': 'Reset',
      'action.retry': 'Retry',
      'action.accept': 'Accept',
      'action.ignore': 'Ignore',
      'action.open': 'Open',
      'action.selectAll': 'Select all',

      'common.all': 'All',
      'common.empty': 'Nothing here yet',
      'common.items': 'items',

      'type.decision': 'Decision',
      'type.rule': 'Rule',
      'type.assumption': 'Assumption',
      'type.question': 'Question',
      'type.proposal': 'Proposal',
      'type.reference': 'Reference',
      'type.metric': 'Metric',
      'type.retro': 'Retro',
      'type.process': 'Process',

      'domain.combat': 'Combat',
      'domain.growth': 'Growth',
      'domain.economy': 'Economy',
      'domain.level': 'Level',
      'domain.event': 'Event',
      'domain.uiux': 'UI/UX',
      'domain.monetization': 'Monetization',
      'domain.social': 'Social',
      'domain.operation': 'Operations',
      'domain.tech': 'Tech',

      'status.draft': 'Draft',
      'status.pending': 'Pending',
      'status.active': 'Active',
      'status.deprecated': 'Deprecated',
      'status.archived': 'Archived',

      'relation.belongs_to': 'Belongs to',
      'relation.depends_on': 'Depends on',
      'relation.affects': 'Affects',
      'relation.derived_from': 'Derived from',
      'relation.references': 'References',
      'relation.conflicts_with': 'Conflicts with',
      'relation.supersedes': 'Supersedes',
      'relation.refines': 'Refines',

      'relStatus.suggested': 'Suggested',
      'relStatus.confirmed': 'Confirmed',
      'relStatus.rejected': 'Rejected',

      'source.manual': 'Manual',
      'source.conversation': 'Conversation',
      'source.import': 'Import',
      'source.ai': 'AI',

      'sort.updated': 'Recently updated',
      'layout.list': 'List',
      'layout.cards': 'Cards',

      'overview.stat.total': 'Memories',
      'overview.stat.inbox': 'Inbox',
      'overview.stat.collections': 'Collections',
      'overview.stat.relations': 'Relations',
      'overview.stat.recalls': 'Recalls',
      'overview.recent': 'Recently updated',
      'overview.inbox': 'Inbox',
      'overview.decisions': 'Confirmed decisions',
      'overview.favorites': 'Favorites',
      'overview.suggestedRelations': 'AI suggested relations',
      'overview.empty': 'No memories yet — start from “New memory”',

      'list.empty': 'No memories match',
      'list.emptyHint': 'Loosen the filters or create one',
      'list.filters': 'Filters',
      'list.searchPlaceholder': 'Search title, content, tags (press /)',

      'filter.type': 'Type',
      'filter.domain': 'Domain',
      'filter.status': 'Status',
      'filter.tag': 'Tag',
      'filter.clearAll': 'Clear filters',

      'detail.created': 'Created',
      'detail.content': 'Content',
      'detail.tags': 'Tags',
      'detail.facts': 'Key numbers',
      'detail.collections': 'Collections',
      'detail.relations': 'Relations',
      'detail.noRelations': 'No relations yet. Link one or wait for AI suggestions.',
      'detail.history': 'History',
      'detail.favorite': 'Favorite',
      'detail.unfavorite': 'Unfavorite',
      'detail.expand': 'Expand',
      'detail.collapse': 'Collapse',

      'editor.title': 'Title',
      'editor.titlePlaceholder': 'One line that captures it',
      'editor.content': 'Content',
      'editor.contentPlaceholder': 'Details, evidence, boundaries… supports - lists and ### headings',
      'editor.type': 'Type',
      'editor.status': 'Status',
      'editor.domains': 'Domains',
      'editor.tags': 'Tags',
      'editor.tagsPlaceholder': 'Enter or comma separated',
      'editor.project': 'Project',
      'editor.source': 'Source',
      'editor.facts': 'Key numbers',
      'editor.factLabel': 'Name',
      'editor.factValue': 'Value',
      'editor.addFact': 'Add row',

      'quick.title': 'Capture',
      'quick.subtitle': 'Drop the raw thought, Zhiwei shapes it into a memory',
      'quick.placeholder': 'e.g. Battle pass XP curve becomes linear for the first 30 levels, exponential after…',
      'quick.analyze': 'Shape with AI',
      'quick.proposal': 'What the AI understood',
      'quick.related': 'Maybe related',
      'quick.collections': 'Maybe belongs to',

      'relation.title': 'Create relation',
      'relation.editTitle': 'Edit relation',
      'relation.from': 'From',
      'relation.to': 'To',
      'relation.type': 'Type',
      'relation.desc': 'Note',
      'relation.descPlaceholder': 'Why does this relation exist?',
      'relation.status': 'Status',
      'relation.swap': 'Swap direction',
      'relation.save': 'Save relation',
      'relation.created': 'Relation created',
      'relation.confirm': 'Confirm',
      'relation.reject': 'Reject',
      'relation.delete': 'Delete relation',
      'relation.self': 'Cannot link a memory to itself',
      'relation.duplicate': 'This relation already exists',
      'relation.pick': 'Pick a memory',
      'relation.pickSearch': 'Search memories',
      'relation.noTarget': 'No other memories to link',
      'relation.suggestedHint': 'AI suggestions become relations only after you confirm',
      'relation.confirmedHint': 'Confirmed relations',
      'relation.more': 'Show all',
      'relation.less': 'Show less',

      'collections.subtitle': 'Group memories about the same thing — a memory can live in many collections',
      'collections.new': 'New collection',
      'collections.name': 'Name',
      'collections.descPlaceholder': 'What belongs here?',
      'collections.color': 'Color',
      'collections.members': 'Members',
      'collections.memberCount': 'memories',
      'collections.newName': 'New collection name',
      'collections.createAndPick': 'Create & add',
      'collections.created': 'Collection created',
      'collections.empty': 'No collections yet',
      'collections.emptyHint': 'Create one, or let the AI cluster your memories',
      'collections.suggestAi': 'Find themes with AI',
      'collections.aiFound': 'Themes found',
      'collections.aiSource': 'AI suggested',
      'collections.accept': 'Accept as collection',
      'collections.addMembers': 'Add memories',
      'collections.removeMember': 'Remove from collection',
      'collections.noMembers': 'No memories in this collection',
      'collections.mergeInto': 'Merge into…',
      'collections.reasons': 'Why grouped',

      'graph.subtitle': 'Drag to explore, click to open, Shift-drag to link, Alt-drag to box select',
      'graph.zoomIn': 'Zoom in',
      'graph.zoomOut': 'Zoom out',
      'graph.fit': 'Fit',
      'graph.relayout': 'Re-layout',
      'graph.collapse': 'Collapse collection',
      'graph.searchPlaceholder': 'Locate a memory in the graph…',
      'graph.saveView': 'Save current view',
      'graph.viewName': 'View name',
      'graph.clusterHint': 'Nodes in the same collection are wrapped in a hull',

      'batch.clear': 'Clear selection',
        'batch.archive': 'Archive',
        'batch.tag': 'Add tag',
        'batch.delete': 'Delete',
        'batch.tagTitle': 'Add a tag to the selection',
        'batch.tagHint': 'Every selected memory gets this tag; existing tags stay.',
        'batch.tagPlaceholder': 'Tag name',
        'batch.tagApply': 'Add',
        'batch.deleteTitle': 'Delete the selected memories',
        'batch.deleteText': 'The memories and their relations are removed; the content stays in the undo entry for a while, so use undo in the toast if this was a mistake.',
        'toast.tagged': 'Tag added',
        'toast.archived': 'Archived',

      'toast.saved': 'Saved',
      'toast.deleted': 'Deleted',
      'toast.collectionSaved': 'Saved to collection',
      'toast.relationCreated': 'Relation created',
      'toast.relationDeleted': 'Relation deleted',
      'toast.viewSaved': 'View saved',

      'error.load': 'Failed to load',
      'error.offline': 'Cannot reach the Zhiwei backend — try restarting DSH',
      'error.write': 'Could not save',

      'view.overview': 'Workbench',
      'view.all': 'All memories',
      'view.inbox': 'Inbox',
      'view.collections': 'Collections',
      'view.favorites': 'Favorites',
      'view.recent': 'Recent',
      'view.graph': 'Relation graph',
      'app.title': 'Zhiwei · AI knowledge workbench',
      'app.loading': 'Loading…',
      'common.close': 'Close',
      'common.cancel': 'Cancel',
      'common.name': 'Name',

      'action.star': 'Star',
      'action.unstar': 'Unstar',
      'action.deleteConfirm': 'Delete?',

      'detail.status': 'Status',
      'detail.meta': 'Details',
      'detail.legacy': 'Imported from the old category system; content kept as is.',
      'detail.noCollections': 'Not in any collection yet',
      'detail.emptyTitle': 'Nothing selected',
      'detail.emptyText': 'Pick a memory from the list, or press “New memory” to capture your first design note.',

      'editor.newTitle': 'New memory',
      'editor.editTitle': 'Edit memory',
      'editor.needContent': 'Content cannot be empty',
      'editor.contentHint': 'Context, decision and the actual numbers — Markdown works.',
      'editor.factsHint': 'One “name=value” per line, e.g. Random skin amplifier=20',
      'editor.collections': 'Collections',
      'editor.collectionsHint': 'A memory can belong to several collections.',
      'editor.noCollections': 'No collections yet',
      'editor.sourceLabel': 'Source note',
      'editor.sourceLabelPlaceholder': 'e.g. N2 weekly sync / competitor teardown / numbers sheet',
      'editor.favorite': 'Star this memory',
      'editor.pin': 'Pin to top',

      'quick.needText': 'Write something first',
      'quick.sourceLabel': 'Source note',
      'quick.saveRaw': 'Save as is',
      'quick.confirm': 'Save & organize',
      'quick.subtitleHint': 'Dump it in — AI will title it, type it, tag domains and suggest relations.',

      'relation.create': 'Create relation',
      'relation.suggested': 'Suggested',
      'relation.needTarget': 'Pick a memory to relate to',
      'relation.searchPlaceholder': 'Search title or content',
      'relation.description': 'Note',
      'relation.descriptionPlaceholder': 'Why do they relate? e.g. same combat economy, constrained by this rule',
      'relation.preview': 'Direction',
      'relation.previewSelf': 'Source and target cannot be the same memory',

      'collections.needName': 'Name the collection first',
      'collections.description': 'Description',
      'collections.project': 'Project',
      'collections.selected': 'selected',
      'collections.deleted': 'Collection deleted',
      'collections.manage': 'Manage collections',
      'collections.editTitle': 'Edit collection',
      'collections.manageHint': 'Rename, change members, merge or delete collections here',
      'collections.open': 'Open collection',
      'collections.mergeAction': 'Merge',
      'collections.mergeConfirm': 'Confirm merge',
      'collections.membersChanged': 'Collection members updated',
      'toast.viewDeleted': 'View deleted',

      'graph.toolSelect': 'Select',
      'graph.toolLink': 'Link',
      'graph.toolBox': 'Box select',
      'graph.toolArea': 'Memory area',
      'graph.linkNeedTarget': 'Drop the line on another memory to link it',
      'graph.linkSelf': 'Cannot link to itself',
      'graph.linkDone': 'Relation created',
      'graph.filters': 'Filters',
      'graph.byType': 'By type',
      'graph.byRelation': 'By relation',
      'graph.byProject': 'By project',
      'graph.byDomain': 'By domain',
      'graph.byCollection': 'By collection',
      'graph.suggestedOnly': 'AI suggestions only',
      'graph.collapsed': 'collapsed',
      'graph.noCollections': 'No collections yet',
      'graph.viewNamePlaceholder': 'e.g. Combat economy map',

      'batch.selected': 'selected',
      'batch.addToCollection': 'Add to collection',
      'batch.setStatus': 'Set active',
      'batch.pickCollection': 'Pick a collection',
      'nav.newProject': 'New project space',
      'toast.created': 'Created',
      'toast.status': 'Status updated',
      'toast.membersAdded': 'Added to collection',
      'toast.merged': 'Collections merged',
      'toast.suggested': 'Suggestions ready',
      'toast.restored': 'Restored',
      'toast.segmentAdded': 'Split into a new memory',

      'assist.title': 'AI assist',
      'assist.organize': 'Organize',
      'assist.similar': 'Find similar',
      'assist.relations': 'Suggest relations',
      'assist.summary': 'Summarize',
      'assist.conflicts': 'Check conflicts',
      'assist.impact': 'Impact',
      'assist.running': 'Analyzing…',
      'assist.done': 'Analysis complete',
      'assist.empty': 'Nothing needs attention',
      'assist.apply': 'Apply suggestion',
      'assist.applied': 'Suggestion applied',
      'assist.reason': 'Why',
      'assist.titleSug': 'Suggested title',
      'assist.typeSug': 'Suggested type',
      'assist.domainSug': 'Suggested domains',
      'assist.tagSug': 'Keywords',
      'assist.summarySug': 'Suggested summary',
      'assist.segments': 'Atomic memories found',
      'assist.splitOne': 'Split this out',
      'assist.segmentCount': 'items',
      'assist.similarCount': 'similar',
      'assist.keepBoth': 'Keep both for now',
      'assist.supersede': 'New one replaces the old',
      'assist.bothApply': 'They cover different cases',
      'assist.noConflict': 'No conflict',
      'assist.confirmed': 'Decision recorded',
      'assist.themes': 'Themes',
      'assist.members': 'Memories involved',
      'assist.needSelection': 'Select a memory or a collection first',
      'assist.upstream': 'Upstream (affects this)',
      'assist.downstream': 'Downstream (affected by this)',
      'assist.notApplied': 'For reference only, nothing is written',
      'action.undo': 'Undo',
      'common.none': 'none',

      'type.habit': 'Habit',
      'type.convention': 'Convention',
      'type.context': 'Context',
      'type.task': 'Task',
      'protection.normal': 'Normal',
      'protection.confirmed': 'Confirmed',
      'protection.protected': 'Protected',
      'change.create': 'Created',
      'change.refine': 'Refined',
      'change.augment': 'Augmented',
      'change.correct': 'Corrected',
      'change.conflict': 'Conflict',
      'change.merge': 'Merged',
      'change.protect': 'Protection',
      'change.status': 'Status',
      'change.restore': 'Restored',
      'evidence.statement': 'Statement',
      'evidence.confirmation': 'Confirmation',
      'evidence.behavior': 'Behavior',
      'evidence.inference': 'Inference',
      'evidence.temporary': 'Temporary',
      'scope.global': 'Global',
      'nav.knowledge': 'Knowledge network',
      'kn.saved': 'Object updated',
      'kn.created': 'Object created',
      'kn.archived': 'Archived — you can restore it anytime',
      'kn.restored': 'Restored',
      'kn.linked': 'Memory linked',
      'kn.unlinked': 'Unlinked — the memory itself remains',
      'kn.merged': 'Merged into the main object',
      'kn.new': 'New object',
      'kn.edit': 'Edit object',
      'kn.objects': 'Objects',
      'search.collections': 'Collections',
      'search.projects': 'Projects',
      'kn.tab.project': 'Project',
      'kn.tab.work': 'Work',
      'kn.tab.preference': 'Preference',
      'kn.tab.global': 'Global',
      'common.saving': 'Saving',
      'kn.title': 'Name',
      'kn.titlePlaceholder': 'e.g. Goblin',
      'kn.type': 'Type',
      'kn.parent': 'Parent',
      'kn.noParent': 'No parent',
      'kn.scope': 'Scope',
      'kn.description': 'Description',
      'kn.descriptionHint': 'What it is and what it governs',
      'kn.descriptionPlaceholder': 'Describe the object and its constraints',
      'kn.aliases': 'Aliases',
      'kn.aliasesHint': 'Comma separated, used for matching',
      'kn.aliasesPlaceholder': 'e.g. Goblin, Gob',
      'kn.attributes': 'Attributes',
      'kn.attrKey': 'Key',
      'kn.attrValue': 'Value',
      'kn.addAttr': 'Add attribute',
      'kn.steps': 'Steps',
      'kn.addStep': 'Add step',
      'kn.stepTitle': 'Step title',
      'kn.stepNote': 'Note',
      'kn.noSteps': 'No steps yet',
      'kn.structure': 'Structure',
      'kn.archive': 'Archive / restore',
      'kn.noAttributes': 'No attributes yet',
      'kn.memories': 'Linked memories',
      'kn.linkMemory': 'Link memory',
      'kn.unlinkHint': 'Unlink only — the memory stays',
      'kn.noMemories': 'No linked memories',
      'kn.relations': 'Relations',
      'kn.createRelation': 'Create relation',
      'kn.noRelations': 'No relations yet',
      'kn.needTitle': 'Name is required',
      'kn.duplicate': 'Similar objects already exist:',
      'kn.useExisting': 'Use this',
      'kn.createAnyway': 'Press save again to create a new object anyway.',
      'kn.merge': 'Merge into another object',
      'kn.versionRestored': 'Rolled back — the previous content stays in history',
      'kn.restore': 'Restore this version',
      'kn.versionCurrent': 'current',
      'change.create': 'created',
      'change.edit': 'edited',
      'change.renamed': 'renamed',
      'change.retyped': 'retyped',
      'change.status': 'status',
      'change.archived': 'archived',
      'change.restore': 'restored',
      'change.merge': 'merged',
      'change.merged': 'merged in',
      'kn.versionsHint': 'Every rename, description, type or status change keeps a version you can roll back to',
      'kn.versions': 'History',
      'kn.mergeTitle': 'Merge similar knowledge objects',
      'kn.mergeHint': 'The main object keeps its id and history; memories and relations move over. The merged object is marked as merged instead of being deleted.',
      'kn.mergeTarget': 'Which object to keep',
      'kn.mergeNone': 'No object of the same type to merge',
      'kn.mergePreview': 'Merged object:',
      'kn.mergeKeep': 'Check both columns before confirming. The action is recorded in history.',
      'kn.mergeConfirm': 'Merge',
      'kn.title2': 'Name',
      'kn.status': 'Status',
      'kn.typeChangeTitle': 'Changing the type affects existing relations',
      'kn.typeChangeText': 'These relations may no longer make sense with the new type. If you continue, they are kept and you should review them later.',
      'kn.typeChangeConfirm': 'Change anyway',
      'kn.stepUp': 'Move up',
      'kn.stepDown': 'Move down',
      'kn.correct': 'Correct what the AI thinks',
      'kn.correctHint': 'The AI may be wrong about you: narrow the scope, mark it as no longer applicable, or say it was a one-off request.',
      'kn.narrow': 'Narrow the scope',
      'kn.widen': 'Widen the scope',
      'kn.obsolete': 'No longer applicable',
      'kn.oneOff': 'This was a one-off',
      'kn.correctNote': 'Notes (stored on this object)',
      'kn.correctNotePlaceholder': 'For example: only required in one project, not in others.',
      'kn.correctDone': 'Preference updated from your correction',
      'kn.deleteTitle': 'Remove this knowledge object',
      'kn.deleteText': 'Archiving hides it from the default view but keeps its relations, memories and history. Deleting removes relations and links too (the action is still recorded).',
      'kn.deleteArchiveHint': 'Prefer archiving: it can be restored later.',
      'kn.archiveAction': 'Archive',
      'kn.deleteHard': 'Delete permanently',
      'kn.deleted': 'Knowledge object deleted',
      'kn.start': 'From',
      'kn.end': 'To',
      'kn.target': 'Target',
      'kn.searchPlaceholder': 'Search objects or memories',
      'relGroup.hierarchy': 'Hierarchy',
      'relGroup.business': 'Business',
      'relGroup.workflow': 'Workflow',
      'relGroup.principle': 'Preference & principle',
      'relGroup.knowledge': 'Knowledge',
      'graph.expandAll': 'Expand all',
      'graph.expandLimit': 'A lot of nodes — everything is expanded now; use a memory area or filters to narrow it down.',
      'tidy.confirmAllNodes': 'Confirm all',
      'tidy.confirmAllDone': 'Confirmed candidate objects',
      'kn.hide': 'Hide from view',
      'kn.show': 'Unhide',
      'kn.shown': 'Shown again',
      'kn.hiddenDone': 'Hidden from the view — restore it from the graph panel',
      'graph.hiddenCount': 'hidden',
      'graph.restoreHidden': 'Restore all hidden nodes',
      'graph.showHidden': 'Show hidden nodes',
      'kn.relationType': 'Relation type',
      'kn.preview': 'Preview',
      'kn.swap': 'Reverse',
      'kn.note': 'Note',
      'kn.notePlaceholder': 'Why this relation exists',
      'action.search': 'Search',
      'search.openHint': 'Ctrl/Cmd + K to search',
      'detail.protection': 'Protection',
      'detail.protectionLocked': 'Protected memories never change on their own — only an explicit request from you can edit them',
      'detail.confidence': 'Confidence',
      'detail.importance': 'Importance',
      'detail.usage': 'Recalled',
      'detail.recallTimes': 'times',
      'detail.lastUsed': 'Last recalled',
      'detail.neverUsed': 'Never recalled',
      'detail.evidenceCount': 'Evidence',
      'detail.proposal': 'Proposed change',
      'detail.protected': 'Protected',
      'detail.accept': 'Accept change',
      'detail.reject': 'Keep as is',
      'detail.evidence': 'Sources & evidence',
      'detail.evidenceHint': 'Every memory keeps its original sources',
      'detail.noEvidence': 'No evidence recorded yet',
      'detail.evidencePlaceholder': 'Add a source or piece of evidence…',
      'detail.addEvidence': 'Record',
      'detail.versions': 'Version history',
      'detail.restore': 'Restore this version',
      'common.collapse': 'Collapse',
      'common.expand': 'Expand',
      'tidy.title': 'Tidy up',
      'tidy.sub': 'What the AI organized, and what still needs your call',
      'tidy.duplicates': 'Possible duplicates',
      'tidy.duplicatesHint': 'Highly similar memories that can be merged',
      'tidy.orphans': 'Orphans',
      'tidy.orphansHint': 'No relations at all — link or archive them',
      'tidy.proposals': 'Pending change proposals',
      'tidy.proposalsHint': 'Protected or conflicting content needs your decision',
      'tidy.pending': 'New memories to review',
      'tidy.pendingHint': 'Candidates from auto-observation; only effective after you confirm',
      'tidy.review': 'Needs review',
      'tidy.reviewHint': 'Affected by newer information — check whether it still holds',
      'tidy.relations': 'Relations to confirm',
      'tidy.relationsHint': 'Found semantically by the AI; confirm to enter the graph',
      'tidy.empty': 'Nothing needs tidying right now',
      'tidy.nodeCandidates': 'Candidate objects',
      'tidy.nodeCandidatesHint': 'Objects found by automatic observation. Confirm to turn them into knowledge objects.',
      'tidy.duplicateNodes': 'Possible duplicate objects',
      'tidy.duplicateNodesHint': 'Same type with overlapping names or descriptions — consider merging into the main object.',
      'tidy.confirmNode': 'Confirm',
      'tidy.merge': 'Merge',
      'tidy.protectedCount': 'Protected',
      'tidy.openEntry': 'Open',
      'recall.title': 'Recall log',
      'recall.sub': 'What the AI actually retrieved in past conversations',
      'recall.empty': 'No recalls yet — traces appear when memories are needed in a conversation',
      'recall.outcome.served': 'Served',
      'recall.outcome.ignored': 'Not used',
      'recall.outcome.conflict': 'Conflict',
      'recall.path': 'Recall path',
      'recall.items': 'Memories used',
      'recall.nodes': 'knowledge objects hit',
      'nav.tidy': 'Tidy up',
      'nav.recall': 'Recall log',
      'toast.merged': 'Memories merged',
      'toast.restoredVersion': 'Version restored',
      'toast.protected': 'Marked as protected',
      'toast.proposalAccepted': 'Proposal applied',
      'toast.proposalRejected': 'Kept as is',
      'toast.evidenceAdded': 'Evidence recorded',
      'toast.tidyRefreshed': 'Tidy report refreshed',
      'toast.observed': 'Content organized',
      'action.observe': 'Organize this',
      'action.refresh': 'Re-analyze',
      'action.merge': 'Merge',
      'observe.title': 'Paste a conversation or note',
      'observe.hint': 'The AI decides whether this is new, an addition to an existing memory, or a conflict with a protected one',
      'observe.placeholder': 'Paste the raw content…',
      'observe.conversationId': 'Source conversation (optional)',
      'observe.run': 'Hand to the AI',
      'observe.result': 'Result',
      'observe.created': 'New memories',
      'observe.updated': 'Updated memories',
      'observe.proposed': 'Proposals created',
      'observe.reinforced': 'Evidence only',
      'observe.skipped': 'Skipped',
      'observe.relations': 'New relations',
      'graph.confidence': 'Confidence',
      'graph.weak': 'Weak link (unconfirmed)',
      'graph.suggested': 'AI suggested',
      'graph.confirmedRel': 'Confirmed',
      'graph.rejected': 'Rejected',
      'graph.tidyHint': 'Batch-handle AI suggestions in Tidy up',
      'graph.focus': 'Highlight neighborhood',
      'graph.impact': 'Upstream & downstream',
      'action.reject': 'Reject',
      'common.loading': 'Loading',
    }

    const CSS = `
    /* ================= 知微 · 设计令牌 ================= */
    .zw-root {
      --zw-font: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'PingFang SC', 'Hiragino Sans GB', 'Microsoft YaHei', sans-serif;
      --zw-mono: 'SF Mono', ui-monospace, 'JetBrains Mono', Menlo, Consolas, monospace;
      --zw-bg: var(--dsw-alias-bg-base, #ffffff);
      --zw-bg-soft: color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 94%, #000 6%);
      --zw-bg-sunken: color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 90%, #000 10%);
      --zw-surface: var(--dsw-alias-bg-base, #ffffff);
      --zw-surface-raised: var(--dsw-alias-bg-base, #ffffff);
      --zw-border: rgba(15, 23, 42, 0.09);
      --zw-border-strong: rgba(15, 23, 42, 0.16);
      --zw-text: var(--dsw-alias-text, #0f172a);
      --zw-text-2: rgba(15, 23, 42, 0.62);
      --zw-text-3: rgba(15, 23, 42, 0.42);
      --zw-accent: #5b5bd6;
      --zw-accent-2: #7c6cf0;
      --zw-accent-soft: rgba(91, 91, 214, 0.1);
      --zw-accent-text: #4a45c9;
      --zw-danger: #dc2626;
      --zw-danger-soft: rgba(220, 38, 38, 0.1);
      --zw-warn: #b45309;
      --zw-ok: #0f766e;
      --zw-shadow-sm: 0 1px 2px rgba(15, 23, 42, 0.06);
      --zw-shadow-md: 0 8px 24px rgba(15, 23, 42, 0.1), 0 1px 3px rgba(15, 23, 42, 0.06);
      --zw-shadow-lg: 0 24px 64px rgba(15, 23, 42, 0.18), 0 2px 8px rgba(15, 23, 42, 0.08);
      --zw-graph-bg: color-mix(in srgb, var(--dsw-alias-bg-base, #ffffff) 96%, #0f172a 4%);
      --zw-graph-dot: rgba(15, 23, 42, 0.1);
      --zw-graph-edge: rgba(15, 23, 42, 0.32);
      --zw-graph-node-ring: var(--dsw-alias-bg-base, #ffffff);
      --zw-region-violet: #8b5cf6;
      --zw-region-blue: #3b82f6;
      --zw-region-teal: #14b8a6;
      --zw-region-amber: #f59e0b;
      --zw-region-rose: #f43f5e;
      --zw-region-lime: #84cc16;
      --zw-type-decision: #6366f1;
      --zw-type-rule: #3b82f6;
      --zw-type-assumption: #f59e0b;
      --zw-type-question: #ec4899;
      --zw-type-proposal: #8b5cf6;
      --zw-type-reference: #14b8a6;
      --zw-type-metric: #22c55e;
      --zw-type-retro: #64748b;
      --zw-type-process: #06b6d4;
      display: flex;
      flex-direction: column;
      min-height: 0;
      height: 100%;
      color: var(--zw-text);
      font-family: var(--zw-font);
      font-size: 13px;
      line-height: 1.55;
      background: var(--zw-bg);
      -webkit-font-smoothing: antialiased;
    }

    .zw-root[data-zw-theme='dark'] {
      --zw-bg: var(--dsw-alias-bg-base, #101014);
      --zw-bg-soft: color-mix(in srgb, var(--dsw-alias-bg-base, #101014) 90%, #ffffff 10%);
      --zw-bg-sunken: color-mix(in srgb, var(--dsw-alias-bg-base, #101014) 82%, #ffffff 18%);
      --zw-surface: var(--dsw-alias-bg-base, #101014);
      --zw-surface-raised: color-mix(in srgb, var(--dsw-alias-bg-base, #101014) 88%, #ffffff 12%);
      --zw-border: rgba(226, 232, 240, 0.1);
      --zw-border-strong: rgba(226, 232, 240, 0.2);
      --zw-text: var(--dsw-alias-text, #e8ecf4);
      --zw-text-2: rgba(226, 232, 240, 0.66);
      --zw-text-3: rgba(226, 232, 240, 0.4);
      --zw-accent: #8b8bf0;
      --zw-accent-2: #a78bfa;
      --zw-accent-soft: rgba(139, 139, 240, 0.16);
      --zw-accent-text: #b6b6ff;
      --zw-danger: #f87171;
      --zw-danger-soft: rgba(248, 113, 113, 0.14);
      --zw-warn: #fbbf24;
      --zw-ok: #2dd4bf;
      --zw-shadow-sm: 0 1px 2px rgba(0, 0, 0, 0.4);
      --zw-shadow-md: 0 10px 30px rgba(0, 0, 0, 0.5);
      --zw-shadow-lg: 0 28px 70px rgba(0, 0, 0, 0.6);
      --zw-graph-bg: color-mix(in srgb, var(--dsw-alias-bg-base, #101014) 92%, #ffffff 8%);
      --zw-graph-dot: rgba(226, 232, 240, 0.12);
      --zw-graph-edge: rgba(226, 232, 240, 0.28);
      --zw-graph-node-ring: var(--dsw-alias-bg-base, #101014);
      --zw-region-violet: #a78bfa;
      --zw-region-blue: #60a5fa;
      --zw-region-teal: #2dd4bf;
      --zw-region-amber: #fbbf24;
      --zw-region-rose: #fb7185;
      --zw-region-lime: #a3e635;
      --zw-type-decision: #818cf8;
      --zw-type-rule: #60a5fa;
      --zw-type-assumption: #fbbf24;
      --zw-type-question: #f472b6;
      --zw-type-proposal: #a78bfa;
      --zw-type-reference: #2dd4bf;
      --zw-type-metric: #4ade80;
      --zw-type-retro: #94a3b8;
      --zw-type-process: #22d3ee;
      color-scheme: dark;
    }

    .zw-root * { box-sizing: border-box; }
    .zw-root button { font-family: inherit; font-size: inherit; color: inherit; }
    .zw-root ::selection { background: var(--zw-accent-soft); }

    .zw-scroll { scrollbar-width: thin; scrollbar-color: var(--zw-border-strong) transparent; }
    .zw-scroll::-webkit-scrollbar { width: 9px; height: 9px; }
    .zw-scroll::-webkit-scrollbar-thumb {
      background: var(--zw-border-strong);
      border-radius: 999px;
      border: 2px solid transparent;
      background-clip: padding-box;
    }
    .zw-scroll::-webkit-scrollbar-track { background: transparent; }

    /* ================= 三栏骨架 ================= */
    .zw-app { display: flex; flex: 1; min-height: 0; position: relative; overflow: hidden; }

    .zw-rail {
      width: 232px;
      flex: 0 0 auto;
      display: flex;
      flex-direction: column;
      min-height: 0;
      padding: 14px 10px 10px;
      gap: 4px;
      border-right: 1px solid var(--zw-border);
      background: var(--zw-bg-soft);
      transition: width 160ms ease;
    }
    .zw-rail[data-collapsed='true'] { width: 60px; padding-left: 6px; padding-right: 6px; }

    .zw-brand { display: flex; align-items: center; gap: 9px; padding: 2px 6px 12px; }
    .zw-brandMark {
      width: 30px; height: 30px; border-radius: 10px; flex: 0 0 auto;
      display: grid; place-items: center;
      background: linear-gradient(140deg, var(--zw-accent), var(--zw-accent-2));
      color: #fff;
      box-shadow: 0 6px 16px color-mix(in srgb, var(--zw-accent) 40%, transparent);
    }
    .zw-brandText { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .zw-brandName { font-size: 15px; font-weight: 650; letter-spacing: 0.02em; }
    .zw-brandBadge { font-size: 10px; color: var(--zw-text-3); letter-spacing: 0.08em; text-transform: uppercase; }
    .zw-rail[data-collapsed='true'] .zw-brandText,
    .zw-rail[data-collapsed='true'] .zw-navLabel,
    .zw-rail[data-collapsed='true'] .zw-navCount,
    .zw-rail[data-collapsed='true'] .zw-navGroupLabel,
    .zw-rail[data-collapsed='true'] .zw-projectName,
    .zw-rail[data-collapsed='true'] .zw-projectCount,
    .zw-rail[data-collapsed='true'] .zw-brandBadge { display: none; }
    .zw-rail[data-collapsed='true'] .zw-brand { justify-content: center; padding-left: 0; padding-right: 0; }
    .zw-rail[data-collapsed='true'] .zw-navItem,
    .zw-rail[data-collapsed='true'] .zw-projectRow { justify-content: center; padding: 0; gap: 0; }
    .zw-rail[data-collapsed='true'] .zw-railToggle { justify-content: center; padding: 0; }
    .zw-rail[data-collapsed='true'] .zw-railToggleLabel,
    .zw-rail[data-collapsed='true'] .zw-savedLabel { display: none; }
    .zw-rail[data-collapsed='true'] .zw-railFoot { align-items: stretch; }
    .zw-rail[data-collapsed='true'] .zw-savedView { justify-content: center; padding: 0; gap: 0; }

    .zw-newBtn {
      display: flex; align-items: center; justify-content: center; gap: 7px;
      width: 100%; height: 34px; margin-bottom: 8px;
      border: 0; border-radius: 10px; cursor: pointer;
      background: linear-gradient(135deg, var(--zw-accent), var(--zw-accent-2));
      color: #fff; font-weight: 600; font-size: 13px;
      box-shadow: 0 4px 14px color-mix(in srgb, var(--zw-accent) 34%, transparent);
      transition: transform 120ms ease, box-shadow 120ms ease, opacity 120ms;
    }
    .zw-newBtn:hover { transform: translateY(-1px); box-shadow: 0 8px 20px color-mix(in srgb, var(--zw-accent) 40%, transparent); }
    .zw-newBtn:active { transform: translateY(0); }
    .zw-rail[data-collapsed='true'] .zw-newBtn { padding: 0; }
    .zw-rail[data-collapsed='true'] .zw-newBtn span { display: none; }

    .zw-navGroup { display: flex; flex-direction: column; gap: 1px; margin-top: 6px; }
    .zw-navGroupLabel {
      padding: 8px 8px 4px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.08em;
      text-transform: uppercase; color: var(--zw-text-3);
      display: flex; align-items: center; justify-content: space-between;
    }
    .zw-navItem {
      display: flex; align-items: center; gap: 9px; width: 100%;
      height: 31px; padding: 0 8px; border: 0; border-radius: 8px;
      background: transparent; cursor: pointer; color: var(--zw-text-2);
      font-size: 12.5px; text-align: left; transition: background 120ms, color 120ms;
    }
    .zw-navItem:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-navItemOn { background: var(--zw-accent-soft); color: var(--zw-accent-text); font-weight: 600; }
    .zw-navItemOn:hover { background: var(--zw-accent-soft); }
    .zw-navItem svg { flex: 0 0 auto; opacity: 0.85; }
    .zw-navLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-navCount {
      flex: 0 0 auto; min-width: 20px; padding: 0 6px; height: 17px; border-radius: 9px;
      display: inline-flex; align-items: center; justify-content: center;
      font-size: 10.5px; font-weight: 600; color: var(--zw-text-3);
      background: var(--zw-bg-sunken); font-variant-numeric: tabular-nums;
    }
    .zw-navItemOn .zw-navCount { background: color-mix(in srgb, var(--zw-accent) 16%, transparent); color: var(--zw-accent-text); }
    .zw-navDot { width: 6px; height: 6px; border-radius: 999px; flex: 0 0 auto; }
    .zw-rail[data-collapsed='true'] .zw-navItem { justify-content: center; padding: 0; }
    .zw-rail[data-collapsed='true'] .zw-navCount { display: none; }

    .zw-projects { display: flex; flex-direction: column; gap: 1px; max-height: 168px; overflow-y: auto; }
    .zw-projectRow {
      display: flex; align-items: center; gap: 8px; height: 28px; padding: 0 8px;
      border: 0; border-radius: 7px; background: transparent; cursor: pointer;
      color: var(--zw-text-2); font-size: 12px; text-align: left;
    }
    .zw-projectRow:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-projectRowOn { color: var(--zw-text); font-weight: 600; background: var(--zw-bg-sunken); }
    .zw-projectDot { width: 7px; height: 7px; border-radius: 2px; flex: 0 0 auto; }
    .zw-projectName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-projectCount { font-size: 10.5px; color: var(--zw-text-3); font-variant-numeric: tabular-nums; }

    .zw-navScroll {
      flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden;
      display: flex; flex-direction: column; gap: 2px;
      padding-right: 2px; margin-right: -2px;
    }
    .zw-railFoot {
      margin-top: auto; border-top: 1px solid var(--zw-border); padding-top: 8px; margin-top: 4px;
      display: flex; flex-direction: column; gap: 2px;
    }
    .zw-savedView {
      display: flex; align-items: center; gap: 2px; width: 100%; height: 26px; padding: 0 4px 0 0;
      border: 0; border-radius: 7px; background: transparent;
      color: var(--zw-text-2); font-size: 12px; text-align: left;
    }
    .zw-savedOpen {
      display: flex; align-items: center; gap: 7px; flex: 1; min-width: 0; height: 26px;
      padding: 0 6px 0 8px; border: 0; background: transparent; cursor: pointer;
      color: inherit; font: inherit; text-align: left; border-radius: 7px;
    }
    .zw-savedDel {
      display: flex; align-items: center; justify-content: center; flex: 0 0 auto;
      width: 20px; height: 20px; border: 0; border-radius: 6px; background: transparent;
      color: var(--zw-text-3); cursor: pointer; opacity: 0; transition: opacity .12s ease;
    }
    .zw-savedView:hover .zw-savedDel, .zw-savedDel:focus-visible { opacity: 1; }
    .zw-savedDel:hover { background: var(--zw-bg-sunken); color: var(--zw-danger); }
    .zw-savedView:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }

    .zw-savedLabel,
    .zw-railToggleLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-savedEmpty { padding: 4px 8px 6px; font-size: 11px; color: var(--zw-text-3); line-height: 1.45; }
    .zw-railToggle {
      display: flex; align-items: center; gap: 7px; height: 26px; padding: 0 8px;
      border: 0; border-radius: 7px; background: transparent; cursor: pointer;
      color: var(--zw-text-3); font-size: 11.5px; text-align: left;
    }
    .zw-railToggle:hover { background: var(--zw-bg-sunken); color: var(--zw-text-2); }
    .zw-rail[data-collapsed='true'] .zw-railToggle { justify-content: center; padding: 0; }
    .zw-rail[data-collapsed='true'] .zw-savedEmpty { display: none; }
    .zw-rail[data-collapsed='true'] .zw-savedDel { display: none; }

    /* ================= 中栏 ================= */
    .zw-center { flex: 1; min-width: 0; display: flex; flex-direction: column; min-height: 0; }
    .zw-topbar {
      flex: 0 0 auto; padding: 14px 18px 0;
      display: flex; flex-direction: column; gap: 10px;
      background: var(--zw-bg); position: relative; z-index: 3;
    }
    .zw-titleRow { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
    .zw-viewTitle { font-size: 17px; font-weight: 650; letter-spacing: -0.01em; margin: 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zw-viewSub { font-size: 11.5px; color: var(--zw-text-3); margin: 1px 0 0; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
    .zw-titleMain { min-width: 132px; flex: 1 1 160px; }
    .zw-count { font-size: 11.5px; color: var(--zw-text-3); font-variant-numeric: tabular-nums; white-space: nowrap; }

    .zw-search {
      flex: 1 1 200px; max-width: 460px; min-width: 168px;
      display: flex; align-items: center; gap: 7px; height: 32px; padding: 0 10px;
      border: 1px solid var(--zw-border); border-radius: 9px;
      background: var(--zw-bg); color: var(--zw-text-3);
      transition: border-color 140ms, box-shadow 140ms;
    }
    .zw-search:focus-within {
      border-color: color-mix(in srgb, var(--zw-accent) 60%, transparent);
      box-shadow: 0 0 0 3px var(--zw-accent-soft);
      color: var(--zw-text-2);
    }
    .zw-searchInput {
      flex: 1; min-width: 0; border: 0; outline: 0; background: transparent;
      font-size: 12.5px; color: var(--zw-text);
    }
    .zw-searchInput::placeholder { color: var(--zw-text-3); }
    .zw-searchX {
      display: grid; place-items: center; width: 18px; height: 18px; border: 0; border-radius: 5px;
      background: transparent; cursor: pointer; color: var(--zw-text-3);
    }
    .zw-searchX:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }

    .zw-btn {
      display: inline-flex; align-items: center; justify-content: center; gap: 6px;
      height: 32px; padding: 0 12px; border: 1px solid var(--zw-border); border-radius: 9px;
      background: var(--zw-bg); color: var(--zw-text); font-size: 12.5px; font-weight: 500;
      cursor: pointer; white-space: nowrap; transition: background 120ms, border-color 120ms, color 120ms;
    }
    .zw-btn:hover { background: var(--zw-bg-soft); border-color: var(--zw-border-strong); }
    .zw-btn:disabled { opacity: 0.5; cursor: not-allowed; }
    .zw-btnPrimary {
      border-color: transparent; color: #fff;
      background: linear-gradient(135deg, var(--zw-accent), var(--zw-accent-2));
      box-shadow: 0 3px 10px color-mix(in srgb, var(--zw-accent) 30%, transparent);
    }
    .zw-btnPrimary:hover { filter: brightness(1.05); background: linear-gradient(135deg, var(--zw-accent), var(--zw-accent-2)); }
    .zw-btnGhost { border-color: transparent; background: transparent; color: var(--zw-text-2); }
    .zw-btnGhost:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-btnDanger { color: var(--zw-danger); border-color: color-mix(in srgb, var(--zw-danger) 30%, transparent); }
    .zw-btnDanger:hover { background: var(--zw-danger-soft); border-color: var(--zw-danger); }
    .zw-btnSm { height: 27px; padding: 0 9px; font-size: 11.5px; border-radius: 7px; }
    .zw-iconBtn {
      display: inline-grid; place-items: center; width: 30px; height: 30px;
      border: 1px solid transparent; border-radius: 8px; background: transparent;
      color: var(--zw-text-2); cursor: pointer; transition: background 120ms, color 120ms;
    }
    .zw-iconBtn:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-iconBtn:disabled { opacity: 0.4; cursor: default; }
    .zw-iconBtnOn { background: var(--zw-accent-soft); color: var(--zw-accent-text); }

    .zw-seg { display: inline-flex; padding: 2px; gap: 2px; border: 1px solid var(--zw-border); border-radius: 9px; background: var(--zw-bg-soft); }
    .zw-segBtn {
      display: inline-flex; align-items: center; gap: 5px; height: 26px; padding: 0 9px;
      border: 0; border-radius: 7px; background: transparent; color: var(--zw-text-3);
      font-size: 11.5px; font-weight: 500; cursor: pointer;
    }
    .zw-segBtn:hover { color: var(--zw-text); }
    .zw-segBtnOn { background: var(--zw-bg); color: var(--zw-text); box-shadow: var(--zw-shadow-sm); }

    .zw-filterbar {
      display: flex; align-items: center; gap: 6px; flex-wrap: wrap;
      padding-bottom: 10px; border-bottom: 1px solid var(--zw-border);
    }
    .zw-filterLabel { font-size: 11px; color: var(--zw-text-3); margin-right: 2px; }
    .zw-chip {
      display: inline-flex; align-items: center; gap: 5px; height: 24px; padding: 0 8px;
      border: 1px solid var(--zw-border); border-radius: 999px; background: var(--zw-bg);
      color: var(--zw-text-2); font-size: 11.5px; cursor: pointer; white-space: nowrap;
      transition: background 120ms, border-color 120ms, color 120ms;
    }
    .zw-chip:hover { border-color: var(--zw-border-strong); color: var(--zw-text); }
    .zw-chipOn { background: var(--zw-accent-soft); border-color: color-mix(in srgb, var(--zw-accent) 40%, transparent); color: var(--zw-accent-text); font-weight: 600; }
    .zw-chipDot { width: 6px; height: 6px; border-radius: 999px; flex: 0 0 auto; }
    .zw-chipX { display: grid; place-items: center; width: 13px; height: 13px; border-radius: 999px; margin-right: -2px; }
    .zw-chipX:hover { background: rgba(0, 0, 0, 0.08); }

    .zw-popoverHost { position: relative; }
    .zw-popover {
      position: absolute; z-index: 40; top: calc(100% + 6px); left: 0; min-width: 210px; max-height: 340px;
      overflow-y: auto; padding: 5px; border-radius: 11px;
      border: 1px solid var(--zw-border); background: var(--zw-surface-raised);
      box-shadow: var(--zw-shadow-lg);
    }
    .zw-popItem {
      display: flex; align-items: center; gap: 8px; width: 100%; height: 29px; padding: 0 8px;
      border: 0; border-radius: 7px; background: transparent; color: var(--zw-text-2);
      font-size: 12.5px; cursor: pointer; text-align: left;
    }
    .zw-popItem:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-popItemOn { color: var(--zw-accent-text); font-weight: 600; }
    .zw-popLabel { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-popCheck { width: 14px; display: grid; place-items: center; color: var(--zw-accent); }
    .zw-popSep { height: 1px; margin: 4px 6px; background: var(--zw-border); }

    .zw-bodyArea { flex: 1; min-height: 0; display: flex; flex-direction: column; overflow: hidden; }

    /* 列表 */
    .zw-listWrap { flex: 1; min-height: 0; overflow-y: auto; padding: 12px 14px 40px; }
    .zw-list { display: flex; flex-direction: column; gap: 6px; }
    .zw-row {
      position: relative; display: flex; gap: 10px; padding: 11px 12px 11px 10px;
      border: 1px solid var(--zw-border); border-radius: 12px; background: var(--zw-surface);
      cursor: pointer; transition: border-color 130ms, box-shadow 130ms, transform 130ms, background 130ms;
    }
    .zw-row:hover { border-color: var(--zw-border-strong); box-shadow: var(--zw-shadow-sm); }
    .zw-rowOn {
      border-color: color-mix(in srgb, var(--zw-accent) 55%, transparent);
      background: color-mix(in srgb, var(--zw-accent) 5%, var(--zw-surface));
      box-shadow: 0 0 0 2px var(--zw-accent-soft);
    }
    .zw-rowCheck {
      flex: 0 0 auto; width: 20px; height: 20px; margin-top: 2px; display: grid; place-items: center;
      border: 1px solid var(--zw-border-strong); border-radius: 6px; background: var(--zw-bg);
      color: transparent; cursor: pointer; transition: all 120ms;
    }
    .zw-rowCheck:hover { border-color: var(--zw-accent); }
    .zw-rowCheckOn { background: var(--zw-accent); border-color: var(--zw-accent); color: #fff; }
    .zw-rowBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .zw-rowTop { display: flex; align-items: center; gap: 7px; min-width: 0; }
    .zw-rowDot { width: 6px; height: 6px; border-radius: 999px; flex: 0 0 auto; }
    .zw-rowTitle {
      font-size: 13.5px; font-weight: 600; min-width: 0; overflow: hidden;
      text-overflow: ellipsis; white-space: nowrap; letter-spacing: -0.005em;
    }
    .zw-rowSummary {
      font-size: 12px; color: var(--zw-text-2); display: -webkit-box;
      -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .zw-rowMeta { display: flex; align-items: center; gap: 6px; flex-wrap: wrap; margin-top: 2px; }
    .zw-rowSide { flex: 0 0 auto; display: flex; flex-direction: column; align-items: flex-end; justify-content: space-between; gap: 6px; }
    .zw-rowDate { font-size: 10.5px; color: var(--zw-text-3); white-space: nowrap; font-variant-numeric: tabular-nums; }

    .zw-badge {
      display: inline-flex; align-items: center; gap: 4px; height: 19px; padding: 0 7px;
      border-radius: 999px; font-size: 10.5px; font-weight: 600; letter-spacing: 0.01em; white-space: nowrap;
    }
    .zw-badgeType { background: var(--zw-bg-sunken); color: var(--zw-text-2); }
    .zw-badgeNeutral { background: var(--zw-bg-sunken); color: var(--zw-text-2); }
    .zw-badgeActive { background: color-mix(in srgb, #10b981 14%, transparent); color: #047857; }
    .zw-badgeDraft { background: var(--zw-bg-sunken); color: var(--zw-text-3); }
    .zw-badgePending { background: color-mix(in srgb, #f59e0b 16%, transparent); color: #b45309; }
    .zw-badgeDeprecated { background: color-mix(in srgb, #ef4444 12%, transparent); color: #b91c1c; }
    .zw-badgeArchived { background: var(--zw-bg-sunken); color: var(--zw-text-3); }
    .zw-root[data-zw-theme='dark'] .zw-badgeActive { color: #34d399; }
    .zw-root[data-zw-theme='dark'] .zw-badgePending { color: #fbbf24; }
    .zw-root[data-zw-theme='dark'] .zw-badgeDeprecated { color: #f87171; }

    .zw-tag {
      display: inline-flex; align-items: center; height: 19px; padding: 0 7px; border-radius: 6px;
      background: var(--zw-bg-sunken); color: var(--zw-text-2); font-size: 10.5px; white-space: nowrap;
    }
    .zw-tagOn { background: var(--zw-accent-soft); color: var(--zw-accent-text); }
    .zw-tagBtn { border: 0; cursor: pointer; }
    .zw-tagBtn:hover { background: var(--zw-accent-soft); color: var(--zw-accent-text); }

    .zw-star { display: grid; place-items: center; width: 22px; height: 22px; border: 0; border-radius: 6px; background: transparent; color: var(--zw-text-3); cursor: pointer; }
    .zw-star:hover { background: var(--zw-bg-sunken); color: #d97706; }
    .zw-starOn { color: #d97706; }

    /* 概要视图 */
    .zw-overview { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 18px 40px; display: flex; flex-direction: column; gap: 18px; }
    .zw-statGrid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .zw-stat {
      display: flex; flex-direction: column; gap: 3px; padding: 12px 14px;
      border: 1px solid var(--zw-border); border-radius: 12px; background: var(--zw-surface);
      cursor: pointer; transition: border-color 130ms, box-shadow 130ms, transform 130ms;
    }
    .zw-stat:hover { border-color: var(--zw-border-strong); box-shadow: var(--zw-shadow-sm); transform: translateY(-1px); }
    .zw-statValue { font-size: 22px; font-weight: 650; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; line-height: 1.1; }
    .zw-statLabel { font-size: 11.5px; color: var(--zw-text-3); display: flex; align-items: center; gap: 5px; }

    .zw-columns { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px; }
    .zw-panelCard { border: 1px solid var(--zw-border); border-radius: 12px; background: var(--zw-surface); overflow: hidden; }
    .zw-panelHead {
      display: flex; align-items: center; gap: 8px; padding: 10px 12px;
      border-bottom: 1px solid var(--zw-border); background: var(--zw-bg-soft);
    }
    .zw-panelTitle { font-size: 12px; font-weight: 650; flex: 1; display: flex; align-items: center; gap: 6px; }
    .zw-panelLink { border: 0; background: transparent; color: var(--zw-text-3); font-size: 11px; cursor: pointer; }
    .zw-panelLink:hover { color: var(--zw-accent-text); }
    .zw-miniList { display: flex; flex-direction: column; padding: 4px; }
    .zw-mini {
      display: flex; align-items: center; gap: 8px; width: 100%; padding: 7px 8px;
      border: 0; border-radius: 8px; background: transparent; cursor: pointer; text-align: left;
    }
    .zw-mini:hover { background: var(--zw-bg-sunken); }
    .zw-miniBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .zw-miniTitle { font-size: 12.5px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-miniMeta { font-size: 10.5px; color: var(--zw-text-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .zw-empty { display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px; padding: 46px 20px; color: var(--zw-text-3); text-align: center; }
    .zw-emptyIcon { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; background: var(--zw-bg-sunken); color: var(--zw-text-3); }
    .zw-emptyTitle { font-size: 13px; font-weight: 600; color: var(--zw-text-2); }
    .zw-emptyText { font-size: 11.5px; max-width: 320px; line-height: 1.6; }

    /* 集合 */
    .zw-collectionGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(240px, 1fr)); gap: 10px; }
    .zw-collectionCard {
      display: flex; flex-direction: column; gap: 7px; padding: 13px 14px;
      border: 1px solid var(--zw-border); border-radius: 12px; background: var(--zw-surface);
      cursor: pointer; transition: border-color 130ms, box-shadow 130ms, transform 130ms;
      position: relative; overflow: hidden;
    }
    .zw-collectionCard:hover { border-color: var(--zw-border-strong); box-shadow: var(--zw-shadow-sm); transform: translateY(-1px); }
    .zw-collectionCard::before {
      content: ''; position: absolute; inset: 0 auto 0 0; width: 3px; background: var(--zw-hullColor, var(--zw-accent));
    }
    .zw-collectionTop { display: flex; align-items: center; gap: 8px; }
    .zw-collectionName { font-size: 13px; font-weight: 650; flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-collectionDesc { font-size: 11.5px; color: var(--zw-text-2); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; min-height: 32px; }
    .zw-collectionMeta { display: flex; align-items: center; gap: 6px; font-size: 10.5px; color: var(--zw-text-3); }
    .zw-collectionAi { color: var(--zw-accent-text); display: inline-flex; align-items: center; gap: 3px; }

    /* ================= 右详情栏 ================= */
    .zw-detail {
      width: clamp(272px, 32vw, 372px); flex: 0 0 auto; min-width: 0; min-height: 0;
      display: flex; flex-direction: column;
      border-left: 1px solid var(--zw-border); background: var(--zw-bg-soft);
      transition: width 160ms ease;
    }
    .zw-detail[data-collapsed='true'] { width: 48px; }
    .zw-detailHead {
      flex: 0 0 auto; display: flex; align-items: flex-start; gap: 6px; flex-wrap: wrap;
      padding: 11px 12px; border-bottom: 1px solid var(--zw-border);
    }
    .zw-detailTitleWrap { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 3px; }
    .zw-detailTitle { font-size: 14px; font-weight: 650; line-height: 1.35; margin: 0; letter-spacing: -0.01em; }
    .zw-detailMeta { display: flex; align-items: center; gap: 5px; flex-wrap: wrap; font-size: 10.5px; color: var(--zw-text-3); }
    .zw-detailActions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; margin-left: auto; }
    .zw-detailScroll { flex: 1; min-height: 0; overflow-y: auto; overflow-x: hidden; padding: 12px 14px 48px; display: flex; flex-direction: column; gap: 15px; }

    .zw-block { display: flex; flex-direction: column; gap: 6px; }
    .zw-blockHead { display: flex; align-items: center; gap: 6px; }
    .zw-blockTitle { font-size: 10.5px; font-weight: 700; letter-spacing: 0.08em; text-transform: uppercase; color: var(--zw-text-3); flex: 1; }
    .zw-blockHint { font-size: 10.5px; color: var(--zw-text-3); }

    .zw-prose { font-size: 12.5px; line-height: 1.7; color: var(--zw-text); display: flex; flex-direction: column; gap: 7px; }
    .zw-proseH { font-size: 12.5px; font-weight: 650; margin: 4px 0 0; }
    .zw-proseP { margin: 0; white-space: pre-wrap; word-break: break-word; }
    .zw-proseUl { margin: 0; padding-left: 17px; display: flex; flex-direction: column; gap: 3px; }
    .zw-proseLi { list-style: disc; }
    .zw-proseCode { font-family: var(--zw-mono); font-size: 11.5px; background: var(--zw-bg-sunken); padding: 1px 4px; border-radius: 4px; }

    .zw-factGrid { display: grid; grid-template-columns: repeat(auto-fill, minmax(120px, 1fr)); gap: 6px; }
    .zw-fact { padding: 7px 9px; border-radius: 9px; background: var(--zw-bg-sunken); display: flex; flex-direction: column; gap: 1px; }
    .zw-factLabel { font-size: 10px; color: var(--zw-text-3); }
    .zw-factValue { font-size: 12.5px; font-weight: 600; font-variant-numeric: tabular-nums; word-break: break-word; }

    .zw-tagRow { display: flex; flex-wrap: wrap; gap: 4px; }
    .zw-regionChip {
      display: inline-flex; align-items: center; gap: 4px; height: 20px; padding: 0 8px 0 6px;
      border-radius: 999px; font-size: 10.5px; font-weight: 600;
      background: var(--zw-bg-sunken); color: var(--zw-text-2); border: 0; cursor: pointer;
    }
    .zw-regionChip:hover { background: var(--zw-accent-soft); color: var(--zw-accent-text); }

    /* 关系列表容器：之前误用了 .zw-relLine（14px 宽的图例短线）当容器，会把整块内容压成一条并溢出 */
    .zw-relList { display: flex; flex-direction: column; gap: 2px; min-width: 0; }
    .zw-relList .zw-relRow { width: 100%; }
    .zw-frameBox .zw-hullOutline:hover { fill-opacity: 0.9; }
    .zw-relGroup { display: flex; flex-direction: column; gap: 2px; }
    .zw-relGroupTitle {
      display: flex; align-items: center; gap: 5px; font-size: 10.5px; color: var(--zw-text-3);
      font-weight: 600; padding: 2px 0;
    }
    .zw-relLine { width: 14px; height: 0; border-top: 2px solid var(--zw-relColor, var(--zw-border-strong)); border-radius: 2px; }
    .zw-relRow {
      display: flex; align-items: flex-start; gap: 7px; padding: 7px 8px;
      border: 1px solid transparent; border-radius: 9px; background: transparent; cursor: pointer; text-align: left;
    }
    .zw-relRow:hover { background: var(--zw-bg); border-color: var(--zw-border); }
    .zw-relGlyph { flex: 0 0 auto; display: grid; place-items: center; width: 20px; height: 20px; border-radius: 6px; background: var(--zw-bg-sunken); color: var(--zw-text-2); }
    .zw-relBody { flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .zw-relName { font-size: 12px; font-weight: 500; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-relNote { font-size: 10.5px; color: var(--zw-text-3); display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden; }
    .zw-relActions { display: flex; align-items: center; gap: 2px; flex: 0 0 auto; }
    .zw-relSuggested { border-color: color-mix(in srgb, var(--zw-accent) 26%, transparent); background: color-mix(in srgb, var(--zw-accent) 4%, transparent); }
    .zw-suggestRow {
      display: flex; align-items: center; gap: 8px; padding: 8px; border-radius: 9px;
      border: 1px dashed color-mix(in srgb, var(--zw-accent) 34%, transparent);
      background: color-mix(in srgb, var(--zw-accent) 4%, transparent);
    }
    .zw-confBar { overflow: hidden; height: 3px; border-radius: 999px; background: var(--zw-border); }
    .zw-confFill { height: 100%; background: linear-gradient(90deg, var(--zw-accent), var(--zw-accent-2)); border-radius: 999px; }

    .zw-historyRow { display: flex; gap: 8px; font-size: 11px; color: var(--zw-text-3); }
    .zw-historyDot { width: 5px; height: 5px; margin-top: 6px; border-radius: 999px; background: var(--zw-border-strong); flex: 0 0 auto; }

    /* ================= 编辑 / 弹窗 ================= */
    .zw-modalMask {
      position: fixed; inset: 0; z-index: 90; display: flex; align-items: flex-start; justify-content: center;
      padding: 6vh 18px 18px; background: rgba(15, 23, 42, 0.42);
      backdrop-filter: blur(3px); animation: zwFade 140ms ease;
    }
    .zw-modal {
      width: 100%; max-width: 620px; max-height: 84vh; display: flex; flex-direction: column;
      border-radius: 16px; border: 1px solid var(--zw-border); background: var(--zw-surface);
      box-shadow: var(--zw-shadow-lg); overflow: hidden; animation: zwRise 180ms cubic-bezier(0.2, 0.8, 0.2, 1);
    }
    .zw-modalWide { max-width: 760px; }
    .zw-modalHead {
      flex: 0 0 auto; display: flex; align-items: center; gap: 8px;
      padding: 13px 16px; border-bottom: 1px solid var(--zw-border);
    }
    .zw-modalTitle { flex: 1; font-size: 14px; font-weight: 650; }
    .zw-modalBody { flex: 1; min-height: 0; overflow-y: auto; padding: 14px 16px; display: flex; flex-direction: column; gap: 12px; }
    .zw-modalFoot {
      flex: 0 0 auto; display: flex; align-items: center; gap: 8px; padding: 11px 16px;
      border-top: 1px solid var(--zw-border); background: var(--zw-bg-soft);
    }
    .zw-modalFootSpacer { flex: 1; }

    .zw-form { display: flex; flex-direction: column; gap: 12px; }
    .zw-formRow { display: flex; gap: 10px; }
    .zw-formRow > * { flex: 1; min-width: 0; }
    .zw-field { display: flex; flex-direction: column; gap: 4px; }
    .zw-fieldLabel { font-size: 10.5px; font-weight: 650; letter-spacing: 0.06em; text-transform: uppercase; color: var(--zw-text-3); }
    .zw-input, .zw-textarea, .zw-select {
      width: 100%; border: 1px solid var(--zw-border); border-radius: 9px; background: var(--zw-bg);
      padding: 7px 10px; font-family: inherit; font-size: 12.5px; color: var(--zw-text);
      outline: 0; transition: border-color 130ms, box-shadow 130ms;
    }
    .zw-input:focus, .zw-textarea:focus, .zw-select:focus {
      border-color: color-mix(in srgb, var(--zw-accent) 60%, transparent);
      box-shadow: 0 0 0 3px var(--zw-accent-soft);
    }
    .zw-textarea { resize: vertical; min-height: 88px; line-height: 1.65; }
    .zw-textareaBig { min-height: 148px; font-size: 13.5px; }
    .zw-select { appearance: none; cursor: pointer; height: 33px; padding-right: 26px; background-image: none; }
    .zw-hint { font-size: 10.5px; color: var(--zw-text-3); }
    .zw-error { font-size: 11.5px; color: var(--zw-danger); }

    .zw-chipPicker { display: flex; flex-wrap: wrap; gap: 5px; }
    .zw-chipOpt {
      display: inline-flex; align-items: center; gap: 5px; height: 25px; padding: 0 9px;
      border: 1px solid var(--zw-border); border-radius: 999px; background: var(--zw-bg);
      font-size: 11.5px; color: var(--zw-text-2); cursor: pointer; transition: all 120ms;
    }
    .zw-chipOpt:hover { border-color: var(--zw-border-strong); }
    .zw-chipOptOn { background: var(--zw-accent-soft); border-color: color-mix(in srgb, var(--zw-accent) 42%, transparent); color: var(--zw-accent-text); font-weight: 600; }

    .zw-facts { display: flex; flex-direction: column; gap: 6px; }
    .zw-factRow { display: flex; gap: 6px; align-items: center; }
    .zw-factRow > .zw-input:first-child { flex: 0 0 38%; }
    .zw-factRow > .zw-input:nth-child(2) { flex: 1; }

    .zw-quickCreate { display: flex; gap: 6px; align-items: center; padding-bottom: 8px; border-bottom: 1px dashed var(--zw-border); margin-bottom: 8px; }
    .zw-quickCreate .zw-input { flex: 1; min-width: 0; }
    .zw-quickCreate .zw-btn { flex: none; white-space: nowrap; }
    .zw-pickList { max-height: 240px; overflow-y: auto; display: flex; flex-direction: column; gap: 2px; }
    .zw-pickRow {
      display: flex; align-items: center; gap: 8px; padding: 7px 8px; border: 1px solid transparent;
      border-radius: 8px; background: transparent; cursor: pointer; text-align: left;
    }
    .zw-pickRow:hover { background: var(--zw-bg-soft); border-color: var(--zw-border); }
    .zw-pickRowOn { background: var(--zw-accent-soft); border-color: color-mix(in srgb, var(--zw-accent) 40%, transparent); }

    /* ================= 关系图 ================= */
    .zw-graphWrap { flex: 1; min-height: 0; display: flex; position: relative; }
    .zw-graphStage {
      flex: 1; min-width: 0; position: relative; overflow: hidden;
      background:
        radial-gradient(circle at 30% 20%, color-mix(in srgb, var(--zw-accent) 8%, transparent), transparent 60%),
        radial-gradient(circle at 75% 80%, color-mix(in srgb, var(--zw-accent-2) 7%, transparent), transparent 62%),
        var(--zw-graph-bg);
      background-size: 100% 100%;
      touch-action: none;
    }
    .zw-graphSvg { display: block; width: 100%; height: 100%; cursor: grab; }
    .zw-graphSvg:active { cursor: grabbing; }
    .zw-graphSvg[data-tool='link'] { cursor: crosshair; }
    .zw-graphSvg[data-tool='region'] { cursor: cell; }

    .zw-gedge { fill: none; stroke-width: 1.4; opacity: 0.62; }
    .zw-gedgeOn { opacity: 1; stroke-width: 2.4; }
    .zw-gedgeDim { opacity: 0.12; }
    .zw-gedgeSuggested { opacity: 0.5; }
    .zw-gedgeFlow { fill: none; stroke-width: 2.6; opacity: 0.34; stroke-dasharray: 3 9; animation: zwFlow 1.6s linear infinite; }
    .zw-gedgeLabel {
      font-size: 9.5px; fill: var(--zw-text-3); font-family: var(--zw-font);
      pointer-events: none; user-select: none;
    }
    .zw-gedgeLabelOn { fill: var(--zw-text); font-weight: 600; }
    .zw-gedgeDraft { stroke: var(--zw-accent); stroke-width: 1.8; stroke-dasharray: 5 5; fill: none; opacity: 0.9; }
    .zw-garrow { fill: var(--zw-graph-edge); opacity: 0.66; }

    .zw-gnode { cursor: pointer; }
    .zw-gnodeHalo { opacity: 0; transition: opacity 160ms; }
    .zw-gnode:hover .zw-gnodeHalo { opacity: 0.16; }
    .zw-gnodeHaloOn { opacity: 0.2; }
    .zw-gnodeRing { fill: none; stroke-width: 1.6; }
    .zw-gnodeCore { transition: r 140ms, filter 140ms; }
    .zw-gnodeOn .zw-gnodeCore { filter: drop-shadow(0 0 8px var(--zw-accent)); }
    .zw-gnodeLabel {
      font-size: 10.5px; fill: var(--zw-text-2); font-family: var(--zw-font);
      pointer-events: none; user-select: none;
    }
    .zw-gnodeLabelOn { fill: var(--zw-text); font-weight: 650; }
    .zw-gnodeDim { opacity: 0.16; }
    .zw-gnodeBadge {
      font-size: 8.5px; fill: var(--zw-text-3); font-family: var(--zw-font);
      pointer-events: none; user-select: none;
    }
    .zw-gnodeHit { fill: transparent; }
    /* 记忆框节点：框本身也是一个可拖、可连线的超级节点 */
    .zw-gframeNode { cursor: grab; }
    .zw-gframeNode:active { cursor: grabbing; }
    .zw-gframeChip {
      fill: color-mix(in srgb, var(--zw-surface) 92%, transparent);
      stroke-width: 1.4; stroke-dasharray: 7 4;
    }
    .zw-gframeOn .zw-gframeChip { stroke-width: 2.2; stroke-dasharray: none; }
    .zw-gframeText {
      font-size: 11px; font-weight: 650; font-family: var(--zw-font);
      pointer-events: none; user-select: none; dominant-baseline: middle;
    }
    .zw-gframeBadge {
      font-size: 9px; font-family: var(--zw-font); pointer-events: none;
      user-select: none; dominant-baseline: middle;
    }
    .zw-gframeDim { opacity: 0.2; }
    .zw-hull { opacity: 0.1; transition: opacity 200ms; }
    .zw-hullOn { opacity: 0.2; }
    .zw-hullOutline { fill: none; stroke-width: 1.2; opacity: 0.5; stroke-dasharray: 6 5; animation: zwHull 22s linear infinite; }
    .zw-hullLabel { font-size: 10.5px; font-weight: 650; font-family: var(--zw-font); cursor: pointer; }
    .zw-hullCount { font-size: 9px; fill: var(--zw-text-3); font-family: var(--zw-font); }

    .zw-boxRect {
      fill: color-mix(in srgb, var(--zw-accent) 10%, transparent);
      stroke: var(--zw-accent); stroke-width: 1.2; stroke-dasharray: 4 4;
    }
    .zw-linkDraft { stroke: var(--zw-accent); stroke-width: 1.8; stroke-dasharray: 5 4; fill: none; }
    .zw-linkDot { fill: var(--zw-accent); }

    .zw-graphToolbar {
      position: absolute; top: 12px; left: 12px; display: flex; align-items: center; gap: 4px;
      flex-wrap: wrap; max-width: calc(100% - 88px);
      padding: 4px; border-radius: 11px; border: 1px solid var(--zw-border);
      background: color-mix(in srgb, var(--zw-surface) 92%, transparent);
      backdrop-filter: blur(8px); box-shadow: var(--zw-shadow-md); z-index: 6;
    }
    .zw-toolSep { width: 1px; height: 18px; background: var(--zw-border); margin: 0 2px; }
    .zw-toolBtn {
      display: inline-flex; align-items: center; gap: 5px; height: 27px; padding: 0 8px;
      border: 0; border-radius: 7px; background: transparent; color: var(--zw-text-2);
      font-size: 11.5px; cursor: pointer; white-space: nowrap;
    }
    .zw-toolBtn:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-toolBtnOn { background: var(--zw-accent-soft); color: var(--zw-accent-text); font-weight: 600; }
    .zw-graphCount {
      position: absolute; left: 12px; bottom: 12px; display: flex; align-items: center; gap: 8px;
      padding: 5px 10px; border-radius: 9px; border: 1px solid var(--zw-border);
      background: color-mix(in srgb, var(--zw-surface) 90%, transparent); backdrop-filter: blur(6px);
      font-size: 10.5px; color: var(--zw-text-3); z-index: 5;
    }
    .zw-graphHint {
      position: absolute; right: 12px; bottom: 12px; padding: 5px 10px; border-radius: 9px;
      border: 1px solid var(--zw-border); background: color-mix(in srgb, var(--zw-surface) 90%, transparent);
      backdrop-filter: blur(6px); font-size: 10.5px; color: var(--zw-text-3); z-index: 5;
      display: flex; align-items: center; gap: 8px; max-width: 62%;
    }
    .zw-graphPanel {
      width: 232px; flex: 0 0 auto; display: flex; flex-direction: column; min-height: 0;
      border-left: 1px solid var(--zw-border); background: var(--zw-bg-soft); overflow-y: auto;
    }
    .zw-graphPanelHead {
      display: flex; align-items: center; gap: 6px; padding: 10px 12px;
      border-bottom: 1px solid var(--zw-border); font-size: 11px; font-weight: 650;
      letter-spacing: 0.06em; text-transform: uppercase; color: var(--zw-text-3);
    }
    .zw-graphSection { padding: 9px 12px; border-bottom: 1px solid var(--zw-border); display: flex; flex-direction: column; gap: 6px; }
    .zw-graphSearch { display: flex; align-items: center; gap: 6px; height: 29px; padding: 0 8px; border: 1px solid var(--zw-border); border-radius: 8px; background: var(--zw-bg); color: var(--zw-text-3); }
    .zw-legendRow { display: flex; align-items: center; gap: 7px; font-size: 11.5px; color: var(--zw-text-2); cursor: pointer; padding: 2px 0; }
    .zw-legendRowOff { opacity: 0.36; }
    .zw-legendSample { width: 18px; height: 0; border-top-width: 2px; border-top-style: solid; flex: 0 0 auto; border-radius: 2px; }
    .zw-legendDot { width: 10px; height: 10px; border-radius: 999px; flex: 0 0 auto; }
    .zw-legendName { flex: 1; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-legendCount { font-size: 10px; color: var(--zw-text-3); font-variant-numeric: tabular-nums; }

    /* 批量条 */
    .zw-batchWrap { position: absolute; left: 50%; bottom: 18px; transform: translateX(-50%); z-index: 30; }
    .zw-batchbar {
      display: flex; align-items: center; gap: 6px; padding: 6px 8px 6px 12px;
      border-radius: 13px; border: 1px solid var(--zw-border-strong);
      background: var(--zw-surface); box-shadow: var(--zw-shadow-lg);
      animation: zwRise 160ms ease;
    }
    .zw-batchCount { font-size: 11.5px; font-weight: 650; color: var(--zw-accent-text); white-space: nowrap; }

    /* Toast */
    .zw-toastWrap { position: absolute; left: 50%; top: 12px; transform: translateX(-50%); z-index: 80; display: flex; flex-direction: column; gap: 6px; align-items: center; pointer-events: none; }
    .zw-toast {
      display: flex; align-items: center; gap: 7px; padding: 7px 13px; border-radius: 10px;
      background: var(--zw-surface); border: 1px solid var(--zw-border-strong);
      box-shadow: var(--zw-shadow-md); font-size: 12px; animation: zwRise 160ms ease;
    }
    .zw-toastOk { color: var(--zw-text); }
    .zw-toastError { color: var(--zw-danger); border-color: color-mix(in srgb, var(--zw-danger) 36%, transparent); }

    /* 快速新增 */
    .zw-quickHead { display: flex; flex-direction: column; gap: 2px; }
    .zw-quickTitle { font-size: 15px; font-weight: 650; }
    .zw-quickSub { font-size: 11.5px; color: var(--zw-text-3); }
    .zw-quickProposal { display: flex; flex-direction: column; gap: 10px; padding: 12px; border-radius: 12px; border: 1px dashed color-mix(in srgb, var(--zw-accent) 34%, transparent); background: color-mix(in srgb, var(--zw-accent) 4%, transparent); }
    .zw-quickProposalHead { display: flex; align-items: center; gap: 7px; font-size: 11px; font-weight: 650; color: var(--zw-accent-text); letter-spacing: 0.04em; }
    .zw-confWrap { display: flex; align-items: center; gap: 6px; }
    .zw-loadingBar { height: 3px; border-radius: 999px; background: var(--zw-border); overflow: hidden; }
    .zw-loadingFill { height: 100%; width: 34%; border-radius: 999px; background: linear-gradient(90deg, transparent, var(--zw-accent), transparent); animation: zwLoading 1.1s ease-in-out infinite; }

    .zw-skeleton { border-radius: 10px; background: linear-gradient(90deg, var(--zw-bg-sunken), var(--zw-bg-soft), var(--zw-bg-sunken)); background-size: 200% 100%; animation: zwShimmer 1.3s linear infinite; }

    .zw-fadeIn { animation: zwFade 160ms ease; }
    .zw-spin { animation: zwSpin 1s linear infinite; }

    @keyframes zwFade { from { opacity: 0; } to { opacity: 1; } }
    @keyframes zwRise { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
    @keyframes zwSpin { to { transform: rotate(360deg); } }
    @keyframes zwFlow { to { stroke-dashoffset: -24; } }
    @keyframes zwHull { to { stroke-dashoffset: -220; } }
    @keyframes zwLoading { 0% { transform: translateX(-100%); } 100% { transform: translateX(320%); } }
    @keyframes zwShimmer { 0% { background-position: 200% 0; } 100% { background-position: -200% 0; } }

    @media (max-width: 1180px) {
      .zw-detail { width: 320px; }
      .zw-graphPanel { width: 204px; }
      .zw-columns { grid-template-columns: 1fr; }
    }
    @media (max-width: 940px) {
      .zw-rail { width: 62px; }
      .zw-rail .zw-navLabel, .zw-rail .zw-navCount, .zw-rail .zw-brandText { display: none; }
      .zw-statGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
    }
    /* 窄面板：详情栏不再挤列表，而是浮在右侧；关闭按钮仍然有效。 */
    @media (max-width: 860px) {
      .zw-detail {
        position: absolute; top: 0; right: 0; bottom: 0; z-index: 22;
        width: min(366px, 92vw); box-shadow: -18px 0 38px -22px rgba(0, 0, 0, 0.45);
        border-left: 1px solid var(--zw-border);
      }
      .zw-detail[data-collapsed='true'] { position: static; width: 44px; box-shadow: none; }
      .zw-factGrid { grid-template-columns: repeat(auto-fill, minmax(104px, 1fr)); }
      .zw-graphPanel { width: 186px; }
    }

    /* ================= 补充件：表单外壳 / 卡片视图 / 图层 ================= */
    .zw-selectWrap { position: relative; display: inline-flex; align-items: center; }
    .zw-selectWrap .zw-select { appearance: none; padding-right: 24px; }
    .zw-selectCaret {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      pointer-events: none; color: var(--zw-text-3); display: inline-flex;
    }
    .zw-fieldInline { display: flex; align-items: center; gap: 8px; }
    .zw-fieldInline > .zw-fieldLabel { margin: 0; white-space: nowrap; }

    .zw-cardGrid {
      display: grid; gap: 12px; padding: 14px 18px 26px;
      grid-template-columns: repeat(auto-fill, minmax(248px, 1fr));
    }
    .zw-card {
      position: relative; display: flex; flex-direction: column; gap: 8px;
      padding: 13px 14px 12px; border: 1px solid var(--zw-border); border-radius: 12px;
      background: var(--zw-surface); color: inherit; cursor: pointer; text-align: left;
      transition: border-color 140ms ease, box-shadow 140ms ease, transform 140ms ease;
    }
    .zw-card:hover { border-color: var(--zw-accent); box-shadow: var(--zw-shadow-sm); transform: translateY(-1px); }
    .zw-cardOn { border-color: var(--zw-accent); box-shadow: 0 0 0 2px var(--zw-accent-soft); }
    .zw-cardTop { display: flex; align-items: center; gap: 6px; }
    .zw-cardTitle {
      font-size: 13.5px; font-weight: 600; line-height: 1.45; color: var(--zw-text);
      display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; overflow: hidden;
    }
    .zw-cardSummary {
      font-size: 12px; line-height: 1.6; color: var(--zw-text-2);
      display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden;
    }
    .zw-cardMeta { display: flex; flex-wrap: wrap; align-items: center; gap: 6px; margin-top: auto; padding-top: 8px; }

    .zw-pickTitle { font-size: 13px; color: var(--zw-text); }
    .zw-pickMeta { margin-left: auto; font-size: 11.5px; color: var(--zw-text-3); }

    .zw-detailEmpty {
      display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 8px;
      padding: 40px 22px; text-align: center; color: var(--zw-text-3); font-size: 12px; line-height: 1.7;
    }
    .zw-appDetailCollapsed .zw-detail { width: 46px; padding: 8px 4px; }
    .zw-appDetailCollapsed .zw-detailScroll, .zw-appDetailCollapsed .zw-detailHead { display: none; }

    .zw-hullLayer, .zw-edgeLayer, .zw-nodeLayer { pointer-events: none; }
    .zw-hullLayer > * , .zw-edgeLayer > * { pointer-events: auto; }
    .zw-nodeLayer > * { pointer-events: auto; }
    .zw-gedgePath { fill: none; stroke-width: 1.35; transition: stroke-width 120ms ease, opacity 120ms ease; }
    .zw-gedge:hover .zw-gedgePath { stroke-width: 2.1; }
    .zw-chipOpen { border-color: var(--zw-accent); color: var(--zw-accent-2); background: var(--zw-accent-soft); }
    .zw-toolLabel {
      font-size: 11px;
      letter-spacing: 0.01em;
      white-space: nowrap;
    }
    /* AI assist panel */
    .zw-assist {
      display: flex;
      flex-direction: column;
      gap: 10px;
    }
    .zw-assistBar {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .zw-assistAction {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 5px 9px;
      border: 1px solid var(--zw-border);
      border-radius: 999px;
      background: var(--zw-surface);
      color: var(--zw-text-2);
      font-size: 12px;
      cursor: pointer;
      transition: border-color 120ms ease, color 120ms ease, background 120ms ease;
    }
    .zw-assistAction:hover {
      border-color: var(--zw-accent);
      color: var(--zw-text);
      background: var(--zw-accent-soft);
    }
    .zw-assistActionOn {
      border-color: var(--zw-accent);
      color: var(--zw-accent-text);
      background: var(--zw-accent-soft);
    }
    .zw-assistAction:disabled {
      opacity: 0.55;
      cursor: default;
    }
    .zw-assistBusy {
      display: flex;
      align-items: center;
      gap: 6px;
      color: var(--zw-text-3);
      font-size: 12px;
    }
    .zw-assistPanel {
      border: 1px solid var(--zw-border);
      border-radius: 10px;
      background: var(--zw-bg-soft);
      padding: 10px 11px;
      display: flex;
      flex-direction: column;
      gap: 9px;
      animation: zwFade 160ms ease;
    }
    .zw-assistHead {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--zw-text);
    }
    .zw-assistHeadTag {
      margin-left: auto;
      font-weight: 400;
      font-size: 11px;
      color: var(--zw-text-3);
    }
    .zw-assistRow {
      display: flex;
      gap: 8px;
      align-items: baseline;
      font-size: 12px;
      line-height: 1.55;
    }
    .zw-assistKey {
      flex: 0 0 62px;
      color: var(--zw-text-3);
    }
    .zw-assistVal {
      flex: 1;
      min-width: 0;
      color: var(--zw-text);
      display: flex;
      flex-wrap: wrap;
      gap: 5px;
      align-items: center;
    }
    .zw-assistReason {
      color: var(--zw-text-3);
      font-size: 11px;
    }
    .zw-assistFoot {
      display: flex;
      gap: 6px;
      justify-content: flex-end;
      border-top: 1px dashed var(--zw-border);
      padding-top: 8px;
    }
    .zw-assistList {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .zw-assistItem {
      border: 1px solid var(--zw-border);
      border-radius: 8px;
      background: var(--zw-surface);
      padding: 7px 9px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .zw-assistItemTop {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .zw-assistItemTitle {
      font-size: 12px;
      font-weight: 500;
      color: var(--zw-text);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
      flex: 1;
      min-width: 0;
      cursor: pointer;
    }
    .zw-assistItemTitle:hover {
      color: var(--zw-accent-2);
      text-decoration: underline;
    }
    .zw-assistItemMeta {
      font-size: 11px;
      color: var(--zw-text-3);
      display: flex;
      gap: 8px;
      flex-wrap: wrap;
    }
    .zw-assistItemBody {
      font-size: 12px;
      color: var(--zw-text-2);
      line-height: 1.55;
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
    }
    .zw-assistScore {
      font-variant-numeric: tabular-nums;
      color: var(--zw-text-3);
      font-size: 11px;
    }
    .zw-scoreBar {
      height: 3px;
      border-radius: 2px;
      background: var(--zw-bg-sunken);
      overflow: hidden;
    }
    .zw-scoreFill {
      height: 100%;
      background: var(--zw-accent);
    }
    .zw-assistSegs {
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .zw-assistSeg {
      border: 1px solid var(--zw-border);
      border-left: 3px solid var(--zw-accent);
      border-radius: 6px;
      background: var(--zw-surface);
      padding: 7px 9px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .zw-assistSegHead {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .zw-assistSegTitle {
      font-size: 12px;
      font-weight: 500;
      flex: 1;
      min-width: 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
    .zw-assistConflict {
      display: flex;
      flex-direction: column;
      gap: 6px;
      border: 1px solid color-mix(in srgb, var(--zw-warn) 40%, var(--zw-border));
      background: color-mix(in srgb, var(--zw-warn) 8%, var(--zw-surface));
      border-radius: 8px;
      padding: 9px 10px;
    }
    .zw-assistConflictHead {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: var(--zw-text);
    }
    .zw-assistChoices {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }
    .zw-assistChoice {
      padding: 4px 9px;
      border: 1px solid var(--zw-border);
      border-radius: 999px;
      background: var(--zw-surface);
      color: var(--zw-text-2);
      font-size: 12px;
      cursor: pointer;
    }
    .zw-assistChoice:hover {
      border-color: var(--zw-accent);
      color: var(--zw-text);
    }
    .zw-impactCol {
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .zw-impactLabel {
      font-size: 11px;
      letter-spacing: 0.03em;
      text-transform: uppercase;
      color: var(--zw-text-3);
    }
    .zw-impactRow {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      color: var(--zw-text-2);
    }
    .zw-impactDepth {
      font-size: 10px;
      color: var(--zw-text-3);
      border: 1px solid var(--zw-border);
      border-radius: 4px;
      padding: 0 4px;
    }

    /* toast action + focus ring */
    .zw-toastRow {
      display: flex;
      align-items: center;
      gap: 10px;
    }
    .zw-toastText {
      flex: 1;
      min-width: 0;
    }
    .zw-toastAction {
      border: 1px solid currentColor;
      border-radius: 999px;
      background: transparent;
      color: inherit;
      font-size: 12px;
      padding: 2px 9px;
      cursor: pointer;
      opacity: 0.85;
    }
    .zw-toastAction:hover {
      opacity: 1;
      background: rgba(255, 255, 255, 0.14);
    }
    :focus-visible {
      outline: 2px solid var(--zw-accent);
      outline-offset: 2px;
    }
    /* 生命周期 / 证据 / 版本 / 提案 */
    .zw-life {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .zw-lifeItem {
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .zw-lifeHead {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 11.5px;
      color: var(--zw-text-2);
    }
    .zw-lifeLabel {
      letter-spacing: 0.01em;
    }
    .zw-lifeValue {
      color: var(--zw-text);
      font-variant-numeric: tabular-nums;
    }
    .zw-lifeFoot {
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
      font-size: 11px;
      color: var(--zw-text-3);
    }
    .zw-protectNote {
      margin-top: 8px;
      padding: 7px 9px;
      border-radius: 8px;
      background: color-mix(in srgb, var(--zw-warn) 12%, transparent);
      color: var(--zw-warn);
      font-size: 11.5px;
      line-height: 1.55;
    }
    .zw-proposalList {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .zw-proposal {
      border: 1px solid color-mix(in srgb, var(--zw-accent) 38%, var(--zw-border));
      border-radius: 10px;
      padding: 9px 10px;
      background: color-mix(in srgb, var(--zw-accent) 6%, var(--zw-surface));
      display: flex;
      flex-direction: column;
      gap: 6px;
    }
    .zw-proposalHead {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 11.5px;
      color: var(--zw-accent-text);
    }
    .zw-proposalNote {
      font-size: 11.5px;
      color: var(--zw-text-2);
      line-height: 1.6;
    }
    .zw-proposalDiff {
      font-size: 12px;
      line-height: 1.65;
      color: var(--zw-text);
      background: var(--zw-bg-soft);
      border-radius: 8px;
      padding: 8px 9px;
      max-height: 160px;
      overflow: auto;
      white-space: pre-wrap;
    }
    .zw-proposalActions {
      display: flex;
      gap: 6px;
    }
    .zw-evidenceList {
      display: flex;
      flex-direction: column;
      gap: 8px;
    }
    .zw-evidence {
      border-left: 2px solid color-mix(in srgb, var(--zw-accent) 40%, transparent);
      padding: 2px 0 2px 9px;
      display: flex;
      flex-direction: column;
      gap: 4px;
    }
    .zw-evidenceTop {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .zw-evidenceText {
      font-size: 12px;
      line-height: 1.65;
      color: var(--zw-text);
      white-space: pre-wrap;
    }
    .zw-evidenceAdd {
      margin-top: 10px;
      display: flex;
      gap: 6px;
    }
    .zw-evidenceAdd .zw-input {
      flex: 1;
      min-width: 0;
    }
    .zw-versionList {
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .zw-version {
      display: flex;
      flex-direction: column;
      gap: 3px;
      padding: 7px 0;
      border-bottom: 1px dashed var(--zw-border);
    }
    .zw-version:last-child {
      border-bottom: 0;
    }
    .zw-versionTop {
      display: flex;
      align-items: center;
      gap: 7px;
      flex-wrap: wrap;
    }
    .zw-versionNo {
      font-size: 11px;
      font-variant-numeric: tabular-nums;
      color: var(--zw-text-3);
    }
    .zw-versionNote {
      font-size: 11.5px;
      color: var(--zw-text-2);
      line-height: 1.55;
    }
    /* 整理中心 / 调用记录 */
    .zw-tidy {
      display: flex;
      flex-direction: column;
      gap: 14px;
      padding: 4px 2px 24px;
    }
    .zw-tidyBar {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .zw-tidyStat {
      font-size: 11.5px;
      color: var(--zw-text-3);
      padding: 3px 9px;
      border-radius: 999px;
      background: var(--zw-bg-soft);
      border: 1px solid var(--zw-border);
    }
    .zw-tidyGrid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(330px, 1fr));
      gap: 14px;
      align-items: start;
    }
    .zw-tidyCard {
      border: 1px solid var(--zw-border);
      border-radius: 12px;
      background: var(--zw-surface);
      padding: 12px 13px 13px;
      display: flex;
      flex-direction: column;
      gap: 8px;
      min-height: 90px;
    }
    .zw-tidyCardWide {
      grid-column: 1 / -1;
    }
    .zw-tidyHead {
      display: flex;
      align-items: center;
      gap: 7px;
      color: var(--zw-text-2);
    }
    .zw-tidyTitle {
      font-size: 12.5px;
      font-weight: 600;
      color: var(--zw-text);
    }
    .zw-tidyCount {
      font-size: 11px;
      color: var(--zw-text-3);
      font-variant-numeric: tabular-nums;
      padding: 1px 7px;
      border-radius: 999px;
      background: var(--zw-bg-soft);
    }
    .zw-tidyHint {
      font-size: 11px;
      color: var(--zw-text-3);
      line-height: 1.55;
    }
    .zw-tidyEmpty {
      font-size: 11.5px;
      color: var(--zw-text-3);
      padding: 10px 0 4px;
    }
    .zw-tidyRow {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 10px;
      padding: 7px 0;
      border-top: 1px dashed var(--zw-border);
    }
    .zw-tidyRowBody {
      display: flex;
      flex-direction: column;
      gap: 3px;
      min-width: 0;
    }
    .zw-tidyRowTitle {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12.5px;
      color: var(--zw-text);
      flex-wrap: wrap;
    }
    .zw-tidyRowMeta {
      font-size: 11px;
      color: var(--zw-text-3);
      line-height: 1.5;
    }
    .zw-tidyRowActions {
      display: flex;
      gap: 5px;
      flex-shrink: 0;
    }
    .zw-tidyLink {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      border: 0;
      background: none;
      padding: 5px 0;
      color: var(--zw-text);
      font-size: 12.5px;
      cursor: pointer;
      text-align: left;
    }
    .zw-tidyLink:hover {
      color: var(--zw-accent-text);
    }
    .zw-versionTitle { font-size: 12px; color: var(--zw-text); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
.zw-versionNow { font-size: 11px; color: var(--zw-accent); }
.zw-recallNodes { display: flex; flex-wrap: wrap; align-items: center; gap: 4px; margin-top: 4px; font-size: 11px; color: var(--zw-text-2); }
.zw-recallList {
      display: flex;
      flex-direction: column;
      gap: 2px;
      padding: 2px 2px 20px;
    }
    .zw-recallRow {
      display: flex;
      flex-direction: column;
      gap: 7px;
      padding: 12px 2px;
      border-bottom: 1px dashed var(--zw-border);
    }
    .zw-recallTop {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
      color: var(--zw-text-2);
    }
    .zw-recallTask {
      font-size: 13px;
      color: var(--zw-text);
      flex: 1;
      min-width: 180px;
    }
    .zw-recallIds {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
    }    .zw-gnodeUp .zw-gnodeCore {
      stroke: var(--zw-accent-2) !important;
      stroke-width: 2.6;
    }
    .zw-gnodeDown .zw-gnodeCore {
      stroke: var(--zw-accent) !important;
      stroke-width: 2.6;
    }
    .zw-gedgeUp .zw-gedgePath {
      opacity: 1;
      stroke-width: 2;
    }
    .zw-gedgeDown .zw-gedgePath {
      opacity: 1;
      stroke-width: 2;
    }

    .zw-navAdd {
      width: 18px; height: 18px; margin-left: auto; display: grid; place-items: center;
      border: 0; border-radius: 6px; background: transparent; color: var(--zw-text-3); cursor: pointer;
    }
    .zw-navAdd:hover { background: var(--zw-bg-sunken); color: var(--zw-text); }
    .zw-navGroupLabel { display: flex; align-items: center; gap: 6px; }
    .zw-projectRow[draggable='true'] { cursor: grab; }
    .zw-projectRowDrag { opacity: 0.45; }
    .zw-projectRowOver { box-shadow: inset 0 2px 0 var(--zw-accent); }

    .zw-menuMask { position: fixed; inset: 0; z-index: 60; }
    .zw-menu {
      position: fixed; z-index: 61; min-width: 168px; padding: 5px;
      display: flex; flex-direction: column; gap: 2px;
      border: 1px solid var(--zw-border); border-radius: 10px;
      background: var(--zw-surface); box-shadow: var(--zw-shadow-lg, 0 12px 32px rgba(0, 0, 0, 0.28));
      animation: zwRise 120ms ease;
    }
    .zw-menuItem {
      display: flex; align-items: center; gap: 8px; height: 30px; padding: 0 9px;
      border: 0; border-radius: 7px; background: transparent; color: var(--zw-text);
      font-size: 12.5px; text-align: left; cursor: pointer;
    }
    .zw-menuItem:hover { background: var(--zw-bg-sunken); }
    .zw-menuItemDanger { color: var(--zw-danger); }
    .zw-menuSep { height: 1px; margin: 4px 6px; background: var(--zw-border); }

    .zw-settings { display: flex; flex-direction: column; gap: 14px; }
    .zw-settingsRow { display: flex; align-items: baseline; gap: 10px; font-size: 12.5px; }
    .zw-settingsKey { flex: 0 0 auto; color: var(--zw-text-3); }
    .zw-settingsPath {
      flex: 1; min-width: 0; padding: 3px 8px; border-radius: 6px;
      background: var(--zw-bg-sunken); color: var(--zw-text-2);
      font-size: 11.5px; overflow-wrap: anywhere;
    }
    .zw-settingsBlock { display: flex; flex-direction: column; gap: 6px; padding-top: 10px; border-top: 1px solid var(--zw-border); }
    .zw-settingsTitle { font-size: 13px; font-weight: 600; }
    .zw-settingsHint { font-size: 12px; color: var(--zw-text-3); line-height: 1.55; }
    .zw-settingsForm { display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .zw-settingsForm .zw-input { flex: 1; min-width: 220px; }
    .zw-fileInput { flex: 1; min-width: 200px; font-size: 12px; color: var(--zw-text-2); }

    .zw-frameLayer { pointer-events: none; }
    .zw-frameBox {
      fill: color-mix(in srgb, var(--zw-frame-color, var(--zw-accent)) 8%, transparent);
      stroke: color-mix(in srgb, var(--zw-frame-color, var(--zw-accent)) 46%, transparent);
      stroke-width: 1.4; stroke-dasharray: 7 6; rx: 18; ry: 18;
    }
    .zw-frameBoxSel { stroke-width: 2.2; stroke-dasharray: none; }
    .zw-frameLabel {
      pointer-events: auto; cursor: pointer; user-select: none;
      font-size: 12px; font-weight: 600;
      fill: color-mix(in srgb, var(--zw-frame-color, var(--zw-accent)) 82%, var(--zw-text));
    }
    .zw-frameCount { font-size: 10.5px; fill: var(--zw-text-3); }
    .zw-frameGroup { pointer-events: none; }
    .zw-frameLabelBg,
    .zw-frameLabel,
    .zw-frameCount { pointer-events: none; }

    .zw-frameHit { fill: transparent; stroke: none; cursor: move; pointer-events: all; }
    .zw-frameHandle { fill: var(--zw-surface); stroke: var(--zw-accent); stroke-width: 1.4; pointer-events: all; cursor: nwse-resize; }
    .zw-frameLabelBg {
      fill: var(--zw-bg-soft);
      stroke: color-mix(in srgb, var(--zw-frame-color, var(--zw-accent)) 40%, transparent);
      stroke-width: 1;
    }

    /* 左栏几何加固：品牌区、新建按钮、分组标题各自占位，窄窗口下不会互相压住 */
    .zw-rail { overflow: hidden; }
    .zw-brand,
    .zw-newBtn,
    .zw-navGroup,
    .zw-projects,
    .zw-railFoot { flex: 0 0 auto; }
    .zw-navScroll { margin-right: 0; padding-right: 0; }
    .zw-brandText { min-width: 0; display: flex; flex-direction: column; gap: 1px; }
    .zw-brandName { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-projectName { min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-navGroupLabel { flex: 0 0 auto; }
    /* 顶栏加固：标题先让位，右侧按钮不被挤压 */
    .zw-titleMain { min-width: 132px; }
    .zw-titleRow > .zw-iconBtn,
    .zw-titleRow > .zw-btn { flex: 0 0 auto; }
    .zw-search { flex: 1 1 200px; min-width: 168px; }
    .zw-projectRowDrag { opacity: 0.55; }
    .zw-projectRowOver { outline: 1px dashed var(--zw-accent); outline-offset: -1px; }

    /* relation row: a frame (not a memory) on the other end */
    .zw-relFrameName {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      color: var(--zw-text-2);
      border-bottom: 1px dashed var(--zw-border);
    }
.zw-framePick { border: 0; background: none; padding: 0; text-align: left; cursor: pointer; color: inherit; font: inherit; }
.zw-framePick:hover { text-decoration: underline; }
.zw-frameEdit { border: 0; background: none; padding: 0 2px; cursor: pointer; color: var(--zw-text-3); display: inline-flex; align-items: center; }
.zw-frameEdit:hover { color: var(--zw-text); }
    /* ================= 窄面板 / 详情栏适配加固 ================= */
    .zw-blockHead { flex-wrap: wrap; row-gap: 3px; }
    .zw-relRow { flex-wrap: wrap; }
    .zw-relActions { margin-left: auto; }
    .zw-toastWrap { max-width: min(560px, calc(100% - 20px)); }
    .zw-toast { max-width: 100%; }
    .zw-detailActions { flex-wrap: wrap; justify-content: flex-end; }

    @media (max-width: 620px) {
      .zw-detail { width: 100vw; max-width: 100vw; }
      .zw-detailHead { padding-left: 14px; padding-right: 14px; }
      .zw-detailScroll { padding-left: 14px; padding-right: 14px; }
      .zw-factGrid { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .zw-detailTitle { font-size: 14px; }
      .zw-assistBar { gap: 5px; }
      .zw-assistAction { font-size: 11.5px; padding: 5px 8px; }
    }
    /* ================= 集合管理 ================= */
    .zw-manageHint { padding: 2px 2px 8px; font-size: 11.5px; color: var(--zw-text-3); }
    .zw-manageList { display: flex; flex-direction: column; gap: 4px; }
    .zw-manageRow {
      display: flex; align-items: center; gap: 8px; flex-wrap: wrap;
      padding: 7px 9px; border: 1px solid var(--zw-border); border-radius: 9px;
      background: var(--zw-bg-soft); min-width: 0;
    }
    .zw-manageName {
      border: 0; background: transparent; padding: 0; cursor: pointer;
      font-size: 12.5px; font-weight: 600; color: var(--zw-text); text-align: left;
      max-width: 220px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .zw-manageName:hover { text-decoration: underline; }
    .zw-manageCount { font-size: 11px; color: var(--zw-text-3); }
    .zw-manageDesc {
      flex: 1 1 160px; min-width: 0; font-size: 11.5px; color: var(--zw-text-2);
      overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .zw-manageActions { display: flex; align-items: center; gap: 6px; margin-left: auto; flex-wrap: wrap; }
    .zw-mergeBox { display: flex; align-items: center; gap: 4px; }
    .zw-mergeBox .zw-selectWrap { min-width: 118px; }
    /* 知识对象节点：比记忆更稳、更"结"的圆形，用内圈字符标类型。 */
    .zw-gnodeKn .zw-gnodeCoreKn { transition: stroke-width 120ms ease; }
    .zw-gnodeKn:hover .zw-gnodeCoreKn { stroke-width: 2.6; }
    .zw-gnodeKnGlyph { font-size: 11px; font-weight: 700; fill: var(--zw-accent); pointer-events: none; user-select: none; }
    .zw-gnodeKnCount { font-size: 9px; font-weight: 700; fill: var(--zw-text-3); pointer-events: none; }
    .zw-gnodeKn .zw-gnodeLabel { font-weight: 650; }
    .zw-knTabs { display: flex; gap: 4px; padding: 2px; background: var(--zw-bg-sunken); border-radius: 8px; }
    .zw-knTab { border: none; background: transparent; color: var(--zw-text-2); font: inherit; font-size: 12px; padding: 4px 10px; border-radius: 6px; cursor: pointer; }
    .zw-knTab:hover { color: var(--zw-text); }
    .zw-knTabOn { background: var(--zw-surface); color: var(--zw-text); box-shadow: var(--zw-shadow-sm); }
    .zw-nodeMeta { display: flex; flex-wrap: wrap; gap: 4px; align-items: center; }
    .zw-nodeAttr { display: grid; grid-template-columns: minmax(64px, auto) minmax(0, 1fr); gap: 2px 10px; font-size: 12px; }
    .zw-nodeAttrKey { color: var(--zw-text-3); }
    .zw-nodeAttrValue { color: var(--zw-text); min-width: 0; overflow-wrap: anywhere; }
    .zw-stepList { display: flex; flex-direction: column; gap: 4px; }
    .zw-stepRow { display: flex; gap: 8px; align-items: flex-start; padding: 5px 0; border-top: 1px dashed var(--zw-border); }
    .zw-stepNo { flex: 0 0 18px; height: 18px; border-radius: 50%; background: var(--zw-bg-sunken); color: var(--zw-text-3); font-size: 11px; display: flex; align-items: center; justify-content: center; }
    .zw-stepBody { min-width: 0; flex: 1; }
    .zw-stepTitle { font-size: 12px; font-weight: 600; }
    .zw-stepNote { font-size: 11.5px; color: var(--zw-text-3); overflow-wrap: anywhere; }
    .zw-preview { border-radius: 8px; background: var(--zw-accent-soft); color: var(--zw-text); padding: 8px 10px; font-size: 12.5px; line-height: 1.6; }
    .zw-dupWarn { border-radius: 8px; border: 1px solid var(--zw-warn); padding: 8px 10px; font-size: 12px; display: flex; flex-direction: column; gap: 4px; }
    .zw-dupRow { display: flex; gap: 6px; align-items: center; justify-content: space-between; }

    .zw-knWrap { min-height: 0; }
    .zw-knBar { flex: 0 0 auto; }
    .zw-detailInner { display: flex; flex-direction: column; gap: 12px; padding: 14px 16px 26px; min-width: 0; }

    .zw-mergeTable { display: flex; flex-direction: column; gap: 2px; border: 1px solid var(--zw-border); border-radius: 10px; padding: 6px 10px; }
    .zw-mergeRow { display: grid; grid-template-columns: 92px minmax(0, 1fr) minmax(0, 1fr); gap: 8px; padding: 5px 0; border-bottom: 1px dashed var(--zw-border); font-size: 12px; }
    .zw-mergeRow:last-child { border-bottom: none; }
    .zw-mergeKey { color: var(--zw-text-3); }
    .zw-mergeVal { color: var(--zw-text-2); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zw-mergeValMain { color: var(--zw-text); font-weight: 600; }
  

    .zw-knHits { flex: 0 0 auto; border-bottom: 1px solid var(--zw-border); padding: 8px 12px; display: flex; flex-direction: column; gap: 4px; }
    .zw-knHitsHead { font-size: 11px; color: var(--zw-text-3); }
    .zw-knHit { display: flex; align-items: center; gap: 8px; width: 100%; text-align: left; border: none; background: transparent; color: var(--zw-text); padding: 4px 6px; border-radius: 7px; cursor: pointer; font-size: 12px; }
    .zw-knHit:hover { background: var(--zw-bg-soft); }
    .zw-knHitTitle { flex: 1 1 auto; min-width: 0; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
  
    .zw-stepEditRow { align-items: flex-start; flex-wrap: wrap; gap: 6px; }
    .zw-stepTools { display: flex; flex-direction: column; gap: 2px; flex: 0 0 auto; }
    .zw-stepTools .zw-iconBtn { width: 20px; height: 16px; }
    .zw-relGroups { display: flex; flex-direction: column; gap: 6px; }
    .zw-relGroup { display: flex; flex-direction: column; gap: 3px; }
    .zw-relGroupLabel { font-size: 11px; font-weight: 650; color: var(--zw-text-3); letter-spacing: .02em; }
    .zw-relGroup .zw-chipPicker { gap: 4px; }
.zw-recallPath { display: flex; gap: 6px; align-items: baseline; font-size: 11px; color: var(--zw-text-2); min-width: 0; }
.zw-recallPath > span { min-width: 0; overflow-wrap: anywhere; }

        .zw-hitGroups {
          display: flex;
          flex-direction: column;
          gap: 6px;
          padding: 0 2px 6px;
        }
`

    const ICONS = {
      search: [
        ['circle', { cx: 11, cy: 11, r: 6.8 }],
        ['path', { d: 'M20 20l-3.7-3.7' }]
      ],
      plus: [
        ['path', { d: 'M12 5v14' }],
        ['path', { d: 'M5 12h14' }]
      ],
      close: [
        ['path', { d: 'M6 6l12 12' }],
        ['path', { d: 'M18 6L6 18' }]
      ],
      check: [['path', { d: 'M5 12.5l4.2 4.3L19 6.5' }]],
      chevronDown: [['path', { d: 'M6 9.5l6 6 6-6' }]],
      chevronRight: [['path', { d: 'M9.5 6l6 6-6 6' }]],
      chevronLeft: [['path', { d: 'M14.5 6l-6 6 6 6' }]],
      star: [
        ['path', { d: 'M12 3.7l2.6 5.3 5.8.85-4.2 4.1 1 5.8-5.2-2.75-5.2 2.75 1-5.8L3.6 9.85l5.8-.85z' }]
      ],
      trash: [
        ['path', { d: 'M4 7h16' }],
        ['path', { d: 'M9.5 7V4.8h5V7' }],
        ['path', { d: 'M6.5 7l.9 12.2h9.2L17.5 7' }]
      ],
      edit: [
        ['path', { d: 'M4.5 19.5l.9-3.9L16.4 4.6l3 3L8.4 18.6z' }],
        ['path', { d: 'M14.6 6.4l3 3' }]
      ],
      link: [
        ['path', { d: 'M9.6 14.4l4.8-4.8' }],
        ['path', { d: 'M8.4 11.6l-1.7 1.7a3.6 3.6 0 0 0 5.1 5.1l1.7-1.7' }],
        ['path', { d: 'M15.6 12.4l1.7-1.7a3.6 3.6 0 0 0-5.1-5.1l-1.7 1.7' }]
      ],
      graph: [
        ['circle', { cx: 6, cy: 6.4, r: 2.3 }],
        ['circle', { cx: 18, cy: 7.4, r: 2.3 }],
        ['circle', { cx: 12, cy: 18, r: 2.3 }],
        ['path', { d: 'M8.2 6.9l7.6.5' }],
        ['path', { d: 'M7.2 8.3l3.9 7.6' }],
        ['path', { d: 'M16.9 9.5l-3.7 6.3' }]
      ],
      layers: [
        ['path', { d: 'M12 3.2l8.6 4.6L12 12.4 3.4 7.8z' }],
        ['path', { d: 'M3.4 12.6L12 17.2l8.6-4.6' }],
        ['path', { d: 'M3.4 16.9L12 21.5l8.6-4.6' }]
      ],
      filter: [
        ['path', { d: 'M3.5 5.5h17' }],
        ['path', { d: 'M6.5 12h11' }],
        ['path', { d: 'M10 18.5h4' }]
      ],
      sort: [
        ['path', { d: 'M4 7h9' }],
        ['path', { d: 'M4 12h6' }],
        ['path', { d: 'M4 17h4' }],
        ['path', { d: 'M17.5 5.5v13' }],
        ['path', { d: 'M14.5 15.5l3 3 3-3' }]
      ],
      list: [
        ['path', { d: 'M8.5 6h11.5' }],
        ['path', { d: 'M8.5 12h11.5' }],
        ['path', { d: 'M8.5 18h11.5' }],
        ['path', { d: 'M4 6h.01' }],
        ['path', { d: 'M4 12h.01' }],
        ['path', { d: 'M4 18h.01' }]
      ],
      grid: [
        ['rect', { x: 3.5, y: 3.5, width: 7, height: 7, rx: 2 }],
        ['rect', { x: 13.5, y: 3.5, width: 7, height: 7, rx: 2 }],
        ['rect', { x: 3.5, y: 13.5, width: 7, height: 7, rx: 2 }],
        ['rect', { x: 13.5, y: 13.5, width: 7, height: 7, rx: 2 }]
      ],
      more: [
        ['circle', { cx: 5.5, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 12, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }],
        ['circle', { cx: 18.5, cy: 12, r: 1.4, fill: 'currentColor', stroke: 'none' }]
      ],
      refresh: [
        ['path', { d: 'M20 11.5A8 8 0 1 1 17.4 6' }],
        ['path', { d: 'M20.4 3.6v5.4h-5.4' }]
      ],
      zoomIn: [
        ['circle', { cx: 11, cy: 11, r: 6.8 }],
        ['path', { d: 'M20 20l-3.6-3.6' }],
        ['path', { d: 'M11 8v6' }],
        ['path', { d: 'M8 11h6' }]
      ],
      zoomOut: [
        ['circle', { cx: 11, cy: 11, r: 6.8 }],
        ['path', { d: 'M20 20l-3.6-3.6' }],
        ['path', { d: 'M8 11h6' }]
      ],
      frame: [
        ['path', { d: 'M4 9V4.5h5' }],
        ['path', { d: 'M20 9V4.5h-5' }],
        ['path', { d: 'M4 15v4.5h5' }],
        ['path', { d: 'M20 15v4.5h-5' }]
      ],
      shuffle: [
        ['path', { d: 'M4 7h4l8 10h4' }],
        ['path', { d: 'M4 17h4l2.4-3' }],
        ['path', { d: 'M13 9.6L15.4 7H20' }],
        ['path', { d: 'M17.4 4.4L20 7l-2.6 2.6' }],
        ['path', { d: 'M17.4 14.4L20 17l-2.6 2.6' }]
      ],
      book: [
        ['path', { d: 'M4.5 5.6a2.6 2.6 0 0 1 2.6-2.6H19.5v15.5H7.1a2.6 2.6 0 0 0-2.6 2.6z' }],
        ['path', { d: 'M19.5 18.5v2' }]
      ],
      inbox: [
        ['path', { d: 'M3.8 13.2L6 4.6h12l2.2 8.6v6.2H3.8z' }],
        ['path', { d: 'M3.8 13.2h4.6l1 2.1h5.2l1-2.1h4.6' }]
      ],
      folder: [
        ['path', { d: 'M3.5 7.2a2 2 0 0 1 2-2h3.9l1.9 2.6h7.2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5.5a2 2 0 0 1-2-2z' }]
      ],
      tag: [
        ['path', { d: 'M20.4 13.2L13 20.6 3.4 11V3.4h7.6l9.4 9.4z' }],
        ['circle', { cx: 7.6, cy: 7.6, r: 1.1 }]
      ],
      sparkle: [
        ['path', { d: 'M11.4 3.4l1.7 4.9 4.9 1.7-4.9 1.7-1.7 4.9-1.7-4.9L4.8 10l4.9-1.7z' }],
        ['path', { d: 'M18.2 14.4l.8 2.3 2.3.8-2.3.8-.8 2.3-.8-2.3-2.3-.8 2.3-.8z' }]
      ],
      arrowRight: [
        ['path', { d: 'M4.5 12h14' }],
        ['path', { d: 'M13 6.5l5.5 5.5-5.5 5.5' }]
      ],
      arrowLeft: [
        ['path', { d: 'M19.5 12h-14' }],
        ['path', { d: 'M11 6.5L5.5 12 11 17.5' }]
      ],
      clock: [
        ['circle', { cx: 12, cy: 12, r: 8.4 }],
        ['path', { d: 'M12 7.4V12l3.2 2.1' }]
      ],
      target: [
        ['circle', { cx: 12, cy: 12, r: 8.2 }],
        ['circle', { cx: 12, cy: 12, r: 3.4 }]
      ],
      warning: [
        ['path', { d: 'M12 3.4l8.9 16.2H3.1z' }],
        ['path', { d: 'M12 9.4v5' }],
        ['path', { d: 'M12 17.2h.01' }]
      ],
      eye: [
        ['path', { d: 'M2.5 12S6.1 5.8 12 5.8 21.5 12 21.5 12 17.9 18.2 12 18.2 2.5 12 2.5 12z' }],
        ['circle', { cx: 12, cy: 12, r: 2.9 }]
      ],
      eyeOff: [
        ['path', { d: 'M2.5 12S6.1 5.8 12 5.8 21.5 12 21.5 12 17.9 18.2 12 18.2 2.5 12 2.5 12z' }],
        ['path', { d: 'M4 4l16 16' }]
      ],
      collapse: [
        ['path', { d: 'M8.5 4v4.5H4' }],
        ['path', { d: 'M15.5 4v4.5H20' }],
        ['path', { d: 'M8.5 20v-4.5H4' }],
        ['path', { d: 'M15.5 20v-4.5H20' }]
      ],
      expand: [
        ['path', { d: 'M4 8.5h4.5V4' }],
        ['path', { d: 'M20 8.5h-4.5V4' }],
        ['path', { d: 'M4 15.5h4.5V20' }],
        ['path', { d: 'M20 15.5h-4.5V20' }]
      ],
      settings: [
        ['path', { d: 'M4 7.5h16' }],
        ['path', { d: 'M4 16.5h16' }],
        ['circle', { cx: 9.5, cy: 7.5, r: 2 }],
        ['circle', { cx: 15, cy: 16.5, r: 2 }]
      ],
      box: [
        ['path', { d: 'M4 8.5V4h4.5' }],
        ['path', { d: 'M20 8.5V4h-4.5' }],
        ['path', { d: 'M4 15.5V20h4.5' }],
        ['path', { d: 'M20 15.5V20h-4.5' }]
      ],
      select: [['path', { d: 'M5.5 3.5L18 11.2l-5 1.1-2.6 4.6z' }]],
      home: [
        ['path', { d: 'M3.5 11L12 3.6l8.5 7.4' }],
        ['path', { d: 'M5.5 9.8V20h13V9.8' }]
      ],
      gavel: [
        ['rect', { x: 3.6, y: 3.6, width: 16.8, height: 16.8, rx: 4.4 }],
        ['path', { d: 'M8 12.4l2.9 2.9 5.3-6' }]
      ],
      help: [
        ['circle', { cx: 12, cy: 12, r: 8.4 }],
        ['path', { d: 'M9.6 9.5a2.5 2.5 0 1 1 3.3 2.4c-.8.3-1.2 1-1.2 2' }],
        ['path', { d: 'M11.8 17.3h.01' }]
      ],
      bulb: [
        ['path', { d: 'M12 3.2a6 6 0 0 0-3.5 10.9c.6.5.9 1.2.9 2h5.2c0-.8.3-1.5.9-2A6 6 0 0 0 12 3.2z' }],
        ['path', { d: 'M9.4 19h5.2' }],
        ['path', { d: 'M10.4 21.4h3.2' }]
      ],
      bookmark: [
        ['path', { d: 'M6.4 3.6h11.2v17l-5.6-4.2-5.6 4.2z' }]
      ],
      chart: [
        ['path', { d: 'M4 20V4' }],
        ['path', { d: 'M4 20h16' }],
        ['path', { d: 'M8 16.5v-4.6' }],
        ['path', { d: 'M13 16.5V8.2' }],
        ['path', { d: 'M18 16.5v-7' }]
      ],
      retro: [
        ['path', { d: 'M3.6 12a8.4 8.4 0 1 0 2.7-6.2' }],
        ['path', { d: 'M3.2 4.6v5h5' }]
      ],
      process: [
        ['rect', { x: 3.2, y: 4, width: 6.2, height: 5.2, rx: 1.6 }],
        ['rect', { x: 14.6, y: 14.8, width: 6.2, height: 5.2, rx: 1.6 }],
        ['path', { d: 'M9.4 6.6h3.4a2.4 2.4 0 0 1 2.4 2.4v5.8' }]
      ],
      copy: [
        ['rect', { x: 9, y: 9, width: 11.4, height: 11.4, rx: 2.4 }],
        ['path', { d: 'M15 5.4H6.4a2 2 0 0 0-2 2V16' }]
      ],
      dot: [['circle', { cx: 12, cy: 12, r: 3.2, fill: 'currentColor', stroke: 'none' }]],
      lock: [
        ['rect', { x: 4.5, y: 10.5, width: 15, height: 9.5, rx: 2.2 }],
        ['path', { d: 'M8 10.5V8a4 4 0 0 1 8 0v2.5' }],
        ['path', { d: 'M12 14v2.4' }]
      ],
      shield: [
        ['path', { d: 'M12 3.5 19 6v5.4c0 4.3-2.8 7.4-7 9.1-4.2-1.7-7-4.8-7-9.1V6l7-2.5Z' }],
        ['path', { d: 'M9 12.1l2.1 2.1L15.2 10' }]
      ],
      history: [
        ['path', { d: 'M4 12a8 8 0 1 0 2.6-5.9' }],
        ['path', { d: 'M4 4.5V8h3.5' }],
        ['path', { d: 'M12 8v4.4l3 1.8' }]
      ],
      broom: [
        ['path', { d: 'M14.5 4.5 19 9' }],
        ['path', { d: 'M13 6 18 11l-6.4 6.4a3.5 3.5 0 0 1-4.9 0l-1.1-1.1a3.5 3.5 0 0 1 0-4.9L13 6Z' }]
      ]
    }

    function Icon(props) {
      const shape = ICONS[props.name] || ICONS.dot
      const size = props.size || 14
      return h(
        'svg',
        {
          width: size,
          height: size,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: props.strokeWidth || 1.8,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          className: props.className,
          'aria-hidden': 'true',
          focusable: 'false'
        },
        shape.map((item, index) => h(item[0], { key: index, ...item[1] }))
      )
    }

    const TYPE_ICON = {
      decision: 'gavel',
      rule: 'book',
      assumption: 'help',
      question: 'help',
      proposal: 'bulb',
      reference: 'bookmark',
      metric: 'chart',
      retro: 'retro',
      process: 'process'
    }


    function createTranslator(dict) {
      const t = (key, vars) => {
        let text = dict[key]
        if (text === undefined) text = ZH[key]
        if (text === undefined) return key
        if (vars) {
          for (const name of Object.keys(vars)) {
            text = text.split('{' + name + '}').join(String(vars[name]))
          }
        }
        return text
      }
      t.has = (key) => dict[key] !== undefined || ZH[key] !== undefined
      return t
    }

    function pad2(value) {
      return String(value).padStart(2, '0')
    }

    function parseDate(value) {
      if (!value) return null
      const date = new Date(value)
      if (Number.isNaN(date.getTime())) return null
      return date
    }

    function formatDay(value) {
      const date = parseDate(value)
      if (!date) return ''
      const now = new Date()
      const sameYear = date.getFullYear() === now.getFullYear()
      return (
        (sameYear ? '' : date.getFullYear() + '-') +
        pad2(date.getMonth() + 1) +
        '-' +
        pad2(date.getDate())
      )
    }

    function formatDateTime(value) {
      const date = parseDate(value)
      if (!date) return ''
      return (
        date.getFullYear() +
        '-' +
        pad2(date.getMonth() + 1) +
        '-' +
        pad2(date.getDate()) +
        ' ' +
        pad2(date.getHours()) +
        ':' +
        pad2(date.getMinutes())
      )
    }

    function truncate(text, max) {
      const value = String(text || '')
      if (value.length <= max) return value
      return value.slice(0, Math.max(0, max - 1)) + '…'
    }

    function clamp(value, min, max) {
      return Math.min(max, Math.max(min, value))
    }

    function countBy(list, pick) {
      const result = {}
      for (const item of list) {
        const key = pick(item)
        if (!key) continue
        result[key] = (result[key] || 0) + 1
      }
      return result
    }

    function unique(list) {
      const seen = new Set()
      const out = []
      for (const item of list) {
        if (seen.has(item)) continue
        seen.add(item)
        out.push(item)
      }
      return out
    }

    function entryHaystack(entry) {
      return [
        entry.title,
        entry.summary,
        entry.content,
        (entry.tags || []).join(' '),
        (entry.domains || []).join(' '),
        entry.type,
        entry.status,
        (entry.facts || []).map((fact) => fact.label + ' ' + fact.value).join(' ')
      ]
        .join('\n')
        .toLowerCase()
    }

    function matchesQuery(entry, needle) {
      if (!needle) return true
      const terms = needle
        .toLowerCase()
        .split(/\s+/)
        .filter(Boolean)
      if (!terms.length) return true
      const haystack = entryHaystack(entry)
      return terms.every((term) => haystack.includes(term))
    }

    function matchesFilters(entry, filters) {
      if (filters.projectId && entry.projectId !== filters.projectId) return false
      if (filters.types.length && filters.types.indexOf(entry.type) < 0) return false
      if (filters.statuses.length && filters.statuses.indexOf(entry.status) < 0) return false
      if (filters.domains.length && !entry.domains.some((domain) => filters.domains.indexOf(domain) >= 0)) return false
      if (filters.tags.length && !entry.tags.some((tag) => filters.tags.indexOf(tag) >= 0)) return false
      return true
    }

    function sortEntries(list, mode) {
      const copy = list.slice()
      copy.sort((left, right) => {
        if (mode === 'title') return String(left.title).localeCompare(String(right.title), 'zh-Hans-CN')
        if (mode === 'created') return String(right.createdAt).localeCompare(String(left.createdAt))
        return String(right.updatedAt).localeCompare(String(left.updatedAt))
      })
      return copy
    }

    function isOfflineError(error) {
      if (!error) return false
      if (error.offline === true) return true
      const text = String((error && error.message) || error)
      return /failed to fetch|network ?error|load failed|econnrefused|networkerror|无法连接/i.test(text)
    }

    function errorText(error, t) {
      if (!error) return ''
      if (isOfflineError(error)) return t('error.offline')
      return (error && error.message) || String(error)
    }

    async function request(url, options) {
      // 带 body 的请求统一补 JSON 头，避免调用处漏写 content-type 被服务端 415 拒绝。
      const init = Object.assign({}, options || {})
      if (init.body !== undefined && init.body !== null) {
        const headers = Object.assign({ accept: 'application/json' }, init.headers || {})
        if (!headers['content-type']) headers['content-type'] = 'application/json'
        init.headers = headers
      }
      let response
      try {
        response = await fetch(url, init)
      } catch (error) {
        const wrapped = new Error((error && error.message) || String(error))
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
            : 'HTTP ' + response.status
        throw new Error(message)
      }
      return payload
    }

    function loadState() {
      return request(API, { method: 'GET', headers: { accept: 'application/json' }, cache: 'no-store' })
    }

    function mutateState(payload) {
      return request(API, {
        method: 'POST',
        headers: { 'content-type': 'application/json', accept: 'application/json' },
        body: JSON.stringify(payload)
      })
    }

    function renderProse(text) {
      const blocks = []
      let bullets = []
      const flush = () => {
        if (!bullets.length) return
        blocks.push(
          h(
            'ul',
            { key: 'ul-' + blocks.length, className: 'zw-proseUl' },
            bullets.map((item, index) => h('li', { key: index, className: 'zw-proseLi' }, item))
          )
        )
        bullets = []
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
          blocks.push(
            h('h5', { key: 'h-' + index, className: 'zw-proseH' }, line.replace(/^#{1,4}\s+/, ''))
          )
          return
        }
        if (/^[-*•]\s+/.test(line)) {
          bullets.push(line.replace(/^[-*•]\s+/, ''))
          return
        }
        flush()
        blocks.push(h('p', { key: 'p-' + index, className: 'zw-proseP' }, line))
      })
      flush()
      return blocks
    }

    /**
     * DSH 切深浅色用 body[data-ds-dark-theme]，旧外壳用过 html[data-theme] /
     * data-dsw-theme。全部探测并监听，切换主题时面板与关系图一起重绘。
     */
    function readThemeMode() {
      if (typeof document === 'undefined') return 'light'
      const html = document.documentElement
      const body = document.body
      if (body && body.hasAttribute('data-ds-dark-theme')) return 'dark'
      const attr =
        (body && body.getAttribute('data-theme')) ||
        (html && html.getAttribute('data-theme')) ||
        (html && html.getAttribute('data-dsw-theme')) ||
        (body && body.getAttribute('data-dsw-theme'))
      if (attr === 'dark' || attr === 'light') return attr
      const source = html && html.dataset ? html.dataset.dsThemeSource : ''
      if (source === 'dark') return 'dark'
      if (source === 'light') return 'light'
      try {
        if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) return 'dark'
      } catch (error) {
        /* matchMedia 不可用 */
      }
      return 'light'
    }

    // 界面上一些「展开 / 收起」的记忆，跨会话保留，但永远不是数据的一部分，
    // 存不进也读不崩：localStorage 不可用时直接退回默认值。
    function readFlag(key, fallback) {
      try {
        const raw = window.localStorage.getItem('zhiwei:' + key)
        if (raw === '1') return true
        if (raw === '0') return false
      } catch (error) {
        /* 隐私模式或没有 localStorage */
      }
      return fallback
    }

    function writeFlag(key, value) {
      try {
        window.localStorage.setItem('zhiwei:' + key, value ? '1' : '0')
      } catch (error) {
        /* 忽略：只是界面偏好 */
      }
    }

    function useThemeMode() {
      const [mode, setMode] = useState(readThemeMode)
      useEffect(() => {
        const sync = () => setMode(readThemeMode())
        sync()
        const observer = typeof MutationObserver === 'function' ? new MutationObserver(sync) : null
        if (observer && typeof document !== 'undefined' && document.body) {
          observer.observe(document.body, {
            attributes: true,
            attributeFilter: ['data-ds-dark-theme', 'data-theme', 'data-dsw-theme', 'class', 'style']
          })
        }
        let media = null
        try {
          if (window.matchMedia) {
            media = window.matchMedia('(prefers-color-scheme: dark)')
            if (media.addEventListener) media.addEventListener('change', sync)
            else if (media.addListener) media.addListener(sync)
          }
        } catch (error) {
          media = null
        }
        return () => {
          if (observer) observer.disconnect()
          try {
            if (media && media.removeEventListener) media.removeEventListener('change', sync)
            else if (media && media.removeListener) media.removeListener(sync)
          } catch (error) {
            /* ignore */
          }
        }
      }, [])
      return mode
    }

    function useDebounced(value, delay) {
      const [debounced, setDebounced] = useState(value)
      useEffect(() => {
        const timer = setTimeout(() => setDebounced(value), delay)
        return () => clearTimeout(timer)
      }, [value, delay])
      return debounced
    }

    function useOutsideClick(ref, active, onClose) {
      useEffect(() => {
        if (!active) return undefined
        const handler = (event) => {
          const node = ref.current
          if (node && !node.contains(event.target)) onClose()
        }
        document.addEventListener('mousedown', handler, true)
        return () => document.removeEventListener('mousedown', handler, true)
      }, [active, onClose, ref])
    }

    function useEscape(active, onEscape) {
      useEffect(() => {
        if (!active) return undefined
        const handler = (event) => {
          if (event.key === 'Escape') {
            event.stopPropagation()
            onEscape()
          }
        }
        document.addEventListener('keydown', handler, true)
        return () => document.removeEventListener('keydown', handler, true)
      }, [active, onEscape])
    }

    function collectionColor(color) {
      return 'var(--zw-region-' + (COLLECTION_COLORS.indexOf(color) >= 0 ? color : 'violet') + ')'
    }

    function typeColor(type) {
      return 'var(--zw-type-' + (TYPE_COLOR[type] ? type : 'retro') + ')'
    }

    function statusTone(status) {
      if (status === 'active') return 'zw-badge zw-badgeActive'
      if (status === 'pending') return 'zw-badge zw-badgePending'
      if (status === 'deprecated') return 'zw-badge zw-badgeDeprecated'
      if (status === 'archived') return 'zw-badge zw-badgeArchived'
      return 'zw-badge zw-badgeDraft'
    }

    function relationColor(type) {
      return RELATION_COLOR[type] || 'var(--zw-text-3)'
    }

    function labelOf(t, list, id, prefix) {
      const key = prefix + '.' + id
      if (t.has(key)) return t(key)
      const found = (list || []).find((item) => item.id === id)
      return found ? found.label : id
    }

    function hintOf(list, id) {
      const found = (list || []).find((item) => item.id === id)
      return found ? found.hint || '' : ''
    }


    function Modal(props) {
      useEscape(true, props.onClose)
      const onMaskDown = (event) => {
        if (event.target === event.currentTarget && props.dismissable !== false) props.onClose()
      }
      return h(
        'div',
        { className: 'zw-modalMask', onMouseDown: onMaskDown, role: 'presentation' },
        h(
          'div',
          {
            className: 'zw-modal' + (props.wide ? ' zw-modalWide' : ''),
            role: 'dialog',
            'aria-modal': 'true',
            'aria-label': props.title
          },
          h(
            'div',
            { className: 'zw-modalHead' },
            props.icon ? h(Icon, { name: props.icon, size: 15 }) : null,
            h('div', { className: 'zw-modalTitle' }, props.title),
            props.headExtra || null,
            h(
              'button',
              { type: 'button', className: 'zw-iconBtn', title: props.closeLabel, onClick: props.onClose },
              h(Icon, { name: 'close', size: 14 })
            )
          ),
          h('div', { className: 'zw-modalBody zw-scroll' }, props.children),
          props.footer ? h('div', { className: 'zw-modalFoot' }, props.footer) : null
        )
      )
    }

    function Popover(props) {
      const [open, setOpen] = useState(false)
      const wrapRef = useRef(null)
      useOutsideClick(wrapRef, open, () => setOpen(false))
      useEscape(open, () => setOpen(false))
      return h(
        'div',
        { className: 'zw-popoverHost', ref: wrapRef },
        props.trigger({ open: open, toggle: () => setOpen(!open) }),
        open
          ? h(
              'div',
              {
                className: 'zw-popover zw-scroll',
                style: props.width ? { minWidth: props.width } : undefined,
                role: 'menu'
              },
              props.children({ close: () => setOpen(false) })
            )
          : null
      )
    }

    function MultiChips(props) {
      return h(
        'div',
        { className: 'zw-chipPicker', role: 'group', 'aria-label': props.label },
        props.options.map((option) =>
          h(
            'button',
            {
              key: option.id,
              type: 'button',
              className: 'zw-chipOpt' + (props.value.indexOf(option.id) >= 0 ? ' zw-chipOptOn' : ''),
              'aria-pressed': props.value.indexOf(option.id) >= 0,
              title: option.hint || option.label,
              onClick: () => props.onToggle(option.id)
            },
            option.color ? h('span', { className: 'zw-chipDot', style: { background: option.color } }) : null,
            option.icon ? h(Icon, { name: option.icon, size: 11 }) : null,
            option.label
          )
        )
      )
    }

    function Select(props) {
      const value = props.value === undefined || props.value === null ? '' : String(props.value)
      return h(
        'div',
        { className: 'zw-selectWrap' },
        h(
          'select',
          {
            className: 'zw-select',
            value: value,
            'aria-label': props.label,
            title: props.title,
            onChange: (event) => props.onChange(event.target.value),
            disabled: props.disabled
          },
          props.placeholder ? h('option', { value: '' }, props.placeholder) : null,
          props.options.map((option) =>
            h('option', { key: option.id, value: option.id }, option.label)
          )
        ),
        h('span', { className: 'zw-selectCaret', 'aria-hidden': 'true' }, h(Icon, { name: 'chevronDown', size: 12 }))
      )
    }

    function Field(props) {
      return h(
        'label',
        { className: 'zw-field' + (props.inline ? ' zw-fieldInline' : '') },
        props.label
          ? h(
              'span',
              { className: 'zw-fieldLabel' },
              props.label,
              props.hint ? h('span', { className: 'zw-hint' }, ' · ' + props.hint) : null
            )
          : null,
        props.children
      )
    }

    function EmptyState(props) {
      return h(
        'div',
        { className: 'zw-empty' },
        h('div', { className: 'zw-emptyIcon' }, h(Icon, { name: props.icon || 'layers', size: 20 })),
        h('div', { className: 'zw-emptyTitle' }, props.title),
        props.text ? h('div', { className: 'zw-emptyText' }, props.text) : null,
        props.action || null
      )
    }

    function ConfirmButton(props) {
      const [armed, setArmed] = useState(false)
      useEffect(() => {
        if (!armed) return undefined
        const timer = setTimeout(() => setArmed(false), 3200)
        return () => clearTimeout(timer)
      }, [armed])
      return h(
        'button',
        {
          type: 'button',
          className: (props.className || 'zw-btn zw-btnSm') + (armed ? ' zw-btnDanger' : ''),
          disabled: props.disabled,
          title: props.title,
          onClick: (event) => {
            event.stopPropagation()
            if (!armed) {
              setArmed(true)
              return
            }
            setArmed(false)
            props.onConfirm()
          }
        },
        armed ? props.confirmLabel || props.label : props.label
      )
    }

    function ToastHost(props) {
      if (!props.toasts.length) return null
      return h(
        'div',
        { className: 'zw-toastWrap', role: 'status', 'aria-live': 'polite' },
        props.toasts.map((toast) =>
          h(
            'div',
            {
              key: toast.id,
              className: 'zw-toast ' + (toast.tone === 'error' ? 'zw-toastError' : 'zw-toastOk')
            },
            h(Icon, { name: toast.tone === 'error' ? 'warning' : 'check', size: 13 }),
            h(
              'div',
              { className: 'zw-toastRow' },
              h('span', { className: 'zw-toastText' }, toast.text),
              toast.action
                ? h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-toastAction',
                      onClick: () => {
                        const action = toast.action
                        if (props.onAction) props.onAction(toast)
                        if (action && typeof action.onClick === 'function') action.onClick()
                      }
                    },
                    toast.action.label
                  )
                : null
            )
          )
        )
      )
    }

    function SectionHead(props) {
      return h(
        'div',
        { className: 'zw-panelHead' },
        h(
          'div',
          { className: 'zw-panelTitle' },
          props.icon ? h(Icon, { name: props.icon, size: 13 }) : null,
          props.title,
          props.count !== undefined
            ? h('span', { className: 'zw-navCount' }, props.count)
            : null
        ),
        props.action || null
      )
    }

    function StatusDot(props) {
      return h('span', {
        className: 'zw-rowDot',
        style: { background: props.color || typeColor(props.type) },
        'aria-hidden': 'true'
      })
    }


    function LeftRail(props) {
      const t = props.t
      const nav = props.nav
      const collapsed = props.collapsed
      const stats = props.stats
      const tidyCount = props.tidyCount || 0
      const item = (kind, label, icon, count) =>
        h(
          'button',
          {
            type: 'button',
            className: 'zw-navItem' + (nav.kind === kind && !nav.id ? ' zw-navItemOn' : ''),
            title: collapsed ? label : undefined,
            onClick: () => props.onNav(kind)
          },
          h(Icon, { name: icon, size: 14 }),
          h('span', { className: 'zw-navLabel' }, label),
          count ? h('span', { className: 'zw-navCount' }, count) : null
        )

      return h(
        'aside',
        {
          className: 'zw-rail',
          'data-collapsed': collapsed ? 'true' : 'false',
          'aria-label': t('app.name')
        },
        h(
          'div',
          { className: 'zw-brand' },
          h('div', { className: 'zw-brandMark' }, h(Icon, { name: 'sparkle', size: 17 })),
          h(
            'div',
            { className: 'zw-brandText' },
            h('span', { className: 'zw-brandName' }, t('app.name')),
            h('span', { className: 'zw-brandBadge' }, t('app.badge'))
          )
        ),
        h(
          'button',
          { type: 'button', className: 'zw-newBtn', onClick: props.onNew, title: t('action.new') },
          h(Icon, { name: 'plus', size: 15 }),
          h('span', null, t('action.new'))
        ),
        h(
          'div',
          { className: 'zw-navScroll zw-scroll' },
          h(
            'div',
            { className: 'zw-navGroup' },
            item('overview', t('nav.overview'), 'home'),
            item('all', t('nav.all'), 'book', stats.entries),
            item('inbox', t('nav.inbox'), 'inbox', stats.inbox),
            item('tidy', t('nav.tidy'), 'broom', tidyCount),
            item('collections', t('nav.collections'), 'folder', stats.collections),
            item('favorites', t('nav.favorites'), 'star', stats.favorites),
            item('recent', t('nav.recent'), 'clock'),
            item('recall', t('nav.recall'), 'history', stats.recalls),
      item('knowledge', t('nav.knowledge'), 'layers', stats.nodes)
          ),
          props.projects.length
            ? h(
                'div',
                { className: 'zw-navGroup' },
                h(
                  'div',
                  { className: 'zw-navGroupLabel' },
                  h('span', null, t('nav.projects')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-navAdd',
                      title: t('nav.newProject'),
                      onClick: (event) => {
                        event.stopPropagation()
                        props.onNewProject()
                      }
                    },
                    h(Icon, { name: 'plus', size: 12 })
                  )
                ),
                h(
                  'div',
                  { className: 'zw-projects zw-scroll' },
                  props.projects.map((project) =>
                    h(
                      'button',
                      {
                        key: project.id,
                        type: 'button',
                        className:
                          'zw-projectRow' +
                          (nav.kind === 'project' && nav.id === project.id ? ' zw-projectRowOn' : ''),
                        title: project.name,
                        draggable: true,
                        onClick: () => props.onNav('project', project.id),
                        onContextMenu: (event) => {
                          event.preventDefault()
                          props.onProjectMenu(project, event.clientX, event.clientY)
                        },
                        onDragStart: () => props.onProjectDragStart(project.id),
                        onDragEnd: () => props.onProjectDragEnd(),
                        onDragOver: (event) => {
                          event.preventDefault()
                          props.onProjectDragOver(project.id)
                        },
                        onDrop: (event) => {
                          event.preventDefault()
                          props.onProjectDrop(project.id)
                        }
                      },
                      h('span', {
                        className: 'zw-projectDot',
                        style: { background: project.color || 'var(--zw-accent)' }
                      }),
                      h('span', { className: 'zw-projectName' }, project.name),
                      h(
                        'span',
                        { className: 'zw-projectCount' },
                        props.projectCounts[project.id] || 0
                      )
                    )
                  )
                )
              )
            : null,
          h(
            'div',
            { className: 'zw-navGroup' },
            item('graph', t('nav.graph'), 'graph', stats.relations)
          )
        ),
        h(
          'div',
          { className: 'zw-railFoot' },
          h('div', { className: 'zw-navGroupLabel' }, t('nav.savedViews')),
          props.views.length
            ? props.views.map((view) =>
                h(
                  'div',
                  { key: view.id, className: 'zw-savedView', title: view.name },
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-savedOpen',
                      onClick: () => props.onOpenView(view)
                    },
                    h(Icon, { name: 'target', size: 12 }),
                    h('span', { className: 'zw-savedLabel' }, view.name)
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-savedDel',
                      title: t('nav.deleteView'),
                      onClick: () => (props.onDeleteView ? props.onDeleteView(view) : null)
                    },
                    h(Icon, { name: 'close', size: 11 })
                  )
                )
              )
            : h('div', { className: 'zw-savedEmpty' }, t('nav.savedViewsEmpty')),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-railToggle',
              title: collapsed ? t('nav.expand') : t('nav.collapse'),
              onClick: props.onToggleCollapsed
            },
            h(Icon, { name: collapsed ? 'expand' : 'collapse', size: 13 }),
            h('span', { className: 'zw-railToggleLabel' }, collapsed ? t('nav.expand') : t('nav.collapse'))
          )
        )
      )
    }

    function SidebarIcon() {
      return h(
        'svg',
        {
          width: 18,
          height: 18,
          viewBox: '0 0 24 24',
          fill: 'none',
          stroke: 'currentColor',
          strokeWidth: 1.7,
          strokeLinecap: 'round',
          strokeLinejoin: 'round',
          'aria-hidden': 'true'
        },
        h('circle', { cx: 6.2, cy: 6.6, r: 2.4 }),
        h('circle', { cx: 17.8, cy: 8.2, r: 2.4 }),
        h('circle', { cx: 12, cy: 17.6, r: 2.4 }),
        h('path', { d: 'M8.4 7.1l7 .8' }),
        h('path', { d: 'M7.2 8.8l3.4 6.6' }),
        h('path', { d: 'M16.6 10.2l-3.2 5.2' })
      )
    }


    function FacetMenu(props) {
      const t = props.t
      const activeCount = props.value.length
      return h(Popover, {
        width: props.width,
        trigger: ({ toggle, open }) =>
          h(
            'button',
            {
              type: 'button',
              className:
                'zw-chip' + (activeCount ? ' zw-chipOn' : '') + (open ? ' zw-chipOpen' : ''),
              onClick: toggle,
              'aria-expanded': open
            },
            props.label,
            activeCount
              ? h('span', { className: 'zw-popCheck' }, activeCount)
              : h(Icon, { name: 'chevronDown', size: 11 })
          ),
        children: ({ close }) =>
          h(
            'div',
            null,
            props.options.length
              ? props.options.map((option) =>
                  h(
                    'button',
                    {
                      key: option.id,
                      type: 'button',
                      className:
                        'zw-popItem' + (props.value.indexOf(option.id) >= 0 ? ' zw-popItemOn' : ''),
                      onClick: () => props.onToggle(option.id)
                    },
                    option.color
                      ? h('span', { className: 'zw-legendDot', style: { background: option.color } })
                      : h('span', {
                          className: 'zw-rowDot',
                          style: { background: option.type ? typeColor(option.type) : 'transparent', opacity: 0.9 }
                        }),
                    h('span', { className: 'zw-popLabel' }, option.label),
                    option.count !== undefined
                      ? h('span', { className: 'zw-legendCount' }, option.count)
                      : null,
                    h(
                      'span',
                      { className: 'zw-popCheck' },
                      props.value.indexOf(option.id) >= 0 ? h(Icon, { name: 'check', size: 12 }) : null
                    )
                  )
                )
              : h('div', { className: 'zw-savedEmpty' }, t('common.empty')),
            activeCount
              ? h(
                  'div',
                  null,
                  h('div', { className: 'zw-popSep' }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-popItem',
                      onClick: () => {
                        props.onClear()
                        close()
                      }
                    },
                    h(Icon, { name: 'close', size: 12 }),
                    h('span', { className: 'zw-popLabel' }, t('action.reset'))
                  )
                )
              : null
          )
      })
    }

    function FilterBar(props) {
      const t = props.t
      const meta = props.meta
      const filters = props.filters
      const toggle = (field, value) => {
        const current = filters[field]
        const next = current.indexOf(value) >= 0 ? current.filter((item) => item !== value) : current.concat([value])
        props.onChange({ ...filters, [field]: next })
      }
      const typeOptions = meta.entryTypes.map((type) => ({
        id: type.id,
        label: labelOf(t, meta.entryTypes, type.id, 'type'),
        count: props.counts.type[type.id] || 0,
        type: type.id
      }))
      const domainOptions = meta.domains.map((domain) => ({
        id: domain.id,
        label: labelOf(t, meta.domains, domain.id, 'domain'),
        count: props.counts.domain[domain.id] || 0
      }))
      const statusOptions = meta.statuses.map((status) => ({
        id: status.id,
        label: labelOf(t, meta.statuses, status.id, 'status'),
        count: props.counts.status[status.id] || 0
      }))
      const tagOptions = props.tagOptions
      const anyActive =
        filters.types.length + filters.domains.length + filters.statuses.length + filters.tags.length > 0

      return h(
        'div',
        { className: 'zw-filterbar' },
        h('span', { className: 'zw-filterLabel' }, h(Icon, { name: 'filter', size: 12 })),
        h(FacetMenu, {
          t: t,
          label: t('filter.type'),
          value: filters.types,
          options: typeOptions,
          onToggle: (value) => toggle('types', value),
          onClear: () => props.onChange({ ...filters, types: [] })
        }),
        h(FacetMenu, {
          t: t,
          label: t('filter.domain'),
          value: filters.domains,
          options: domainOptions,
          onToggle: (value) => toggle('domains', value),
          onClear: () => props.onChange({ ...filters, domains: [] })
        }),
        h(FacetMenu, {
          t: t,
          label: t('filter.status'),
          value: filters.statuses,
          options: statusOptions,
          onToggle: (value) => toggle('statuses', value),
          onClear: () => props.onChange({ ...filters, statuses: [] })
        }),
        tagOptions.length
          ? h(FacetMenu, {
              t: t,
              label: t('filter.tag'),
              value: filters.tags,
              options: tagOptions,
              width: 240,
              onToggle: (value) => toggle('tags', value),
              onClear: () => props.onChange({ ...filters, tags: [] })
            })
          : null,
        anyActive
          ? h(
              'button',
              {
                type: 'button',
                className: 'zw-filterLabel',
                style: { cursor: 'pointer', marginLeft: 4 },
                onClick: () =>
                  props.onChange({ types: [], domains: [], statuses: [], tags: [], projectId: filters.projectId })
              },
              t('filter.clearAll')
            )
          : null,
        h('span', { style: { flex: 1 } }),
        h(
          'div',
          { className: 'zw-seg', role: 'group', 'aria-label': t('list.filters') },
          h(
            'button',
            {
              type: 'button',
              className: 'zw-segBtn' + (props.layout === 'list' ? ' zw-segBtnOn' : ''),
              title: t('layout.list'),
              onClick: () => props.onLayout('list')
            },
            h(Icon, { name: 'list', size: 12 })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-segBtn' + (props.layout === 'cards' ? ' zw-segBtnOn' : ''),
              title: t('layout.cards'),
              onClick: () => props.onLayout('cards')
            },
            h(Icon, { name: 'grid', size: 12 })
          )
        ),
        h(Popover, {
          trigger: ({ toggle, open }) =>
            h(
              'button',
              {
                type: 'button',
                className: 'zw-chip' + (open ? ' zw-chipOn' : ''),
                onClick: toggle,
                title: t('sort.updated')
              },
              h(Icon, { name: 'sort', size: 12 }),
              t('sort.' + props.sort),
              h(Icon, { name: 'chevronDown', size: 11 })
            ),
          children: ({ close }) =>
            h(
              'div',
              null,
              ['updated', 'created', 'title'].map((mode) =>
                h(
                  'button',
                  {
                    key: mode,
                    type: 'button',
                    className: 'zw-popItem' + (props.sort === mode ? ' zw-popItemOn' : ''),
                    onClick: () => {
                      props.onSort(mode)
                      close()
                    }
                  },
                  h('span', { className: 'zw-popCheck' }, props.sort === mode ? h(Icon, { name: 'check', size: 12 }) : null),
                  h('span', { className: 'zw-popLabel' }, t('sort.' + mode))
                )
              )
            )
        })
      )
    }

    function MemoryRow(props) {
      const t = props.t
      const entry = props.entry
      const meta = props.meta
      const collections = props.collectionsFor(entry)
      const relationCount = props.relationCount(entry)
      return h(
        'div',
        {
          className: 'zw-row' + (props.active ? ' zw-rowOn' : ''),
          role: 'button',
          tabIndex: 0,
          onClick: () => props.onOpen(entry.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              props.onOpen(entry.id)
            }
          }
        },
        h(
          'button',
          {
            type: 'button',
            className: 'zw-rowCheck' + (props.checked ? ' zw-rowCheckOn' : ''),
            'aria-pressed': props.checked,
            title: t('action.selectAll'),
            onClick: (event) => {
              event.stopPropagation()
              props.onCheck(entry.id)
            }
          },
          props.checked ? h(Icon, { name: 'check', size: 12 }) : null
        ),
        h(
          'div',
          { className: 'zw-rowBody' },
          h(
            'div',
            { className: 'zw-rowTop' },
            h(StatusDot, { type: entry.type }),
            h('span', { className: 'zw-rowTitle' }, entry.title || t('common.empty')),
            h(
              'span',
              { className: 'zw-badge zw-badgeType' },
              labelOf(t, meta.entryTypes, entry.type, 'type')
            ),
            h('span', { className: statusTone(entry.status) }, labelOf(t, meta.statuses, entry.status, 'status'))
          ),
          entry.summary
            ? h('div', { className: 'zw-rowSummary' }, entry.summary)
            : entry.content
              ? h('div', { className: 'zw-rowSummary' }, truncate(entry.content.replace(/\n+/g, ' '), 160))
              : null,
          h(
            'div',
            { className: 'zw-rowMeta' },
            entry.domains.slice(0, 3).map((domain) =>
              h('span', { key: domain, className: 'zw-tag' }, labelOf(t, meta.domains, domain, 'domain'))
            ),
            collections.slice(0, 2).map((collection) =>
              h(
                'span',
                {
                  key: collection.id,
                  className: 'zw-tag',
                  style: { color: collectionColor(collection.color) }
                },
                '# ' + collection.name
              )
            ),
            collections.length > 2
              ? h('span', { className: 'zw-tag' }, '+' + (collections.length - 2))
              : null,
            entry.tags.slice(0, 3).map((tag) => h('span', { key: tag, className: 'zw-tag' }, '#' + tag)),
            relationCount
              ? h('span', { className: 'zw-tag' }, relationCount + ' ' + t('detail.relations'))
              : null
          )
        ),
        h(
          'div',
          { className: 'zw-rowSide' },
          h(
            'button',
            {
              type: 'button',
              className: 'zw-star' + (entry.favorite ? ' zw-starOn' : ''),
              title: entry.favorite ? t('detail.unfavorite') : t('detail.favorite'),
              onClick: (event) => {
                event.stopPropagation()
                props.onStar(entry.id, !entry.favorite)
              }
            },
            h(Icon, { name: 'star', size: 13 })
          ),
          h('span', { className: 'zw-rowDate', title: formatDateTime(entry.updatedAt) }, formatDay(entry.updatedAt))
        )
      )
    }

    function MemoryCard(props) {
      const t = props.t
      const entry = props.entry
      const meta = props.meta
      return h(
        'div',
        {
          className: 'zw-card' + (props.active ? ' zw-cardOn' : ''),
          role: 'button',
          tabIndex: 0,
          onClick: () => props.onOpen(entry.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              props.onOpen(entry.id)
            }
          }
        },
        h(
          'div',
          { className: 'zw-cardTop' },
          h(StatusDot, { type: entry.type }),
          h('span', { className: 'zw-badge zw-badgeType' }, labelOf(t, meta.entryTypes, entry.type, 'type')),
          h('span', { className: statusTone(entry.status) }, labelOf(t, meta.statuses, entry.status, 'status')),
          h('span', { style: { flex: 1 } }),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-star' + (entry.favorite ? ' zw-starOn' : ''),
              onClick: (event) => {
                event.stopPropagation()
                props.onStar(entry.id, !entry.favorite)
              }
            },
            h(Icon, { name: 'star', size: 12 })
          )
        ),
        h('div', { className: 'zw-cardTitle' }, entry.title),
        h(
          'div',
          { className: 'zw-cardSummary' },
          entry.summary || truncate(String(entry.content || '').replace(/\n+/g, ' '), 120)
        ),
        h(
          'div',
          { className: 'zw-cardMeta' },
          entry.domains.slice(0, 2).map((domain) =>
            h('span', { key: domain, className: 'zw-tag' }, labelOf(t, meta.domains, domain, 'domain'))
          ),
          entry.tags.slice(0, 2).map((tag) => h('span', { key: tag, className: 'zw-tag' }, '#' + tag)),
          h('span', { style: { flex: 1 } }),
          h('span', { className: 'zw-rowDate' }, formatDay(entry.updatedAt))
        )
      )
    }

    function MemoryList(props) {
      if (!props.entries.length) {
        return h(EmptyState, {
          icon: 'search',
          title: props.t('list.empty'),
          text: props.t('list.emptyHint'),
          action: h(
            'button',
            { type: 'button', className: 'zw-btn zw-btnSm', onClick: props.onNew },
            h(Icon, { name: 'plus', size: 13 }),
            props.t('action.new')
          )
        })
      }
      if (props.layout === 'cards') {
        return h(
          'div',
          { className: 'zw-cardGrid' },
          props.entries.map((entry) =>
            h(MemoryCard, {
              key: entry.id,
              t: props.t,
              meta: props.meta,
              entry: entry,
              active: props.selectedId === entry.id,
              onOpen: props.onOpen,
              onStar: props.onStar
            })
          )
        )
      }
      return h(
        'div',
        { className: 'zw-list' },
        props.entries.map((entry) =>
          h(MemoryRow, {
            key: entry.id,
            t: props.t,
            meta: props.meta,
            entry: entry,
            active: props.selectedId === entry.id,
            checked: props.selection.indexOf(entry.id) >= 0,
            onOpen: props.onOpen,
            onCheck: props.onCheck,
            onStar: props.onStar,
            collectionsFor: props.collectionsFor,
            relationCount: props.relationCount
          })
        )
      )
    }


    function StatTile(props) {
      return h(
        'button',
        { type: 'button', className: 'zw-stat', onClick: props.onClick },
        h('div', { className: 'zw-statValue' }, props.value),
        h(
          'div',
          { className: 'zw-statLabel' },
          h(Icon, { name: props.icon, size: 12 }),
          props.label
        )
      )
    }

    function MiniRows(props) {
      if (!props.entries.length) {
        return h('div', { className: 'zw-savedEmpty' }, props.emptyText)
      }
      return h(
        'div',
        { className: 'zw-miniList' },
        props.entries.map((entry) =>
          h(
            'button',
            {
              key: entry.id,
              type: 'button',
              className: 'zw-mini',
              onClick: () => props.onOpen(entry.id)
            },
            h(StatusDot, { type: entry.type }),
            h(
              'div',
              { className: 'zw-miniBody' },
              h('span', { className: 'zw-miniTitle' }, entry.title),
              h(
                'span',
                { className: 'zw-miniMeta' },
                props.metaOf(entry),
                ' · ',
                formatDay(entry.updatedAt)
              )
            ),
            h(Icon, { name: 'chevronRight', size: 12 })
          )
        )
      )
    }

    function OverviewView(props) {
      const t = props.t
      const meta = props.meta
      const labelOfEntry = (entry) =>
        [
          labelOf(t, meta.entryTypes, entry.type, 'type'),
          entry.domains.length ? labelOf(t, meta.domains, entry.domains[0], 'domain') : ''
        ]
          .filter(Boolean)
          .join(' · ')

      const recent = sortEntries(props.entries, 'updated').slice(0, 6)
      const inbox = sortEntries(
        props.entries.filter((entry) => entry.status === 'draft' || entry.status === 'pending'),
        'updated'
      ).slice(0, 5)
      const decisions = sortEntries(
        props.entries.filter((entry) => entry.type === 'decision' && entry.status === 'active'),
        'updated'
      ).slice(0, 5)
      const favorites = sortEntries(
        props.entries.filter((entry) => entry.favorite),
        'updated'
      ).slice(0, 5)

      return h(
        'div',
        { className: 'zw-overview zw-scroll zw-fadeIn' },
        props.entries.length
          ? null
          : h(EmptyState, {
              icon: 'sparkle',
              title: t('overview.empty'),
              action: h(
                'button',
                { type: 'button', className: 'zw-btn zw-btnPrimary zw-btnSm', onClick: props.onNew },
                h(Icon, { name: 'plus', size: 13 }),
                t('action.new')
              )
            }),
        h(
          'div',
          { className: 'zw-statGrid' },
          h(StatTile, {
            value: props.stats.entries,
            label: t('overview.stat.total'),
            icon: 'book',
            onClick: () => props.onNav('all')
          }),
          h(StatTile, {
            value: props.stats.inbox,
            label: t('overview.stat.inbox'),
            icon: 'inbox',
            onClick: () => props.onNav('inbox')
          }),
          h(StatTile, {
            value: props.stats.collections,
            label: t('overview.stat.collections'),
            icon: 'folder',
            onClick: () => props.onNav('collections')
          }),
          h(StatTile, {
            value: props.stats.relations,
            label: t('overview.stat.relations'),
            icon: 'graph',
            onClick: () => props.onNav('graph')
          }),
          h(StatTile, {
            value: props.stats.recalls || 0,
            label: t('overview.stat.recalls'),
            icon: 'history',
            onClick: () => props.onNav('recall')
          })
        ),
        props.suggestedRelations.length
          ? h(
              'div',
              { className: 'zw-panelCard' },
              h(SectionHead, {
                icon: 'sparkle',
                title: t('overview.suggestedRelations'),
                count: props.suggestedRelations.length,
                action: h(
                  'button',
                  { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('graph') },
                  t('nav.graph')
                )
              }),
              h(
                'div',
                { className: 'zw-miniList' },
                props.suggestedRelations.slice(0, 4).map((item) =>
                  h(
                    'div',
                    { key: item.relation.id, className: 'zw-mini' },
                    h(Icon, { name: 'link', size: 12 }),
                    h(
                      'div',
                      { className: 'zw-miniBody' },
                      h(
                        'span',
                        { className: 'zw-miniTitle' },
                        item.from + ' → ' + item.to
                      ),
                      h(
                        'span',
                        { className: 'zw-miniMeta' },
                        labelOf(t, meta.relationTypes, item.relation.relationType, 'relation') +
                          (item.relation.description ? ' · ' + item.relation.description : '')
                      )
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: () => props.onDecide(item.relation.id, 'confirmed')
                      },
                      t('action.accept')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm zw-btnGhost',
                        onClick: () => props.onDecide(item.relation.id, 'rejected')
                      },
                      t('action.ignore')
                    )
                  )
                )
              )
            )
          : null,
        h(
          'div',
          { className: 'zw-columns' },
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'clock',
              title: t('overview.recent'),
              action: h(
                'button',
                { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('all') },
                t('common.all')
              )
            }),
            h(MiniRows, {
              entries: recent,
              metaOf: labelOfEntry,
              emptyText: t('common.empty'),
              onOpen: props.onOpen
            })
          ),
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'inbox',
              title: t('overview.inbox'),
              count: props.stats.inbox,
              action: h(
                'button',
                { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('inbox') },
                t('action.open')
              )
            }),
            h(MiniRows, {
              entries: inbox,
              metaOf: labelOfEntry,
              emptyText: t('common.empty'),
              onOpen: props.onOpen
            })
          ),
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'gavel',
              title: t('overview.decisions'),
              action: h(
                'button',
                {
                  type: 'button',
                  className: 'zw-panelLink',
                  onClick: () =>
                    props.onFilterNav('all', { types: ['decision'], statuses: ['active'] })
                },
                t('common.all')
              )
            }),
            h(MiniRows, {
              entries: decisions,
              metaOf: labelOfEntry,
              emptyText: t('common.empty'),
              onOpen: props.onOpen
            })
          ),
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'star',
              title: t('overview.favorites'),
              count: props.stats.favorites,
              action: h(
                'button',
                { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('favorites') },
                t('common.all')
              )
            }),
            h(MiniRows, {
              entries: favorites,
              metaOf: labelOfEntry,
              emptyText: t('common.empty'),
              onOpen: props.onOpen
            })
          ),
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'broom',
              title: t('tidy.title'),
              count: (props.stats.pendingProposals || 0) + (props.stats.suggestedRelations || 0),
              action: h(
                'button',
                { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('tidy') },
                t('action.open')
              )
            }),
            h(MiniRows, {
              entries: sortEntries(
                props.entries.filter((entry) => entry.status === 'review'),
                'updated'
              ).slice(0, 4),
              metaOf: labelOfEntry,
              emptyText: t('tidy.empty'),
              onOpen: props.onOpen
            })
          ),
          h(
            'div',
            { className: 'zw-panelCard' },
            h(SectionHead, {
              icon: 'history',
              title: t('recall.title'),
              count: (props.recalls || []).length,
              action: h(
                'button',
                { type: 'button', className: 'zw-panelLink', onClick: () => props.onNav('recall') },
                t('common.all')
              )
            }),
            (props.recalls || []).length
              ? h(
                  'div',
                  { className: 'zw-miniList' },
                  (props.recalls || []).slice(0, 4).map((recall) =>
                    h(
                      'div',
                      { key: recall.id, className: 'zw-mini' },
                      h(Icon, { name: 'target', size: 12 }),
                      h(
                        'div',
                        { className: 'zw-miniBody' },
                        h('span', { className: 'zw-miniTitle' }, recall.task),
                        h(
                          'span',
                          { className: 'zw-miniMeta' },
                          recallOutcomeLabel(t, recall.outcome) +
                            ' · ' +
                            formatDay(recall.createdAt)
                        )
                      )
                    )
                  )
                )
              : h('div', { className: 'zw-savedEmpty' }, t('recall.empty'))
          )
        )
      )
    }

    function CollectionCard(props) {
      const t = props.t
      const collection = props.collection
      return h(
        'div',
        {
          className: 'zw-collectionCard',
          style: { '--zw-hullColor': collectionColor(collection.color) },
          role: 'button',
          tabIndex: 0,
          onClick: () => props.onOpen(collection.id),
          onKeyDown: (event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault()
              props.onOpen(collection.id)
            }
          }
        },
        h(
          'div',
          { className: 'zw-collectionTop' },
          h('span', { className: 'zw-legendDot', style: { background: collectionColor(collection.color) } }),
          h('span', { className: 'zw-collectionName' }, collection.name),
          collection.source === 'ai'
            ? h(
                'span',
                { className: 'zw-collectionAi', title: t('collections.aiSource') },
                h(Icon, { name: 'sparkle', size: 11 })
              )
            : null
        ),
        h('div', { className: 'zw-collectionDesc' }, collection.description || t('common.empty')),
        h(
          'div',
          { className: 'zw-collectionMeta' },
          h(Icon, { name: 'layers', size: 11 }),
          collection.memberIds.length + ' ' + t('collections.memberCount'),
          collection.tags && collection.tags.length
            ? h('span', { className: 'zw-tag' }, '#' + collection.tags[0])
            : null,
          h('span', { style: { flex: 1 } }),
          collection.status === 'suggested'
            ? h('span', { className: 'zw-badge zw-badgePending' }, t('collections.aiSource'))
            : null
        )
      )
    }

    function CollectionManageRow(props) {
      const t = props.t
      const collection = props.collection
      const [mergeInto, setMergeInto] = useState('')
      const targets = props.collections.filter(
        (item) => item.id !== collection.id && item.status !== 'suggested'
      )
      return h(
        'div',
        { className: 'zw-manageRow' },
        h('span', {
          className: 'zw-legendDot',
          style: { background: collectionColor(collection.color) }
        }),
        h(
          'button',
          {
            type: 'button',
            className: 'zw-manageName',
            title: t('collections.open'),
            onClick: () => props.onOpen(collection.id)
          },
          collection.name
        ),
        h('span', { className: 'zw-manageCount' }, collection.memberIds.length + ' ' + t('collections.memberCount')),
        h('span', { className: 'zw-manageDesc' }, collection.description || t('common.empty')),
        h(
          'span',
          { className: 'zw-manageActions' },
          h(
            'button',
            { type: 'button', className: 'zw-btn zw-btnSm', onClick: () => props.onEdit(collection) },
            h(Icon, { name: 'edit', size: 12 }),
            t('action.edit')
          ),
          h(
            'button',
            { type: 'button', className: 'zw-btn zw-btnSm', onClick: () => props.onMembers(collection) },
            h(Icon, { name: 'layers', size: 12 }),
            t('collections.members')
          ),
          targets.length
            ? h(
                'span',
                { className: 'zw-mergeBox' },
                h(Select, {
                  value: mergeInto,
                  options: targets.map((item) => ({ id: item.id, label: item.name })),
                  placeholder: t('collections.mergeInto'),
                  onChange: setMergeInto
                }),
                h(ConfirmButton, {
                  label: t('collections.mergeAction'),
                  confirmLabel: t('collections.mergeConfirm'),
                  className: 'zw-btn zw-btnSm',
                  disabled: !mergeInto,
                  onConfirm: () => {
                    if (mergeInto) props.onMerge(collection.id, mergeInto)
                  }
                })
              )
            : null,
          h(ConfirmButton, {
            label: t('action.delete'),
            confirmLabel: t('action.deleteConfirm'),
            className: 'zw-btn zw-btnSm zw-btnDanger',
            onConfirm: () => props.onDelete(collection)
          })
        )
      )
    }

    function CollectionManage(props) {
      const t = props.t
      const rows = props.collections.filter((collection) => collection.status !== 'suggested')
      return h(
        'div',
        { className: 'zw-panelCard' },
        h(SectionHead, { icon: 'layers', title: t('collections.manage'), count: rows.length }),
        h('div', { className: 'zw-manageHint' }, t('collections.manageHint')),
        rows.length
          ? h(
              'div',
              { className: 'zw-manageList' },
              rows.map((collection) =>
                h(CollectionManageRow, {
                  key: collection.id,
                  t: t,
                  collection: collection,
                  collections: props.collections,
                  onOpen: props.onOpen,
                  onEdit: props.onEdit,
                  onMembers: props.onMembers,
                  onMerge: props.onMerge,
                  onDelete: props.onDelete
                })
              )
            )
          : h('div', { className: 'zw-tidyEmpty' }, t('collections.empty'))
      )
    }
    function CollectionsView(props) {
      const t = props.t
      const collections = props.collections.filter((collection) => collection.status !== 'suggested')
      const suggestions = props.suggestions
      const [manage, setManage] = useState(false)
      return h(
        'div',
        { className: 'zw-overview zw-scroll zw-fadeIn' },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' } },
          h('div', { className: 'zw-viewSub' }, t('collections.subtitle')),
          h('span', { style: { flex: 1 } }),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-btn zw-btnSm' + (props.suggesting ? ' zw-btnGhost' : ''),
              disabled: props.suggesting,
              onClick: props.onSuggest
            },
            h(Icon, { name: 'sparkle', size: 12, className: props.suggesting ? 'zw-spin' : undefined }),
            t('collections.suggestAi')
          ),
          h(
            'button',
            { type: 'button', className: 'zw-btn zw-btnSm', onClick: props.onCreate },
            h(Icon, { name: 'plus', size: 12 }),
            t('collections.new')
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-btn zw-btnSm' + (manage ? ' zw-btnPrimary' : ''),
              title: t('collections.manageHint'),
              onClick: () => setManage(!manage)
            },
            h(Icon, { name: 'layers', size: 12 }),
            t('collections.manage')
          )
        ),
        suggestions.length
          ? h(
              'div',
              { className: 'zw-panelCard' },
              h(SectionHead, {
                icon: 'sparkle',
                title: t('collections.aiFound'),
                count: suggestions.length
              }),
              h(
                'div',
                { className: 'zw-miniList' },
                suggestions.map((suggestion) =>
                  h(
                    'div',
                    { key: suggestion.id || suggestion.name, className: 'zw-mini' },
                    h(Icon, { name: 'folder', size: 12 }),
                    h(
                      'div',
                      { className: 'zw-miniBody' },
                      h('span', { className: 'zw-miniTitle' }, suggestion.name),
                      h(
                        'span',
                        { className: 'zw-miniMeta' },
                        (suggestion.description || '') +
                          (suggestion.memberIds ? ' · ' + suggestion.memberIds.length + ' ' + t('collections.memberCount') : '')
                      ),
                      suggestion.reasons && suggestion.reasons.length
                        ? h(
                            'span',
                            { className: 'zw-miniMeta' },
                            t('collections.reasons') + '：' + suggestion.reasons.join('；')
                          )
                        : null
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: () => props.onAccept(suggestion)
                      },
                      t('collections.accept')
                    )
                  )
                )
              )
            )
          : null,
        manage
          ? h(CollectionManage, {
              t: t,
              collections: props.collections,
              onOpen: props.onOpen,
              onEdit: props.onEdit,
              onMembers: props.onMembers,
              onMerge: props.onMerge,
              onDelete: props.onDelete
            })
          : null,
        manage
          ? null
          : h(
          'div',
          { className: 'zw-collectionGrid' },
          collections.length
            ? collections.map((collection) =>
                h(CollectionCard, {
                  key: collection.id,
                  t: t,
                  collection: collection,
                  onOpen: props.onOpen
                })
              )
            : h(EmptyState, {
                icon: 'folder',
                title: t('collections.empty'),
                text: t('collections.emptyHint'),
                action: h(
                  'button',
                  { type: 'button', className: 'zw-btn zw-btnSm', onClick: props.onCreate },
                  h(Icon, { name: 'plus', size: 12 }),
                  t('collections.new')
                )
              })
        )
      )
    }

    function CollectionDetail(props) {
      const t = props.t
      const meta = props.meta
      const collection = props.collection
      const [editing, setEditing] = useState(false)
      const [name, setName] = useState(collection.name)
      const [description, setDescription] = useState(collection.description || '')
      const [merging, setMerging] = useState(false)
      useEffect(() => {
        setName(collection.name)
        setDescription(collection.description || '')
      }, [collection.id])
      const members = props.members

      const saveHeader = () => {
        setEditing(false)
        if (name.trim() !== collection.name || description !== (collection.description || '')) {
          props.onUpdate({ name: name.trim() || collection.name, description: description })
        }
      }

      return h(
        'div',
        { className: 'zw-overview zw-scroll zw-fadeIn' },
        h(
          'div',
          { style: { display: 'flex', alignItems: 'flex-start', gap: 10 } },
          h('span', {
            className: 'zw-legendDot',
            style: { width: 14, height: 14, marginTop: 4, background: collectionColor(collection.color) }
          }),
          h(
            'div',
            { style: { flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 } },
            editing
              ? h('input', {
                  className: 'zw-input',
                  value: name,
                  autoFocus: true,
                  onChange: (event) => setName(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') saveHeader()
                    if (event.key === 'Escape') setEditing(false)
                  }
                })
              : h('h3', { className: 'zw-viewTitle', style: { fontSize: 18 } }, collection.name),
            editing
              ? h('textarea', {
                  className: 'zw-textarea',
                  style: { minHeight: 62 },
                  value: description,
                  onChange: (event) => setDescription(event.target.value)
                })
              : h(
                  'div',
                  { className: 'zw-viewSub' },
                  collection.description || t('collections.descPlaceholder')
                )
          ),
          h(
            'div',
            { style: { display: 'flex', alignItems: 'center', gap: 4 } },
            editing
              ? h(
                  'button',
                  { type: 'button', className: 'zw-btn zw-btnSm zw-btnPrimary', onClick: saveHeader },
                  t('action.save')
                )
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-iconBtn',
                    title: t('action.edit'),
                    onClick: () => setEditing(true)
                  },
                  h(Icon, { name: 'edit', size: 13 })
                ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('assist.summary'),
                onClick: () => props.onSummarize && props.onSummarize()
              },
              h(Icon, { name: 'sparkle', size: 13 })
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('collections.mergeInto'),
                onClick: () => setMerging(!merging)
              },
              h(Icon, { name: 'layers', size: 13 })
            ),
            h(ConfirmButton, {
              className: 'zw-iconBtn',
              label: h(Icon, { name: 'trash', size: 13 }),
              confirmLabel: h(Icon, { name: 'check', size: 13 }),
              title: t('action.delete'),
              onConfirm: () => props.onDelete(collection.id)
            })
          )
        ),
        merging
          ? h(
              'div',
              { className: 'zw-panelCard' },
              h(SectionHead, { icon: 'layers', title: t('collections.mergeInto') }),
              h(
                'div',
                { className: 'zw-miniList' },
                props.collections
                  .filter((item) => item.id !== collection.id && item.status !== 'suggested')
                  .map((item) =>
                    h(
                      'button',
                      {
                        key: item.id,
                        type: 'button',
                        className: 'zw-mini',
                        onClick: () => {
                          props.onMerge(collection.id, item.id)
                          setMerging(false)
                        }
                      },
                      h('span', {
                        className: 'zw-legendDot',
                        style: { background: collectionColor(item.color) }
                      }),
                      h(
                        'div',
                        { className: 'zw-miniBody' },
                        h('span', { className: 'zw-miniTitle' }, item.name),
                        h(
                          'span',
                          { className: 'zw-miniMeta' },
                          item.memberIds.length + ' ' + t('collections.memberCount')
                        )
                      ),
                      h(Icon, { name: 'arrowRight', size: 12 })
                    )
                  )
              )
            )
          : null,
        h(
          'div',
          { className: 'zw-panelCard' },
          h(SectionHead, {
            icon: 'layers',
            title: t('collections.members'),
            count: members.length,
            action: h(
              'button',
              { type: 'button', className: 'zw-panelLink', onClick: props.onAddMembers },
              t('collections.addMembers')
            )
          }),
          members.length
            ? h(
                'div',
                { className: 'zw-miniList' },
                members.map((entry) =>
                  h(
                    'div',
                    { key: entry.id, className: 'zw-mini' },
                    h(StatusDot, { type: entry.type }),
                    h(
                      'div',
                      { className: 'zw-miniBody', role: 'button', onClick: () => props.onOpen(entry.id) },
                      h('span', { className: 'zw-miniTitle' }, entry.title),
                      h(
                        'span',
                        { className: 'zw-miniMeta' },
                        labelOf(t, meta.entryTypes, entry.type, 'type') +
                          ' · ' +
                          labelOf(t, meta.statuses, entry.status, 'status')
                      )
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-iconBtn',
                        title: t('collections.removeMember'),
                        onClick: () => props.onRemoveMember(entry.id)
                      },
                      h(Icon, { name: 'close', size: 12 })
                    )
                  )
                )
              )
            : h('div', { className: 'zw-savedEmpty' }, t('collections.noMembers'))
        )
      )
    }


    function RelationRow(props) {
      const t = props.t
      const relation = props.relation
      const other = props.other
      const suggested = relation.status === 'suggested'
      return h(
        'div',
        { className: 'zw-relRow' + (suggested ? ' zw-relSuggested' : '') },
        h(
          'span',
          { className: 'zw-relGlyph', style: { color: relationColor(relation.relationType) } },
          h(Icon, { name: props.direction === 'in' ? 'arrowLeft' : 'arrowRight', size: 12 })
        ),
        h(
          'div',
          { className: 'zw-relBody' },
          h(
            'div',
            { className: 'zw-relName' },
            h(
              'span',
              { style: { color: relationColor(relation.relationType) } },
              props.direction === 'in' ? '‹ ' : ''
            ),
            h(
              'span',
              {
                className: other.frame ? 'zw-relFrameName' : '',
                role: 'button',
                tabIndex: 0,
                onClick: () => props.onOpen(other.id)
              },
              other.frame ? h(Icon, { name: 'frame', size: 11 }) : null,
              other.title
            ),
            h(
              'span',
              { className: 'zw-relNote' },
              ' · ',
              labelOf(t, props.meta.relationTypes, relation.relationType, 'relation')
            ),
            h(
              'span',
              { className: 'zw-tag', title: t('graph.byRelation') },
              labelOf(t, props.meta.relationStatuses, relation.status, 'relStatus')
            )
          ),
          relation.description
            ? h('div', { className: 'zw-relNote' }, relation.description)
            : null,
          suggested
            ? h(
                'div',
                { className: 'zw-relActions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm',
                    onClick: () => props.onDecide(relation.id, 'confirmed')
                  },
                  h(Icon, { name: 'check', size: 11 }),
                  t('action.accept')
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnGhost',
                    onClick: () => props.onDecide(relation.id, 'rejected')
                  },
                  t('action.ignore')
                )
              )
            : null
        ),
        suggested
          ? h(
              'span',
              { className: 'zw-badge zw-badgePending' },
              h(Icon, { name: 'sparkle', size: 10 }),
              t('relation.suggested')
            )
          : h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('relation.delete'),
                onClick: () => props.onDelete(relation.id)
              },
              h(Icon, { name: 'close', size: 11 })
            )
      )
    }

    function LifecycleBar(props) {
      const t = props.t
      const entry = props.entry
      const items = [
        { key: 'confidence', label: t('detail.confidence'), value: entry.confidence },
        { key: 'importance', label: t('detail.importance'), value: entry.importance }
      ]
      return h(
        'div',
        { className: 'zw-life' },
        items.map((item) =>
          h(
            'div',
            { key: item.key, className: 'zw-lifeItem' },
            h(
              'div',
              { className: 'zw-lifeHead' },
              h('span', { className: 'zw-lifeLabel' }, item.label),
              h('span', { className: 'zw-lifeValue' }, Math.round((item.value || 0) * 100) + '%')
            ),
            h(
              'div',
              { className: 'zw-scoreBar' },
              h('div', {
                className: 'zw-scoreFill',
                style: { width: Math.round((item.value || 0) * 100) + '%' }
              })
            )
          )
        ),
        h(
          'div',
          { className: 'zw-lifeFoot' },
          h('span', null, t('detail.usage') + ' ' + (entry.usageCount || 0) + ' ' + t('detail.recallTimes')),
          h('span', null, entry.lastUsedAt ? t('detail.lastUsed') + ' ' + formatDay(entry.lastUsedAt) : t('detail.neverUsed')),
          h('span', null, t('detail.evidenceCount') + ' ' + (entry.evidenceCount || 0))
        )
      )
    }

    function DetailRail(props) {
      const t = props.t
      const meta = props.meta
      const entry = props.entry
      const [confirmDelete, setConfirmDelete] = useState(false)
      const [evidenceText, setEvidenceText] = useState('')
      const [showAllVersions, setShowAllVersions] = useState(false)
      useEffect(() => {
        setConfirmDelete(false)
        setEvidenceText('')
        setShowAllVersions(false)
      }, [entry ? entry.id : null])

      if (!entry) {
        return h(
          'aside',
          { className: 'zw-detail' + (props.collapsed ? '' : ' zw-detailEmpty'), 'data-collapsed': props.collapsed ? 'true' : 'false' },
          props.collapsed
            ? h(
                'button',
                {
                  type: 'button',
                  className: 'zw-iconBtn',
                  title: t('detail.expand'),
                  onClick: props.onExpand
                },
                h(Icon, { name: 'chevronLeft', size: 14 })
              )
            : h(
                'div',
                { className: 'zw-empty', style: { padding: '40px 16px' } },
                h('div', { className: 'zw-emptyIcon' }, h(Icon, { name: 'book', size: 22 })),
                h('div', { className: 'zw-emptyTitle' }, t('detail.emptyTitle')),
                h('div', { className: 'zw-emptyText' }, t('detail.emptyText'))
              )
        )
      }

      const groups = props.relationGroups
      const assist = props.assist || {}
      return h(
        'aside',
        { className: 'zw-detail', 'data-collapsed': props.collapsed ? 'true' : 'false' },
        props.collapsed
          ? h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('detail.expand'),
                onClick: props.onExpand
              },
              h(Icon, { name: 'chevronLeft', size: 14 })
            )
          : h(
              'div',
              { className: 'zw-detailHead' },
              h(
                'div',
                { className: 'zw-detailTitleWrap' },
                h('h2', { className: 'zw-detailTitle' }, entry.title),
                h(
                  'div',
                  { className: 'zw-detailMeta' },
                  h(
                    'span',
                    {
                      className: 'zw-badge zw-badgeType',
                      style: {
                        color: typeColor(entry.type),
                        borderColor: typeColor(entry.type)
                      }
                    },
                    h(Icon, { name: TYPE_ICON[entry.type] || 'book', size: 10 }),
                    labelOf(t, meta.entryTypes, entry.type, 'type')
                  ),
                  h(
                    'span',
                    { className: statusTone(entry.status) },
                    labelOf(t, meta.statuses, entry.status, 'status')
                  ),
                  h(
                    'span',
                    { className: 'zw-badge zw-badgeNeutral' },
                    labelOf(t, meta.scopes, entry.scope || 'project', 'scope')
                  ),
                  (props.nodesOf ? props.nodesOf(entry) : []).map((node) =>
                    h(
                      'button',
                      {
                        key: 'node-' + node.id,
                        type: 'button',
                        className: 'zw-tag zw-tagBtn',
                        title: t('kn.memories'),
                        onClick: () => (props.onOpenNode ? props.onOpenNode(node) : null)
                      },
                      h(Icon, { name: 'layers', size: 10 }),
                      node.title
                    )
                  ),                  (entry.domains || []).map((domain) =>
                    h(
                      'span',
                      { key: domain, className: 'zw-tag' },
                      labelOf(t, meta.domains, domain, 'domain')
                    )
                  ),
                  h(
                    'span',
                    { className: 'zw-rowDate' },
                    formatDay(entry.updatedAt)
                  )
                )
              ),
              h(
                'div',
                { className: 'zw-detailActions' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-iconBtn',
                    title: entry.favorite ? t('action.unstar') : t('action.star'),
                    onClick: () => props.onStar(entry.id, !entry.favorite)
                  },
                  h(Icon, { name: 'star', size: 14, fill: entry.favorite ? 'currentColor' : 'none' })
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-iconBtn',
                    title: t('action.edit'),
                    onClick: () => props.onEdit(entry.id)
                  },
                  h(Icon, { name: 'edit', size: 14 })
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-iconBtn',
                    title: t('detail.collapse'),
                    onClick: props.onCollapse
                  },
                  h(Icon, { name: 'chevronRight', size: 14 })
                )
              )
            ),
        props.collapsed
          ? null
          : h(
              'div',
              { className: 'zw-detailScroll' },
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('span', { className: 'zw-blockTitle' }, t('detail.status')),
                  h(
                    'span',
                    { className: 'zw-blockHint' },
                    hintOf(meta.statuses, entry.status)
                  )
                ),
                h(
                  'div',
                  { className: 'zw-seg' },
                  meta.statuses.map((status) =>
                    h(
                      'button',
                      {
                        key: status.id,
                        type: 'button',
                        className:
                          'zw-segBtn' + (entry.status === status.id ? ' zw-segBtnOn' : ''),
                        onClick: () => props.onSetStatus(entry.id, status.id)
                      },
                      labelOf(t, meta.statuses, status.id, 'status')
                    )
                  )
                )
              ),
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h(
                    'span',
                    { className: 'zw-blockTitle' },
                    h(Icon, { name: entry.protectionLevel === 'protected' ? 'lock' : 'book', size: 12 }),
                    t('detail.protection')
                  ),
                  h('span', { className: 'zw-blockHint' }, hintOf(meta.protectionLevels, entry.protectionLevel))
                ),
                h(
                  'div',
                  { className: 'zw-seg' },
                  (meta.protectionLevels || []).map((level) =>
                    h(
                      'button',
                      {
                        key: level.id,
                        type: 'button',
                        className:
                          'zw-segBtn' + (entry.protectionLevel === level.id ? ' zw-segBtnOn' : ''),
                        title: labelOf(t, meta.protectionLevels, level.id, 'protection'),
                        onClick: () => props.onProtect(entry.id, level.id)
                      },
                      labelOf(t, meta.protectionLevels, level.id, 'protection')
                    )
                  )
                ),
                entry.protectionLevel === 'protected'
                  ? h('div', { className: 'zw-blockHint zw-protectNote' }, t('detail.protectionLocked'))
                  : null,
                props.pendingProposals && props.pendingProposals.length
                  ? h(
                      'div',
                      { className: 'zw-proposalList' },
                      props.pendingProposals.map((proposal) =>
                        h(
                          'div',
                          { key: proposal.id, className: 'zw-proposal' },
                          h(
                            'div',
                            { className: 'zw-proposalHead' },
                            h(Icon, { name: 'sparkle', size: 11 }),
                            t('detail.proposal') +
                              ' · ' +
                              labelOf(t, meta.changeTypes, proposal.changeType, 'change'),
                            proposal.protected ? h('span', { className: 'zw-tag' }, t('detail.protected')) : null
                          ),
                          proposal.reason
                            ? h('div', { className: 'zw-proposalNote' }, proposal.reason)
                            : null,
                          h('div', { className: 'zw-proposalDiff' }, proposal.proposedContent),
                          h(
                            'div',
                            { className: 'zw-proposalActions' },
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'zw-btn zw-btnSm zw-btnPrimary',
                                onClick: () => props.onDecideProposal(proposal.id, 'accept')
                              },
                              t('detail.accept')
                            ),
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'zw-btn zw-btnSm zw-btnGhost',
                                onClick: () => props.onDecideProposal(proposal.id, 'reject')
                              },
                              t('detail.reject')
                            )
                          )
                        )
                      )
                    )
                  : null,
                h(LifecycleBar, { t: t, entry: entry })
              ),
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h(
                    'span',
                    { className: 'zw-blockTitle' },
                    t('detail.evidence') + ' · ' + (entry.evidence ? entry.evidence.length : 0)
                  ),
                  h('span', { className: 'zw-blockHint' }, t('detail.evidenceHint'))
                ),
                entry.evidence && entry.evidence.length
                  ? h(
                      'div',
                      { className: 'zw-evidenceList' },
                      entry.evidence
                        .slice(-6)
                        .reverse()
                        .map((item) =>
                          h(
                            'div',
                            { key: item.id, className: 'zw-evidence' },
                            h(
                              'div',
                              { className: 'zw-evidenceTop' },
                              h(
                                'span',
                                { className: 'zw-tag' },
                                labelOf(t, meta.evidenceTypes, item.evidenceType, 'evidence')
                              ),
                              h(
                                'span',
                                { className: 'zw-rowDate' },
                                formatDay(item.createdAt) + (item.sourceConversation ? ' · ' + item.sourceConversation : '')
                              )
                            ),
                            h('div', { className: 'zw-evidenceText' }, item.content)
                          )
                        )
                    )
                  : h('div', { className: 'zw-savedEmpty' }, t('detail.noEvidence')),
                h(
                  'div',
                  { className: 'zw-evidenceAdd' },
                  h('input', {
                    className: 'zw-input',
                    value: evidenceText,
                    placeholder: t('detail.evidencePlaceholder'),
                    onChange: (event) => setEvidenceText(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key === 'Enter' && evidenceText.trim()) {
                        props.onAddEvidence(entry.id, evidenceText.trim())
                        setEvidenceText('')
                      }
                    }
                  }),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-btn zw-btnSm zw-btnGhost',
                      disabled: !evidenceText.trim(),
                      onClick: () => {
                        props.onAddEvidence(entry.id, evidenceText.trim())
                        setEvidenceText('')
                      }
                    },
                    h(Icon, { name: 'plus', size: 11 }),
                    t('detail.addEvidence')
                  )
                )
              ),
              entry.versions && entry.versions.length > 1
                ? h(
                    'div',
                    { className: 'zw-block' },
                    h(
                      'div',
                      { className: 'zw-blockHead' },
                      h(
                        'span',
                        { className: 'zw-blockTitle' },
                        t('detail.versions') + ' · ' + entry.versions.length
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-panelLink',
                          onClick: () => setShowAllVersions(!showAllVersions)
                        },
                        showAllVersions ? t('common.collapse') : t('common.expand')
                      )
                    ),
                    h(
                      'div',
                      { className: 'zw-versionList' },
                      entry.versions
                        .slice()
                        .reverse()
                        .slice(0, showAllVersions ? entry.versions.length : 3)
                        .map((version) =>
                          h(
                            'div',
                            { key: version.id, className: 'zw-version' },
                            h(
                              'div',
                              { className: 'zw-versionTop' },
                              h('span', { className: 'zw-versionNo' }, 'v' + version.version),
                              h(
                                'span',
                                { className: 'zw-tag' },
                                labelOf(t, meta.changeTypes, version.changeType, 'change')
                              ),
                              h('span', { className: 'zw-rowDate' }, formatDateTime(version.createdAt)),
                              version.version > 1
                                ? h(
                                    'button',
                                    {
                                      type: 'button',
                                      className: 'zw-panelLink',
                                      onClick: () => props.onRestoreVersion(entry.id, version.id)
                                    },
                                    t('detail.restore')
                                  )
                                : null
                            ),
                            version.changeReason
                              ? h('div', { className: 'zw-versionNote' }, version.changeReason)
                              : null
                          )
                        )
                    )
                  )
                : null,
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('span', { className: 'zw-blockTitle' }, t('detail.content'))
                ),
                h('div', { className: 'zw-prose' }, renderProse(entry.content))
              ),
              entry.facts.length
                ? h(
                    'div',
                    { className: 'zw-block' },
                    h(
                      'div',
                      { className: 'zw-blockHead' },
                      h('span', { className: 'zw-blockTitle' }, t('detail.facts'))
                    ),
                    h(
                      'div',
                      { className: 'zw-factGrid' },
                      entry.facts.map((fact, index) =>
                        h(
                          'div',
                          { key: index, className: 'zw-fact' },
                          h('span', { className: 'zw-factLabel' }, fact.label),
                          h('span', { className: 'zw-factValue' }, fact.value)
                        )
                      )
                    )
                  )
                : null,
              entry.tags.length
                ? h(
                    'div',
                    { className: 'zw-block' },
                    h(
                      'div',
                      { className: 'zw-blockHead' },
                      h('span', { className: 'zw-blockTitle' }, t('detail.tags'))
                    ),
                    h(
                      'div',
                      { className: 'zw-tagRow' },
                      entry.tags.map((tag) =>
                        h('span', { key: tag, className: 'zw-tag' }, '#' + tag)
                      )
                    )
                  )
                : null,
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('span', { className: 'zw-blockTitle' }, t('detail.collections')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-panelLink',
                      onClick: () => props.onEditCollections(entry.id)
                    },
                    t('action.edit')
                  )
                ),
                props.collections.length
                  ? h(
                      'div',
                      { className: 'zw-tagRow' },
                      props.collections.map((collection) =>
                        h(
                          'button',
                          {
                            key: collection.id,
                            type: 'button',
                            className: 'zw-tag zw-tagBtn',
                            onClick: () => props.onOpenCollection(collection.id)
                          },
                          h('span', {
                            className: 'zw-legendDot',
                            style: { background: collectionColor(collection.color), width: 7, height: 7 }
                          }),
                          collection.name
                        )
                      )
                    )
                  : h('div', { className: 'zw-savedEmpty' }, t('detail.noCollections'))
              ),
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h(
                    'span',
                    { className: 'zw-blockTitle' },
                    t('detail.relations') + ' · ' + props.relationCount
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-panelLink',
                      onClick: () => props.onCreateLink(entry.id)
                    },
                    h(Icon, { name: 'plus', size: 11 }),
                    t('relation.create')
                  )
                ),
                groups.length
                  ? groups.map((group) =>
                      h(
                        'div',
                        { key: group.type, className: 'zw-relGroup' },
                        h(
                          'div',
                          { className: 'zw-relGroupTitle' },
                          h('span', {
                            className: 'zw-legendDot',
                            style: { background: relationColor(group.type), width: 6, height: 6 }
                          }),
                          labelOf(t, meta.relationTypes, group.type, 'relation'),
                          ' · ',
                          group.items.length
                        ),
                        h(
                          'div',
                          { className: 'zw-relList' },
                          group.items.map((item) =>
                            h(RelationRow, {
                              key: item.relation.id,
                              t: t,
                              meta: meta,
                              relation: item.relation,
                              other: item.other,
                              direction: item.direction,
                              onOpen: props.onOpen,
                              onDecide: props.onDecideRelation,
                              onDelete: props.onDeleteRelation
                            })
                          )
                        )
                      )
                    )
                  : h('div', { className: 'zw-savedEmpty' }, t('detail.noRelations'))
              ),
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('span', { className: 'zw-blockTitle' }, t('assist.title')),
                  h('span', { className: 'zw-blockHint' }, t('assist.notApplied'))
                ),
                h(AssistPanel, {
                  t: t,
                  meta: meta,
                  scope: 'entry',
                  busy: assist.busy,
                  action: assist.action,
                  result: assist.result,
                  error: assist.error,
                  onRun: props.onAssist,
                  onClose: assist.onClose,
                  onOpenEntry: props.onOpen,
                  onOpenCollection: props.onOpenCollection,
                  onSplit: props.onSplitSegment,
                  onApply: props.onApplyOrganize,
                  onRelate: props.onRelateSuggestion,
                  onResolve: props.onResolveConflict,
                  onShowMembers: props.onShowMembers
                })
              ),              entry.history && entry.history.length
                ? h(
                    'div',
                    { className: 'zw-block' },
                    h(
                      'div',
                      { className: 'zw-blockHead' },
                      h('span', { className: 'zw-blockTitle' }, t('detail.history'))
                    ),
                    entry.history.slice(0, 5).map((item, index) =>
                      h(
                        'div',
                        { key: index, className: 'zw-historyRow' },
                        h('span', { className: 'zw-historyDot' }),
                        h(
                          'span',
                          null,
                          formatDateTime(item.at) + ' · ' + item.note
                        )
                      )
                    )
                  )
                : null,
              h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('span', { className: 'zw-blockTitle' }, t('detail.meta')),
                  h(
                    'span',
                    { className: 'zw-blockHint' },
                    labelOf(t, meta.sourceKinds, entry.source.kind, 'source') +
                      (entry.source.label ? ' · ' + entry.source.label : '')
                  )
                ),
                h(
                  'div',
                  { className: 'zw-blockHint' },
                  t('detail.created') + ' ' + formatDateTime(entry.createdAt)
                ),
                entry.legacy
                  ? h('div', { className: 'zw-blockHint' }, t('detail.legacy'))
                  : null,
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm' + (confirmDelete ? ' zw-btnDanger' : ' zw-btnGhost'),
                    style: { marginTop: 8 },
                    onClick: () => {
                      if (confirmDelete) {
                        props.onDelete(entry.id)
                        setConfirmDelete(false)
                      } else {
                        setConfirmDelete(true)
                        setTimeout(() => setConfirmDelete(false), 3200)
                      }
                    }
                  },
                  h(Icon, { name: confirmDelete ? 'check' : 'trash', size: 12 }),
                  confirmDelete ? t('action.deleteConfirm') : t('action.delete')
                )
              )
            )
      )
    }


    function FactsEditor(props) {
      const t = props.t
      const facts = props.value
      const update = (index, patch) => {
        const next = facts.slice()
        next[index] = Object.assign({}, next[index], patch)
        props.onChange(next)
      }
      return h(
        'div',
        { className: 'zw-facts' },
        facts.map((fact, index) =>
          h(
            'div',
            { key: index, className: 'zw-factRow' },
            h('input', {
              className: 'zw-input',
              placeholder: t('editor.factLabel'),
              value: fact.label,
              onChange: (event) => update(index, { label: event.target.value })
            }),
            h('input', {
              className: 'zw-input',
              placeholder: t('editor.factValue'),
              value: fact.value,
              onChange: (event) => update(index, { value: event.target.value })
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('action.delete'),
                onClick: () => props.onChange(facts.filter((_, i) => i !== index))
              },
              h(Icon, { name: 'close', size: 12 })
            )
          )
        ),
        h(
          'button',
          {
            type: 'button',
            className: 'zw-btn zw-btnSm zw-btnGhost',
            onClick: () => props.onChange(facts.concat([{ label: '', value: '' }]))
          },
          h(Icon, { name: 'plus', size: 12 }),
          t('editor.addFact')
        )
      )
    }

    function EntryEditor(props) {
      const t = props.t
      const meta = props.meta
      const source = props.entry
      const [draft, setDraft] = useState(() => ({
        title: source ? source.title : '',
        content: source ? source.content : '',
        type: source ? source.type : 'decision',
        status: source ? source.status : 'active',
        projectId: source ? source.projectId : props.defaultProjectId,
        domains: source ? source.domains.slice() : [],
        tags: source ? source.tags.slice() : [],
        facts: source ? source.facts.map((fact) => ({ label: fact.label, value: fact.value })) : [],
        sourceKind: source ? source.source.kind : 'manual',
        sourceLabel: source ? source.source.label || '' : '',
        collectionIds: source ? props.collectionsOf(source.id).map((collection) => collection.id) : [],
        favorite: source ? Boolean(source.favorite) : false,
        pinned: source ? Boolean(source.pinned) : false
      }))
      const [tagInput, setTagInput] = useState('')
      const [error, setError] = useState('')

      const patch = (key, value) => setDraft((prev) => Object.assign({}, prev, { [key]: value }))
      const toggleIn = (key, value) =>
        setDraft((prev) => {
          const list = prev[key]
          return Object.assign({}, prev, {
            [key]: list.includes(value) ? list.filter((item) => item !== value) : list.concat([value])
          })
        })

      const addTags = () => {
        const parts = tagInput
          .split(/[,，\s]+/)
          .map((item) => item.trim())
          .filter(Boolean)
        if (!parts.length) return
        patch('tags', unique(draft.tags.concat(parts)))
        setTagInput('')
      }

      const submit = () => {
        if (!draft.content.trim() && !draft.title.trim()) {
          setError(t('editor.needContent'))
          return
        }
        props.onSave(
          Object.assign({}, draft, {
            id: source ? source.id : undefined,
            source: { kind: draft.sourceKind, label: draft.sourceLabel },
            tags: draft.tags,
            facts: draft.facts.filter((fact) => fact.label.trim() || fact.value.trim())
          })
        )
      }

      return h(
        Modal,
        {
          title: source ? t('editor.editTitle') : t('editor.newTitle'),
          icon: source ? 'edit' : 'plus',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          wide: true,
          footer: h(
            React.Fragment,
            null,
            props.onDelete
              ? h(ConfirmButton, {
                  className: 'zw-btn zw-btnSm zw-btnGhost',
                  label: t('action.delete'),
                  confirmLabel: t('action.deleteConfirm'),
                  onConfirm: () => props.onDelete(source.id)
                })
              : null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                disabled: props.saving,
                onClick: submit
              },
              props.saving ? h(Icon, { name: 'refresh', size: 12, className: 'zw-spin' }) : null,
              t('action.save')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            Field,
            { label: t('editor.title') },
            h('input', {
              className: 'zw-input',
              value: draft.title,
              placeholder: t('editor.titlePlaceholder'),
              onChange: (event) => patch('title', event.target.value)
            })
          ),
          h(
            Field,
            { label: t('editor.content'), hint: t('editor.contentHint') },
            h('textarea', {
              className: 'zw-textarea',
              value: draft.content,
              placeholder: t('editor.contentPlaceholder'),
              onChange: (event) => patch('content', event.target.value)
            })
          ),
          h(
            Field,
            { label: t('editor.type') },
            h(MultiChips, {
              options: meta.entryTypes.map((item) => ({
                id: item.id,
                label: item.label,
                icon: TYPE_ICON[item.id],
                color: typeColor(item.id)
              })),
              value: [draft.type],
              onToggle: (id) => patch('type', id)
            })
          ),
          h(
            'div',
            { className: 'zw-formRow' },
            h(
              Field,
              { label: t('editor.status') },
              h(Select, {
                value: draft.status,
                options: meta.statuses.map((item) => ({ id: item.id, label: item.label })),
                onChange: (value) => patch('status', value)
              })
            ),
            h(
              Field,
              { label: t('editor.project') },
              h(Select, {
                value: draft.projectId,
                options: props.projects.map((item) => ({ id: item.id, label: item.name })),
                onChange: (value) => patch('projectId', value)
              })
            )
          ),
          h(
            Field,
            { label: t('editor.domains') },
            h(MultiChips, {
              options: meta.domains.map((item) => ({ id: item.id, label: item.label })),
              value: draft.domains,
              onToggle: (id) => toggleIn('domains', id)
            })
          ),
          h(
            Field,
            { label: t('editor.tags') },
            h(
              'div',
              { className: 'zw-tagRow' },
              draft.tags.map((tag) =>
                h(
                  'span',
                  { key: tag, className: 'zw-tag zw-tagOn' },
                  '#' + tag,
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-chipX',
                      onClick: () => patch('tags', draft.tags.filter((item) => item !== tag))
                    },
                    h(Icon, { name: 'close', size: 9 })
                  )
                )
              )
            ),
            h('input', {
              className: 'zw-input',
              value: tagInput,
              placeholder: t('editor.tagsPlaceholder'),
              onChange: (event) => setTagInput(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter' || event.key === ',') {
                  event.preventDefault()
                  addTags()
                }
              },
              onBlur: addTags
            })
          ),
          h(
            Field,
            { label: t('editor.facts'), hint: t('editor.factsHint') },
            h(FactsEditor, {
              t: t,
              value: draft.facts,
              onChange: (value) => patch('facts', value)
            })
          ),
          h(
            Field,
            { label: t('editor.collections'), hint: t('editor.collectionsHint') },
            props.allCollections.filter((collection) => collection.status !== 'suggested').length
              ? h(MultiChips, {
                  options: props.allCollections
                    .filter((collection) => collection.status !== 'suggested')
                    .map((collection) => ({
                      id: collection.id,
                      label: collection.name,
                      color: collectionColor(collection.color),
                      dot: true
                    })),
                  value: draft.collectionIds,
                  onToggle: (id) => toggleIn('collectionIds', id)
                })
              : h('div', { className: 'zw-hint' }, t('editor.noCollections'))
          ),
          h(
            'div',
            { className: 'zw-formRow' },
            h(
              Field,
              { label: t('editor.source') },
              h(Select, {
                value: draft.sourceKind,
                options: meta.sourceKinds.map((item) => ({ id: item.id, label: item.label })),
                onChange: (value) => patch('sourceKind', value)
              })
            ),
            h(
              Field,
              { label: t('editor.sourceLabel') },
              h('input', {
                className: 'zw-input',
                value: draft.sourceLabel,
                placeholder: t('editor.sourceLabelPlaceholder'),
                onChange: (event) => patch('sourceLabel', event.target.value)
              })
            )
          ),
          h(
            'div',
            { className: 'zw-tagRow' },
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm' + (draft.favorite ? '' : ' zw-btnGhost'),
                onClick: () => patch('favorite', !draft.favorite)
              },
              h(Icon, { name: 'star', size: 12, fill: draft.favorite ? 'currentColor' : 'none' }),
              t('editor.favorite')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm' + (draft.pinned ? '' : ' zw-btnGhost'),
                onClick: () => patch('pinned', !draft.pinned)
              },
              h(Icon, { name: 'bookmark', size: 12 }),
              t('editor.pin')
            )
          ),
          error ? h('div', { className: 'zw-error' }, error) : null
        )
      )
    }


    function QuickAdd(props) {
      const t = props.t
      const meta = props.meta
      const [text, setText] = useState('')
      const [phase, setPhase] = useState('input')
      const [suggestion, setSuggestion] = useState(null)
      const [title, setTitle] = useState('')
      const [type, setType] = useState('decision')
      const [domains, setDomains] = useState([])
      const [tags, setTags] = useState([])
      const [projectId, setProjectId] = useState(props.defaultProjectId)
      const [busy, setBusy] = useState(false)
      const [error, setError] = useState('')

      const analyze = async () => {
        if (!text.trim()) {
          setError(t('quick.needText'))
          return
        }
        setBusy(true)
        setError('')
        try {
          const result = await props.onSuggest(text.trim())
          const next = result || {}
          setSuggestion(next)
          setTitle(next.title || '')
          setType(next.type || 'decision')
          setDomains(Array.isArray(next.domains) ? next.domains : [])
          setTags(Array.isArray(next.tags) ? next.tags : [])
          setProjectId(next.projectId || props.defaultProjectId)
          setPhase('review')
        } catch (err) {
          setError(errorText(err, t('error.offline')))
        } finally {
          setBusy(false)
        }
      }

      const save = (raw) => {
        if (!text.trim() && !(raw && raw.title)) {
          setError(t('quick.needText'))
          return
        }
        props.onSave({
          title: raw && raw.title ? raw.title : title,
          content: text.trim(),
          type: raw && raw.type ? raw.type : type,
          domains: raw && raw.domains ? raw.domains : domains,
          tags: raw && raw.tags ? raw.tags : tags,
          projectId: raw && raw.projectId ? raw.projectId : projectId,
          summary: suggestion ? suggestion.summary : '',
          source: { kind: 'manual', label: t('quick.sourceLabel') },
          suggestRelations: Boolean(suggestion)
        })
      }

      return h(
        Modal,
        {
          title: t('quick.title'),
          icon: 'sparkle',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnGhost',
                disabled: props.saving,
                onClick: () => save({ title: '', type: 'decision', domains: [], tags: [], projectId })
              },
              t('quick.saveRaw')
            ),
            h('span', { className: 'zw-modalFootSpacer' }),
            phase === 'input'
              ? h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnPrimary',
                    disabled: busy || props.saving,
                    onClick: analyze
                  },
                  h(Icon, {
                    name: busy ? 'refresh' : 'sparkle',
                    size: 12,
                    className: busy ? 'zw-spin' : undefined
                  }),
                  t('quick.analyze')
                )
              : h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnPrimary',
                    disabled: props.saving,
                    onClick: () => save(null)
                  },
                  t('quick.confirm')
                )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            'div',
            { className: 'zw-quickHead' },
            h('div', { className: 'zw-quickTitle' }, t('quick.subtitle')),
            h('div', { className: 'zw-quickSub' }, t('quick.subtitleHint'))
          ),
          h('textarea', {
            className: 'zw-textarea zw-textareaBig',
            value: text,
            autoFocus: true,
            placeholder: t('quick.placeholder'),
            onChange: (event) => {
              setText(event.target.value)
              if (phase === 'review') setPhase('input')
            }
          }),
          phase === 'review' && suggestion
            ? h(
                'div',
                { className: 'zw-quickProposal' },
                h(
                  'div',
                  { className: 'zw-quickProposalHead' },
                  h(Icon, { name: 'sparkle', size: 12 }),
                  t('quick.proposal'),
                  suggestion.confidence != null
                    ? h(
                        'span',
                        { className: 'zw-count' },
                        Math.round(suggestion.confidence * 100) + '%'
                      )
                    : null
                ),
                h(
                  Field,
                  { label: t('editor.title') },
                  h('input', {
                    className: 'zw-input',
                    value: title,
                    onChange: (event) => setTitle(event.target.value)
                  })
                ),
                suggestion.summary
                  ? h(
                      'div',
                      { className: 'zw-hint' },
                      h(Icon, { name: 'copy', size: 11 }),
                      ' ',
                      suggestion.summary
                    )
                  : null,
                suggestion.segments && suggestion.segments.length
                  ? h(
                      Field,
                      { label: t('assist.segments'), hint: t('assist.notApplied') },
                      h(
                        'div',
                        { className: 'zw-assistSegs' },
                        suggestion.segments.map((segment, index) =>
                          h(
                            'div',
                            { key: 'seg-' + index, className: 'zw-assistSeg' },
                            h(
                              'div',
                              { className: 'zw-assistSegHead' },
                              h('span', { className: 'zw-assistSegTitle', title: segment.title }, segment.title),
                              h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'zw-btn zw-btnGhost zw-btnSm',
                                  disabled: props.saving,
                                  onClick: () =>
                                    props.onSaveSegment({
                                      title: segment.title,
                                      content: segment.content,
                                      type: segment.type || type,
                                      domains: segment.domains && segment.domains.length ? segment.domains : domains,
                                      tags: segment.tags && segment.tags.length ? segment.tags : tags,
                                      projectId: projectId
                                    })
                                },
                                t('assist.splitOne')
                              )
                            ),
                            h('div', { className: 'zw-assistItemBody' }, segment.content)
                          )
                        )
                      )
                    )
                  : null,                h(
                  Field,
                  { label: t('editor.type'), hint: suggestion.typeReason || '' },
                  h(MultiChips, {
                    options: meta.entryTypes.map((item) => ({
                      id: item.id,
                      label: item.label,
                      icon: TYPE_ICON[item.id],
                      color: typeColor(item.id)
                    })),
                    value: [type],
                    onToggle: (id) => setType(id)
                  })
                ),
                h(
                  Field,
                  { label: t('editor.domains'), hint: suggestion.domainReason || '' },
                  h(MultiChips, {
                    options: meta.domains.map((item) => ({ id: item.id, label: item.label })),
                    value: domains,
                    onToggle: (id) =>
                      setDomains((prev) =>
                        prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])
                      )
                  })
                ),
                tags.length
                  ? h(
                      Field,
                      { label: t('editor.tags') },
                      h(
                        'div',
                        { className: 'zw-tagRow' },
                        tags.map((tag) =>
                          h(
                            'span',
                            { key: tag, className: 'zw-tag zw-tagOn' },
                            '#' + tag,
                            h(
                              'button',
                              {
                                type: 'button',
                                className: 'zw-chipX',
                                onClick: () => setTags(tags.filter((item) => item !== tag))
                              },
                              h(Icon, { name: 'close', size: 9 })
                            )
                          )
                        )
                      )
                    )
                  : null,
                h(
                  Field,
                  { label: t('editor.project'), hint: suggestion.projectReason || '' },
                  h(Select, {
                    value: projectId,
                    options: props.projects.map((item) => ({ id: item.id, label: item.name })),
                    onChange: setProjectId
                  })
                ),
                suggestion.relations && suggestion.relations.length
                  ? h(
                      Field,
                      { label: t('quick.related') },
                      h(
                        'div',
                        { className: 'zw-miniList' },
                        suggestion.relations.slice(0, 5).map((item) =>
                          h(
                            'div',
                            { key: item.targetMemoryId, className: 'zw-mini' },
                            h(Icon, { name: 'link', size: 11 }),
                            h(
                              'div',
                              { className: 'zw-miniBody' },
                              h('span', { className: 'zw-miniTitle' }, item.title || item.targetMemoryId),
                              h(
                                'span',
                                { className: 'zw-miniMeta' },
                                labelOf(t, meta.relationTypes, item.relationType, 'relation') +
                                  (item.description ? ' · ' + item.description : '')
                              )
                            ),
                            item.confidence != null
                              ? h(
                                  'span',
                                  { className: 'zw-count' },
                                  Math.round(item.confidence * 100) + '%'
                                )
                              : null
                          )
                        )
                      )
                    )
                  : null,
                suggestion.collections && suggestion.collections.length
                  ? h(
                      Field,
                      { label: t('quick.collections') },
                      h(
                        'div',
                        { className: 'zw-tagRow' },
                        suggestion.collections.map((item) =>
                          h(
                            'span',
                            { key: item.name || item.id, className: 'zw-tag' },
                            h(Icon, { name: 'folder', size: 10 }),
                            item.name
                          )
                        )
                      )
                    )
                  : null
              )
            : null,
          error ? h('div', { className: 'zw-error' }, error) : null
        )
      )
    }


    function RelationDialog(props) {
      const t = props.t
      const meta = props.meta
      const [targetId, setTargetId] = useState(props.initialTargetId || '')
      const [relationType, setRelationType] = useState('references')
      const [description, setDescription] = useState('')
      const [query, setQuery] = useState('')
      const [error, setError] = useState('')

      const candidates = props.entries.filter(
        (entry) => entry.id !== props.sourceId && (!query.trim() || matchesQuery(entry, query))
      )
      const target = props.entries.find((entry) => entry.id === targetId) || null

      const submit = () => {
        if (!targetId) {
          setError(t('relation.needTarget'))
          return
        }
        props.onSave({
          sourceMemoryId: props.sourceId,
          targetMemoryId: targetId,
          relationType: relationType,
          description: description.trim()
        })
      }

      return h(
        Modal,
        {
          title: t('relation.create'),
          icon: 'link',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                disabled: props.saving,
                onClick: submit
              },
              t('relation.create')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            Field,
            { label: t('relation.from') },
            h(
              'div',
              { className: 'zw-mini', style: { cursor: 'default' } },
              h(Icon, { name: 'book', size: 12 }),
              h(
                'div',
                { className: 'zw-miniBody' },
                h(
                  'span',
                  { className: 'zw-miniTitle' },
                  props.entries.find((entry) => entry.id === props.sourceId)
                    ? props.entries.find((entry) => entry.id === props.sourceId).title
                    : props.sourceId
                )
              )
            )
          ),
          h(
            Field,
            { label: t('relation.to') },
            h('input', {
              className: 'zw-input',
              placeholder: t('relation.searchPlaceholder'),
              value: query,
              onChange: (event) => setQuery(event.target.value)
            }),
            h(
              'div',
              { className: 'zw-pickList' },
              candidates.slice(0, 40).map((entry) =>
                h(
                  'button',
                  {
                    key: entry.id,
                    type: 'button',
                    className: 'zw-pickRow' + (entry.id === targetId ? ' zw-pickRowOn' : ''),
                    onClick: () => setTargetId(entry.id)
                  },
                  h(StatusDot, { type: entry.type }),
                  h('span', { className: 'zw-pickTitle' }, entry.title),
                  h(
                    'span',
                    { className: 'zw-pickMeta' },
                    labelOf(t, meta.statuses, entry.status, 'status')
                  ),
                  entry.id === targetId ? h(Icon, { name: 'check', size: 12 }) : null
                )
              )
            )
          ),
          h(
            Field,
            { label: t('relation.type') },
            h(
              'div',
              { className: 'zw-relGroups' },
              (meta.relationGroups || []).map((group) =>
                h(
                  'div',
                  { key: group.id, className: 'zw-relGroup' },
                  h(
                    'span',
                    { className: 'zw-relGroupLabel' },
                    {
                      hierarchy: t('relGroup.hierarchy'),
                      business: t('relGroup.business'),
                      workflow: t('relGroup.workflow'),
                      principle: t('relGroup.principle'),
                      knowledge: t('relGroup.knowledge')
                    }[group.id] || group.label
                  ),
                  h(MultiChips, {
                    options: meta.relationTypes
                      .filter((item) => (group.types || []).indexOf(item.id) >= 0)
                      .map((item) => ({ id: item.id, label: item.label, color: relationColor(item.id) })),
                    value: [relationType],
                    onToggle: (id) => setRelationType(id)
                  })
                )
              )
            ),
            h('div', { className: 'zw-hint' }, hintOf(meta.relationTypes, relationType))
          ),
          h(
            Field,
            { label: t('relation.description') },
            h('input', {
              className: 'zw-input',
              value: description,
              placeholder: t('relation.descriptionPlaceholder'),
              onChange: (event) => setDescription(event.target.value)
            })
          ),
          target
            ? h(
                'div',
                { className: 'zw-hint' },
                h(Icon, { name: 'info', size: 11 }),
                ' ',
                t('relation.preview') +
                  '：' +
                  target.title +
                  ' ' +
                  (relationType === 'affects' || relationType === 'depends_on' ? '←' : '→') +
                  ' ' +
                  t('relation.previewSelf')
              )
            : null,
          error ? h('div', { className: 'zw-error' }, error) : null
        )
      )
    }

    function CollectionCreate(props) {
      const t = props.t
      const editing = Boolean(props.collection)
      const base = props.collection || null
      const [name, setName] = useState(base ? base.name : '')
      const [description, setDescription] = useState(base ? base.description || '' : '')
      const [color, setColor] = useState(base && base.color ? base.color : COLLECTION_COLORS[0])
      const [projectId, setProjectId] = useState(base ? base.projectId : props.defaultProjectId)
      const [error, setError] = useState('')
      const submit = () => {
        if (!name.trim()) {
          setError(t('collections.needName'))
          return
        }
        const patch = {
          name: name.trim(),
          description: description.trim(),
          color: color,
          projectId: projectId
        }
        if (editing) {
          if (props.onSave) props.onSave(patch)
          return
        }
        if (props.onCreate) props.onCreate(Object.assign({ memberIds: [] }, patch))
      }
      return h(
        Modal,
        {
          title: editing ? t('collections.editTitle') : t('collections.new'),
          icon: 'folder',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                disabled: props.saving,
                onClick: submit
              },
              t('action.save')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            Field,
            { label: t('collections.name') },
            h('input', {
              className: 'zw-input',
              value: name,
              autoFocus: true,
              onChange: (event) => setName(event.target.value)
            })
          ),
          h(
            Field,
            { label: t('collections.description') },
            h('textarea', {
              className: 'zw-textarea',
              style: { minHeight: 64 },
              value: description,
              onChange: (event) => setDescription(event.target.value)
            })
          ),
          h(
            Field,
            { label: t('collections.color') },
            h(
              'div',
              { className: 'zw-tagRow' },
              COLLECTION_COLORS.map((item) =>
                h(
                  'button',
                  {
                    key: item,
                    type: 'button',
                    className: 'zw-iconBtn' + (color === item ? ' zw-iconBtnOn' : ''),
                    title: item,
                    onClick: () => setColor(item)
                  },
                  h('span', { className: 'zw-legendDot', style: { background: collectionColor(item) } })
                )
              )
            )
          ),
          h(
            Field,
            { label: t('collections.project') },
            h(Select, {
              value: projectId,
              options: (props.projects || []).map((item) => ({ id: item.id, label: item.name })),
              onChange: setProjectId
            })
          ),
          error ? h('div', { className: 'zw-error' }, error) : null
        )
      )
    }
    function BatchTagDialog(props) {
  const [tag, setTag] = useState('')

  const submit = () => {
    const value = tag.trim()
    if (!value || props.saving) return
    props.onApply(value)
  }

  return h(
    Modal,
    {
      title: props.t('batch.tagTitle'),
      icon: 'tag',
      onClose: props.onClose,
      footer: [
        h('button', { key: 'cancel', type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, props.t('action.cancel')),
        h(
          'button',
          {
            key: 'ok',
            type: 'button',
            className: 'zw-btn zw-btnPrimary',
            disabled: props.saving || !tag.trim(),
            onClick: submit
          },
          props.t('batch.tagApply')
        )
      ]
    },
    h(
      'div',
      { className: 'zw-form' },
      h('p', { className: 'zw-hint' }, props.t('batch.tagHint')),
      h('input', {
        className: 'zw-input',
        value: tag,
        placeholder: props.t('batch.tagPlaceholder'),
        autoFocus: true,
        onChange: (event) => setTag(event.target.value),
        onKeyDown: (event) => {
          if (event.key === 'Enter') {
            event.preventDefault()
            submit()
          }
        }
      })
    )
  )
}

function CollectionPicker(props) {
      const t = props.t
      const [picked, setPicked] = useState(() => unique((props.value || []).slice()))
      const [newName, setNewName] = useState('')
      const toggle = (id) =>
        setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])))
      const canCreate = Boolean(props.onCreate) && newName.trim().length > 0 && !props.saving
      const createNow = () => {
        if (!canCreate) return
        const name = newName.trim()
        Promise.resolve(props.onCreate(name)).then((collection) => {
          if (!collection) return
          setPicked((prev) => (prev.includes(collection.id) ? prev : prev.concat([collection.id])))
          setNewName('')
        })
      }
      return h(
        Modal,
        {
          title: props.title || t('detail.collections'),
          icon: 'folder',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-count' }, picked.length + ' ' + t('collections.selected')),
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                disabled: props.saving,
                onClick: () => props.onApply(picked)
              },
              t('action.confirm')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          props.onCreate
            ? h(
                'div',
                { className: 'zw-quickCreate' },
                h('input', {
                  className: 'zw-input',
                  value: newName,
                  placeholder: t('collections.newName'),
                  'aria-label': t('collections.newName'),
                  onChange: (event) => setNewName(event.target.value),
                  onKeyDown: (event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault()
                      createNow()
                    }
                  }
                }),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnPrimary',
                    disabled: !canCreate,
                    title: t('collections.createAndPick'),
                    onClick: createNow
                  },
                  h(Icon, { name: 'plus', size: 13 }),
                  t('collections.createAndPick')
                )
              )
            : null,
          props.collections.length
            ? h(
                'div',
                { className: 'zw-pickList' },
                props.collections.map((collection) =>
                  h(
                    'button',
                    {
                      key: collection.id,
                      type: 'button',
                      className: 'zw-pickRow' + (picked.includes(collection.id) ? ' zw-pickRowOn' : ''),
                      onClick: () => toggle(collection.id)
                    },
                    h('span', {
                      className: 'zw-rowCheck' + (picked.includes(collection.id) ? ' zw-rowCheckOn' : '')
                    }),
                    h('span', {
                      className: 'zw-legendDot',
                      style: { background: collectionColor(collection.color) }
                    }),
                    h('span', { className: 'zw-pickTitle' }, collection.name),
                    h(
                      'span',
                      { className: 'zw-pickMeta' },
                      collection.memberIds.length + ' ' + t('collections.memberCount')
                    )
                  )
                )
              )
            : h('div', { className: 'zw-savedEmpty' }, t('collections.empty'))
        )
      )
    }

    function MembersPicker(props) {
      const t = props.t
      const [query, setQuery] = useState('')
      const [picked, setPicked] = useState(() => unique(props.memberIds.slice()))
      const candidates = props.entries.filter(
        (entry) => !query.trim() || matchesQuery(entry, query)
      )
      const toggle = (id) =>
        setPicked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])))
      return h(
        Modal,
        {
          title: props.title || t('collections.addMembers'),
          icon: 'layers',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-count' }, picked.length + ' ' + t('collections.selected')),
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                disabled: props.saving,
                onClick: () => props.onApply(picked)
              },
              t('action.confirm')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h('input', {
            className: 'zw-input',
            placeholder: t('list.searchPlaceholder'),
            value: query,
            autoFocus: true,
            onChange: (event) => setQuery(event.target.value)
          }),
          h(
            'div',
            { className: 'zw-pickList' },
            candidates.slice(0, 200).map((entry) =>
              h(
                'button',
                {
                  key: entry.id,
                  type: 'button',
                  className: 'zw-pickRow' + (picked.includes(entry.id) ? ' zw-pickRowOn' : ''),
                  onClick: () => toggle(entry.id)
                },
                h('span', {
                  className: 'zw-rowCheck' + (picked.includes(entry.id) ? ' zw-rowCheckOn' : '')
                }),
                h(StatusDot, { type: entry.type }),
                h('span', { className: 'zw-pickTitle' }, entry.title),
                h(
                  'span',
                  { className: 'zw-pickMeta' },
                  (entry.domains[0]
                    ? labelOf(t, props.meta.domains, entry.domains[0], 'domain')
                    : '') + ' · ' + formatDay(entry.updatedAt)
                )
              )
            )
          )
        )
      )
    }

    function ObserveDialog(props) {
      const t = props.t
      const [text, setText] = useState('')
      const [conversationId, setConversationId] = useState('')
      const result = props.result || null
      const lines = []
      if (result) {
        if (result.created && result.created.length) lines.push(t('observe.created') + ' ' + result.created.length)
        if (result.updated && result.updated.length) lines.push(t('observe.updated') + ' ' + result.updated.length)
        if (result.proposed && result.proposed.length) lines.push(t('observe.proposed') + ' ' + result.proposed.length)
        if (result.reinforced && result.reinforced.length) lines.push(t('observe.reinforced') + ' ' + result.reinforced.length)
        if (result.skipped && result.skipped.length) lines.push(t('observe.skipped') + ' ' + result.skipped.length)
      }
      return h(
        Modal,
        {
          title: t('observe.title'),
          icon: 'sparkle',
          wide: true,
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('button', { type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, t('action.close')),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnPrimary',
                disabled: props.busy || !text.trim(),
                onClick: () => props.onRun(text, conversationId)
              },
              h(Icon, { name: props.busy ? 'refresh' : 'sparkle', size: 12 }),
              props.busy ? t('assist.running') : t('observe.run')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h('div', { className: 'zw-fieldLabel' }, t('observe.hint')),
          h('textarea', {
            className: 'zw-textarea zw-textareaBig',
            value: text,
            placeholder: t('observe.placeholder'),
            onChange: (event) => setText(event.target.value)
          }),
          h(
            'div',
            { className: 'zw-field' },
            h('div', { className: 'zw-fieldLabel' }, t('observe.conversationId')),
            h('input', {
              className: 'zw-input',
              value: conversationId,
              onChange: (event) => setConversationId(event.target.value)
            })
          ),
          result
            ? h(
                'div',
                { className: 'zw-assistPanel' },
                h('div', { className: 'zw-assistHead' }, h('span', null, t('observe.result'))),
                lines.map((line, index) => h('div', { key: index, className: 'zw-assistRow' }, line)),
                result.relations && result.relations.length
                  ? h(
                      'div',
                      { className: 'zw-assistRow' },
                      t('observe.relations') + ' ' + result.relations.length
                    )
                  : null
              )
            : null
        )
      )
    }
    function ContextMenu(props) {
      const items = props.items || []
      return h(
        'div',
        {
          className: 'zw-menuMask',
          onPointerDown: props.onClose,
          onContextMenu: (event) => {
            event.preventDefault()
            props.onClose()
          }
        },
        h(
          'div',
          {
            className: 'zw-menu',
            style: { left: Math.max(8, props.x || 8) + 'px', top: Math.max(8, props.y || 8) + 'px' },
            onPointerDown: (event) => event.stopPropagation()
          },
          items.map((item, index) =>
            h(
              'button',
              {
                key: (item.label || 'item') + index,
                type: 'button',
                className: 'zw-menuItem' + (item.danger ? ' zw-menuItemDanger' : ''),
                onClick: () => {
                  props.onClose()
                  if (item.onClick) item.onClick()
                }
              },
              item.icon ? h(Icon, { name: item.icon, size: 13 }) : null,
              h('span', null, item.label)
            )
          )
        )
      )
    }

    function ProjectDialog(props) {
      const project = props.project || null
      const deleting = props.mode === 'delete'
      const [name, setName] = useState(project ? project.name : '')
      const [description, setDescription] = useState(project ? project.description : '')
      const [error, setError] = useState('')
      const t = props.t
      const submit = () => {
        if (!name.trim()) {
          setError(t('project.needName'))
          return
        }
        props.onSave(name.trim(), description.trim())
      }
      return h(
        Modal,
        {
          title: deleting ? t('project.deleteTitle') : project ? t('project.editTitle') : t('project.newTitle'),
          icon: 'home',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            'div',
            { className: 'zw-modalFoot' },
            h('span', { className: 'zw-modalFootSpacer' }),
            h('button', { type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, t('action.cancel')),
            deleting
              ? h(
                  ConfirmButton,
                  {
                    label: t('project.deleteConfirm'),
                    confirmLabel: t('action.deleteConfirm'),
                    className: 'zw-btn zw-btnDanger',
                    onConfirm: () => props.onDelete(project)
                  }
                )
              : h('button', { type: 'button', className: 'zw-btn zw-btnPrimary', onClick: submit }, t('action.save'))
          )
        },
        deleting
          ? h('div', { className: 'zw-hint' }, t('project.deleteText'), ' ', project ? '「' + project.name + '」' : '')
          : h(
              'div',
              { className: 'zw-form' },
              h(
                Field,
                { label: t('project.name') },
                h('input', {
                  className: 'zw-input',
                  value: name,
                  placeholder: t('project.namePlaceholder'),
                  onChange: (event) => {
                    setName(event.target.value)
                    setError('')
                  }
                })
              ),
              h(
                Field,
                { label: t('project.description') },
                h('textarea', {
                  className: 'zw-textarea',
                  value: description,
                  placeholder: t('project.descriptionPlaceholder'),
                  onChange: (event) => setDescription(event.target.value)
                })
              ),
              error ? h('div', { className: 'zw-error' }, error) : null
            )
      )
    }
    // ---------------------------------------------------------------------
    // AI assist panel
    //
    // Analysis always runs on the host: the browser only renders what came
    // back and asks the user to confirm before anything is written. Every
    // suggestion therefore carries a reason the user can read.
    // ---------------------------------------------------------------------

    function AssistChip(props) {
      return h(
        'button',
        {
          type: 'button',
          className: 'zw-assistAction' + (props.active ? ' zw-assistActionOn' : ''),
          title: props.title || props.label,
          disabled: props.disabled,
          onClick: props.onClick
        },
        h(Icon, { name: props.icon, size: 12 }),
        h('span', null, props.label)
      )
    }

    function AssistReason(props) {
      if (!props.text) return null
      return h('span', { className: 'zw-assistReason' }, props.t('assist.reason') + '：' + props.text)
    }

    function AssistItemHead(props) {
      return h(
        'div',
        { className: 'zw-assistItemTop' },
        props.children
      )
    }

    function TypeBadge(props) {
      const meta = props.meta || {}
      const type = (meta.entryTypes || []).find((item) => item.id === props.type)
      if (!type) return null
      return h(
        'span',
        {
          className: 'zw-badge zw-badgeType',
          style: { color: typeColor(props.type), borderColor: 'transparent' },
          title: type.hint || type.label
        },
        h(Icon, { name: TYPE_ICON[props.type] || 'dot', size: 10 }),
        h('span', null, type.label)
      )
    }

    function AssistOrganize(props) {
      const result = props.result
      const t = props.t
      const meta = props.meta
      const rows = []
      if (result.title) {
        rows.push(
          h(
            'div',
            { className: 'zw-assistRow', key: 'title' },
            h('span', { className: 'zw-assistKey' }, t('assist.titleSug')),
            h('span', { className: 'zw-assistVal' }, result.title)
          )
        )
      }
      if (result.type) {
        rows.push(
          h(
            'div',
            { className: 'zw-assistRow', key: 'type' },
            h('span', { className: 'zw-assistKey' }, t('assist.typeSug')),
            h(
              'span',
              { className: 'zw-assistVal' },
              h(TypeBadge, { meta: meta, type: result.type }),
              h(AssistReason, { t: t, text: result.typeReason })
            )
          )
        )
      }
      if (result.domains && result.domains.length) {
        rows.push(
          h(
            'div',
            { className: 'zw-assistRow', key: 'domains' },
            h('span', { className: 'zw-assistKey' }, t('assist.domainSug')),
            h(
              'span',
              { className: 'zw-assistVal' },
              result.domains.map((domain) =>
                h('span', { className: 'zw-tag', key: domain }, labelOf(t, meta.domains, domain, 'domain'))
              ),
              h(AssistReason, { t: t, text: result.domainReason })
            )
          )
        )
      }
      if (result.tags && result.tags.length) {
        rows.push(
          h(
            'div',
            { className: 'zw-assistRow', key: 'tags' },
            h('span', { className: 'zw-assistKey' }, t('assist.tagSug')),
            h(
              'span',
              { className: 'zw-assistVal' },
              result.tags.map((tag) => h('span', { className: 'zw-tag', key: tag }, '#' + tag))
            )
          )
        )
      }
      if (result.summary) {
        rows.push(
          h(
            'div',
            { className: 'zw-assistRow', key: 'summary' },
            h('span', { className: 'zw-assistKey' }, t('assist.summarySug')),
            h('span', { className: 'zw-assistVal' }, result.summary)
          )
        )
      }

      const sections = []
      if (result.segments && result.segments.length) {
        sections.push(
          h(
            'div',
            { className: 'zw-assistSegs', key: 'segments' },
            h(
              'div',
              { className: 'zw-assistHead' },
              h(Icon, { name: 'layers', size: 12 }),
              h('span', null, t('assist.segments')),
              h('span', { className: 'zw-assistHeadTag' }, result.segments.length + ' ' + t('assist.segmentCount'))
            ),
            result.segments.map((segment, index) =>
              h(
                'div',
                { className: 'zw-assistSeg', key: 'seg-' + index },
                h(
                  'div',
                  { className: 'zw-assistSegHead' },
                  h(TypeBadge, { meta: meta, type: segment.type }),
                  h('span', { className: 'zw-assistSegTitle', title: segment.title }, segment.title),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-btn zw-btnGhost zw-btnSm',
                      onClick: () => props.onSplit(segment)
                    },
                    t('assist.splitOne')
                  )
                ),
                h('div', { className: 'zw-assistItemBody' }, segment.content),
                h(AssistReason, { t: t, text: segment.reason })
              )
            )
          )
        )
      }

      if (result.collections && result.collections.length) {
        sections.push(
          h(
            'div',
            { className: 'zw-assistList', key: 'collections' },
            result.collections.map((item) =>
              h(
                'div',
                { className: 'zw-assistItem', key: item.collectionId },
                h(
                  AssistItemHead,
                  null,
                  h(Icon, { name: 'layers', size: 12 }),
                  h(
                    'span',
                    {
                      className: 'zw-assistItemTitle',
                      title: item.description || item.name,
                      onClick: () => props.onOpenCollection(item.collectionId)
                    },
                    item.name
                  )
                ),
                h(AssistReason, { t: t, text: item.reason })
              )
            )
          )
        )
      }

      if (result.relations && result.relations.length) {
        sections.push(
          h(
            'div',
            { className: 'zw-assistList', key: 'relations' },
            h(
              'div',
              { className: 'zw-assistHead' },
              h(Icon, { name: 'link', size: 12 }),
              h('span', null, t('assist.relations'))
            ),
            result.relations.map((item, index) =>
              h(
                'div',
                { className: 'zw-assistItem', key: 'rel-' + index },
                h(
                  AssistItemHead,
                  null,
                  h(
                    'span',
                    { className: 'zw-tag', style: { color: relationColor(item.relationType) } },
                    labelOf(t, meta.relationTypes, item.relationType, 'relation')
                  ),
                  h(
                    'span',
                    {
                      className: 'zw-assistItemTitle',
                      title: item.description,
                      onClick: () => props.onOpenEntry(item.targetMemoryId)
                    },
                    item.title
                  ),
                  h(AssistChip, {
                    icon: 'link',
                    label: t('relation.create'),
                    disabled: !item.targetMemoryId,
                    onClick: () => props.onRelate(item)
                  })
                ),
                h(AssistReason, { t: t, text: (item.reasons || []).join(' · ') })
              )
            )
          )
        )
      }

      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'sparkle', size: 13 }),
          h('span', null, t('assist.done')),
          h('span', { className: 'zw-assistHeadTag' }, t('assist.notApplied'))
        ),
        rows.length ? h('div', null, rows) : null,
        sections,
        h(
          'div',
          { className: 'zw-assistFoot' },
          h(
            'button',
            {
              type: 'button',
              className: 'zw-btn zw-btnGhost zw-btnSm',
              onClick: props.onClose
            },
            t('action.close')
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-btn zw-btnPrimary zw-btnSm',
              onClick: () => props.onApply(result)
            },
            t('assist.apply')
          )
        )
      )
    }

    function AssistSimilar(props) {
      const t = props.t
      const items = props.result.items || []
      if (!items.length) {
        return h(
          'div',
          { className: 'zw-assistPanel' },
          h('div', { className: 'zw-assistHead' }, h(Icon, { name: 'search', size: 13 }), h('span', null, t('assist.similar'))),
          h('div', { className: 'zw-assistItemBody' }, t('assist.empty'))
        )
      }
      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'search', size: 13 }),
          h('span', null, t('assist.similar')),
          h('span', { className: 'zw-assistHeadTag' }, items.length + ' ' + t('assist.similarCount'))
        ),
        h(
          'div',
          { className: 'zw-assistList' },
          items.map((item) =>
            h(
              'div',
              { className: 'zw-assistItem', key: item.entryId },
              h(
                AssistItemHead,
                null,
                h(TypeBadge, { meta: props.meta, type: item.type }),
                h(
                  'span',
                  {
                    className: 'zw-assistItemTitle',
                    title: item.title,
                    onClick: () => props.onOpenEntry(item.entryId)
                  },
                  item.title
                ),
                h('span', { className: 'zw-assistScore' }, item.scoreLabel + '%')
              ),
              h('div', { className: 'zw-scoreBar' }, h('div', { className: 'zw-scoreFill', style: { width: item.scoreLabel + '%' } })),
              h(AssistReason, { t: t, text: (item.reasons || []).join(' · ') })
            )
          )
        )
      )
    }

    function AssistRelations(props) {
      const t = props.t
      const items = props.result.items || []
      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'link', size: 13 }),
          h('span', null, t('assist.relations')),
          h('span', { className: 'zw-assistHeadTag' }, t('assist.notApplied'))
        ),
        items.length
          ? h(
              'div',
              { className: 'zw-assistList' },
              items.map((item) =>
                h(
                  'div',
                  { className: 'zw-assistItem', key: item.targetMemoryId + item.relationType },
                  h(
                    AssistItemHead,
                    null,
                    h(
                      'span',
                      { className: 'zw-tag', style: { color: relationColor(item.relationType) } },
                      labelOf(t, props.meta.relationTypes, item.relationType, 'relation')
                    ),
                    h(
                      'span',
                      {
                        className: 'zw-assistItemTitle',
                        title: item.description || item.title,
                        onClick: () => props.onOpenEntry(item.targetMemoryId)
                      },
                      item.title
                    ),
                    item.alreadyLinked
                      ? h('span', { className: 'zw-assistItemMeta' }, t('relation.suggested'))
                      : h(AssistChip, {
                          icon: 'link',
                          label: t('relation.create'),
                          onClick: () => props.onRelate(item)
                        })
                  ),
                  h(AssistReason, { t: t, text: (item.reasons || []).join(' · ') })
                )
              )
            )
          : h('div', { className: 'zw-assistItemBody' }, t('assist.empty'))
      )
    }

    function AssistSummary(props) {
      const t = props.t
      const result = props.result
      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'sparkle', size: 13 }),
          h('span', null, result.title || t('assist.summary')),
          h('span', { className: 'zw-assistHeadTag' }, t('assist.notApplied'))
        ),
        result.overview ? h('div', { className: 'zw-assistItemBody' }, result.overview) : null,
        (result.bullets || []).length
          ? h(
              'div',
              { className: 'zw-prose' },
              h(
                'ul',
                { className: 'zw-proseUl' },
                result.bullets.map((bullet, index) => h('li', { className: 'zw-proseLi', key: 'b-' + index }, bullet))
              )
            )
          : null,
        (result.themes || []).length
          ? h(
              'div',
              { className: 'zw-assistRow' },
              h('span', { className: 'zw-assistKey' }, t('assist.themes')),
              h(
                'span',
                { className: 'zw-assistVal' },
                result.themes.map((theme) =>
                  h('span', { className: 'zw-tag', key: theme.label }, theme.label + ' · ' + theme.count)
                )
              )
            )
          : null,
        result.memberIds && result.memberIds.length
          ? h(
              'div',
              { className: 'zw-assistRow' },
              h('span', { className: 'zw-assistKey' }, t('assist.members')),
              h(
                'span',
                { className: 'zw-assistVal' },
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnGhost zw-btnSm',
                    onClick: () => props.onShowMembers(result.memberIds)
                  },
                  result.memberIds.length + ' ' + t('assist.segmentCount')
                )
              )
            )
          : null
      )
    }

    function AssistConflicts(props) {
      const t = props.t
      const items = props.result.items || []
      if (!items.length) {
        return h(
          'div',
          { className: 'zw-assistPanel' },
          h('div', { className: 'zw-assistHead' }, h(Icon, { name: 'shield', size: 13 }), h('span', null, t('assist.conflicts'))),
          h('div', { className: 'zw-assistItemBody' }, t('assist.empty'))
        )
      }
      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'warning', size: 13 }),
          h('span', null, t('assist.conflicts')),
          h('span', { className: 'zw-assistHeadTag' }, items.length + ' ' + t('assist.segmentCount'))
        ),
        items.map((item) =>
          h(
            'div',
            { className: 'zw-assistConflict', key: item.entryId },
            h(
              'div',
              { className: 'zw-assistConflictHead' },
              h(Icon, { name: item.kind === 'number-mismatch' ? 'chart' : 'book', size: 12 }),
              h(
                'span',
                {
                  className: 'zw-assistItemTitle',
                  title: item.title,
                  onClick: () => props.onOpenEntry(item.entryId)
                },
                item.title
              ),
              h(TypeBadge, { meta: props.meta, type: item.type })
            ),
            h(AssistReason, { t: t, text: (item.reasons || []).join(' · ') }),
            h('div', { className: 'zw-assistItemMeta' }, item.note || ''),
            h(
              'div',
              { className: 'zw-assistChoices' },
              h(
                'button',
                {
                  type: 'button',
                  className: 'zw-assistChoice',
                  onClick: () => props.onResolve(item, 'supersede')
                },
                t('assist.supersede')
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'zw-assistChoice',
                  onClick: () => props.onResolve(item, 'both-apply')
                },
                t('assist.bothApply')
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'zw-assistChoice',
                  onClick: () => props.onResolve(item, 'keep-both')
                },
                t('assist.keepBoth')
              ),
              h(
                'button',
                {
                  type: 'button',
                  className: 'zw-assistChoice',
                  onClick: () => props.onResolve(item, 'no-conflict')
                },
                t('assist.noConflict')
              )
            )
          )
        )
      )
    }

    function AssistImpact(props) {
      const t = props.t
      const result = props.result
      const column = (label, rows, direction) =>
        h(
          'div',
          { className: 'zw-impactCol' },
          h('div', { className: 'zw-impactLabel' }, label),
          rows.length
            ? rows.map((row, index) =>
                h(
                  'div',
                  { className: 'zw-impactRow', key: direction + '-' + index },
                  h(Icon, { name: direction === 'up' ? 'arrowLeft' : 'arrowRight', size: 11 }),
                  h(
                    'span',
                    {
                      className: 'zw-assistItemTitle',
                      title: row.title,
                      onClick: () => props.onOpenEntry(row.entryId)
                    },
                    row.title
                  ),
                  h('span', { className: 'zw-tag', style: { color: relationColor(row.relationType) } }, row.relationLabel),
                  h('span', { className: 'zw-impactDepth' }, 'D' + row.depth)
                )
              )
            : h('div', { className: 'zw-assistItemMeta' }, t('common.none'))
        )
      return h(
        'div',
        { className: 'zw-assistPanel' },
        h(
          'div',
          { className: 'zw-assistHead' },
          h(Icon, { name: 'graph', size: 13 }),
          h('span', null, t('assist.impact')),
          h('span', { className: 'zw-assistHeadTag' }, t('assist.notApplied'))
        ),
        column(t('assist.upstream'), result.incoming || [], 'up'),
        column(t('assist.downstream'), result.outgoing || [], 'down'),
        result.note ? h('div', { className: 'zw-assistItemMeta' }, result.note) : null
      )
    }

    function AssistResult(props) {
      const result = props.result
      if (!result) return null
      if (result.kind === 'organize') return h(AssistOrganize, props)
      if (result.kind === 'similar') return h(AssistSimilar, props)
      if (result.kind === 'relations') return h(AssistRelations, props)
      if (result.kind === 'summary') return h(AssistSummary, props)
      if (result.kind === 'conflicts') return h(AssistConflicts, props)
      if (result.kind === 'impact') return h(AssistImpact, props)
      return null
    }

    function AssistPanel(props) {
      const t = props.t
      const scope = props.scope || 'entry'
      const actions =
        scope === 'entry'
          ? [
              { id: 'organize', icon: 'sparkle', label: t('assist.organize') },
              { id: 'similar', icon: 'search', label: t('assist.similar') },
              { id: 'relations', icon: 'link', label: t('assist.relations') },
              { id: 'conflicts', icon: 'warning', label: t('assist.conflicts') },
              { id: 'impact', icon: 'graph', label: t('assist.impact') }
            ]
          : [{ id: 'summary', icon: 'sparkle', label: t('assist.summary') }]

      return h(
        'div',
        { className: 'zw-assist' },
        h(
          'div',
          { className: 'zw-assistBar' },
          actions.map((action) =>
            h(AssistChip, {
              key: action.id,
              icon: action.icon,
              label: action.label,
              active: props.action === action.id,
              disabled: props.busy,
              onClick: () => props.onRun(action.id)
            })
          )
        ),
        props.busy
          ? h(
              'div',
              { className: 'zw-assistBusy' },
              h(Icon, { name: 'refresh', size: 12 }),
              h('span', null, t('assist.running')),
              h('div', { className: 'zw-loadingBar' }, h('div', { className: 'zw-loadingFill' }))
            )
          : null,
        props.error
          ? h('div', { className: 'zw-error' }, props.error)
          : h(AssistResult, Object.assign({}, props, { result: props.result }))
      )
    }

    function hullPath(points, padding) {
      if (!points.length) return ''
      if (points.length === 1) {
        const radius = 40 + padding
        const point = points[0]
        return (
          'M' +
          (point.x - radius) +
          ',' +
          point.y +
          'a' +
          radius +
          ',' +
          radius +
          ' 0 1,0 ' +
          radius * 2 +
          ',0a' +
          radius +
          ',' +
          radius +
          ' 0 1,0 ' +
          -radius * 2 +
          ',0Z'
        )
      }
      const sorted = points.slice().sort((left, right) => (left.x === right.x ? left.y - right.y : left.x - right.x))
      const cross = (origin, a, b) =>
        (a.x - origin.x) * (b.y - origin.y) - (a.y - origin.y) * (b.x - origin.x)
      const lower = []
      sorted.forEach((point) => {
        while (lower.length >= 2 && cross(lower[lower.length - 2], lower[lower.length - 1], point) <= 0) lower.pop()
        lower.push(point)
      })
      const upper = []
      sorted
        .slice()
        .reverse()
        .forEach((point) => {
          while (upper.length >= 2 && cross(upper[upper.length - 2], upper[upper.length - 1], point) <= 0) upper.pop()
          upper.push(point)
        })
      lower.pop()
      upper.pop()
      const hull = lower.concat(upper)
      if (hull.length < 3) {
        const a = points[0]
        const b = points[points.length - 1]
        const mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
        const dx = b.x - a.x
        const dy = b.y - a.y
        const length = Math.sqrt(dx * dx + dy * dy) || 1
        const nx = (-dy / length) * (padding + 30)
        const ny = (dx / length) * (padding + 30)
        return (
          'M' +
          (a.x + nx) +
          ',' +
          (a.y + ny) +
          'Q' +
          (mid.x + nx * 1.6) +
          ',' +
          (mid.y + ny * 1.6) +
          ' ' +
          (b.x + nx) +
          ',' +
          (b.y + ny) +
          'Q' +
          (mid.x - nx * 0.4) +
          ',' +
          (mid.y - ny * 0.4) +
          ' ' +
          (a.x + nx) +
          ',' +
          (a.y + ny) +
          'Z'
        )
      }
      const center = hull.reduce((acc, point) => ({ x: acc.x + point.x / hull.length, y: acc.y + point.y / hull.length }), { x: 0, y: 0 })
      const expanded = hull.map((point) => {
        const dx = point.x - center.x
        const dy = point.y - center.y
        const length = Math.sqrt(dx * dx + dy * dy) || 1
        return { x: point.x + (dx / length) * padding, y: point.y + (dy / length) * padding }
      })
      let path = ''
      expanded.forEach((point, index) => {
        const next = expanded[(index + 1) % expanded.length]
        const midX = (point.x + next.x) / 2
        const midY = (point.y + next.y) / 2
        if (index === 0) path += 'M' + midX + ',' + midY
        path += 'Q' + point.x + ',' + point.y + ' ' + midX + ',' + midY
      })
      return path + 'Z'
    }

    function layoutGraph(nodes, edges, clusterAnchors, startPositions, iterations) {
      const anchors = new Map()
      const groups = new Map()
      nodes.forEach((node) => {
        const key = node.clusterId || 'none'
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key).push(node)
      })
      let index = 0
      groups.forEach((group, key) => {
        const angle = index * 2.399963
        const radius = key === 'none' ? 0 : 180 + 80 * Math.sqrt(index)
        anchors.set(key, { x: Math.cos(angle) * radius, y: Math.sin(angle) * radius })
        index += 1
      })
      const positions = new Map()
      nodes.forEach((node, order) => {
        const start = startPositions && startPositions.get(node.id)
        if (start) {
          positions.set(node.id, { x: start.x, y: start.y })
          return
        }
        const angle = order * 2.399963
        const radius = 26 + 22 * Math.sqrt(order + 1)
        const anchor = anchors.get(node.clusterId || 'none') || { x: 0, y: 0 }
        positions.set(node.id, {
          x: anchor.x + Math.cos(angle) * radius,
          y: anchor.y + Math.sin(angle) * radius
        })
      })
      const adjacency = new Map()
      nodes.forEach((node) => adjacency.set(node.id, []))
      edges.forEach((edge) => {
        if (adjacency.has(edge.source) && adjacency.has(edge.target)) {
          adjacency.get(edge.source).push(edge.target)
          adjacency.get(edge.target).push(edge.source)
        }
      })
      const steps = Math.max(0, iterations || 0)
      for (let step = 0; step < steps; step += 1) {
        const forces = new Map()
        nodes.forEach((node) => forces.set(node.id, { x: 0, y: 0 }))
        for (let i = 0; i < nodes.length; i += 1) {
          const left = positions.get(nodes[i].id)
          for (let j = i + 1; j < nodes.length; j += 1) {
            const right = positions.get(nodes[j].id)
            let dx = left.x - right.x
            let dy = left.y - right.y
            let distance = Math.sqrt(dx * dx + dy * dy)
            if (distance < 1) {
              dx = (Math.random() - 0.5) * 2
              dy = (Math.random() - 0.5) * 2
              distance = 2
            }
            const force = 14000 / (distance * distance)
            const fx = (dx / distance) * force
            const fy = (dy / distance) * force
            const leftForce = forces.get(nodes[i].id)
            const rightForce = forces.get(nodes[j].id)
            leftForce.x += fx
            leftForce.y += fy
            rightForce.x -= fx
            rightForce.y -= fy
          }
        }
        edges.forEach((edge) => {
          const left = positions.get(edge.source)
          const right = positions.get(edge.target)
          if (!left || !right) return
          const dx = right.x - left.x
          const dy = right.y - left.y
          const distance = Math.sqrt(dx * dx + dy * dy) || 1
          const targetLength = edge.kind === 'suggested' ? 250 : 200
          const force = (distance - targetLength) * 0.045
          const fx = (dx / distance) * force
          const fy = (dy / distance) * force
          const leftForce = forces.get(edge.source)
          const rightForce = forces.get(edge.target)
          leftForce.x += fx
          leftForce.y += fy
          rightForce.x -= fx
          rightForce.y -= fy
        })
        nodes.forEach((node) => {
          const force = forces.get(node.id)
          const position = positions.get(node.id)
          const anchor = anchors.get(node.clusterId || 'none') || { x: 0, y: 0 }
          force.x += (anchor.x - position.x) * 0.012
          force.y += (anchor.y - position.y) * 0.012
          position.x = position.x + clamp(force.x, -30, 30) * 0.85
          position.y = position.y + clamp(force.y, -30, 30) * 0.85
        })
      }
      return positions
    }

    function nodeGlyph(nodeType) {
      const map = {
        project: '项',
        system: '系',
        subsystem: '子',
        concept: '象',
        workflow: '流',
        preference: '好',
        principle: '则',
        method: '法'
      }
      return map[nodeType] || '知'
    }

    function typeLabelOfNode(nodeType) {
      return nodeType
    }
    function GraphView(props) {
      const t = props.t
      const meta = props.meta
      const wrapRef = useRef(null)
      const svgRef = useRef(null)
      const positionsRef = useRef(new Map())
      const viewRef = useRef({ x: 0, y: 0, k: 1 })
      const dragRef = useRef(null)
      // 被用户手动拖过的记忆框不再自动跟随成员位置。
      const pinnedFrames = useRef(new Set())
      const seed = props.initialConfig || {}
      const [size, setSize] = useState({ width: 900, height: 560 })
      const [view, setView] = useState({ x: 0, y: 0, k: 1 })
      const [tool, setTool] = useState(seed.tool || 'select')
      const [panelOpen, setPanelOpen] = useState(false)
      const [showSuggested, setShowSuggested] = useState(seed.showSuggested !== false)
      const [hiddenTypes, setHiddenTypes] = useState(seed.hiddenTypes || [])
      const [hiddenRelations, setHiddenRelations] = useState(seed.hiddenRelations || [])
      const [hiddenDomains, setHiddenDomains] = useState(seed.hiddenDomains || [])
      const [hiddenProjects, setHiddenProjects] = useState(seed.hiddenProjects || [])
      const [collapsed, setCollapsed] = useState(seed.collapsed || [])
      const [hiddenCollections, setHiddenCollections] = useState(seed.hiddenCollections || [])
      const [hiddenNodeTypes, setHiddenNodeTypes] = useState(seed.hiddenNodeTypes || [])
      const [showArchivedNodes, setShowArchivedNodes] = useState(Boolean(seed.showArchivedNodes))
      const [search, setSearch] = useState(seed.search || '')
      const [linkDraft, setLinkDraft] = useState(null)
      const [boxDraft, setBoxDraft] = useState(null)
      const [activeFrame, setActiveFrame] = useState('')
      const [frameDraftRect, setFrameDraftRect] = useState(null)
      const autoSaveRef = useRef(null)
      const [hoverEdge, setHoverEdge] = useState('')
      const [flash, setFlash] = useState('')
      const [tick, setTick] = useState(0)
      const [collapsedNodes, setCollapsedNodes] = useState(seed.collapsedNodes || [])
      const [spaceDown, setSpaceDown] = useState(false)
      const selection = props.selection || []

      useEffect(() => {
        const node = wrapRef.current
        if (!node) return undefined
        const measure = () => {
          const rect = node.getBoundingClientRect()
          setSize({ width: Math.max(320, Math.round(rect.width)), height: Math.max(320, Math.round(rect.height)) })
        }
        measure()
        if (typeof window !== 'undefined' && window.addEventListener) window.addEventListener('resize', measure)
        return () => {
          if (typeof window !== 'undefined' && window.removeEventListener) window.removeEventListener('resize', measure)
        }
      }, [])

      useEffect(() => {
        if (!flash) return undefined
        const timer = setTimeout(() => setFlash(''), 2400)
        return () => clearTimeout(timer)
      }, [flash])

      // 键盘：Space 平移画布；Esc 取消选择；Delete 对选中对象发起删除 / 归档确认。
      useEffect(() => {
        const typing = (target) => {
          const tag = target && target.tagName ? String(target.tagName).toLowerCase() : ""
          return tag === "input" || tag === "textarea" || tag === "select" || Boolean(target && target.isContentEditable)
        }
        const onKeyDown = (event) => {
          const key = event && event.key
          if (key === " " && !typing(event.target)) {
            setSpaceDown(true)
            if (event.preventDefault) event.preventDefault()
            return
          }
          if (key === "Escape") {
            setActiveFrame("")
            if (props.onClearSelection) props.onClearSelection()
            return
          }
          if (key !== "Delete" && key !== "Backspace") return
          if (typing(event.target)) return
          if (event.preventDefault) event.preventDefault()
          if (activeFrame) {
            const frame = (props.frames || []).find((item) => item.id === activeFrame)
            setActiveFrame("")
            if (frame && props.onDeleteFrame) props.onDeleteFrame(frame)
            return
          }
          const picked = (props.selection || [])
            .map((id) => (props.knowledgeNodes || []).find((node) => node.id === id))
            .filter(Boolean)
          if (picked.length && props.onRequestDeleteNode) props.onRequestDeleteNode(picked[0])
        }
        const onKeyUp = (event) => {
          if (event && event.key === " ") setSpaceDown(false)
        }
        window.addEventListener("keydown", onKeyDown)
        window.addEventListener("keyup", onKeyUp)
        return () => {
          window.removeEventListener("keydown", onKeyDown)
          window.removeEventListener("keyup", onKeyUp)
        }
      }, [activeFrame, props.frames, props.deleteFrameGuard, props.selection, props.knowledgeNodes, props.onDeleteFrame, props.onRequestDeleteNode, props.onClearSelection])

      useEffect(() => {
        if (typeof props.onState !== 'function') return
        props.onState({
          tool: tool,
          showSuggested: showSuggested,
          hiddenTypes: hiddenTypes,
          hiddenRelations: hiddenRelations,
          hiddenDomains: hiddenDomains,
          hiddenProjects: hiddenProjects,
          hiddenCollections: hiddenCollections,
          hiddenNodeTypes: hiddenNodeTypes,
          showArchivedNodes: showArchivedNodes,
          collapsed: collapsed,
          search: search
        })
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [
        tool,
        showSuggested,
        hiddenTypes.join(','),
        hiddenRelations.join(','),
        hiddenDomains.join(','),
        hiddenProjects.join(','),
        hiddenCollections.join(','),
        collapsed.join(','),
        search
      ])

      const hiddenSet = useMemo(() => new Set(props.hiddenNodes || []), [props.hiddenNodes])
  const showHidden = Boolean(props.showHidden)

  const model = useMemo(() => {
        const entryById = new Map(props.entries.map((entry) => [entry.id, entry]))
        const clusters = props.collections
          .filter((collection) => collection.status !== 'suggested')
          .filter((collection) => !hiddenCollections.includes(collection.id))
          .map((collection) => ({
            id: collection.id,
            name: collection.name,
            color: collection.color,
            memberIds: collection.memberIds.filter((id) => entryById.has(id))
          }))
          .filter((collection) => collection.memberIds.length > 0)
        const clusterOf = new Map()
        clusters.forEach((cluster) => {
          cluster.memberIds.forEach((id) => {
            if (!clusterOf.has(id)) clusterOf.set(id, cluster.id)
          })
        })
        const collapsedSet = new Set(collapsed)
        const nodes = []
        const visibleIds = new Set()
        props.entries
          .filter((entry) => !hiddenTypes.includes(entry.type))
          .filter((entry) => !hiddenProjects.includes(entry.projectId))
          .filter((entry) => !entry.domains.length || entry.domains.some((domain) => !hiddenDomains.includes(domain)))
          .forEach((entry) => {
            const clusterId = clusterOf.get(entry.id)
            if (clusterId && collapsedSet.has(clusterId)) return
            visibleIds.add(entry.id)
            nodes.push({ id: entry.id, entry: entry, clusterId: clusterId || '' })
          })
        clusters.forEach((cluster) => {
          if (!collapsedSet.has(cluster.id)) return
          const members = cluster.memberIds.filter((id) => entryById.has(id))
          if (!members.length) return
          visibleIds.add(cluster.id)
          nodes.push({
            id: cluster.id,
            clusterCollapsed: true,
            cluster: cluster,
            count: members.length,
            memberIds: members
          })
        })
        // 记忆框：框本身是一个超级节点，可以拖、可以拖线连到别的记忆或别的框，
        // 这样「这一组东西」就能作为整体参与项目结构。
        const frameNodes = (props.frames || [])
          .map((frame) => {
            const members = frame.memberIds.filter((id) => visibleIds.has(id))
            if (!members.length) return null
            return {
              id: frame.id,
              frame: frame,
              frameNode: true,
              memberIds: members,
              label: frame.name
            }
          })
          .filter(Boolean)
        frameNodes.forEach((node) => {
          visibleIds.add(node.id)
          nodes.push(node)
        })
        // 知识对象是知识网络的主节点，记忆按需挂在它们周围。
        const allKnowledge = (props.knowledgeNodes || [])
        const knowledgeMap = new Map(allKnowledge.map((node) => [node.id, node]))
        const collapsedNodeSet = new Set(collapsedNodes)
        const childrenOf = (id) => allKnowledge.filter((node) => node.parentNodeId === id && node.status !== "merged")
        const isUnderCollapsed = (node) => {
          let guard = 0
          let parentId = node.parentNodeId
          while (parentId && guard < 32) {
            if (collapsedNodeSet.has(parentId)) return true
            const parent = knowledgeMap.get(parentId)
            parentId = parent ? parent.parentNodeId : ""
            guard += 1
          }
          return false
        }
        const countHidden = (id) => {
          const kids = childrenOf(id)
          return kids.reduce((sum, kid) => sum + 1 + countHidden(kid.id), 0)
        }
        const knowledgeNodes = allKnowledge
          .filter((node) => node.status !== "merged")
          .filter((node) => !hiddenNodeTypes.includes(node.nodeType))
          .filter((node) => !hiddenProjects.includes(node.projectId))
          .filter((node) => showArchivedNodes || node.status !== "archived")
          .filter((node) => !isUnderCollapsed(node))
          .map((node) => {
            visibleIds.add(node.id)
            const childCount = childrenOf(node.id).length
            const isCollapsed = collapsedNodeSet.has(node.id)
            return {
              id: node.id,
              knowledge: node,
              knowledgeNode: true,
              label: node.title,
              nodeTypeLabel: typeLabelOfNode(node.nodeType),
              childCount: childCount,
              collapsedNode: isCollapsed,
              hiddenChildCount: isCollapsed ? countHidden(node.id) : childCount,
              count: (node.relatedMemoryIds || []).length + (isCollapsed ? countHidden(node.id) : 0)
            }
          })
        knowledgeNodes.forEach((node) => nodes.push(node))
        const edges = []
        props.relations
          .filter((relation) => showSuggested || relation.status !== 'suggested')
          .filter((relation) => !hiddenRelations.includes(relation.relationType))
          .forEach((relation) => {
            let source = relation.sourceType === 'node' ? relation.sourceId : relation.sourceId || relation.sourceMemoryId
            let target = relation.targetType === 'node' ? relation.targetId : relation.targetId || relation.targetMemoryId
            const sourceCluster = clusterOf.get(source)
            const targetCluster = clusterOf.get(target)
            if (sourceCluster && collapsedSet.has(sourceCluster)) source = sourceCluster
            if (targetCluster && collapsedSet.has(targetCluster)) target = targetCluster
            if (source === target) return
            if (!visibleIds.has(source) || !visibleIds.has(target)) return
            edges.push({
              id: relation.id,
              relation: relation,
              source: source,
              target: target,
              kind: relation.status === 'suggested' ? 'suggested' : 'confirmed'
            })
          })
        const degree = new Map()
        nodes.forEach((node) => degree.set(node.id, 0))
        edges.forEach((edge) => {
          degree.set(edge.source, (degree.get(edge.source) || 0) + 1)
          degree.set(edge.target, (degree.get(edge.target) || 0) + 1)
        })
        nodes.forEach((node) => {
          node.degree = degree.get(node.id) || 0
          if (node.frameNode) {
            node.radius = 13
            node.frameWidth = Math.max(64, Math.min(150, 30 + String(node.label).length * 6.6))
            node.frameHeight = 26
            return
          }
          if (node.knowledgeNode) {
            node.radius = 15 + Math.min(node.degree, 8) * 1.8
            node.nodeStatus = node.knowledge.status
            return
          }
          node.radius = node.clusterCollapsed
            ? 24 + Math.min(node.count, 12) * 1.4
            : 11 + Math.min(node.degree, 9) * 1.5 + (node.entry.status === 'active' ? 0 : 0)
        })
        return { nodes: nodes, edges: edges, clusters: clusters, clusterOf: clusterOf }
      }, [
        props.entries,
        props.relations,
        props.collections,
        showSuggested,
        hiddenTypes.join(','),
        hiddenRelations.join(','),
        hiddenDomains.join(','),
        hiddenProjects.join(','),
        hiddenCollections.join(','),
        collapsed.join(','),
        (props.knowledgeNodes || []).map((node) => node.id + ':' + node.status + ':' + node.updatedAt).join(','),
        hiddenNodeTypes.join(','),
        showArchivedNodes
      ])

      const clusterAnchors = useMemo(
        () =>
          model.clusters.map((cluster) => ({
            id: cluster.id,
            memberIds: cluster.memberIds.filter((id) => model.nodes.some((node) => node.id === id))
          })),
        [model]
      )

      const nodeKey = model.nodes
        .map((node) => node.id)
        .sort()
        .join('|')

      useEffect(() => {
        // 先用手动保存过的布局做种子，再跑本地松弛：打开关系图时保持用户调好的样子。
        const saved = (props.layout && props.layout.positions) || {}
        const seeded = new Map(positionsRef.current)
        model.nodes.forEach((node) => {
          if (seeded.has(node.id)) return
          const point = saved[node.id]
          if (point && Number.isFinite(Number(point.x)) && Number.isFinite(Number(point.y))) {
            seeded.set(node.id, { x: Number(point.x), y: Number(point.y) })
          }
        })
        positionsRef.current = layoutGraph(model.nodes, model.edges, clusterAnchors, seeded, 300)
        placeFrameNodes()
        fitToWindow()
        setTick((value) => value + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [nodeKey])

      useEffect(() => {
        if (!positionsRef.current.size) return
        positionsRef.current = layoutGraph(model.nodes, model.edges, clusterAnchors, positionsRef.current, 80)
        placeFrameNodes()
        setTick((value) => value + 1)
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [model.edges.length])

      // 记忆区：有 rect 的框把把手贴在框左上角；老数据没有 rect 时退回「成员上方」。
      const placeFrameNodes = () => {
        model.nodes.forEach((node) => {
          if (!node.frameNode || pinnedFrames.current.has(node.id)) return
          const rect = node.frame && node.frame.rect
          if (rect) {
            positionsRef.current.set(node.id, { x: rect.x + 34, y: rect.y - 16 })
            return
          }
          if (!node.memberIds.length) return
          let sumX = 0
          let sumY = 0
          let count = 0
          node.memberIds.forEach((id) => {
            const point = positionsRef.current.get(id)
            if (!point) return
            sumX += point.x
            sumY += point.y
            count += 1
          })
          if (!count) return
          positionsRef.current.set(node.id, { x: sumX / count, y: sumY / count - 58 })
        })
      }

      const positionOf = (id) => positionsRef.current.get(id) || { x: 0, y: 0 }

      const fitToWindow = () => {
        const nodes = model.nodes
        if (!nodes.length) {
          viewRef.current = { x: size.width / 2, y: size.height / 2, k: 1 }
          setView(viewRef.current)
          return
        }
        let minX = Infinity
        let maxX = -Infinity
        let minY = Infinity
        let maxY = -Infinity
        nodes.forEach((node) => {
          const point = positionOf(node.id)
          minX = Math.min(minX, point.x - node.radius - 70)
          maxX = Math.max(maxX, point.x + node.radius + 70)
          minY = Math.min(minY, point.y - node.radius - 54)
          maxY = Math.max(maxY, point.y + node.radius + 54)
        })
        const width = Math.max(120, maxX - minX)
        const height = Math.max(120, maxY - minY)
        const scale = clamp(Math.min((size.width - 60) / width, (size.height - 60) / height), 0.2, 1.6)
        const next = {
          x: size.width / 2 - ((minX + maxX) / 2) * scale,
          y: size.height / 2 - ((minY + maxY) / 2) * scale,
          k: scale
        }
        viewRef.current = next
        setView(next)
      }

      const toGraph = (screenX, screenY) => {
        const current = viewRef.current
        return { x: (screenX - current.x) / current.k, y: (screenY - current.y) / current.k }
      }

      const localPoint = (event) => {
        const svg = svgRef.current
        if (svg && svg.getBoundingClientRect) {
          const rect = svg.getBoundingClientRect()
          return { x: event.clientX - rect.left, y: event.clientY - rect.top }
        }
        return { x: event.clientX, y: event.clientY }
      }

      const zoomBy = (factor) => {
        const current = viewRef.current
        const nextScale = clamp(current.k * factor, 0.15, 3)
        const ratio = nextScale / current.k
        const next = {
          k: nextScale,
          x: size.width / 2 - (size.width / 2 - current.x) * ratio,
          y: size.height / 2 - (size.height / 2 - current.y) * ratio
        }
        viewRef.current = next
        setView(next)
      }

      const relayout = () => {
        positionsRef.current = new Map()
        positionsRef.current = layoutGraph(model.nodes, model.edges, clusterAnchors, null, 320)
        fitToWindow()
        setTick((value) => value + 1)
      }

      const startPan = (event) => {
        if (event.button !== 0) return
        dragRef.current = {
          kind: 'pan',
          pointerId: event.pointerId,
          startX: event.clientX,
          startY: event.clientY,
          originX: viewRef.current.x,
          originY: viewRef.current.y,
          moved: false
        }
        if (event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
      }

      const startNodeDrag = (event, node) => {
        if (event.button !== 0) return
        event.stopPropagation()
        const point = localPoint(event)
        if (tool === 'link') {
          dragRef.current = {
            kind: 'link',
            pointerId: event.pointerId,
            fromId: node.clusterCollapsed ? '' : node.id,
            fromCluster: node.clusterCollapsed ? node.id : '',
            start: point,
            moved: false
          }
          setLinkDraft({ from: point, to: point, cluster: Boolean(node.clusterCollapsed) })
          if (event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
          return
        }
        const graphPoint = toGraph(point.x, point.y)
        const current = positionOf(node.id)
        dragRef.current = {
          kind: 'node',
          pointerId: event.pointerId,
          id: node.id,
          node: node,
          dx: graphPoint.x - current.x,
          dy: graphPoint.y - current.y,
          startX: event.clientX,
          startY: event.clientY,
          moved: false
        }
        if (event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
      }

      // 两个工具共用同一套拖框手势：框选只负责选中，记忆区负责建块。
      const startBox = (event) => {
        if (event.button !== 0) return
        if (tool !== 'box' && tool !== 'area') return
        const point = localPoint(event)
        dragRef.current = {
          kind: 'box',
          pointerId: event.pointerId,
          start: point,
          moved: false,
          mode: tool === 'area' ? 'area' : 'box',
          multi: Boolean(event.shiftKey || event.metaKey)
        }
        setBoxDraft({ from: point, to: point, mode: tool === 'area' ? 'area' : 'box' })
        if (event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
      }

      // 记住一块已有记忆区：拖动 = 整体平移，四角小方块 = 缩放。
      const startFrameDrag = (event, frame, handle) => {
        if (event.button !== 0) return
        if (event.stopPropagation) event.stopPropagation()
        const rect = frameRectOf(frame) || { x: 0, y: 0, w: 120, h: 90 }
        const point = localPoint(event)
        const graphPoint = toGraph(point.x, point.y)
        dragRef.current = {
          kind: 'frame',
          pointerId: event.pointerId,
          id: frame.id,
          frame: frame,
          handle: handle || '',
          rect: rect,
          start: graphPoint,
          moved: false
        }
        setActiveFrame(frame.id)
        if (props.onSelectFrame) props.onSelectFrame(frame, false)
        if (event.currentTarget && event.currentTarget.setPointerCapture) event.currentTarget.setPointerCapture(event.pointerId)
      }


      const onPointerMove = (event) => {
        const drag = dragRef.current
        if (!drag) return
        if (drag.kind === 'pan') {
          const dx = event.clientX - drag.startX
          const dy = event.clientY - drag.startY
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
          const next = { x: drag.originX + dx, y: drag.originY + dy, k: viewRef.current.k }
          viewRef.current = next
          setView(next)
          return
        }
        if (drag.kind === 'node') {
          const point = localPoint(event)
          const graphPoint = toGraph(point.x, point.y)
          if (Math.abs(event.clientX - drag.startX) + Math.abs(event.clientY - drag.startY) > 3) drag.moved = true
          positionsRef.current.set(drag.id, { x: graphPoint.x - drag.dx, y: graphPoint.y - drag.dy })
          setTick((value) => value + 1)
          return
        }
        if (drag.kind === 'link') {
          const point = localPoint(event)
          if (Math.abs(point.x - drag.start.x) + Math.abs(point.y - drag.start.y) > 3) drag.moved = true
          setLinkDraft({ from: drag.start, to: point, cluster: Boolean(drag.fromCluster) })
          return
        }
        if (drag.kind === 'box') {
          const point = localPoint(event)
          if (Math.abs(point.x - drag.start.x) + Math.abs(point.y - drag.start.y) > 3) drag.moved = true
          setBoxDraft({ from: drag.start, to: point, mode: drag.mode })
          return
        }
        if (drag.kind === 'frame') {
          const point = localPoint(event)
          const graphPoint = toGraph(point.x, point.y)
          const dx = graphPoint.x - drag.start.x
          const dy = graphPoint.y - drag.start.y
          if (Math.abs(dx) + Math.abs(dy) > 3) drag.moved = true
          let next
          if (!drag.handle) {
            next = {
              x: Math.round(drag.rect.x + dx),
              y: Math.round(drag.rect.y + dy),
              w: drag.rect.w,
              h: drag.rect.h
            }
          } else {
            let left = drag.rect.x
            let top = drag.rect.y
            let right = drag.rect.x + drag.rect.w
            let bottom = drag.rect.y + drag.rect.h
            if (drag.handle.indexOf('w') >= 0) left = Math.min(left + dx, right - 80)
            if (drag.handle.indexOf('e') >= 0) right = Math.max(right + dx, left + 80)
            if (drag.handle.indexOf('n') >= 0) top = Math.min(top + dy, bottom - 60)
            if (drag.handle.indexOf('s') >= 0) bottom = Math.max(bottom + dy, top + 60)
            next = {
              x: Math.round(left),
              y: Math.round(top),
              w: Math.round(right - left),
              h: Math.round(bottom - top)
            }
          }
          setFrameDraftRect({ id: drag.id, rect: next })
        }
      }

      const endDrag = (event) => {
        const drag = dragRef.current
        dragRef.current = null
        if (!drag) return
        if (drag.kind === 'node') {
          if (!drag.moved) {
            const additive = Boolean(event && (event.shiftKey || event.ctrlKey || event.metaKey))
            if (drag.node && drag.node.frameNode && props.onSelectFrame) {
              props.onSelectFrame(drag.node.frame, additive)
            } else {
              props.onSelect(drag.id, additive)
            }
          } else if (drag.node && drag.node.frameNode) {
            pinnedFrames.current.add(drag.id)
            scheduleAutoSave()
          } else scheduleAutoSave()
          return
        }
        if (drag.kind === 'link') {
          const point = localPoint(event)
          setLinkDraft(null)
          if (drag.fromCluster) {
            setFlash(t('graph.clusterHint'))
            return
          }
          const graphPoint = toGraph(point.x, point.y)
          let hit = null
          model.nodes.forEach((node) => {
            if (node.clusterCollapsed) return
            const center = positionOf(node.id)
            if (node.frameNode) {
              const halfW = node.frameWidth / 2 + 6
              const halfH = node.frameHeight / 2 + 6
              if (Math.abs(center.x - graphPoint.x) <= halfW && Math.abs(center.y - graphPoint.y) <= halfH) hit = node
              return
            }
            const distance = Math.sqrt(
              Math.pow(center.x - graphPoint.x, 2) + Math.pow(center.y - graphPoint.y, 2)
            )
            if (distance <= node.radius + 14) hit = node
          })
          if (!hit) {
            setFlash(t('graph.linkNeedTarget'))
            return
          }
          if (hit.id === drag.fromId) {
            setFlash(t('graph.linkSelf'))
            return
          }
          props.onCreateRelation(drag.fromId, hit.id)
          setTool('select')
          setFlash(t('graph.linkDone'))
          return
        }
        if (drag.kind === 'box') {
          const box = boxDraft
          setBoxDraft(null)
          if (!box) return
          const left = Math.min(box.from.x, box.to.x)
          const right = Math.max(box.from.x, box.to.x)
          const top = Math.min(box.from.y, box.to.y)
          const bottom = Math.max(box.from.y, box.to.y)
          const picked = []
          model.nodes.forEach((node) => {
            const point = positionOf(node.id)
            const screenX = point.x * viewRef.current.k + viewRef.current.x
            const screenY = point.y * viewRef.current.k + viewRef.current.y
            if (screenX >= left && screenX <= right && screenY >= top && screenY <= bottom) picked.push(node.id)
          })
          // 画框存的是图坐标，跟缩放/平移无关，之后框内归属全靠这个 rect 重算。
          const current = viewRef.current
          const rect = {
            x: Math.round((left - current.x) / current.k),
            y: Math.round((top - current.y) / current.k),
            w: Math.round(Math.max(56, (right - left) / current.k)),
            h: Math.round(Math.max(44, (bottom - top) / current.k))
          }
          // 「框选」只负责选中；「记忆区」才落块。
          if (drag.mode !== 'area') {
            props.onMultiSelect(picked)
            return
          }
          if (props.onCreateFrame) {
            props.onCreateFrame({ rect: rect, memberIds: picked })
            setFlash(t('graph.frameDrawn'))
            setTool('select')
            return
          }
          if (props.onSaveFrame) {
            const frames = props.frames || []
            props.onSaveFrame({
              name: t('graph.frameName') + ' ' + (frames.length + 1),
              color: COLLECTION_COLORS[frames.length % COLLECTION_COLORS.length],
              memberIds: picked,
              rect: rect
            })
            setFlash(t('graph.frameSaved'))
            setTool('select')
          }
          return
        }
        if (drag.kind === 'frame') {
          const draft = frameDraftRect
          setFrameDraftRect(null)
          if (!drag.moved) return
          const nextRect = draft && draft.id === drag.id ? draft.rect : drag.rect
          // 框搬过家之后，把门牌重新贴到框上。
          pinnedFrames.current.delete(drag.id)
          if (props.onUpdateFrame) props.onUpdateFrame(drag.frame, nextRect)
          else if (props.onSaveFrame) {
            props.onSaveFrame({ id: drag.id, name: drag.frame.name, rect: nextRect })
          }
          return
        }
        if (drag.kind === 'pan') {
          // 点空白的深色背景（没有拖动）= 退出选择并收起右侧详情栏。
          if (!drag.moved && tool === 'select' && props.onClearSelection) props.onClearSelection()
        }
      }

      const onWheel = (event) => {
        if (typeof event.preventDefault === 'function') event.preventDefault()
        const point = localPoint(event)
        const current = viewRef.current
        const factor = event.deltaY > 0 ? 0.9 : 1.1
        const nextScale = clamp(current.k * factor, 0.15, 3)
        const ratio = nextScale / current.k
        const next = {
          k: nextScale,
          x: point.x - (point.x - current.x) * ratio,
          y: point.y - (point.y - current.y) * ratio
        }
        viewRef.current = next
        setView(next)
      }

      const searchMatches = search.trim()
        ? model.nodes.filter((node) => node.entry && matchesQuery(node.entry, search))
        : []

      const typeOptions = meta.entryTypes.map((item) => ({
        id: item.id,
        label: item.label,
        count: props.entries.filter((entry) => entry.type === item.id).length,
        color: typeColor(item.id)
      }))

      const relationOptions = meta.relationTypes.map((item) => ({
        id: item.id,
        label: item.label,
        count: props.relations.filter((relation) => relation.relationType === item.id).length,
        color: relationColor(item.id),
        dash: RELATION_DASH[item.id]
      }))

      const domainOptions = meta.domains.map((item) => ({
        id: item.id,
        label: item.label,
        count: props.entries.filter((entry) => entry.domains.includes(item.id)).length
      }))

      const nodeById = new Map(model.nodes.map((node) => [node.id, node]))

      const edgePath = (edge) => {
        const from = positionOf(edge.source)
        const to = positionOf(edge.target)
        const fromNode = nodeById.get(edge.source)
        const toNode = nodeById.get(edge.target)
        const fromRadius = fromNode ? fromNode.radius : 12
        const toRadius = toNode ? toNode.radius : 12
        const dx = to.x - from.x
        const dy = to.y - from.y
        const distance = Math.sqrt(dx * dx + dy * dy) || 1
        const ux = dx / distance
        const uy = dy / distance
        const startX = from.x + ux * fromRadius
        const startY = from.y + uy * fromRadius
        const endX = to.x - ux * (toRadius + 7)
        const endY = to.y - uy * (toRadius + 7)
        const bend = Math.min(46, distance * 0.17) * (edge.id.charCodeAt(edge.id.length - 1) % 2 ? 1 : -1)
        const midX = (startX + endX) / 2 - uy * bend
        const midY = (startY + endY) / 2 + ux * bend
        return {
          d: 'M' + startX + ',' + startY + ' Q' + midX + ',' + midY + ' ' + endX + ',' + endY,
          midX: midX,
          midY: midY,
          angle: (Math.atan2(endY - midY, endX - midX) * 180) / Math.PI
        }
      }

      const clusterShapes = model.clusters
        .filter((cluster) => !collapsed.includes(cluster.id))
        .map((cluster) => {
          const members = model.nodes.filter((node) => node.clusterId === cluster.id)
          if (members.length < 2) return null
          const points = members.map((node) => positionOf(node.id))
          const center = points.reduce(
            (acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }),
            { x: 0, y: 0 }
          )
          let topY = Infinity
          points.forEach((point) => {
            topY = Math.min(topY, point.y)
          })
          return h(
            'g',
            { key: cluster.id, className: 'zw-hull' },
            h('path', {
              className: 'zw-hullOutline',
              d: hullPath(points, 34),
              style: {
                fill: 'color-mix(in srgb, ' + collectionColor(cluster.color) + ' 9%, transparent)',
                stroke: 'color-mix(in srgb, ' + collectionColor(cluster.color) + ' 42%, transparent)'
              }
            }),
            h(
              'text',
              {
                className: 'zw-hullLabel',
                x: center.x,
                y: topY - 44,
                style: { fill: collectionColor(cluster.color) },
                onClick: () => toggleCollapse(cluster.id)
              },
              cluster.name,
              h(
                'tspan',
                { className: 'zw-hullCount', x: center.x, dy: 14 },
                members.length + ' ' + t('collections.memberCount') + ' · ' + t('graph.collapse')
              )
            )
          )
        })
        .filter(Boolean)

      // 记忆区：用户亲手画的空间容器。框内（rect 命中）的节点自动归属，
      // 所以拖动节点进出框，归属就会跟着变；保存布局后由 host 落库。
      // 拖动 / 缩放中的框用草稿矩形显示，松手才落库。
      const frameRectOf = (frame) =>
        frameDraftRect && frameDraftRect.id === frame.id ? frameDraftRect.rect : frame.rect

      const frameRectMembers = (frame) => {
        const visibleSet = new Set(model.nodes.map((node) => node.id))
        const box = frameRectOf(frame)
        if (!box) return frame.memberIds.filter((id) => visibleSet.has(id))
        return model.nodes
          .filter((node) => node.id !== frame.id)
          .filter((node) => {
            const point = positionOf(node.id)
            return (
              point.x >= box.x &&
              point.x <= box.x + box.w &&
              point.y >= box.y &&
              point.y <= box.y + box.h
            )
          })
          .map((node) => node.id)
      }

      const frameShapes = (props.frames || [])
        .map((frame) => {
          const memberIds = frameRectMembers(frame)
          const members = model.nodes.filter((node) => memberIds.includes(node.id))
          const color = collectionColor(frame.color)
          const selected = activeFrame === frame.id
          if (frame.rect) {
            const rect = frameRectOf(frame) || frame.rect
            const labelWidth = Math.max(48, Math.round(String(frame.name).length * 12.6 + 34))
            const handles = selected
              ? [
                  ['nw', rect.x, rect.y],
                  ['ne', rect.x + rect.w, rect.y],
                  ['sw', rect.x, rect.y + rect.h],
                  ['se', rect.x + rect.w, rect.y + rect.h]
                ].map((item) =>
                  h('rect', {
                    key: 'h-' + item[0],
                    className: 'zw-frameHandle',
                    x: item[1] - 5,
                    y: item[2] - 5,
                    width: 10,
                    height: 10,
                    rx: 2,
                    onPointerDown: (event) => startFrameDrag(event, frame, item[0])
                  })
                )
              : null
            return h(
              'g',
              { key: frame.id, className: 'zw-frameGroup' },
              h('rect', {
                className: selected ? 'zw-frameBox zw-frameBoxSel' : 'zw-frameBox',
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.h,
                rx: 16,
                style: {
                  '--zw-frame-color': color,
                  fill: 'color-mix(in srgb, ' + color + ' 5%, transparent)',
                  stroke: 'color-mix(in srgb, ' + color + (selected ? ' 88%, transparent)' : ' 52%, transparent)'),
                  strokeDasharray: selected ? 'none' : '7 6'
                }
              }),
              // 透明的可抓取层：拖它 = 整块搬家；四角小方块 = 缩放。
              h('rect', {
                className: 'zw-frameHit',
                x: rect.x,
                y: rect.y,
                width: rect.w,
                height: rect.h,
                rx: 16,
                onPointerDown: (event) => startFrameDrag(event, frame, ''),
                onDoubleClick: () => {
                  if (props.onRenameFrame) props.onRenameFrame(frame)
                }
              }),
              handles,
              h('rect', {
                className: 'zw-frameLabelBg',
                x: rect.x + 10,
                y: rect.y - 21,
                width: labelWidth,
                height: 21,
                rx: 6,
                style: { '--zw-frame-color': color }
              }),
              h(
                'text',
                {
                  className: 'zw-frameLabel',
                  x: rect.x + 18,
                  y: rect.y - 6,
                  style: { fill: color, '--zw-frame-color': color }
                },
                frame.name,
                h(
                  'tspan',
                  { className: 'zw-frameCount', x: rect.x + 18 + labelWidth - 26, dy: 0 },
                  String(members.length)
                )
              )
            )
          }
          if (members.length < 2) return null
          const points = members.map((node) => positionOf(node.id))
          const center = points.reduce(
            (acc, point) => ({ x: acc.x + point.x / points.length, y: acc.y + point.y / points.length }),
            { x: 0, y: 0 }
          )
          let topY = Infinity
          points.forEach((point) => {
            topY = Math.min(topY, point.y)
          })
          return h(
            'g',
            { key: frame.id, className: selected ? 'zw-frameBox zw-frameBoxSel' : 'zw-frameBox' },
            h('path', {
              className: 'zw-hullOutline',
              d: hullPath(points, 22),
              style: {
                fill: 'color-mix(in srgb, ' + color + ' 6%, transparent)',
                stroke: 'color-mix(in srgb, ' + color + ' ' + (selected ? '88%' : '55%') + ', transparent)',
                strokeDasharray: '6 5',
                cursor: 'pointer'
              },
              onClick: () => {
                setActiveFrame(frame.id)
                if (props.onSelectFrame) props.onSelectFrame(frame, false)
              },
              onDoubleClick: () => {
                if (props.onRenameFrame) props.onRenameFrame(frame)
              }
            }),
            h(
              'text',
              { className: 'zw-frameLabel', x: center.x, y: topY - 26, style: { fill: color } },
              frame.name,
              h(
                'tspan',
                { className: 'zw-frameCount', x: center.x, dy: 13 },
                members.length + ' ' + t('collections.memberCount')
              )
            )
          )
        })
        .filter(Boolean)

      const collectPositions = () => {
        const positions = {}
        positionsRef.current.forEach((point, id) => {
          positions[id] = { x: Math.round(point.x), y: Math.round(point.y) }
        })
        return positions
      }

      // 拖完节点/框后静默存一次布局，host 会顺手按 rect 重算记忆区归属。
      const scheduleAutoSave = () => {
        if (typeof props.onLayoutChange !== 'function') return
        if (autoSaveRef.current) clearTimeout(autoSaveRef.current)
        autoSaveRef.current = setTimeout(() => {
          autoSaveRef.current = null
          props.onLayoutChange(collectPositions())
        }, 700)
      }

      const saveLayoutNow = () => {
        if (!props.onSaveLayout) return
        props.onSaveLayout(collectPositions())
        setFlash(t('graph.layoutSaved'))
      }

      const toggleCollapse = (clusterId) => {
        setCollapsed((prev) =>
          prev.includes(clusterId) ? prev.filter((item) => item !== clusterId) : prev.concat([clusterId])
        )
      }

      const toolButton = (id, icon, label) =>
        h(
          'button',
          {
            type: 'button',
            className: 'zw-toolBtn' + (tool === id ? ' zw-toolBtnOn' : ''),
            title: label,
            onClick: () => {
              setTool(id)
              setLinkDraft(null)
              setBoxDraft(null)
            }
          },
          h(Icon, { name: icon, size: 14 }),
          h('span', { className: 'zw-toolLabel' }, label)
        )

      const highlightIds = new Set(selection)
      searchMatches.forEach((node) => highlightIds.add(node.id))

      // 上下游高亮：选中单个节点时，沿关系方向标出上游（指向它）与下游（由它指出）
      const upstreamIds = new Set()
      const downstreamIds = new Set()
      if (selection.length === 1) {
        const anchor = selection[0]
        props.relations.forEach((relation) => {
          if (relation.status === 'rejected') return
          if (relation.sourceMemoryId === anchor) downstreamIds.add(relation.targetMemoryId)
          if (relation.targetMemoryId === anchor) upstreamIds.add(relation.sourceMemoryId)
        })
      }
      const impactClass = (id) =>
        (upstreamIds.has(id) ? ' zw-gnodeUp' : '') + (downstreamIds.has(id) ? ' zw-gnodeDown' : '')

      return h(
        'div',
        { className: 'zw-graphWrap', ref: wrapRef },
        h(
          'svg',
          {
            className: 'zw-graphSvg',
            ref: svgRef,
            'data-tool': tool,
            onPointerDown: (event) => {
              if (tool === 'box' || tool === 'area') {
                startBox(event)
                return
              }
              if (event.target === svgRef.current) {
                if (event.shiftKey) {
                  startBox(event)
                  return
                }
                setActiveFrame('')
                startPan(event)
              }
            },
            onPointerMove: onPointerMove,
            onPointerUp: endDrag,
            onPointerCancel: endDrag,
            onWheel: onWheel
          },
          h(
            'defs',
            null,
            meta.relationTypes.map((item) =>
              h(
                'marker',
                {
                  key: item.id,
                  id: 'zwArrow-' + item.id,
                  viewBox: '0 0 10 10',
                  refX: 9,
                  refY: 5,
                  markerWidth: 6,
                  markerHeight: 6,
                  orient: 'auto-start-reverse'
                },
                h('path', { d: 'M0,0 L10,5 L0,10 z', fill: relationColor(item.id) })
              )
            ),
            h(
              'filter',
              { id: 'zwGlow', x: '-40%', y: '-40%', width: '180%', height: '180%' },
              h('feGaussianBlur', { stdDeviation: 3.4, result: 'blur' }),
              h('feMerge', null, h('feMergeNode', { in: 'blur' }), h('feMergeNode', { in: 'SourceGraphic' }))
            )
          ),
          h(
            'g',
            { transform: 'translate(' + view.x + ',' + view.y + ') scale(' + view.k + ')' },
            h('g', { className: 'zw-frameLayer' }, frameShapes),
            h('g', { className: 'zw-hullLayer' }, clusterShapes),
            h(
              'g',
              { className: 'zw-edgeLayer' },
              model.edges.map((edge) => {
                const path = edgePath(edge)
                const color = relationColor(edge.relation.relationType)
                const dim =
                  selection.length &&
                  !highlightIds.has(edge.source) &&
                  !highlightIds.has(edge.target)
                const active =
                  selection.includes(edge.source) || selection.includes(edge.target) || hoverEdge === edge.id
                return h(
                  'g',
                  {
                    key: edge.id,
                    className:
                      'zw-gedge' +
                      (active ? ' zw-gedgeOn' : '') +
                      (dim ? ' zw-gedgeDim' : '') +
                      (edge.kind === 'suggested' ? ' zw-gedgeSuggested' : '') +
                      (selection.includes(edge.source) ? ' zw-gedgeDown' : '') +
                      (selection.includes(edge.target) ? ' zw-gedgeUp' : ''),
                    onPointerEnter: () => setHoverEdge(edge.id),
                    onPointerLeave: () => setHoverEdge('')
                  },
                  h('path', {
                    className: 'zw-gedgePath',
                    d: path.d,
                    style: {
                      stroke: color,
                      strokeDasharray: RELATION_DASH[edge.relation.relationType] || '',
                      markerEnd: 'url(#zwArrow-' + edge.relation.relationType + ')'
                    }
                  }),
                  edge.kind === 'confirmed'
                    ? h('path', {
                        className: 'zw-gedgeFlow',
                        d: path.d,
                        style: { stroke: color }
                      })
                    : null,
                  active
                    ? h(
                        'text',
                        {
                          className: 'zw-gedgeLabel zw-gedgeLabelOn',
                          x: path.midX,
                          y: path.midY - 8
                        },
                        labelOf(t, meta.relationTypes, edge.relation.relationType, 'relation')
                      )
                    : null
                )
              })
            ),
            h(
              'g',
              { className: 'zw-nodeLayer' },
              model.nodes.map((node) => {
                const point = positionOf(node.id)
                const selected = selection.includes(node.id)
                const dim = selection.length && !highlightIds.has(node.id)
                if (node.clusterCollapsed) {
                  return h(
                    'g',
                    {
                      key: node.id,
                      className:
                        'zw-gnode' +
                        (selected ? ' zw-gnodeOn' : '') +
                        (dim ? ' zw-gnodeDim' : '') +
                        impactClass(node.id),
                      transform: 'translate(' + point.x + ',' + point.y + ')',
                      onPointerDown: (event) => startNodeDrag(event, node),
                      style: { cursor: 'pointer' }
                    },
                    h('circle', {
                      className: 'zw-gnodeCore',
                      r: node.radius,
                      style: {
                        fill: 'color-mix(in srgb, ' + collectionColor(node.cluster.color) + ' 26%, transparent)',
                        stroke: collectionColor(node.cluster.color)
                      },
                      onDoubleClick: () => toggleCollapse(node.id)
                    }),
                    h(
                      'text',
                      { className: 'zw-gnodeLabel', y: 4, textAnchor: 'middle' },
                      node.count
                    ),
                    h(
                      'text',
                      { className: 'zw-gnodeBadge', y: node.radius + 16, textAnchor: 'middle' },
                      node.cluster.name
                    )
                  )
                }
                if (node.frameNode) {
                  const width = node.frameWidth
                  const height = node.frameHeight
                  const color = collectionColor(node.frame.color)
                  const inFrame = node.memberIds.indexOf(selection[0]) >= 0
                  return h(
                    'g',
                    {
                      key: node.id,
                      className:
                        'zw-gframeNode' +
                        (selected || inFrame ? ' zw-gframeOn' : '') +
                        (dim ? ' zw-gframeDim' : ''),
                      transform: 'translate(' + point.x + ',' + point.y + ')',
                      onPointerDown: (event) => startNodeDrag(event, node),
                      onDoubleClick: () => props.onRenameFrame && props.onRenameFrame(node.frame)
                    },
                    h('rect', {
                      className: 'zw-gframeChip',
                      x: -width / 2,
                      y: -height / 2,
                      width: width,
                      height: height,
                      rx: 9,
                      style: {
                        stroke: color,
                        fill: 'color-mix(in srgb, ' + color + ' 12%, var(--zw-surface))'
                      }
                    }),
                    h(
                      'text',
                      {
                        className: 'zw-gframeText',
                        x: 0,
                        y: 0,
                        textAnchor: 'middle',
                        style: { fill: color }
                      },
                      truncate(node.label, 14)
                    ),
                    h(
                      'text',
                      { className: 'zw-gframeBadge', y: height / 2 + 11, textAnchor: 'middle' },
                      node.memberIds.length + ' ' + t('collections.memberCount')
                    ),
                    h(
                      'title',
                      null,
                      node.label + ' · ' + t('graph.frameNodeHint')
                    )
                  )
                }
                if (node.knowledgeNode) {
                  const knowledge = node.knowledge
                  return h(
                    'g',
                    {
                      key: node.id,
                      className:
                        'zw-gnode zw-gnodeKn' +
                        (selected ? ' zw-gnodeOn' : '') +
                        (dim ? ' zw-gnodeDim' : '') +
                        impactClass(node.id),
                      transform: 'translate(' + point.x + ',' + point.y + ')',
                      onPointerDown: (event) => startNodeDrag(event, node),
                      onDoubleClick: () => (props.onFocusNode ? props.onFocusNode(knowledge) : null),
                      style: { cursor: tool === 'link' ? 'crosshair' : 'pointer' }
                    },
                    h('circle', {
                      className: 'zw-gnodeHalo' + (selected ? ' zw-gnodeHaloOn' : ''),
                      r: node.radius + 10,
                      style: { fill: 'var(--zw-accent)' }
                    }),
                    h('circle', {
                      className: 'zw-gnodeCore zw-gnodeCoreKn',
                      r: node.radius,
                      style: {
                        fill: 'var(--zw-surface)',
                        stroke: 'var(--zw-accent)',
                        strokeWidth: 2,
                        strokeDasharray: knowledge.status === 'candidate' ? '4 3' : '',
                        opacity: knowledge.status === 'archived' ? 0.5 : 1
                      }
                    }),
                    h(
                      'text',
                      { className: 'zw-gnodeKnGlyph', y: 4, textAnchor: 'middle' },
                      nodeGlyph(knowledge.nodeType)
                    ),
                    h(
                      'text',
                      {
                        className: 'zw-gnodeLabel' + (selected ? ' zw-gnodeLabelOn' : ''),
                        y: node.radius + 15,
                        textAnchor: 'middle'
                      },
                      truncate(knowledge.title, 14)
                    ),
                    node.hiddenChildCount
                      ? h(
                          "text",
                          {
                            className: "zw-gnodeKnCount" + (node.collapsedNode ? " zw-gnodeKnCountOn" : ""),
                            y: -node.radius - 6,
                            textAnchor: "middle",
                            style: { cursor: "pointer" },
                            onPointerDown: (event) => {
                              if (event && event.stopPropagation) event.stopPropagation()
                            },
                            onClick: (event) => {
                              if (event && event.stopPropagation) event.stopPropagation()
                              setCollapsedNodes((prev) =>
                                prev.indexOf(node.id) >= 0 ? prev.filter((id) => id !== node.id) : prev.concat([node.id])
                              )
                            }
                          },
                          "+" + node.hiddenChildCount
                        )
                      : null,
                    h('title', null, knowledge.title + ' · ' + labelOf(t, meta.nodeTypes, knowledge.nodeType, 'type'))
                  )
                }
                const entry = node.entry
                return h(
                  'g',
                  {
                    key: node.id,
                    className:
                      'zw-gnode' +
                      (selected ? ' zw-gnodeOn' : '') +
                      (dim ? ' zw-gnodeDim' : '') +
                      impactClass(node.id),
                    transform: 'translate(' + point.x + ',' + point.y + ')',
                    onPointerDown: (event) => startNodeDrag(event, node),
                    style: { cursor: tool === 'link' ? 'crosshair' : 'pointer' }
                  },
                  h('circle', {
                    className: 'zw-gnodeHalo' + (selected ? ' zw-gnodeHaloOn' : ''),
                    r: node.radius + 9,
                    style: { fill: typeColor(entry.type) }
                  }),
                  h('circle', {
                    className: 'zw-gnodeCore',
                    r: node.radius,
                    style: {
                      fill: typeColor(entry.type),
                      stroke:
                        entry.status === 'active'
                          ? 'var(--zw-graph-node-ring)'
                          : entry.status === 'draft' || entry.status === 'pending'
                            ? 'var(--zw-warn)'
                            : 'var(--zw-text-3)',
                      strokeDasharray: entry.status === 'draft' || entry.status === 'pending' ? '3 3' : '',
                      opacity: entry.status === 'deprecated' || entry.status === 'archived' ? 0.55 : 1
                    }
                  }),
                  entry.favorite
                    ? h('circle', {
                        className: 'zw-gnodeBadge',
                        cx: node.radius - 3,
                        cy: -node.radius + 3,
                        r: 3.4,
                        style: { fill: 'var(--zw-warn)' }
                      })
                    : null,
                  h(
                    'text',
                    {
                      className: 'zw-gnodeLabel' + (selected ? ' zw-gnodeLabelOn' : ''),
                      y: node.radius + 14,
                      textAnchor: 'middle'
                    },
                    truncate(entry.title, 12)
                  ),
                  h('title', null, entry.title + ' · ' + labelOf(t, meta.entryTypes, entry.type, 'type'))
                )
              })
            ),
            linkDraft
              ? h(
                  'g',
                  { className: 'zw-linkDraft' },
                  h('line', {
                    className: 'zw-gedgeDraft',
                    x1: toGraph(linkDraft.from.x, linkDraft.from.y).x,
                    y1: toGraph(linkDraft.from.x, linkDraft.from.y).y,
                    x2: toGraph(linkDraft.to.x, linkDraft.to.y).x,
                    y2: toGraph(linkDraft.to.x, linkDraft.to.y).y
                  }),
                  h('circle', {
                    className: 'zw-linkDot',
                    cx: toGraph(linkDraft.to.x, linkDraft.to.y).x,
                    cy: toGraph(linkDraft.to.x, linkDraft.to.y).y,
                    r: 5
                  })
                )
              : null
          ),
          boxDraft
            ? h('rect', {
                className: 'zw-boxRect',
                x: Math.min(boxDraft.from.x, boxDraft.to.x),
                y: Math.min(boxDraft.from.y, boxDraft.to.y),
                width: Math.abs(boxDraft.to.x - boxDraft.from.x),
                height: Math.abs(boxDraft.to.y - boxDraft.from.y)
              })
            : null
        ),
        h(
          'div',
          { className: 'zw-graphToolbar' },
          h(
            'button',
            { type: 'button', className: 'zw-toolBtn', title: t('graph.zoomIn'), onClick: () => zoomBy(1.2) },
            h(Icon, { name: 'zoomIn', size: 14 })
          ),
          h(
            'button',
            { type: 'button', className: 'zw-toolBtn', title: t('graph.zoomOut'), onClick: () => zoomBy(1 / 1.2) },
            h(Icon, { name: 'zoomOut', size: 14 })
          ),
          h(
            'button',
            { type: 'button', className: 'zw-toolBtn', title: t('graph.fit'), onClick: fitToWindow },
            h(Icon, { name: 'frame', size: 14 })
          ),
          h(
            'button',
            { type: 'button', className: 'zw-toolBtn', title: t('graph.relayout'), onClick: relayout },
            h(Icon, { name: 'shuffle', size: 14 })
          ),
          h('span', { className: 'zw-toolSep' }),
          toolButton('select', 'select', t('graph.toolSelect')),
          toolButton('link', 'link', t('graph.toolLink')),
          toolButton('box', 'box', t('graph.toolBox')),
          toolButton('area', 'frame', t('graph.toolArea')),
          h('span', { className: 'zw-toolSep' }),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-toolBtn',
              title: t('graph.saveLayout'),
              onClick: saveLayoutNow
            },
            h(Icon, { name: 'frame', size: 14 }),
            h('span', { className: 'zw-toolLabel' }, t('graph.saveLayout'))
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-toolBtn' + (panelOpen ? ' zw-toolBtnOn' : ''),
              title: t('graph.filters'),
              onClick: () => setPanelOpen(!panelOpen)
            },
            h(Icon, { name: 'filter', size: 14 })
          ),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-toolBtn',
              title: t('graph.saveView'),
              onClick: props.onSaveView
            },
            h(Icon, { name: 'bookmark', size: 14 })
          )
        ),
                h(
          'button',
          {
            type: 'button',
            className: 'zw-iconBtn',
            title: t('graph.expandAll'),
            onClick: () => {
              setCollapsedNodes(new Set())
              if ((props.knowledgeNodes || []).length > 120) flash(t('graph.expandLimit'))
            }
          },
          h(Icon, { name: 'expand', size: 15 })
        ),
h('span', { className: 'zw-graphCount' }, model.nodes.length + ' / ' + model.edges.length),
        flash ? h('span', { className: 'zw-graphHint' }, flash) : null,
        panelOpen
          ? h(
              'div',
              { className: 'zw-graphPanel' },
              h(
                'div',
                { className: 'zw-graphPanelHead' },
                h('span', { className: 'zw-blockTitle' }, t('graph.filters')),
                h(
                  'button',
                  { type: 'button', className: 'zw-iconBtn', onClick: () => setPanelOpen(false) },
                  h(Icon, { name: 'close', size: 13 })
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('input', {
                  className: 'zw-input zw-graphSearch',
                  placeholder: t('graph.searchPlaceholder'),
                  value: search,
                  onChange: (event) => setSearch(event.target.value)
                }),
                search.trim() && searchMatches.length
                  ? h(
                      'div',
                      { className: 'zw-miniList' },
                      searchMatches.slice(0, 6).map((node) =>
                        h(
                          'button',
                          {
                            key: node.id,
                            type: 'button',
                            className: 'zw-mini',
                            onClick: () => props.onSelect(node.id, false)
                          },
                          h(StatusDot, { type: node.entry.type }),
                          h(
                            'div',
                            { className: 'zw-miniBody' },
                            h('span', { className: 'zw-miniTitle' }, node.entry.title)
                          ),
                          h(Icon, { name: 'target', size: 12 })
                        )
                      )
                    )
                  : null
              ),
              hiddenSet.size
                ? h(
                    'div',
                    { className: 'zw-graphSection' },
                    h('div', { className: 'zw-blockHint' }, t('graph.hiddenCount') + ' ' + hiddenSet.size),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnGhost zw-btnSm',
                        onClick: () => props.onRestoreHidden && props.onRestoreHidden()
                      },
                      t('graph.restoreHidden')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: showHidden ? 'zw-btn zw-btnPrimary zw-btnSm' : 'zw-btn zw-btnGhost zw-btnSm',
                        onClick: () => props.onShowHidden && props.onShowHidden(!showHidden)
                      },
                      t('graph.showHidden')
                    )
                  )
                : null,
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.byType')),
                typeOptions.map((option) =>
                  h(
                    'button',
                    {
                      key: option.id,
                      type: 'button',
                      className: 'zw-legendRow' + (hiddenTypes.includes(option.id) ? ' zw-legendRowOff' : ''),
                      onClick: () =>
                        setHiddenTypes((prev) =>
                          prev.includes(option.id)
                            ? prev.filter((item) => item !== option.id)
                            : prev.concat([option.id])
                        )
                    },
                    h('span', {
                      className: 'zw-legendDot',
                      style: { background: option.color, opacity: hiddenTypes.includes(option.id) ? 0.35 : 1 }
                    }),
                    h('span', { className: 'zw-legendName' }, option.label),
                    h('span', { className: 'zw-legendCount' }, option.count)
                  )
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.byRelation')),
                relationOptions.map((option) =>
                  h(
                    'button',
                    {
                      key: option.id,
                      type: 'button',
                      className:
                        'zw-legendRow' + (hiddenRelations.includes(option.id) ? ' zw-legendRowOff' : ''),
                      onClick: () =>
                        setHiddenRelations((prev) =>
                          prev.includes(option.id)
                            ? prev.filter((item) => item !== option.id)
                            : prev.concat([option.id])
                        )
                    },
                    h('svg', { className: 'zw-legendSample', width: 22, height: 8 },
                      h('line', {
                        x1: 0,
                        y1: 4,
                        x2: 22,
                        y2: 4,
                        style: {
                          stroke: option.color,
                          strokeDasharray: option.dash || ''
                        }
                      })
                    ),
                    h('span', { className: 'zw-legendName' }, option.label),
                    h('span', { className: 'zw-legendCount' }, option.count)
                  )
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-legendRow',
                    onClick: () => setShowSuggested(!showSuggested)
                  },
                  h('span', {
                    className: 'zw-legendDot',
                    style: {
                      background: 'transparent',
                      border: '1px dashed var(--zw-accent)',
                      opacity: showSuggested ? 1 : 0.35
                    }
                  }),
                  h('span', { className: 'zw-legendName' }, t('graph.suggestedOnly')),
                  h('span', { className: 'zw-legendCount' }, props.stats ? props.stats.suggestedRelations : '')
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.weak')),
                h(
                  'div',
                  { className: 'zw-legendRow' },
                  h('span', {
                    className: 'zw-legendSample',
                    style: { borderTop: '1px dashed var(--zw-text-3)' }
                  }),
                  h('span', { className: 'zw-legendName' }, t('graph.suggested')),
                  h(
                    'span',
                    { className: 'zw-legendCount' },
                    props.stats ? props.stats.suggestedRelations : ''
                  )
                ),
                h(
                  'div',
                  { className: 'zw-legendRow' },
                  h('span', {
                    className: 'zw-legendSample',
                    style: { borderTop: '1px solid var(--zw-graph-edge)' }
                  }),
                  h('span', { className: 'zw-legendName' }, t('graph.confirmedRel')),
                  h(
                    'span',
                    { className: 'zw-legendCount' },
                    props.stats ? props.stats.confirmedRelations : ''
                  )
                ),
                h(
                  'div',
                  { className: 'zw-legendRow' },
                  h('span', {
                    className: 'zw-legendSample',
                    style: { borderTop: '1px dashed var(--zw-danger)', opacity: 0.6 }
                  }),
                  h('span', { className: 'zw-legendName' }, t('graph.rejected'))
                ),
                props.onOpenTidy
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-legendRow',
                        title: t('graph.tidyHint'),
                        onClick: props.onOpenTidy
                      },
                      h(Icon, { name: 'broom', size: 12 }),
                      h('span', { className: 'zw-legendName' }, t('nav.tidy'))
                    )
                  : null
              ),
              // 记忆区列表：点一下就选中整框成员，长按/双击可以改名或删除。
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.frames')),
                (props.frames || []).length
                  ? (props.frames || []).map((frame) =>
                      h(
                        'div',
                        { key: frame.id, className: 'zw-legendRow' },
                        h('span', {
                          className: 'zw-legendSample',
                          style: {
                            border: '1px dashed color-mix(in srgb, ' + collectionColor(frame.color) + ' 70%, transparent)',
                            opacity: 0.9
                          }
                        }),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-legendName zw-framePick',
                            title: t('graph.framePick'),
                            onClick: () => {
                              if (!props.onSelectFrame) return
                              props.onSelectFrame(frame, false)
                            }
                          },
                          frame.name
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-legendCount zw-frameEdit',
                            title: t('graph.searchArea'),
                            onClick: () => {
                              if (!props.onSearchArea) return
                              props.onSearchArea(frame)
                            }
                          },
                          h(Icon, { name: 'search', size: 11 })
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-legendCount zw-frameEdit',
                            title: t('graph.frameRenameTitle'),
                            onClick: () => {
                              if (!props.onRenameFrame) return
                              props.onRenameFrame(frame)
                            }
                          },
                          h(Icon, { name: 'edit', size: 11 })
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-legendCount zw-frameEdit',
                            title: t('graph.frameDelete'),
                            onClick: () => {
                              if (!props.onDeleteFrame) return
                              props.onDeleteFrame(frame)
                            }
                          },
                          h(Icon, { name: 'trash', size: 11 })
                        )
                      )
                    )
                  : h('div', { className: 'zw-savedEmpty' }, t('graph.noFrames'))
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-legendRow' }, h('span', { className: 'zw-legendName' }, t('graph.focus'))),
                h(
                  'div',
                  { className: 'zw-legendRow' },
                  h('span', { className: 'zw-legendName' }, t('graph.impact'))
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.byProject')),
                (props.projects || []).map((project) =>
                  h(
                    'button',
                    {
                      key: project.id,
                      type: 'button',
                      className:
                        'zw-legendRow' + (hiddenProjects.includes(project.id) ? ' zw-legendRowOff' : ''),
                      onClick: () =>
                        setHiddenProjects((prev) =>
                          prev.includes(project.id)
                            ? prev.filter((item) => item !== project.id)
                            : prev.concat([project.id])
                        )
                    },
                    h('span', { className: 'zw-legendName' }, project.name),
                    h(
                      'span',
                      { className: 'zw-legendCount' },
                      props.entries.filter((entry) => entry.projectId === project.id).length
                    )
                  )
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.byDomain')),
                domainOptions.map((option) =>
                  h(
                    'button',
                    {
                      key: option.id,
                      type: 'button',
                      className:
                        'zw-legendRow' + (hiddenDomains.includes(option.id) ? ' zw-legendRowOff' : ''),
                      onClick: () =>
                        setHiddenDomains((prev) =>
                          prev.includes(option.id)
                            ? prev.filter((item) => item !== option.id)
                            : prev.concat([option.id])
                        )
                    },
                    h('span', { className: 'zw-legendName' }, option.label),
                    h('span', { className: 'zw-legendCount' }, option.count)
                  )
                )
              ),
              h(
                'div',
                { className: 'zw-graphSection' },
                h('div', { className: 'zw-blockHint' }, t('graph.byCollection')),
                model.clusters.length
                  ? model.clusters.map((cluster) =>
                      h(
                        'button',
                        {
                          key: cluster.id,
                          type: 'button',
                          className:
                            'zw-legendRow' + (hiddenCollections.includes(cluster.id) ? ' zw-legendRowOff' : ''),
                          onClick: () =>
                            setHiddenCollections((prev) =>
                              prev.includes(cluster.id)
                                ? prev.filter((item) => item !== cluster.id)
                                : prev.concat([cluster.id])
                            )
                        },
                        h('span', {
                          className: 'zw-legendDot',
                          style: { background: collectionColor(cluster.color) }
                        }),
                        h('span', { className: 'zw-legendName' }, cluster.name),
                        h('span', { className: 'zw-legendCount' }, cluster.memberIds.length),
                        collapsed.includes(cluster.id)
                          ? h('span', { className: 'zw-count' }, t('graph.collapsed'))
                          : null
                      )
                    )
                  : h('div', { className: 'zw-savedEmpty' }, t('graph.noCollections'))
              )
            )
          : null,
        selection.length > 1
          ? h(
              'div',
              { className: 'zw-batchWrap' },
              h(
                'div',
                { className: 'zw-batchbar' },
                h('span', { className: 'zw-batchCount' }, selection.length + ' ' + t('batch.selected')),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnPrimary',
                    onClick: () => props.onBatchAction('collection')
                  },
                  h(Icon, { name: 'folder', size: 12 }),
                  t('batch.addToCollection')
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm',
                    onClick: () => props.onBatchAction('status')
                  },
                  h(Icon, { name: 'check', size: 12 }),
                  t('batch.setStatus')
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnGhost',
                    onClick: () => props.onMultiSelect([])
                  },
                  t('batch.clear')
                )
              )
            )
          : null
      )
    }


    // 整理中心：AI 自动整理的结果与待确认事项
    // 调用记录：真实发生过的记忆取用

    function TidyCard(props) {
      const t = props.t
      return h(
        'section',
        { className: 'zw-tidyCard' + (props.wide ? ' zw-tidyCardWide' : '') },
        h(
          'div',
          { className: 'zw-tidyHead' },
          h(Icon, { name: props.icon || 'broom', size: 13 }),
          h('span', { className: 'zw-tidyTitle' }, props.title),
          h('span', { className: 'zw-tidyCount' }, props.count),
          props.action || null
        ),
        props.hint ? h('div', { className: 'zw-tidyHint' }, props.hint) : null,
        props.children
      )
    }

    function TidyEmptyRow(props) {
      return h('div', { className: 'zw-tidyEmpty' }, props.text)
    }

    function recallOutcomeLabel(t, outcome) {
      if (outcome === 'ignored') return t('recall.outcome.ignored')
      if (outcome === 'conflict') return t('recall.outcome.conflict')
      return t('recall.outcome.served')
    }

    function TidyView(props) {
      const t = props.t
      const meta = props.meta
      const report = props.report || {}
      const duplicates = report.duplicates || []
      const orphans = report.orphans || []
      const proposals = report.pendingProposals || []
      const relations = report.suggestedRelations || []
      const candidateNodes = report.candidateNodes || []
      const duplicateNodes = report.duplicateNodes || []

      return h(
        'div',
        { className: 'zw-tidy' },
        h('div', { className: 'zw-tidyHint' }, t('tidy.sub')),
        h(
          'div',
          { className: 'zw-tidyBar' },
          h('span', { className: 'zw-tidyStat', title: t('tidy.pendingHint') }, t('tidy.pending') + ' ' + (report.pendingMemories || 0)),
          h('span', { className: 'zw-tidyStat', title: t('tidy.reviewHint') }, t('tidy.review') + ' ' + (report.reviewMemories || 0)),
          h('span', { className: 'zw-tidyStat' }, t('tidy.protectedCount') + ' ' + (report.protectedCount || 0)),
          h(
            'button',
            {
              type: 'button',
              className: 'zw-btn zw-btnSm zw-btnGhost',
              disabled: props.busy,
              onClick: props.onRefresh
            },
            h(Icon, { name: 'refresh', size: 12 }),
            props.busy ? t('common.loading') : t('action.refresh')
          )
        ),
        h(
          'div',
          { className: 'zw-tidyGrid' },
          h(
            TidyCard,
            {
              t: t,
              icon: 'sparkle',
              title: t('tidy.proposals'),
              count: proposals.length,
              hint: t('tidy.proposalsHint')
            },
            proposals.length
              ? proposals.map((proposal) =>
                  h(
                    'div',
                    { key: proposal.id, className: 'zw-tidyRow' },
                    h(
                      'div',
                      { className: 'zw-tidyRowBody' },
                      h(
                        'div',
                        { className: 'zw-tidyRowTitle' },
                        proposal.title,
                        proposal.protected ? h('span', { className: 'zw-tag' }, t('detail.protected')) : null
                      ),
                      h(
                        'div',
                        { className: 'zw-tidyRowMeta' },
                        labelOf(t, meta.changeTypes, proposal.changeType, 'change') +
                          (proposal.reason ? ' · ' + proposal.reason : '')
                      )
                    ),
                    h(
                      'div',
                      { className: 'zw-tidyRowActions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnPrimary',
                          onClick: () => props.onDecideProposal(proposal.id, 'accept')
                        },
                        t('detail.accept')
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnGhost',
                          onClick: () => props.onDecideProposal(proposal.id, 'reject')
                        },
                        t('detail.reject')
                      )
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          ),
          h(
            TidyCard,
            {
              t: t,
              icon: 'link',
              title: t('tidy.relations'),
              count: relations.length,
              hint: t('tidy.relationsHint')
            },
            relations.length
              ? relations.map((relation) =>
                  h(
                    'div',
                    { key: relation.id, className: 'zw-tidyRow' },
                    h(
                      'div',
                      { className: 'zw-tidyRowBody' },
                      h(
                        'div',
                        { className: 'zw-tidyRowTitle' },
                        relation.sourceTitle + ' → ' + relation.targetTitle
                      ),
                      h(
                        'div',
                        { className: 'zw-tidyRowMeta' },
                        labelOf(t, meta.relationTypes, relation.relationType, 'relation') +
                          ' · ' +
                          t('graph.confidence') +
                          ' ' +
                          Math.round((relation.confidence || 0) * 100) +
                          '%'
                      )
                    ),
                    h(
                      'div',
                      { className: 'zw-tidyRowActions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnPrimary',
                          onClick: () => props.onConfirmRelation(relation.id)
                        },
                        t('action.confirm')
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnGhost',
                          onClick: () => props.onRejectRelation(relation.id)
                        },
                        t('action.reject')
                      )
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          ),
          h(
            TidyCard,
            {
              t: t,
              icon: 'copy',
              title: t('tidy.duplicates'),
              count: duplicates.length,
              hint: t('tidy.duplicatesHint')
            },
            duplicates.length
              ? duplicates.map((pair, index) =>
                  h(
                    'div',
                    { key: index, className: 'zw-tidyRow' },
                    h(
                      'div',
                      { className: 'zw-tidyRowBody' },
                      h(
                        'div',
                        { className: 'zw-tidyRowTitle' },
                        pair.a.title,
                        h(Icon, { name: 'arrowRight', size: 11 }),
                        pair.b.title
                      ),
                      h('div', { className: 'zw-tidyRowMeta' }, pair.reason)
                    ),
                    h(
                      'div',
                      { className: 'zw-tidyRowActions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnGhost',
                          onClick: () => props.onOpen(pair.a.id)
                        },
                        t('tidy.openEntry')
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnPrimary',
                          title: t('action.merge'),
                          onClick: () => props.onMerge(pair.a.id, pair.b.id)
                        },
                        t('tidy.merge')
                      )
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          ),
          h(
            TidyCard,
            {
              t: t,
              icon: 'target',
              title: t('tidy.orphans'),
              count: orphans.length,
              hint: t('tidy.orphansHint')
            },
            orphans.length
              ? orphans.map((entry) =>
                  h(
                    'div',
                    { key: entry.id, className: 'zw-tidyRow' },
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-tidyLink',
                        onClick: () => props.onOpen(entry.id)
                      },
                      h(Icon, { name: TYPE_ICON[entry.type] || 'book', size: 11 }),
                      entry.title
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          ),
          h(
            TidyCard,
            {
              t: t,
              icon: 'layers',
              title: t('tidy.nodeCandidates'),
              count: candidateNodes.length,
              hint: t('tidy.nodeCandidatesHint'),
              action:
                candidateNodes.length > 1
                  ? h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnGhost zw-btnSm',
                        disabled: props.busy,
                        onClick: () => props.onConfirmAllNodes(candidateNodes.map((node) => node.id))
                      },
                      t('tidy.confirmAllNodes')
                    )
                  : null
            },
            candidateNodes.length
              ? candidateNodes.map((node) =>
                  h(
                    'div',
                    { key: node.id, className: 'zw-tidyRow' },
                    h(
                      'div',
                      { className: 'zw-tidyRowBody' },
                      h('div', { className: 'zw-tidyRowTitle' }, node.title),
                      h('div', { className: 'zw-tidyRowMeta' }, labelOf(t, meta.nodeTypes, node.nodeType, 'type'))
                    ),
                    h(
                      'div',
                      { className: 'zw-tidyRowActions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnPrimary',
                          onClick: () => props.onConfirmNode && props.onConfirmNode(node)
                        },
                        t('tidy.confirmNode')
                      ),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnGhost',
                          onClick: () => props.onOpenNode && props.onOpenNode(node.id)
                        },
                        t('tidy.openEntry')
                      )
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          ),
          h(
            TidyCard,
            {
              t: t,
              icon: 'copy',
              title: t('tidy.duplicateNodes'),
              count: duplicateNodes.length,
              hint: t('tidy.duplicateNodesHint')
            },
            duplicateNodes.length
              ? duplicateNodes.map((pair, index) =>
                  h(
                    'div',
                    { key: index, className: 'zw-tidyRow' },
                    h(
                      'div',
                      { className: 'zw-tidyRowBody' },
                      h(
                        'div',
                        { className: 'zw-tidyRowTitle' },
                        pair.a.title,
                        h(Icon, { name: 'arrowRight', size: 11 }),
                        pair.b.title
                      ),
                      h('div', { className: 'zw-tidyRowMeta' }, pair.reason)
                    ),
                    h(
                      'div',
                      { className: 'zw-tidyRowActions' },
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-btn zw-btnSm zw-btnPrimary',
                          onClick: () => props.onMergeNodes && props.onMergeNodes(pair.a.id, pair.b.id)
                        },
                        t('tidy.merge')
                      )
                    )
                  )
                )
              : h(TidyEmptyRow, { text: t('tidy.empty') })
          )
        )
      )
    }

    function RecallView(props) {
      const t = props.t
      const recalls = props.recalls || []
      const entryById = props.entryById
      if (!recalls.length) {
        return h(
          EmptyState,
          {
            icon: 'history',
            title: t('recall.title'),
            text: t('recall.empty')
          }
        )
      }
      return h(
        'div',
        { className: 'zw-recallList' },
        h('div', { className: 'zw-tidyHint' }, t('recall.sub')),
        recalls.map((recall) =>
          h(
            'div',
            { key: recall.id, className: 'zw-recallRow' },
            h(
              'div',
              { className: 'zw-recallTop' },
              h(Icon, { name: 'history', size: 12 }),
              h('span', { className: 'zw-recallTask' }, recall.task),
              h(
                'span',
                { className: 'zw-tag' },
                recallOutcomeLabel(t, recall.outcome)
              ),
              h('span', { className: 'zw-rowDate' }, formatDateTime(recall.at))
            ),
            (recall.paths || []).length
              ? h(
                  'div',
                  { className: 'zw-recallPath' },
                  h('span', { className: 'zw-blockHint' }, t('recall.path')),
                  h(
                    'span',
                    null,
                    recall.paths
                      .slice(0, 3)
                      .map((item) =>
                        (item.hops || [])
                          .map((hop) => hop.title || (hop.relationType ? '[' + hop.relationType + ']' : ''))
                          .filter(Boolean)
                          .join(' → ')
                      )
                      .filter(Boolean)
                      .join('；')
                  )
                )
              : null,
            (recall.nodes || []).length
              ? h(
                  'div',
                  { className: 'zw-recallNodes', title: t('recall.nodes') },
                  t('recall.nodes') + '：',
                  recall.nodes.map((node) =>
                    h(
                      'span',
                      { key: node.id, className: 'zw-tag' },
                      node.title + (node.nodeType ? ' · ' + node.nodeType : '')
                    )
                  )
                )
              : null,
            h(
              'div',
              { className: 'zw-recallIds', title: t('recall.items') },
              recall.ids.length
                ? recall.ids.map((id) => {
                    const entry = entryById.get(id)
                    if (!entry) return null
                    return h(
                      'button',
                      {
                        key: id,
                        type: 'button',
                        className: 'zw-tag zw-tagBtn',
                        onClick: () => props.onOpen(id)
                      },
                      entry.title
                    )
                  })
                : h('span', { className: 'zw-tidyRowMeta' }, t('common.none'))
            )
          )
        )
      )
    }

    // ---------------------------------------------------------------------
    // 知识对象（KnowledgeNode）：多维知识网络的骨架。
    // 记忆负责「具体发生过什么」，知识对象负责「这些东西属于谁、谁和谁有关系」。
    // ---------------------------------------------------------------------

    const KNODE_VIEWS = [
      { id: 'project', types: ['project', 'system', 'subsystem', 'concept'] },
      { id: 'work', types: ['workflow', 'method'] },
      { id: 'preference', types: ['preference', 'principle'] },
      { id: 'global', types: [] }
    ]

    function nodeTypesForView(view) {
      const found = KNODE_VIEWS.find((item) => item.id === view)
      return found ? found.types : []
    }

    function nodesForView(nodes, view) {
      const types = nodeTypesForView(view)
      const list = (nodes || []).filter((node) => node.status !== 'merged')
      if (!types.length) return list
      return list.filter((node) => types.indexOf(node.nodeType) >= 0)
    }

    function nodeById(nodes, id) {
      return (nodes || []).find((node) => node.id === id) || null
    }

    function KnowledgeView(props) {
      const t = props.t
      const meta = props.meta
      const nodes = props.nodes || []
      const view = props.view || 'project'
      const types = nodeTypesForView(view)
      const visibleNodes = nodesForView(nodes, view)
      const visibleIds = new Set(visibleNodes.map((node) => node.id))
      const entries = (props.entries || []).filter((entry) => {
        if (!types.length) return true
        const linked = entry.nodeIds || []
        if (linked.some((id) => visibleIds.has(id))) return true
        return false
      })
      const relations = (props.relations || []).filter((relation) => {
        const ends = [relation.sourceType === 'node' ? relation.sourceId : '', relation.targetType === 'node' ? relation.targetId : '']
        if (!types.length) return true
        return ends.some((id) => id && visibleIds.has(id))
      })
      return h(
        'div',
        { className: 'zw-knWrap', style: { display: 'flex', flexDirection: 'column', height: '100%', minHeight: 0 } },
        h(
          'div',
          { className: 'zw-knBar', style: { display: 'flex', gap: '8px', alignItems: 'center', padding: '0 12px 8px' } },
          h(
            'div',
            { className: 'zw-knTabs' },
            [{ id: 'project', title: t('kn.tab.project') }, { id: 'work', title: t('kn.tab.work') }, { id: 'preference', title: t('kn.tab.preference') }, { id: 'global', title: t('kn.tab.global') }].map((item) =>
              h(
                'button',
                {
                  key: item.id,
                  type: 'button',
                  className: 'zw-knTab' + (item.id === view ? ' zw-knTabOn' : ''),
                  onClick: () => props.onView(item.id)
                },
                item.title
              )
            )
          ),
          h(
            'span',
            { className: 'zw-viewSub' },
            visibleNodes.length + ' ' + t('kn.objects') + ' · ' + entries.length + ' ' + t('common.items')
          ),
          h('span', { style: { flex: 1 } }),
          h(
            'button',
            { type: 'button', className: 'zw-btn zw-btnPrimary zw-btnSm', onClick: () => props.onCreate(null) },
            h(Icon, { name: 'plus', size: 13 }),
            t('kn.new')
          )
        ),
        h(
          'div',
          { style: { flex: 1, minHeight: 0 } },
          h(GraphView, {
            key: 'knowledge:' + view,
            t: t,
            meta: meta,
            entries: entries,
            knowledgeNodes: visibleNodes,
            relations: relations,
            collections: props.collections,
            projects: props.projects,
            stats: props.stats,
            selection: props.selection,
            initialConfig: props.initialConfig,
            onSelect: props.onSelect,
            onFocusNode: props.onOpenNode,
            onMultiSelect: props.onMultiSelect,
            onClearSelection: props.onClearSelection,
            onCreateRelation: props.onCreateRelation,
            onDecideRelation: props.onDecideRelation,
            frames: props.frames,
            layout: props.layout,
            onSaveFrame: props.onSaveFrame,
            onSaveLayout: props.onSaveLayout,
            onLayoutChange: props.onLayoutChange,
            onBatchAction: props.onBatchAction,
            onOpenTidy: props.onOpenTidy,
            onState: props.onState,
            onRequestDeleteNode: props.onRequestDeleteNode
          })
        )
      )
    }

    function NodeAttrList(props) {
      const attributes = props.attributes || []
      if (!attributes.length) return null
      return h(
        'div',
        { className: 'zw-nodeAttr' },
        attributes.map((item, index) =>
          h(
            React.Fragment,
            { key: item.label + ':' + index },
            h('div', { className: 'zw-nodeAttrKey' }, item.label),
            h('div', { className: 'zw-nodeAttrValue' }, item.value)
          )
        )
      )
    }

    function NodeDetail(props) {
      const t = props.t
      const meta = props.meta
      const node = props.node
      const isHidden = (props.hiddenIds || []).indexOf(node.id) >= 0
      if (!node) return null
      const entries = props.entries || []
      const nodes = props.nodes || []
      const memories = entries.filter((entry) => (node.relatedMemoryIds || []).indexOf(entry.id) >= 0)
      const children = nodes.filter((item) => item.parentNodeId === node.id && item.status !== 'merged')
      const parent = node.parentNodeId ? nodeById(nodes, node.parentNodeId) : null
      const project = (props.projects || []).find((item) => item.id === node.projectId) || null
      const relations = props.relations || []
      const typeLabel = labelOf(t, meta.nodeTypes, node.nodeType, 'type')
      return h(
        'div',
        { className: 'zw-detailInner' },
        h(
          'div',
          { className: 'zw-detailMeta' },
          h('span', { className: 'zw-badge zw-badgeType' }, typeLabel),
          h('span', { className: statusTone(node.status) }, labelOf(t, meta.nodeStatuses, node.status, 'knStatus')),
          node.scope === 'global' ? h('span', { className: 'zw-badge zw-badgeNeutral' }, t('scope.global')) : null,
          project ? h('span', { className: 'zw-badge zw-badgeNeutral' }, project.name) : null
        ),
        h(
          'div',
          { className: 'zw-detailHead' },
          h('div', { className: 'zw-detailTitleWrap' }, h('h2', { className: 'zw-detailTitle' }, node.title)),
          h(
            'div',
            { className: 'zw-detailActions' },
            h(
              'button',
              { type: 'button', className: 'zw-iconBtn', title: t('action.edit'), onClick: () => props.onEdit(node) },
              h(Icon, { name: 'edit', size: 15 })
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: isHidden ? t('kn.show') : t('kn.hide'),
                onClick: () => props.onToggleHidden && props.onToggleHidden(node)
              },
              h(Icon, { name: isHidden ? 'eye' : 'eyeOff', size: 15 })
            ),
            h(
              'button',
              { type: 'button', className: 'zw-iconBtn', title: t('kn.merge'), onClick: () => props.onMerge(node) },
              h(Icon, { name: 'layers', size: 15 })
            ),
            h(
              'button',
              { type: 'button', className: 'zw-iconBtn', title: t('kn.archive'), onClick: () => props.onArchive(node) },
              h(Icon, { name: node.status === 'archived' ? 'refresh' : 'box', size: 15 })
            ),
            h(
              'button',
              { type: 'button', className: 'zw-iconBtn', title: t('action.close'), onClick: props.onClose },
              h(Icon, { name: 'close', size: 15 })
            )
          )
        ),
        h(
          'div',
          { className: 'zw-detailScroll' },
          node.description
            ? h('div', { className: 'zw-block' }, h('div', { className: 'zw-prose' }, renderProse(node.description)))
            : null,
          h(
            'div',
            { className: 'zw-block' },
            h('div', { className: 'zw-blockHead' }, h('div', { className: 'zw-blockTitle' }, t('kn.attributes'))),
            node.attributes && node.attributes.length
              ? h(NodeAttrList, { attributes: node.attributes })
              : h('div', { className: 'zw-hint' }, t('kn.noAttributes'))
          ),
          node.nodeType === 'workflow'
            ? h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('div', { className: 'zw-blockTitle' }, t('kn.steps')),
                  h(
                    'button',
                    { type: 'button', className: 'zw-iconBtn', title: t('kn.addStep'), onClick: () => props.onEdit(node) },
                    h(Icon, { name: 'plus', size: 13 })
                  )
                ),
                (node.steps || []).length
                  ? h(
                      'div',
                      { className: 'zw-stepList' },
                      node.steps.map((step, index) =>
                        h(
                          'div',
                          { key: step.id || 'step-' + index, className: 'zw-stepRow' },
                          h('span', { className: 'zw-stepNo' }, String(index + 1)),
                          h(
                            'div',
                            { className: 'zw-stepBody' },
                            h('div', { className: 'zw-stepTitle' }, step.title),
                            step.note ? h('div', { className: 'zw-stepNote' }, step.note) : null
                          )
                        )
                      )
                    )
                  : h('div', { className: 'zw-hint' }, t('kn.noSteps'))
              )
            : null,
          node.nodeType === 'preference'
            ? h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('div', { className: 'zw-blockTitle' }, t('kn.correct')),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-iconBtn',
                      title: t('kn.correct'),
                      onClick: () => props.onCorrect(node)
                    },
                    h(Icon, { name: 'edit', size: 13 })
                  )
                ),
                h('div', { className: 'zw-hint' }, t('kn.correctHint'))
              )
            : null,
          parent || children.length
            ? h(
                'div',
                { className: 'zw-block' },
                h('div', { className: 'zw-blockHead' }, h('div', { className: 'zw-blockTitle' }, t('kn.structure'))),
                parent
                  ? h(
                      'div',
                      { className: 'zw-relRow' },
                      h(Icon, { name: 'layers', size: 12 }),
                      h('button', { type: 'button', className: 'zw-tagBtn', onClick: () => props.onOpenNode(parent) }, parent.title),
                      h('span', { className: 'zw-hint' }, t('kn.parent'))
                    )
                  : null,
                children.length
                  ? h(
                      'div',
                      { className: 'zw-tagRow' },
                      children.map((child) =>
                        h(
                          'button',
                          {
                            key: child.id,
                            type: 'button',
                            className: 'zw-tag zw-tagBtn',
                            onClick: () => props.onOpenNode(child)
                          },
                          child.title
                        )
                      )
                    )
                  : null
              )
            : null,
          h(
            'div',
            { className: 'zw-block' },
            h(
              'div',
              { className: 'zw-blockHead' },
              h('div', { className: 'zw-blockTitle' }, t('kn.memories'), h('span', { className: 'zw-count' }, String(memories.length))),
              h(
                'button',
                { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => props.onLinkMemory(node) },
                h(Icon, { name: 'link', size: 12 }),
                t('kn.linkMemory')
              )
            ),
            memories.length
              ? h(
                  'div',
                  { className: 'zw-relList' },
                  memories.map((entry) =>
                    h(
                      'div',
                      { key: entry.id, className: 'zw-relRow' },
                      h('span', { className: 'zw-rowDot', style: { background: typeColor(entry.type) } }),
                      h(
                        'button',
                        { type: 'button', className: 'zw-relName', onClick: () => props.onOpenEntry(entry.id) },
                        entry.title
                      ),
                      h('span', { className: 'zw-hint' }, labelOf(t, meta.entryTypes, entry.type, 'type')),
                      h('span', { style: { flex: 1 } }),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-iconBtn',
                          title: t('kn.unlinkHint'),
                          onClick: () => props.onUnlinkMemory(node, entry)
                        },
                        h(Icon, { name: 'close', size: 12 })
                      )
                    )
                  )
                )
              : h('div', { className: 'zw-hint' }, t('kn.noMemories'))
          ),
          h(
            'div',
            { className: 'zw-block' },
            h(
              'div',
              { className: 'zw-blockHead' },
              h('div', { className: 'zw-blockTitle' }, t('kn.relations')),
              h(
                'button',
                { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => props.onCreateRelation(node) },
                h(Icon, { name: 'link', size: 12 }),
                t('kn.createRelation')
              )
            ),
            relations.length
              ? h(
                  'div',
                  { className: 'zw-relList' },
                  relations.map((relation) => {
                    const outgoing = relation.sourceId === node.id
                    const otherId = outgoing ? relation.targetId : relation.sourceId
                    const otherNode = nodeById(nodes, otherId)
                    const otherEntry = entries.find((entry) => entry.id === otherId)
                    const otherTitle = otherNode ? otherNode.title : otherEntry ? otherEntry.title : otherId
                    return h(
                      'div',
                      { key: relation.id, className: 'zw-relRow' },
                      h('span', { className: 'zw-relGlyph', style: { color: relationColor(relation.relationType) } }, outgoing ? '→' : '←'),
                      h(
                        'div',
                        { className: 'zw-relBody' },
                        h(
                          'div',
                          { className: 'zw-relName' },
                          h('span', { className: 'zw-tag' }, labelOf(t, meta.relationTypes, relation.relationType, 'relation')),
                          h(
                            'button',
                            {
                              type: 'button',
                              className: 'zw-tagBtn',
                              onClick: () => (otherNode ? props.onOpenNode(otherNode) : props.onOpenEntry(otherId))
                            },
                            otherTitle
                          )
                        ),
                        relation.description ? h('div', { className: 'zw-relNote' }, relation.description) : null
                      ),
                      h('span', { style: { flex: 1 } }),
                      relation.status === 'suggested'
                        ? h(
                            'div',
                            { className: 'zw-relActions' },
                            h(
                              'button',
                              { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => props.onDecideRelation(relation.id, 'confirmed') },
                              t('relation.confirm')
                            ),
                            h(
                              'button',
                              { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => props.onDecideRelation(relation.id, 'rejected') },
                              t('relation.reject')
                            )
                          )
                        : h(
                            'button',
                            {
                              type: 'button',
                              className: 'zw-iconBtn',
                              title: t('action.delete'),
                              onClick: () => props.onDeleteRelation(relation)
                            },
                            h(Icon, { name: 'trash', size: 12 })
                          )
                    )
                  })
                )
              : h('div', { className: 'zw-hint' }, t('kn.noRelations'))
          ),
          (node.versions || []).length > 1
            ? h(
                'div',
                { className: 'zw-block' },
                h(
                  'div',
                  { className: 'zw-blockHead' },
                  h('div', { className: 'zw-blockTitle' }, t('kn.versions')),
                  h('div', { className: 'zw-blockHint' }, t('kn.versionsHint'))
                ),
                h(
                  'div',
                  { className: 'zw-versionList' },
                  (node.versions || [])
                    .slice()
                    .reverse()
                    .map((version) =>
                      h(
                        'div',
                        { key: version.id, className: 'zw-version' },
                        h(
                          'div',
                          { className: 'zw-versionTop' },
                          h('span', { className: 'zw-versionNo' }, 'v' + version.version),
                          h('span', { className: 'zw-tag' }, t('change.' + version.changeType)),
                          h('span', { className: 'zw-rowDate' }, formatDay(version.createdAt)),
                          version.version === node.currentVersion
                            ? h('span', { className: 'zw-versionNow' }, t('kn.versionCurrent'))
                            : h(
                                'button',
                                {
                                  type: 'button',
                                  className: 'zw-btn zw-btnGhost zw-btnSm',
                                  onClick: () => props.onRestoreVersion(node, version)
                                },
                                t('kn.restore')
                              )
                        ),
                        h('div', { className: 'zw-versionTitle' }, version.title),
                        version.changeReason
                          ? h('div', { className: 'zw-versionNote' }, version.changeReason)
                          : null
                      )
                    )
                )
              )
            : null,
          h(
            'div',
            { className: 'zw-hint', style: { padding: '6px 2px 18px' } },
            t('detail.meta') + ' · ' + formatDay(node.updatedAt) + ' · ' + (node.id || '')
          )
        )
      )
    }

    function AttributeEditor(props) {
      const t = props.t
      const rows = props.value || []
      const change = (next) => props.onChange(next)
      return h(
        'div',
        { className: 'zw-facts' },
        rows.map((row, index) =>
          h(
            'div',
            { key: 'attr-' + index, className: 'zw-factRow' },
            h('input', {
              className: 'zw-input',
              value: row.label,
              placeholder: t('kn.attrKey'),
              onChange: (event) => {
                const next = rows.slice()
                next[index] = { label: event.target.value, value: row.value }
                change(next)
              }
            }),
            h('input', {
              className: 'zw-input',
              value: row.value,
              placeholder: t('kn.attrValue'),
              onChange: (event) => {
                const next = rows.slice()
                next[index] = { label: row.label, value: event.target.value }
                change(next)
              }
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-iconBtn',
                title: t('action.delete'),
                onClick: () => change(rows.filter((_, at) => at !== index))
              },
              h(Icon, { name: 'trash', size: 13 })
            )
          )
        ),
        h(
          'button',
          { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => change(rows.concat([{ label: '', value: '' }])) },
          h(Icon, { name: 'plus', size: 12 }),
          t('kn.addAttr')
        )
      )
    }

    function NodeDialog(props) {
      const t = props.t
      const meta = props.meta
      const editing = Boolean(props.node)
      const [form, setForm] = useState(() => ({
        title: props.node ? props.node.title : '',
        description: props.node ? props.node.description : '',
        nodeType: props.node ? props.node.nodeType : props.defaultType || 'concept',
        projectId: props.node ? props.node.projectId : (props.defaultProjectId || ''),
        scope: props.node ? props.node.scope : 'project',
        parentNodeId: props.node ? props.node.parentNodeId : props.defaultParentId || '',
        aliases: props.node && props.node.aliases ? props.node.aliases.join(', ') : '',
        attributes: props.node && props.node.attributes ? props.node.attributes.map((item) => ({ label: item.label, value: item.value })) : [],
        steps: props.node && props.node.steps ? props.node.steps.map((step) => ({ id: step.id, title: step.title, note: step.note })) : []
      }))
      const [error, setError] = useState('')
      const [duplicate, setDuplicate] = useState(null)
      const valueRef = useRef(form)
      valueRef.current = form
      const patch = (next) => setForm(Object.assign({}, valueRef.current, next))
      const moveStep = (index, delta) => {
        const list = (form.steps || []).slice()
        const to = index + delta
        if (to < 0 || to >= list.length) return
        const picked = list.splice(index, 1)[0]
        list.splice(to, 0, picked)
        patch({ steps: list })
      }
      const parents = (props.nodes || []).filter((node) => node.status !== 'merged' && (!props.node || node.id !== props.node.id))
      const submit = () => {
        const current = valueRef.current
        const title = String(current.title || '').trim()
        if (!title) {
          setError(t('kn.needTitle'))
          return
        }
        setError('')
        props.onSave({
          id: props.node ? props.node.id : undefined,
          title: title,
          description: current.description,
          nodeType: current.nodeType,
          projectId: props.node ? props.node.projectId : current.projectId,
          scope: current.scope,
          parentNodeId: current.parentNodeId,
          aliases: String(current.aliases || '')
            .split(',')
            .map((item) => item.trim())
            .filter(Boolean),
          attributes: (current.attributes || []).filter((row) => row.label && row.value),
          steps: (current.steps || []).filter((step) => step.title),
          allowDuplicate: Boolean(duplicate)
        })
      }
      return h(
        Modal,
        {
          title: editing ? t('kn.edit') : t('kn.new'),
          icon: 'graph',
          onClose: props.onClose,
          wide: true,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h('button', { type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, t('action.cancel')),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnPrimary', disabled: props.saving, onClick: submit },
              props.saving ? t('common.saving') : t('action.save')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            'div',
            { className: 'zw-formRow' },
            h(
              Field,
              { label: t('kn.title') },
              h('input', {
                className: 'zw-input',
                value: form.title,
                placeholder: t('kn.titlePlaceholder'),
                onChange: (event) => patch({ title: event.target.value })
              })
            ),
            h(
              Field,
              { label: t('kn.type') },
              h(Select, {
                value: form.nodeType,
                options: meta.nodeTypes.map((item) => ({ id: item.id, label: item.label })),
                onChange: (value) => patch({ nodeType: value })
              })
            )
          ),
          h(
            'div',
            { className: 'zw-formRow' },
            h(
              Field,
              { label: t('kn.parent') },
              h(Select, {
                value: form.parentNodeId,
                placeholder: t('kn.noParent'),
                options: parents.map((node) => ({ id: node.id, label: node.title })),
                onChange: (value) => patch({ parentNodeId: value })
              })
            ),
            h(
              Field,
              { label: t('kn.scope') },
              h(Select, {
                value: form.scope,
                options: meta.scopes.map((item) => ({ id: item.id, label: item.label })),
                onChange: (value) => patch({ scope: value })
              })
            )
          ),
          h(
            Field,
            { label: t('kn.description'), hint: t('kn.descriptionHint') },
            h('textarea', {
              className: 'zw-textarea',
              rows: 4,
              value: form.description,
              placeholder: t('kn.descriptionPlaceholder'),
              onChange: (event) => patch({ description: event.target.value })
            })
          ),
          h(
            Field,
            { label: t('kn.aliases'), hint: t('kn.aliasesHint') },
            h('input', {
              className: 'zw-input',
              value: form.aliases,
              placeholder: t('kn.aliasesPlaceholder'),
              onChange: (event) => patch({ aliases: event.target.value })
            })
          ),
          h(Field, { label: t('kn.attributes') }, h(AttributeEditor, { t: t, value: form.attributes, onChange: (next) => patch({ attributes: next }) })),
          form.nodeType === 'workflow'
            ? h(
                Field,
                { label: t('kn.steps') },
                h(
                  'div',
                  { className: 'zw-facts' },
                  (form.steps || []).map((step, index) =>
                    h(
                      'div',
                      { key: 'step-' + index, className: 'zw-factRow zw-stepEditRow' },
                      h(
                        'div',
                        { className: 'zw-stepTools' },
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-iconBtn',
                            title: t('kn.stepUp'),
                            disabled: index === 0,
                            onClick: () => moveStep(index, -1)
                          },
                          h(Icon, { name: 'chevronDown', size: 12, style: { transform: 'rotate(180deg)' } })
                        ),
                        h(
                          'button',
                          {
                            type: 'button',
                            className: 'zw-iconBtn',
                            title: t('kn.stepDown'),
                            disabled: index === form.steps.length - 1,
                            onClick: () => moveStep(index, 1)
                          },
                          h(Icon, { name: 'chevronDown', size: 12 })
                        )
                      ),
                      h('input', {
                        className: 'zw-input',
                        value: step.title,
                        placeholder: t('kn.stepTitle'),
                        onChange: (event) => {
                          const next = form.steps.slice()
                          next[index] = Object.assign({}, step, { title: event.target.value })
                          patch({ steps: next })
                        }
                      }),
                      h('input', {
                        className: 'zw-input',
                        value: step.note || '',
                        placeholder: t('kn.stepNote'),
                        onChange: (event) => {
                          const next = form.steps.slice()
                          next[index] = Object.assign({}, step, { note: event.target.value })
                          patch({ steps: next })
                        }
                      }),
                      h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-iconBtn',
                          title: t('action.delete'),
                          onClick: () => patch({ steps: form.steps.filter((_, at) => at !== index) })
                        },
                        h(Icon, { name: 'trash', size: 13 })
                      )
                    )
                  ),
                  h(
                    'button',
                    {
                      type: 'button',
                      className: 'zw-btn zw-btnGhost zw-btnSm',
                      onClick: () => patch({ steps: (form.steps || []).concat([{ title: '', note: '' }]) })
                    },
                    h(Icon, { name: 'plus', size: 12 }),
                    t('kn.addStep')
                  )
                )
              )
            : null,
          duplicate && duplicate.length
            ? h(
                'div',
                { className: 'zw-dupWarn' },
                h('div', null, t('kn.duplicate')),
                duplicate.map((item) =>
                  h(
                    'div',
                    { key: item.id, className: 'zw-dupRow' },
                    h('span', null, item.title + ' · ' + labelOf(t, meta.nodeTypes, item.nodeType, 'type')),
                    h(
                      'button',
                      { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => props.onOpenNode(item) },
                      t('kn.useExisting')
                    )
                  )
                ),
                h('div', { className: 'zw-hint' }, t('kn.createAnyway'))
              )
            : null,
          error ? h('div', { className: 'zw-error' }, error) : null
        )
      )
    }

    function PreferenceFixDialog(props) {
      const t = props.t
      const [choice, setChoice] = useState('')
      const [note, setNote] = useState('')
      const options = [
        { id: 'narrow', label: t('kn.narrow') },
        { id: 'widen', label: t('kn.widen') },
        { id: 'obsolete', label: t('kn.obsolete') },
        { id: 'oneOff', label: t('kn.oneOff') }
      ]
      const canSave = Boolean(choice) && !props.saving
      return h(
        Modal,
        {
          title: t('kn.correct'),
          icon: 'edit',
          onClose: props.onClose,
          closeLabel: t('common.close'),
          footer: h(
            'div',
            { className: 'zw-modalFoot' },
            h('div', { className: 'zw-modalFootSpacer' }),
            h('button', { type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, t('common.cancel')),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnPrimary',
                disabled: !canSave,
                onClick: () => props.onSave({ kind: choice, note: note })
              },
              t('action.save')
            )
          )
        },
        h('div', { className: 'zw-form' }, h('div', { className: 'zw-hint' }, t('kn.correctHint'))),
        h(MultiChips, {
          label: t('kn.correct'),
          options: options,
          value: choice ? [choice] : [],
          onToggle: (id) => setChoice((prev) => (prev === id ? '' : id))
        }),
        h(
          Field,
          { label: t('kn.correctNote') },
          h('textarea', {
            className: 'zw-textarea',
            rows: 3,
            value: note,
            placeholder: t('kn.correctNotePlaceholder'),
            onChange: (event) => setNote(event.target.value)
          })
        )
      )
    }

    function NodeMergeDialog(props) {
      const t = props.t
      const meta = props.meta
      const node = props.node
      const nodes = props.nodes || []
      const entries = props.entries || []
      const candidates = nodes
        .filter((item) => item.id !== node.id)
        .filter((item) => item.status !== 'merged')
        .filter((item) => item.nodeType === node.nodeType)
      const preferred = props.defaultTargetId && candidates.some((item) => item.id === props.defaultTargetId)
        ? props.defaultTargetId
        : candidates.length
        ? candidates[0].id
        : ''
      const [targetId, setTargetId] = useState(preferred)
      const target = nodes.find((item) => item.id === targetId) || null
      const memoryCount = (item) => (item ? (item.relatedMemoryIds || []).length : 0)
      const rows = target
        ? [
            { key: t('kn.title2'), left: node.title, right: target.title },
            { key: t('kn.type'), left: labelOf(t, meta.nodeTypes, node.nodeType, 'type'), right: labelOf(t, meta.nodeTypes, target.nodeType, 'type') },
            { key: t('kn.status'), left: node.status, right: target.status },
            { key: t('kn.memories'), left: String(memoryCount(node)), right: String(memoryCount(target)) },
            { key: t('kn.description'), left: truncate(node.description || '-', 60), right: truncate(target.description || '-', 60) }
          ]
        : []
      return h(
        Modal,
        {
          title: t('kn.mergeTitle'),
          icon: 'layers',
          wide: true,
          onClose: props.onClose,
          footer: h(
            'div',
            { className: 'zw-modalFoot' },
            h('button', { className: 'zw-btn zw-btnGhost', type: 'button', onClick: props.onClose }, t('action.cancel')),
            h(
              'button',
              {
                className: 'zw-btn zw-btnPrimary',
                type: 'button',
                disabled: props.saving || !target,
                onClick: () => props.onSave(target.id, node.id)
              },
              t('kn.mergeConfirm')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h('div', { className: 'zw-hint' }, t('kn.mergeHint')),
          h(
            Field,
            { label: t('kn.mergeTarget') },
            h(Select, {
              value: targetId,
              placeholder: t('kn.mergeNone'),
              options: candidates.map((item) => ({ id: item.id, label: item.title + ' · ' + truncate(item.description || '', 24) })),
              onChange: (next) => setTargetId(next)
            })
          ),
          target
            ? h(
                'div',
                { className: 'zw-mergeTable' },
                rows.map((row) =>
                  h(
                    'div',
                    { className: 'zw-mergeRow', key: row.key },
                    h('div', { className: 'zw-mergeKey' }, row.key),
                    h('div', { className: 'zw-mergeVal' }, row.left),
                    h('div', { className: 'zw-mergeVal zw-mergeValMain' }, row.right)
                  )
                )
              )
            : null,
          target
            ? h(
                'div',
                { className: 'zw-preview' },
                t('kn.mergePreview') + ' ' + target.title,
                ' · ' + t('kn.memories') + ' ' + (memoryCount(node) + memoryCount(target))
              )
            : null,
          h('div', { className: 'zw-hint' }, t('kn.mergeKeep'))
        )
      )
    }


    function NodeRelationDialog(props) {
      const t = props.t
      const meta = props.meta
      const source = props.source
      const [targetType, setTargetType] = useState('node')
      const [targetId, setTargetId] = useState('')
      const [relationType, setRelationType] = useState('related_to')
      const [description, setDescription] = useState('')
      const [swapped, setSwapped] = useState(false)
      const [query, setQuery] = useState('')
      const nodes = (props.nodes || []).filter((node) => node.id !== source.id && node.status !== 'merged')
      const entries = props.entries || []
      const needle = query.trim().toLowerCase()
      const nodeOptions = nodes.filter((node) => !needle || node.title.toLowerCase().indexOf(needle) >= 0)
      const entryOptions = entries.filter((entry) => !needle || entry.title.toLowerCase().indexOf(needle) >= 0)
      const target = targetType === 'node' ? nodes.find((node) => node.id === targetId) : entries.find((entry) => entry.id === targetId)
      const phrases = { related_to: '关联于', depends_on: '依赖于', affects: '影响', contains: '包含', belongs_to: '属于', uses: '使用', drops: '掉落', requires: '需要', applies_to: '适用于', guides: '指导', prefers: '偏好', avoids: '避免', conflicts_with: '与…冲突', supersedes: '替代', refines: '细化', derived_from: '来源于', references: '参考', appears_in: '出现在', crafted_from: '由…制作', balanced_against: '与…平衡', follows: '遵循', precedes: '先于', next_step: '下一步', triggers: '触发', produces: '产出', exception_to: '是…的例外', constrains: '约束', part_of: '是…的一部分' }
      const phrase = phrases[relationType] || labelOf(t, meta.relationTypes, relationType, 'relation')
      const fromTitle = swapped ? (target ? target.title : t('kn.target')) : source.title
      const toTitle = swapped ? source.title : target ? target.title : t('kn.target')
      return h(
        Modal,
        {
          title: t('kn.createRelation'),
          icon: 'link',
          onClose: props.onClose,
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h('button', { type: 'button', className: 'zw-btn zw-btnGhost', onClick: props.onClose }, t('action.cancel')),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnPrimary',
                disabled: !target || props.saving,
                onClick: () =>
                  props.onSave({
                    sourceType: swapped ? targetType : 'node',
                    sourceId: swapped ? targetId : source.id,
                    targetType: swapped ? 'node' : targetType,
                    targetId: swapped ? source.id : targetId,
                    relationType: relationType,
                    description: description
                  })
              },
              t('action.save')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            'div',
            { className: 'zw-formRow' },
            h(Field, { label: t('kn.start') }, h('div', { className: 'zw-preview' }, swapped ? (target ? target.title : '—') : source.title)),
            h(Field, { label: t('kn.end') }, h('div', { className: 'zw-preview' }, swapped ? source.title : target ? target.title : '—'))
          ),
          h(
            'div',
            { className: 'zw-formRow' },
            h(
              Field,
              { label: t('kn.target') },
              h(Select, {
                value: targetType,
                options: [
                  { id: 'node', label: t('kn.objects') },
                  { id: 'memory', label: t('kn.memories') }
                ],
                onChange: (value) => {
                  setTargetType(value)
                  setTargetId('')
                }
              })
            ),
            h(
              Field,
              { label: t('action.search') },
              h('input', {
                className: 'zw-input',
                value: query,
                placeholder: t('kn.searchPlaceholder'),
                onChange: (event) => setQuery(event.target.value)
              })
            )
          ),
          targetType === 'node'
            ? h(
                'div',
                { className: 'zw-pickList' },
                nodeOptions.slice(0, 40).map((node) =>
                  h(
                    'button',
                    {
                      key: node.id,
                      type: 'button',
                      className: 'zw-pickRow' + (node.id === targetId ? ' zw-pickRowOn' : ''),
                      onClick: () => setTargetId(node.id)
                    },
                    h('span', { className: 'zw-badge zw-badgeNeutral' }, labelOf(t, meta.nodeTypes, node.nodeType, 'type')),
                    node.title
                  )
                )
              )
            : h(
                'div',
                { className: 'zw-pickList' },
                entryOptions.slice(0, 40).map((entry) =>
                  h(
                    'button',
                    {
                      key: entry.id,
                      type: 'button',
                      className: 'zw-pickRow' + (entry.id === targetId ? ' zw-pickRowOn' : ''),
                      onClick: () => setTargetId(entry.id)
                    },
                    h('span', { className: 'zw-badge zw-badgeNeutral' }, labelOf(t, meta.entryTypes, entry.type, 'type')),
                    entry.title
                  )
                )
              ),
          h(
            Field,
            { label: t('kn.relationType') },
            h(
              'div',
              { className: 'zw-relGroups' },
              (meta.relationGroups || []).map((group) =>
                h(
                  'div',
                  { key: group.id, className: 'zw-relGroup' },
                  h(
                    'span',
                    { className: 'zw-relGroupLabel' },
                    {
                      hierarchy: t('relGroup.hierarchy'),
                      business: t('relGroup.business'),
                      workflow: t('relGroup.workflow'),
                      principle: t('relGroup.principle'),
                      knowledge: t('relGroup.knowledge')
                    }[group.id] || group.label
                  ),
                  h(MultiChips, {
                    options: meta.relationTypes
                      .filter((item) => (group.types || []).indexOf(item.id) >= 0)
                      .map((item) => ({ id: item.id, label: item.label, color: relationColor(item.id) })),
                    value: [relationType],
                    onToggle: (id) => setRelationType(id)
                  })
                )
              )
            )
          ),
          h(
            Field,
            { label: t('kn.preview') },
            h('div', { className: 'zw-preview' }, fromTitle + ' ' + phrase + ' ' + toTitle),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnGhost zw-btnSm', onClick: () => setSwapped(!swapped) },
              h(Icon, { name: 'shuffle', size: 12 }),
              t('kn.swap')
            )
          ),
          h(
            Field,
            { label: t('kn.note') },
            h('input', {
              className: 'zw-input',
              value: description,
              placeholder: t('kn.notePlaceholder'),
              onChange: (event) => setDescription(event.target.value)
            })
          )
        )
      )
    }

    function NodeMemoryPicker(props) {
      const t = props.t
      const meta = props.meta
      const node = props.node
      const linked = node ? node.relatedMemoryIds || [] : []
      const candidates = (props.entries || []).filter((entry) => linked.indexOf(entry.id) < 0)
      const [query, setQuery] = useState('')
      const needle = query.trim().toLowerCase()
      const shown = candidates.filter((entry) => !needle || entry.title.toLowerCase().indexOf(needle) >= 0)
      return h(
        Modal,
        {
          title: t('kn.linkMemory'),
          icon: 'link',
          onClose: props.onClose,
          closeLabel: t('action.close')
        },
        h(Field, {
          label: t('action.search'),
          hint: h('span', null, t('kn.unlinkHint'))
        }, h('input', {
          className: 'zw-input',
          value: query,
          placeholder: t('kn.searchPlaceholder'),
          onChange: (event) => setQuery(event.target.value)
        })),
        shown.length
          ? h(
              'div',
              { className: 'zw-pickList' },
              shown.slice(0, 80).map((entry) =>
                h(
                  'button',
                  {
                    key: entry.id,
                    type: 'button',
                    className: 'zw-pickRow',
                    disabled: props.saving,
                    onClick: () => props.onPick(entry)
                  },
                  h('span', { className: 'zw-badge zw-badgeNeutral' }, labelOf(t, meta.entryTypes, entry.type, 'type')),
                  entry.title
                )
              )
            )
          : h('div', { className: 'zw-hint' }, t('kn.noMemories'))
      )
    }

    // 「知微」的设置搬进 DSH 自己的设置页：存储位置、整理用的模型、导入导出。
    // 这个组件不依赖面板 props，自己拉数据、自己写数据。
    function SettingsSection(props) {
      const t = props.t
      const [info, setInfo] = useState(null)
      const [choices, setChoices] = useState({ available: false, providers: [], models: [] })
      const [provider, setProvider] = useState('')
      const [model, setModel] = useState('')
      const [enabled, setEnabled] = useState(false)
      const [storageDraft, setStorageDraft] = useState('')
      const [importMode, setImportMode] = useState('merge')
      const [busy, setBusy] = useState('')
      const [message, setMessage] = useState('')
      const [error, setError] = useState('')
      const fileRef = useRef(null)

      const applySettings = useCallback((next) => {
        setInfo(next)
        if (next && typeof next.storagePath === 'string') setStorageDraft(next.storagePath)
        const route = (next && next.model) || {}
        setProvider(route.provider || '')
        setModel(route.model || '')
        setEnabled(route.enabled === true)
      }, [])

      const refresh = useCallback(async () => {
        try {
          const [settings, models] = await Promise.all([
            request(API, { method: 'POST', body: JSON.stringify({ action: 'settings.get' }) }),
            request(API, { method: 'POST', body: JSON.stringify({ action: 'models.list' }) })
          ])
          if (settings && settings.settings) applySettings(settings.settings)
          if (models) {
            setChoices({
              available: models.available === true,
              providers: models.providers || [],
              models: models.models || []
            })
          }
          setError('')
        } catch (err) {
          setError(errorText(err, t('error.load')))
        }
      }, [applySettings, t])

      useEffect(() => {
        refresh()
      }, [refresh])

      const modelsForProvider = choices.models.filter(
        (item) => !provider || item.provider === provider
      )

      const saveStorage = async () => {
        const target = storageDraft.trim()
        if (!target) {
          setError(t('settings.needPath'))
          return
        }
        setBusy('storage')
        setError('')
        try {
          const result = await request(API, {
            method: 'POST',
            body: JSON.stringify({ action: 'settings.storage', path: target })
          })
          if (result && result.storagePath) {
            setInfo(Object.assign({}, info, { storagePath: result.storagePath }))
            setStorageDraft(result.storagePath)
          }
          setMessage(t('settings.switched'))
        } catch (err) {
          setError(errorText(err, t('error.write')))
        } finally {
          setBusy('')
        }
      }

      const saveModel = async (nextEnabled) => {
        const on = nextEnabled === undefined ? enabled : nextEnabled
        setBusy('model')
        setError('')
        try {
          const result = await request(API, {
            method: 'POST',
            body: JSON.stringify({
              action: 'settings.model',
              provider: provider,
              model: model,
              enabled: on
            })
          })
          if (result && result.model) {
            setEnabled(result.model.enabled === true)
            setInfo(Object.assign({}, info, { model: result.model }))
          }
          setMessage(t('settings.modelSaved'))
        } catch (err) {
          setError(errorText(err, t('error.write')))
        } finally {
          setBusy('')
        }
      }

      const exportData = async () => {
        setBusy('export')
        setError('')
        try {
          const result = await request(API, {
            method: 'POST',
            body: JSON.stringify({ action: 'export' })
          })
          const payload = JSON.stringify(result && result.data ? result.data : result, null, 2)
          const blob = new Blob([payload], { type: 'application/json' })
          const url = URL.createObjectURL(blob)
          const link = document.createElement('a')
          link.href = url
          link.download = 'zhiwei-' + formatDay(new Date()) + '.json'
          document.body.appendChild(link)
          link.click()
          link.remove()
          setTimeout(() => URL.revokeObjectURL(url), 4000)
          setMessage(t('settings.exported'))
        } catch (err) {
          setError(errorText(err, t('error.write')))
        } finally {
          setBusy('')
        }
      }

      const importData = async (file) => {
        if (!file) return
        setBusy('import')
        setError('')
        try {
          const text = await file.text()
          const data = JSON.parse(text)
          const result = await request(API, {
            method: 'POST',
            body: JSON.stringify({ action: 'import', mode: importMode, data: data })
          })
          const counts = (result && result.imported) || {}
          setMessage(
            t('settings.imported') +
              ' ' +
              (counts.entries || 0) +
              ' ' +
              t('collections.memberCount')
          )
          refresh()
        } catch (err) {
          setError(t('settings.importFailed') + ' ' + errorText(err, t('error.write')))
        } finally {
          setBusy('')
        }
      }

      return h(
        'div',
        { className: 'zw-settings' },
        h(
          'div',
          { className: 'zw-settingsRow' },
          h('span', { className: 'zw-settingsKey' }, t('settings.storage')),
          h('span', { className: 'zw-settingsPath' }, (info && info.storagePath) || t('common.loading'))
        ),
        h(
          'div',
          { className: 'zw-settingsBlock' },
          h('div', { className: 'zw-settingsTitle' }, t('settings.switchTitle')),
          h('div', { className: 'zw-settingsHint' }, t('settings.switchHint')),
          h(
            'div',
            { className: 'zw-settingsForm' },
            h('input', {
              className: 'zw-input',
              value: storageDraft,
              placeholder: (info && info.defaultPath) || '',
              onChange: (event) => setStorageDraft(event.target.value)
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm',
                disabled: busy === 'storage',
                onClick: saveStorage
              },
              t('settings.switchApply')
            )
          )
        ),
        h(
          'div',
          { className: 'zw-settingsBlock' },
          h('div', { className: 'zw-settingsTitle' }, t('settings.modelTitle')),
          h(
            'div',
            { className: 'zw-settingsHint' },
            choices.available ? t('settings.modelHint') : t('settings.modelUnavailable')
          ),
          h(
            'div',
            { className: 'zw-settingsForm' },
            h(Select, {
              value: provider,
              options: choices.providers.map((item) => ({ id: item.id, label: item.name })),
              placeholder: t('settings.modelNone'),
              onChange: (next) => {
                setProvider(next)
                setModel('')
              }
            }),
            h(Select, {
              value: model,
              options: modelsForProvider.map((item) => ({ id: item.id, label: item.name })),
              placeholder: t('settings.modelName'),
              disabled: !provider,
              onChange: setModel
            }),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm' + (enabled ? ' zw-btnPrimary' : ''),
                disabled: busy === 'model' || !provider || !model,
                onClick: () => saveModel(!enabled)
              },
              enabled ? t('settings.modelOn') : t('settings.modelEnable')
            )
          )
        ),
        h(
          'div',
          { className: 'zw-settingsBlock' },
          h('div', { className: 'zw-settingsTitle' }, t('settings.exportTitle')),
          h('div', { className: 'zw-settingsHint' }, t('settings.exportHint')),
          h(
            'div',
            { className: 'zw-settingsForm' },
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm',
                disabled: busy === 'export',
                onClick: exportData
              },
              h(Icon, { name: 'copy', size: 12 }),
              t('settings.export')
            ),
            h('div', { className: 'zw-settingsTitle' }, t('settings.importTitle')),
            h('div', { className: 'zw-settingsHint' }, t('settings.importHint')),            h(Select, {
              value: importMode,
              options: [
                { id: 'merge', label: t('settings.importMerge') },
                { id: 'replace', label: t('settings.importReplace') }
              ],
              onChange: setImportMode
            }),
            h('input', {
              ref: fileRef,
              className: 'zw-fileInput',
              type: 'file',
              accept: '.json,application/json',
              onChange: (event) => {
                const file = event.target.files && event.target.files[0]
                importData(file)
                event.target.value = ''
              }
            })
          )
        ),
        message ? h('div', { className: 'zw-settingsHint' }, message) : null,
        error ? h('div', { className: 'zw-error' }, error) : null
      )
    }

    function NameDialog(props) {
      const t = props.t
      const [value, setValue] = useState(props.value || '')
      // 输入值同时放一份 ref：对话框常被复用，靠 state 闭包容易拿到旧值。
      const valueRef = useRef(value)
      const change = (next) => {
        valueRef.current = next
        setValue(next)
      }
      const submit = () => {
        const name = String(valueRef.current || '').trim()
        console.log('SUBMIT name=' + JSON.stringify(name))
        if (name) props.onSave(name)
      }
      return h(
        Modal,
        {
          title: props.title,
          icon: props.icon || 'bookmark',
          onClose: props.onClose,
          closeLabel: t('action.close'),
          footer: h(
            React.Fragment,
            null,
            h('span', { className: 'zw-modalFootSpacer' }),
            h(
              'button',
              { type: 'button', className: 'zw-btn zw-btnSm zw-btnGhost', onClick: props.onClose },
              t('action.cancel')
            ),
            h(
              'button',
              {
                type: 'button',
                className: 'zw-btn zw-btnSm zw-btnPrimary',
                onClick: submit
              },
              t('action.save')
            )
          )
        },
        h(
          'div',
          { className: 'zw-form' },
          h(
            Field,
            { label: props.label || t('common.name') },
            h('input', {
              className: 'zw-input',
              value: value,
              autoFocus: true,
              placeholder: props.placeholder || '',
              onChange: (event) => change(event.target.value),
              onKeyDown: (event) => {
                if (event.key === 'Enter') submit()
              }
            })
          )
        )
      )
    }

    function DesignMemoryPanel(props) {
      const t = props.t && typeof props.t.has === 'function' ? props.t : createTranslator(ZH)
      const theme = useThemeMode()
      const [data, setData] = useState({
        status: 'loading',
        meta: DEFAULT_META,
        entries: [],
        relations: [],
        collections: [],
        projects: [],
        views: [],
        frames: [],
        layout: { positions: {}, updatedAt: '' },
        stats: {},
        storagePath: '',
        error: null
      })
      const [nav, setNav] = useState({ kind: 'overview', id: '' })
      const [filters, setFilters] = useState({ projectId: '', types: [], statuses: [], domains: [], tags: [] })
      const [search, setSearch] = useState('')
      const [sort, setSort] = useState('updated')
      const [layout, setLayout] = useState('list')
      const [selectedId, setSelectedId] = useState('')
      const [selectedNodeId, setSelectedNodeId] = useState('')
      const [knView, setKnView] = useState('project')
      const [checked, setChecked] = useState([])
      const [graphSelection, setGraphSelection] = useState([])
      // 左栏默认展开（带文字导航），并记住用户自己的展开 / 收起选择。
      const [railCollapsed, setRailCollapsed] = useState(() => readFlag('railCollapsed', false))
      const [detailCollapsed, setDetailCollapsed] = useState(() => readFlag('detailCollapsed', false))
      const [toasts, setToasts] = useState([])
      const [busy, setBusy] = useState('')
      const [modal, setModal] = useState(null)
      const [graphView, setGraphView] = useState(null)
      const [assist, setAssist] = useState({ entryId: '', action: '', result: null, error: '', busy: false })
      const [tidyReport, setTidyReport] = useState(null)
      const [tidyBusy, setTidyBusy] = useState(false)
      const [showHidden, setShowHidden] = useState(false)
      const [menu, setMenu] = useState(null)
      const dragProject = useRef('')
      const pendingProjects = useRef(null)

      const notify = useCallback((text, tone, action) => {
        const id = 'toast_' + Date.now() + '_' + Math.round(Math.random() * 999)
        setToasts((prev) => prev.concat([{ id: id, text: text, tone: tone || 'ok', action: action || null }]))
        setTimeout(() => {
          setToasts((prev) => prev.filter((item) => item.id !== id))
        }, action ? 9000 : 2600)
      }, [])

      const applyState = useCallback((payload) => {
        setData((prev) => ({
          status: 'ready',
          meta: payload.meta || prev.meta || DEFAULT_META,
          entries: payload.entries || [],
          nodes: payload.nodes || [],
          relations: payload.relations || [],
          collections: payload.collections || [],
          projects: payload.projects || [],
          views: payload.views || [],
          proposals: payload.proposals || [],
          recalls: payload.recalls || [],
          frames: payload.frames || [],
          layout: payload.layout || { positions: {}, updatedAt: '' },
          stats: payload.stats || {},
          storagePath: payload.storagePath || '',
          error: null
        }))
      }, [])

      const load = useCallback(async () => {
        setData((prev) => Object.assign({}, prev, { status: 'loading' }))
        try {
          const payload = await loadState()
          applyState(payload)
        } catch (err) {
          setData((prev) =>
            Object.assign({}, prev, {
              status: 'error',
              error: isOfflineError(err) ? t('error.offline') : errorText(err, t('error.load'))
            })
          )
        }
      }, [applyState, t])

      useEffect(() => {
        load()
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [])

      const mutate = useCallback(
        async (payload, message) => {
          setBusy(payload.action)
          try {
            const result = await mutateState(payload)
            applyState(result)
            if (message) notify(message, 'ok')
            return result
          } catch (err) {
            notify(isOfflineError(err) ? t('error.offline') : errorText(err, t('error.write')), 'error')
            return null
          } finally {
            setBusy('')
          }
        },
        [applyState, notify, t]
      )

      const meta = data.meta || DEFAULT_META
      const entries = data.entries || []
      const nodes = data.nodes || []
      const relations = data.relations || []
      const collections = data.collections || []
      const frames = data.frames || []
      const projects = data.projects || []
      const stats = data.stats || {}
      const proposals = data.proposals || []
      const recalls = data.recalls || []
      const defaultProjectId = projects.length ? projects[0].id : 'prj_default'

      const hiddenNodes = (data.layout && data.layout.hidden) || []
      const hiddenSet = useMemo(() => new Set(hiddenNodes), [data.layout])
      const visibleEntries = useMemo(
        () => (showHidden ? entries : entries.filter((entry) => !hiddenSet.has(entry.id))),
        [entries, showHidden, hiddenSet]
      )
      const visibleNodes = useMemo(
        () => (showHidden ? nodes : nodes.filter((node) => !hiddenSet.has(node.id))),
        [nodes, showHidden, hiddenSet]
      )

      const entryById = useMemo(() => new Map(entries.map((entry) => [entry.id, entry])), [entries])
      const nodeById = useMemo(() => new Map(nodes.map((node) => [node.id, node])), [nodes])
      const frameById = useMemo(() => new Map(frames.map((frame) => [frame.id, frame])), [frames])
      const collectionById = useMemo(
        () => new Map(collections.map((collection) => [collection.id, collection])),
        [collections]
      )

      const collectionsOf = useCallback(
        (entryId) => collections.filter((collection) => collection.memberIds.includes(entryId)),
        [collections]
      )

      const relationsOf = useCallback(
        (entryId) =>
          relations
            .filter((relation) => relation.sourceMemoryId === entryId || relation.targetMemoryId === entryId)
            .map((relation) => {
              const outgoing = relation.sourceMemoryId === entryId
              const otherId = outgoing ? relation.targetMemoryId : relation.sourceMemoryId
              const frame = frameById.get(otherId)
              const other = entryById.get(otherId) ||
                (frame ? { id: otherId, title: frame.name, frame: true } : { id: otherId, title: otherId })
              return {
                relation: relation,
                other: other,
                direction: outgoing ? 'out' : 'in'
              }
            }),
        [relations, entryById, frameById]
      )

      const groupedRelations = useCallback(
        (entryId) => {
          const items = relationsOf(entryId)
          const order = meta.relationTypes.map((item) => item.id)
          const groups = []
          order.forEach((type) => {
            const group = items.filter((item) => item.relation.relationType === type)
            if (group.length) groups.push({ type: type, items: group })
          })
          return groups
        },
        [relationsOf, meta]
      )

      const relationCount = useCallback(
        (entryId) =>
          relations.filter(
            (relation) => relation.sourceMemoryId === entryId || relation.targetMemoryId === entryId
          ).length,
        [relations]
      )

      const snapshotEntry = useCallback(
        (id) => {
          const entry = entryById.get(id)
          if (!entry) return null
          return {
            entry: entry,
            relations: relations.filter(
              (relation) => relation.sourceMemoryId === id || relation.targetMemoryId === id
            ),
            collectionIds: collections
              .filter((collection) => collection.memberIds.includes(id))
              .map((collection) => collection.id)
          }
        },
        [entryById, relations, collections]
      )

      const loadTidy = useCallback(async (quiet) => {
        setTidyBusy(true)
        try {
          const result = await mutateState({ action: 'memory-tidy' })
          setTidyReport(result.result || null)
          if (!quiet) notify(t('toast.tidyRefreshed'), 'ok')
        } catch (err) {
          notify(isOfflineError(err) ? t('error.offline') : errorText(err, t('error.write')), 'error')
        } finally {
          setTidyBusy(false)
        }
      }, [notify, t])

      useEffect(() => {
        if (nav.kind === 'tidy' && !tidyReport && !tidyBusy) loadTidy(true)
      }, [nav.kind, tidyReport, tidyBusy, loadTidy])

      const confirmAllCandidateNodes = useCallback(
        async (ids) => {
          const list = Array.isArray(ids) ? ids : []
          if (!list.length) return
          for (const id of list) {
            await mutate({ action: 'node-save', id: id, status: 'active' })
          }
          notify(t('tidy.confirmAllDone') + ' ' + list.length, 'ok')
          loadTidy(true)
        },
        [mutate, t, notify, loadTidy]
      )

      const toggleHiddenNode = useCallback(
        async (node) => {
          const current = (data.layout && data.layout.hidden) || []
          const next = current.indexOf(node.id) >= 0 ? current.filter((id) => id !== node.id) : current.concat([node.id])
          await mutate(
            { action: 'layout-save', hidden: next },
            current.indexOf(node.id) >= 0 ? t('kn.shown') : t('kn.hiddenDone')
          )
        },
        [data.layout, mutate, t]
      )

      const restoreHiddenNodes = useCallback(async () => {
        await mutate({ action: 'layout-save', hidden: [] }, t('kn.shown'))
      }, [mutate, t])

      const confirmCandidateNode = useCallback(
        async (node) => {
          await mutate({ action: 'node-save', id: node.id, status: 'active' }, t('kn.saved'))
          loadTidy(true)
        },
        [mutate, t, loadTidy]
      )

      const protectEntry = useCallback(
        (id, level) => mutate({ action: 'entry-protect', id: id, level: level }, t('toast.protected')),
        [mutate, t]
      )

      const restoreVersion = useCallback(
        (id, versionId) => mutate({ action: 'entry-version-restore', id: id, versionId: versionId }, t('toast.restoredVersion')),
        [mutate, t]
      )

      const addEvidenceTo = useCallback(
        (id, text) =>
          mutate(
            { action: 'evidence-add', id: id, evidence: text, evidenceType: 'statement' },
            t('toast.evidenceAdded')
          ),
        [mutate, t]
      )

      const decideProposal = useCallback(
        (proposalId, decision) =>
          mutate(
            { action: 'proposal-decide', proposalId: proposalId, decision: decision },
            decision === 'accept' ? t('toast.proposalAccepted') : t('toast.proposalRejected')
          ),
        [mutate, t]
      )

      const mergeEntries = useCallback(
        (targetId, otherId) =>
          mutate({ action: 'memory-merge', ids: [targetId, otherId], targetId: targetId }, t('toast.merged')),
        [mutate, t]
      )

      const observeContent = useCallback(
        async (text, conversationId) => {
          setBusy('memory-observe')
          try {
            const result = await mutateState({
              action: 'memory-observe',
              text: text,
              conversationId: conversationId || ''
            })
            applyState(result)
            setModal({ type: 'observe', result: result.result || null })
            notify(t('toast.observed'), 'ok')
            return result
          } catch (err) {
            notify(isOfflineError(err) ? t('error.offline') : errorText(err, t('error.write')), 'error')
            return null
          } finally {
            setBusy('')
          }
        },
        [applyState, notify, t]
      )

      const projectCounts = useMemo(() => {
        const counts = {}
        projects.forEach((project) => {
          counts[project.id] = entries.filter((entry) => entry.projectId === project.id).length
        })
        return counts
      }, [projects, entries])

      // 记忆区里的记忆：把嵌套的子框一起展开（框里可以套框）。
      const areaScopeOf = useCallback(
        (frameId) => {
          const ids = new Set()
          const guard = new Set()
          const walk = (id) => {
            if (guard.has(id)) return
            guard.add(id)
            const frame = frameById.get(id)
            if (!frame) return
            frame.memberIds.forEach((memberId) => {
              if (frameById.has(memberId)) walk(memberId)
              else if (entryById.has(memberId)) ids.add(memberId)
            })
          }
          walk(frameId)
          return ids
        },
        [frameById, entryById]
      )

      const nodeHits = useMemo(() => {
        const needle = search.trim()
        return nodes
          .filter((node) => node.status !== 'merged')
          .filter((node) => {
            if (!needle) return true
            const haystack = [node.title, node.description, (node.aliases || []).join(' '), (node.tags || []).join(' ')].join(' ')
            return matchesQuery({ title: haystack }, needle)
          })
          .slice(0, 20)
      }, [nodes, search])

      const collectionHits = useMemo(() => {
        const needle = search.trim()
        if (!needle) return []
        return collections
          .filter((collection) => {
            const haystack = [collection.name, collection.description, (collection.tags || []).join(' ')].join(' ')
            return matchesQuery({ title: haystack }, needle)
          })
          .slice(0, 6)
      }, [collections, search])

      const projectHits = useMemo(() => {
        const needle = search.trim()
        if (!needle) return []
        return projects
          .filter((project) => matchesQuery({ title: [project.name, project.description].join(' ') }, needle))
          .slice(0, 6)
      }, [projects, search])

      const navEntries = useMemo(() => {
        let list = entries.slice()
        if (nav.kind === 'inbox') {
          list = list.filter((entry) => entry.status === 'draft' || entry.status === 'pending')
        } else if (nav.kind === 'favorites') {
          list = list.filter((entry) => entry.favorite)
        } else if (nav.kind === 'project') {
          list = list.filter((entry) => entry.projectId === nav.id)
        } else if (nav.kind === 'collection') {
          const collection = collectionById.get(nav.id)
          list = collection ? list.filter((entry) => collection.memberIds.includes(entry.id)) : []
        } else if (nav.kind === 'recent') {
          list = sortEntries(list, 'updated').slice(0, 20)
        } else if (nav.kind === 'area') {
          const scope = areaScopeOf(nav.id)
          list = list.filter((entry) => scope.has(entry.id))
        }
        if (filters.projectId) list = list.filter((entry) => entry.projectId === filters.projectId)
        list = list.filter((entry) => matchesFilters(entry, filters))
        list = list.filter((entry) => matchesQuery(entry, search))
        return sortEntries(list, nav.kind === 'recent' ? 'updated' : sort)
      }, [entries, nav, filters, search, sort, collectionById, areaScopeOf])

      const suggestedRelations = useMemo(
        () =>
          relations
            .filter((relation) => relation.status === 'suggested')
            .map((relation) => ({
              relation: relation,
              from: entryById.get(relation.sourceMemoryId)
                ? entryById.get(relation.sourceMemoryId).title
                : relation.sourceMemoryId,
              to: entryById.get(relation.targetMemoryId)
                ? entryById.get(relation.targetMemoryId).title
                : relation.targetMemoryId
            })),
        [relations, entryById]
      )

      const selectedEntry = selectedId ? entryById.get(selectedId) || null : null
      const selectedNode = selectedNodeId ? nodeById.get(selectedNodeId) || null : null

      useEffect(() => {
        if (selectedId && !entryById.has(selectedId)) setSelectedId('')
      }, [entryById, selectedId])

      const viewTitle = useMemo(() => {
        if (nav.kind === 'overview') return t('view.overview')
        if (nav.kind === 'all') return t('view.all')
        if (nav.kind === 'inbox') return t('view.inbox')
        if (nav.kind === 'collections') return t('view.collections')
        if (nav.kind === 'favorites') return t('view.favorites')
        if (nav.kind === 'recent') return t('view.recent')
        if (nav.kind === 'graph') return t('view.graph')
        if (nav.kind === 'tidy') return t('tidy.title')
        if (nav.kind === 'recall') return t('recall.title')
        if (nav.kind === 'knowledge') return t('nav.knowledge')
        if (nav.kind === 'project') {
          const project = projects.find((item) => item.id === nav.id)
          return project ? project.name : t('view.all')
        }
        if (nav.kind === 'collection') {
          const collection = collectionById.get(nav.id)
          return collection ? collection.name : t('view.collections')
        }
        if (nav.kind === 'area') {
          const frame = frameById.get(nav.id)
          return frame ? frame.name : t('graph.frames')
        }
        return t('app.title')
      }, [nav, t, projects, collectionById, frameById])

      // 换视图 / 换项目 / 进关系图时，右侧详情栏自动收起。
      useEffect(() => {
        setSelectedId('')
      }, [nav.kind, nav.id])

      const searchRef = useRef(null)

      // Ctrl/Cmd + K 把焦点送到搜索框；Enter 直接打开结果里的第一条。
      useEffect(() => {
        const onKeyDown = (event) => {
          const key = String(event.key || '')
          if ((event.ctrlKey || event.metaKey) && (key === 'k' || key === 'K')) {
            event.preventDefault()
            const input = searchRef.current
            if (input && typeof input.focus === 'function') input.focus()
            if (input && typeof input.select === 'function') input.select()
          }
        }
        window.addEventListener('keydown', onKeyDown)
        return () => window.removeEventListener('keydown', onKeyDown)
      }, [])

      const openEntry = useCallback((id) => {
        setSelectedId(id)
        setSelectedNodeId('')
        setDetailCollapsed(false)
      }, [])

      const openKnowledgeNode = useCallback((node) => {
        if (!node) return
        setSelectedNodeId(node.id)
        setSelectedId('')
        setDetailCollapsed(false)
      }, [])

      // 关系可能是连到「记忆框」的：框不是记忆，不能当记忆详情打开，
      // 而是把画布里框住的成员选中，让用户在关系图上看到它。
      const openNode = useCallback(
        (id) => {
          if (entryById.has(id)) {
            openEntry(id)
            return
          }
          const frame = frameById.get(id)
          if (frame) {
            setNav({ kind: 'graph', id: '' })
            setGraphSelection(frame.memberIds.slice())
            setSelectedId('')
          }
        },
        [entryById, frameById, openEntry]
      )

      const onSelectGraphNode = useCallback(
        (id, additive) => {
          const graphNode = graphView && graphView.collapsedNodes && graphView.collapsedNodes.has(id)
          if (additive) {
            setGraphSelection((prev) =>
              prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])
            )
            return
          }
          if (collectionById.has(id)) {
            setNav({ kind: 'collection', id: id })
            return
          }
          if (nodeById.has(id)) {
            setGraphSelection([id])
            openKnowledgeNode(nodeById.get(id))
            return
          }
          setGraphSelection([id])
          openEntry(id)
        },
        [collectionById, openEntry, graphView, nodeById, openKnowledgeNode]
      )

      const toggleChecked = useCallback((id) => {
        setChecked((prev) => (prev.includes(id) ? prev.filter((item) => item !== id) : prev.concat([id])))
      }, [])

      const saveEntry = useCallback(
        async (payload) => {
          const body = Object.assign({}, payload)
          const collectionIds = body.collectionIds ? body.collectionIds.slice() : null
          delete body.collectionIds
          const result = await mutate(
            Object.assign({ action: 'entry-save' }, body),
            body.id ? t('toast.saved') : t('toast.created')
          )
          if (!result) return
          const targetId = body.id || (result.entry && result.entry.id)
          if (targetId && collectionIds) {
            const current = collectionsOf(targetId).map((collection) => collection.id)
            const add = collectionIds.filter((id) => !current.includes(id))
            const remove = current.filter((id) => !collectionIds.includes(id))
            if (add.length || remove.length) {
              await mutate({ action: 'entry-collections', id: targetId, add: add, remove: remove })
            }
          }
          setModal(null)
          if (targetId) openEntry(targetId)
        },
        [mutate, t, collectionsOf, openEntry]
      )

      const deleteEntry = useCallback(
        async (id) => {
          const snapshot = snapshotEntry(id)
          const result = await mutate({ action: 'entry-delete', id: id })
          if (!result) return
          setSelectedId('')
          setModal(null)
          notify(
            t('toast.deleted'),
            'ok',
            snapshot
              ? {
                  label: t('action.undo'),
                  onClick: async () => {
                    const restored = await mutate({
                      action: 'entry-restore',
                      entry: snapshot.entry,
                      relations: snapshot.relations,
                      collectionIds: snapshot.collectionIds
                    })
                    if (restored) {
                      notify(t('toast.restored'), 'ok')
                      openEntry(restored.entry.id)
                    }
                  }
                }
              : null
          )
        },
        [mutate, t, notify, snapshotEntry, openEntry]
      )

      const starEntry = useCallback(
        async (id, next) => {
          await mutate({ action: 'entry-flag', id: id, favorite: Boolean(next) })
        },
        [mutate]
      )

      const setStatus = useCallback(
        async (id, status) => {
          await mutate({ action: 'entry-status', id: id, status: status }, t('toast.status'))
        },
        [mutate, t]
      )

      const createRelation = useCallback(
        async (payload) => {
          const result = await mutate(Object.assign({ action: 'relation-create' }, payload))
          if (result) {
            if (result.relation && result.relation.id) {
              notify(t('toast.relationCreated'), 'ok', {
                label: t('action.undo'),
                onClick: () =>
                  mutate({ action: 'relation-delete', id: result.relation.id }, t('toast.relationDeleted'))
              })
            } else {
              notify(t('toast.relationCreated'), 'ok')
            }
            setModal(null)
          }
        },
        [mutate, notify, t]
      )

      const decideRelation = useCallback(
        async (id, verdict) => {
          await mutate({ action: 'relation-decide', id: id, verdict: verdict })
        },
        [mutate]
      )

      const deleteRelation = useCallback(
        async (id) => {
          const relation = relations.find((item) => item.id === id)
          const snapshot = relation
            ? {
                sourceType: relation.sourceType,
                sourceId: relation.sourceId,
                targetType: relation.targetType,
                targetId: relation.targetId,
                relationType: relation.relationType,
                description: relation.description,
                status: relation.status === 'suggested' ? 'confirmed' : relation.status
              }
            : null
          await mutate({ action: 'relation-delete', id: id })
          notify(t('toast.relationDeleted'), 'ok', snapshot
            ? {
                label: t('action.undo'),
                onClick: () =>
                  mutate(Object.assign({ action: 'relation-create' }, snapshot), t('toast.relationCreated'))
              }
            : null)
        },
        [mutate, notify, t, relations]
      )

      // 知识对象：新建 / 编辑 / 归档 / 关联记忆 / 建立关系 / 合并。
      const correctPreference = useCallback(
        async (node, fix) => {
          const patch = { action: 'node-save', id: node.id }
          if (fix.kind === 'narrow') patch.scope = 'project'
          if (fix.kind === 'widen') patch.scope = 'global'
          if (fix.kind === 'obsolete' || fix.kind === 'oneOff') patch.status = 'archived'
          const note = String(fix.note || '').trim()
          const label =
            fix.kind === 'oneOff'
              ? t('kn.oneOff')
              : fix.kind === 'obsolete'
              ? t('kn.obsolete')
              : fix.kind === 'narrow'
              ? t('kn.narrow')
              : t('kn.widen')
          patch.attributes = (node.attributes || []).concat([
            { label: t('kn.correct'), value: note ? label + '：' + note : label }
          ])
          setModal(null)
          await mutate(patch, t('kn.correctDone'))
        },
        [mutate, t]
      )

      const saveNode = useCallback(
        async (payload) => {
          const body = Object.assign({ action: 'node-save' }, payload)
          setBusy('node')
          try {
            const result = await mutateState(body)
            applyState(result)
            if (result.requiresConfirmation) {
              setModal({ type: 'nodeTypeConfirm', payload: payload, affected: result.affectedRelations || [] })
              return
            }
            if (result.duplicate && result.duplicate.length > 0) {
              notify(t('kn.duplicate'), 'warn')
              setModal({ type: 'node', node: null, duplicate: result.duplicate })
              return
            }
            const saved = result.node
            if (saved) {
              setSelectedNodeId(saved.id)
              setSelectedId('')
              setDetailCollapsed(false)
            }
            setModal(null)
            notify(payload.id ? t('kn.saved') : t('kn.created'), 'ok')
          } catch (err) {
            notify(errorText(err, t('error.write')), 'error')
          } finally {
            setBusy('')
          }
        },
        [applyState, notify, t]
      )

      const archiveNode = useCallback(
        async (node) => {
          const next = node.status === 'archived' ? 'node-restore' : 'node-archive'
          await mutate({ action: next, id: node.id }, node.status === 'archived' ? t('kn.restored') : t('kn.archived'))
        },
        [mutate, t]
      )

      const deleteNode = useCallback(
        async (node) => {
          const result = await mutate({ action: 'node-delete', id: node.id, mode: 'archive' }, t('kn.archived'))
          if (result) setSelectedNodeId('')
        },
        [mutate, t]
      )

      const requestDeleteNode = useCallback((node) => {
        if (node) setModal({ type: "nodeDelete", node: node })
      }, [])

      const hardDeleteNode = useCallback(
        async (node) => {
          const result = await mutate({ action: "node-delete", id: node.id, mode: "hard" }, t('kn.deleted'))
          if (result) {
            setSelectedNodeId("")
            setModal(null)
          }
        },
        [mutate, t]
      )

      const restoreNodeVersion = useCallback(
        async (node, version) => {
          if (!node || !version) return
          await mutate(
            { action: 'node-version-restore', nodeId: node.id, versionId: version.id },
            t('kn.versionRestored')
          )
        },
        [mutate, t]
      )

      const linkMemoryToNode = useCallback(
        async (node, memoryId) => {
          const result = await mutate({ action: 'node-link-memory', nodeId: node.id, memoryId: memoryId }, t('kn.linked'))
          if (result) setModal(null)
        },
        [mutate, t]
      )

      const unlinkMemoryFromNode = useCallback(
        async (node, entry) => {
          const result = await mutate(
            { action: 'node-unlink-memory', nodeId: node.id, memoryId: entry.id },
            t('kn.unlinked')
          )
          if (result) setModal(null)
        },
        [mutate, t]
      )

      const createNodeRelation = useCallback(
        async (payload) => {
          const result = await mutate(Object.assign({ action: 'relation-create' }, payload), t('toast.relationCreated'))
          if (result) setModal(null)
        },
        [mutate, t]
      )

      const mergeKnowledgeNodes = useCallback(
        async (targetId, sourceId) => {
          const result = await mutate({ action: 'node-merge', targetId: targetId, sourceId: sourceId }, t('kn.merged'))
          if (result) setModal(null)
        },
        [mutate, t]
      )
      const quickSave = useCallback(
        async (payload) => {
          setBusy('quick')
          try {
            const result = await mutateState(
              Object.assign({ action: 'entry-save', status: 'pending' }, payload)
            )
            applyState(result)
            const created = result.entry
            notify(t('toast.created'), 'ok')
            setModal(null)
            if (!created) return
            openEntry(created.id)
            if (payload.suggestRelations) {
              const suggest = await request(API, {
                method: 'POST',
                body: JSON.stringify({ action: 'suggest.relations', id: created.id })
              })
              const suggestions = (suggest && suggest.suggestions) || []
              for (let index = 0; index < Math.min(3, suggestions.length); index += 1) {
                const item = suggestions[index]
                const applied = await mutateState({
                  action: 'relation-create',
                  sourceMemoryId: created.id,
                  targetMemoryId: item.targetMemoryId,
                  relationType: item.relationType,
                  description: item.description || '',
                  status: 'suggested'
                })
                applyState(applied)
              }
            }
          } catch (err) {
            notify(isOfflineError(err) ? t('error.offline') : errorText(err, t('error.write')), 'error')
          } finally {
            setBusy('')
          }
        },
        [applyState, notify, openEntry, t]
      )

      const askSuggestRelations = useCallback(async (text) => {
        const result = await request(API, {
          method: 'POST',
          body: JSON.stringify({ action: 'suggest.entry', text: text })
        })
        const suggestion = (result && result.suggestion) || {}
        const relationResult = await request(API, {
          method: 'POST',
          body: JSON.stringify({ action: 'suggest.relations', text: text })
        })
        suggestion.relations = (relationResult && relationResult.suggestions) || []
        return suggestion
      }, [])

      const runAssist = useCallback(
        async (kind) => {
          const entry = selectedId ? entryById.get(selectedId) : null
          if (!entry) {
            notify(t('assist.needSelection'), 'error')
            return
          }
          setAssist({ entryId: entry.id, action: kind, result: null, error: '', busy: true })
          try {
            const payload = await request(API, {
              method: 'POST',
              body: JSON.stringify({ action: 'ai.analyze', analysis: kind, id: entry.id })
            })
            if (!payload || payload.ok === false) {
              throw new Error((payload && payload.error && payload.error.message) || 'analyze failed')
            }
            setAssist({ entryId: entry.id, action: kind, result: payload.result || null, error: '', busy: false })
          } catch (err) {
            setAssist({
              entryId: entry.id,
              action: kind,
              result: null,
              error: isOfflineError(err) ? t('error.offline') : errorText(err, t('error.load')),
              busy: false
            })
          }
        },
        [entryById, selectedId, notify, t]
      )

      const closeAssist = useCallback(() => {
        setAssist({ entryId: '', action: '', result: null, error: '', busy: false })
      }, [])

      const applyOrganize = useCallback(
        async (result) => {
          if (!result || !result.entryId) return
          const body = { action: 'entry-save', id: result.entryId }
          if (result.title) body.title = result.title
          if (result.summary) body.summary = result.summary
          if (result.type) body.type = result.type
          if (result.domains && result.domains.length) body.domains = result.domains
          if (result.tags && result.tags.length) body.tags = result.tags
          const saved = await mutate(body, t('assist.applied'))
          if (saved) closeAssist()
        },
        [mutate, t, closeAssist]
      )

      const splitSegment = useCallback(
        async (segment) => {
          if (!segment) return
          const owner = assist.entryId ? entryById.get(assist.entryId) : selectedEntry
          const result = await mutate(
            {
              action: 'entry-save',
              title: segment.title,
              content: segment.content,
              type: segment.type || 'reference',
              domains: segment.domains || [],
              tags: segment.tags || [],
              projectId: owner ? owner.projectId : defaultProjectId,
              status: 'pending',
              source: { kind: 'ai', label: t('assist.segments') }
            },
            t('toast.segmentAdded')
          )
          if (result && result.entry) openEntry(result.entry.id)
        },
        [mutate, t, assist.entryId, entryById, selectedEntry, defaultProjectId, openEntry]
      )

      const relateSuggestion = useCallback(
        async (item) => {
          const sourceId = assist.entryId || selectedId
          if (!sourceId || !item || !item.targetMemoryId) return
          await createRelation({
            sourceMemoryId: sourceId,
            targetMemoryId: item.targetMemoryId,
            relationType: item.relationType || 'references',
            description: item.description || '',
            status: 'confirmed'
          })
        },
        [createRelation, assist.entryId, selectedId]
      )

      const resolveConflict = useCallback(
        async (item, choice) => {
          const sourceId = assist.entryId || selectedId
          if (!sourceId || !item) return
          if (choice === 'no-conflict') {
            notify(t('assist.confirmed'), 'ok')
            return
          }
          if (choice === 'supersede') {
            await createRelation({
              sourceMemoryId: sourceId,
              targetMemoryId: item.entryId,
              relationType: 'supersedes',
              description: t('assist.supersede'),
              status: 'confirmed'
            })
            await mutate({ action: 'entry-status', id: item.entryId, status: 'deprecated' }, t('assist.confirmed'))
            return
          }
          if (choice === 'both-apply') {
            await createRelation({
              sourceMemoryId: sourceId,
              targetMemoryId: item.entryId,
              relationType: 'references',
              description: t('assist.bothApply'),
              status: 'confirmed'
            })
            return
          }
          await createRelation({
            sourceMemoryId: sourceId,
            targetMemoryId: item.entryId,
            relationType: 'conflicts_with',
            description: t('assist.keepBoth'),
            status: 'confirmed'
          })
        },
        [createRelation, mutate, notify, t, assist.entryId, selectedId]
      )

      const summarizeCollection = useCallback(
        async (collectionId) => {
          try {
            const payload = await request(API, {
              method: 'POST',
              body: JSON.stringify({ action: 'ai.analyze', analysis: 'summary', collectionId: collectionId })
            })
            if (!payload || !payload.result) throw new Error('summary failed')
            setModal({ type: 'summary', result: payload.result })
          } catch (err) {
            notify(isOfflineError(err) ? t('error.offline') : errorText(err, t('error.load')), 'error')
          }
        },
        [notify, t]
      )
      const saveCollection = useCallback(
        async (payload) => {
          const result = await mutate(
            Object.assign({ action: 'collection-save' }, payload),
            t('toast.collectionSaved')
          )
          if (result) {
            setModal(null)
            if (result.collection) setNav({ kind: 'collection', id: result.collection.id })
          }
        },
        [mutate, t]
      )

      // 「加入集合」弹窗里直接新建：建好就勾上，用户不用关弹窗再重开。
      const createCollectionInline = useCallback(
        async (name) => {
          const result = await mutate({ action: 'collection-save', name: name }, t('collections.created'))
          return result && result.collection ? result.collection : null
        },
        [mutate, t]
      )

      const updateCollection = useCallback(
        async (payload) => {
          await mutate(Object.assign({ action: 'collection-save' }, payload), t('toast.saved'))
        },
        [mutate, t]
      )

      const deleteCollection = useCallback(
        async (id) => {
          const snapshot = collectionById.get(id) || null
          const result = await mutate({ action: 'collection-delete', id: id })
          if (!result) return
          setNav({ kind: 'collections', id: '' })
          notify(
            t('toast.deleted'),
            'ok',
            snapshot
              ? {
                  label: t('action.undo'),
                  onClick: async () => {
                    const restored = await mutate({ action: 'collection-restore', collection: snapshot })
                    if (restored) notify(t('toast.restored'), 'ok')
                  }
                }
              : null
          )
        },
        [mutate, t, notify, collectionById]
      )

      const addMembers = useCallback(
        async (collectionId, ids) => {
          const result = await mutate({ action: 'collection-members', id: collectionId, add: ids })
          if (result) {
            notify(t('toast.membersAdded'), 'ok', {
              label: t('action.undo'),
              onClick: () =>
                mutate({ action: 'collection-members', id: collectionId, remove: ids }, t('toast.saved'))
            })
            setModal(null)
          }
        },
        [mutate, notify, t]
      )

      const removeMember = useCallback(
        async (collectionId, entryId) => {
          await mutate({ action: 'collection-members', id: collectionId, remove: [entryId] })
        },
        [mutate]
      )

      // 管理界面里勾选成员是「最终状态」，这里换算成增/删两个动作。
      const syncMembers = useCallback(
        async (collectionId, ids) => {
          const collection = collectionById.get(collectionId)
          const current = collection ? collection.memberIds : []
          const next = Array.isArray(ids) ? ids : []
          const add = next.filter((id) => !current.includes(id))
          const remove = current.filter((id) => !next.includes(id))
          if (!add.length && !remove.length) {
            setModal(null)
            return
          }
          const result = await mutate(
            { action: 'collection-members', id: collectionId, add: add, remove: remove },
            t('collections.membersChanged')
          )
          if (result) setModal(null)
        },
        [mutate, t, collectionById]
      )

      const mergeCollections = useCallback(
        async (sourceId, targetId) => {
          const result = await mutate(
            { action: 'collection-merge', sourceId: sourceId, targetId: targetId },
            t('toast.merged')
          )
          if (result) setNav({ kind: 'collection', id: targetId })
        },
        [mutate, t]
      )

      const acceptSuggestion = useCallback(
        async (suggestion) => {
          const result = await mutate(
            {
              action: 'collection-save',
              name: suggestion.name,
              description: suggestion.description || '',
              color: suggestion.color || 'violet',
              projectId: suggestion.projectId || defaultProjectId,
              memberIds: suggestion.memberIds || [],
              source: 'ai',
              status: 'confirmed'
            },
            t('toast.collectionSaved')
          )
          if (result) setModal(null)
        },
        [mutate, t, defaultProjectId]
      )

      const batchAction = useCallback(
        async (kind) => {
          if (!checked.length) return
          if (kind === 'collection') {
            setModal({ type: 'batchCollection', ids: checked.slice() })
            return
          }
          await mutate({ action: 'entry-bulk', ids: checked.slice(), op: 'status', status: 'active' }, t('toast.saved'))
          setChecked([])
        },
        [checked, mutate, t]
      )

      // 切换左栏（换个视图、换个项目、进关系图）时，右侧详情栏跟着收起，
      // 避免「已经换了地方，右边还挂着上一条记忆」。
      const setNavKind = useCallback((kind, id) => {
        setNav({ kind: kind, id: id || '' })
        setSelectedId('')
        setChecked([])
        setSearch('')
        if (kind !== 'graph') setGraphSelection([])
      }, [])

      const deleteView = useCallback(
        async (view) => {
          if (!view) return
          const result = await mutate({ action: 'view-delete', viewId: view.id }, t('toast.viewDeleted'))
          if (result && nav.kind === 'graph' && nav.id === view.id) setNav({ kind: 'graph', id: '' })
        },
        [mutate, t, nav]
      )
      const restoreView = useCallback((view) => {
        const config = view.config || {}
        setGraphView(config)
        setNav({ kind: 'graph', id: view.id })
      }, [])

      const saveView = useCallback(
        (name) => {
          setModal(null)
          mutate(
            { action: 'view-save', name: name, kind: 'graph', config: graphView || {} },
            t('toast.viewSaved')
          )
        },
        [mutate, t, graphView]
      )

      const graphStateRef = useRef({})
      const onGraphState = useCallback((state) => {
        graphStateRef.current = state
        setGraphView(state)
      }, [])

      const saveFrame = useCallback(
        (payload) =>
          mutate(
            {
              action: 'frame-save',
              id: payload.id,
              name: payload.name,
              memberIds: payload.memberIds,
              rect: payload.rect,
              color: payload.color
            },
            t('graph.frameSaved')
          ),
        [mutate, t]
      )

      const saveLayout = useCallback(
        (positions) => mutate({ action: 'layout-save', positions: positions }, t('graph.layoutSaved')),
        [mutate, t]
      )

      // 拖完节点静默存布局：host 会按 rect 重算记忆区归属，界面随之刷新。
      const saveLayoutQuiet = useCallback(
        (positions) =>
          mutateState({ action: 'layout-save', positions: positions })
            .then((payload) => applyState(payload))
            .catch(() => {}),
        [applyState]
      )

      const deleteFrame = useCallback(
        (frame) => {
          if (!frame) return
          mutate({ action: 'frame-delete', id: frame.id }, t('graph.frameDeleted'))
        },
        [mutate, t]
      )

      const openProjectMenu = useCallback((project, x, y) => {
        setMenu({
          x: x,
          y: y,
          items: [
            {
              label: t('action.rename'),
              icon: 'edit',
              onClick: () => setModal({ type: 'project', mode: 'edit', project: project })
            },
            {
              label: t('action.delete'),
              icon: 'trash',
              danger: true,
              onClick: () =>
                setModal({ type: 'project', mode: 'delete', project: project, dialog: 'delete' })
            }
          ]
        })
      }, [t])

      const reorderProjects = useCallback(
        (ids) => mutate({ action: 'project-reorder', ids: ids }, t('toast.projectMoved')),
        [mutate, t]
      )

      const counts = useMemo(
        () => ({
          type: entries.reduce((acc, entry) => {
            acc[entry.type] = (acc[entry.type] || 0) + 1
            return acc
          }, {}),
          domain: entries.reduce((acc, entry) => {
            entry.domains.forEach((domain) => {
              acc[domain] = (acc[domain] || 0) + 1
            })
            return acc
          }, {}),
          status: entries.reduce((acc, entry) => {
            acc[entry.status] = (acc[entry.status] || 0) + 1
            return acc
          }, {})
        }),
        [entries]
      )

      const tagOptions = useMemo(() => {
        const countsByTag = {}
        entries.forEach((entry) => {
          entry.tags.forEach((tag) => {
            countsByTag[tag] = (countsByTag[tag] || 0) + 1
          })
        })
        return Object.keys(countsByTag)
          .sort((left, right) => countsByTag[right] - countsByTag[left])
          .slice(0, 24)
          .map((tag) => ({ id: tag, label: '#' + tag, count: countsByTag[tag] }))
      }, [entries])

      if (data.status === 'loading' && !entries.length) {
        return h(
          'div',
          { className: 'zw-root', 'data-zw-theme': theme },
          h('style', null, CSS),
          h(
            'div',
            { className: 'zw-app' },
            h(
              'div',
              { className: 'zw-empty', style: { margin: 'auto' } },
              h('div', { className: 'zw-emptyIcon' }, h(Icon, { name: 'sparkle', size: 22, className: 'zw-spin' })),
              h('div', { className: 'zw-emptyTitle' }, t('app.loading'))
            )
          )
        )
      }
      const batchIds = nav.kind === 'graph' || nav.kind === 'knowledge' ? graphSelection : checked
      const clearBatch = () => {
        if (nav.kind === 'graph') setGraphSelection([])
        else setChecked([])
      }

      const centerBody = (() => {        if (nav.kind === 'overview') {
          return h(OverviewView, {
            t: t,
            meta: meta,
            stats: stats,
            entries: entries,
            suggestedRelations: suggestedRelations,
            recalls: recalls,
            onNav: setNavKind,
            onFilterNav: (kind, next) => {
              setFilters(Object.assign({ projectId: '', types: [], statuses: [], domains: [], tags: [] }, next || {}))
              setNavKind(kind)
            },
            onOpen: openEntry,
            onNew: () => setModal({ type: 'quick' }),
            onDecide: decideRelation
          })
        }
        if (nav.kind === 'collections') {
          return h(CollectionsView, {
            t: t,
            collections: collections,
            suggestions: (graphView && graphView.collectionSuggestions) || [],
            suggesting: busy === 'suggest.collections',
            onSuggest: async () => {
              setBusy('suggest.collections')
              try {
                const result = await request(API, {
                  method: 'POST',
                  body: JSON.stringify({ action: 'suggest.collections', projectId: filters.projectId || '' })
                })
                setGraphView(Object.assign({}, graphView, {
                  collectionSuggestions: (result && result.suggestions) || []
                }))
                notify(t('toast.suggested'), 'ok')
              } catch (err) {
                notify(errorText(err, t('error.write')), 'error')
              } finally {
                setBusy('')
              }
            },
            onCreate: () => setModal({ type: 'collection' }),
            onAccept: acceptSuggestion,
            onOpen: (id) => setNav({ kind: 'collection', id: id }),
            onEdit: (collection) => setModal({ type: 'collection', collection: collection }),
            onMembers: (collection) =>
              setModal({ type: 'members', collectionId: collection.id, sync: true }),
            onMerge: (sourceId, targetId) => mergeCollections(sourceId, targetId),
            onDelete: (collection) => deleteCollection(collection.id)
          })
        }
        if (nav.kind === 'collection') {
          const collection = collectionById.get(nav.id)
          if (!collection) {
            return h(EmptyState, { icon: 'folder', title: t('collections.empty'), text: t('collections.deleted') })
          }
          const members = collection.memberIds
            .map((id) => entryById.get(id))
            .filter(Boolean)
          return h(CollectionDetail, {
            t: t,
            meta: meta,
            collection: collection,
            members: members,
            collections: collections,
            onUpdate: (patch) => updateCollection(Object.assign({ id: collection.id }, patch)),
            onSummarize: () => summarizeCollection(collection.id),
            onRemoveMember: (id) => removeMember(collection.id, id),
            onAddMembers: () => setModal({ type: 'members', collectionId: collection.id }),
            onDelete: deleteCollection,
            onMerge: mergeCollections,
            onOpen: openEntry
          })
        }
        if (nav.kind === 'tidy') {
          return h(TidyView, {
            onConfirmNode: confirmCandidateNode,
            onConfirmAllNodes: confirmAllCandidateNodes,
            onOpenNode: (id) => {
              const node = nodeById.get(id)
              if (node) {
                setNav({ kind: 'knowledge', id: '' })
                openKnowledgeNode(node)
              }
            },
            onMergeNodes: (aId, bId) => {
              const node = nodeById.get(aId)
              if (node) setModal({ type: 'nodeMerge', node: node, defaultTargetId: bId })
            },
            t: t,
            meta: meta,
            report: tidyReport,
            busy: tidyBusy,
            onRefresh: loadTidy,
            onOpen: openEntry,
            onDecideProposal: decideProposal,
            onConfirmRelation: (id) => decideRelation(id, 'confirmed'),
            onRejectRelation: (id) => decideRelation(id, 'rejected'),
            onMerge: mergeEntries
          })
        }
        if (nav.kind === 'recall') {
          return h(RecallView, {
            t: t,
            recalls: recalls,
            entryById: entryById,
            onOpen: openEntry
          })
        }
        if (nav.kind === 'knowledge') {
          return h(KnowledgeView, {
            key: 'knowledge',
            t: t,
            meta: meta,
            entries: visibleEntries,
            nodes: visibleNodes,
            hiddenNodes: hiddenNodes,
            showHidden: showHidden,
            onShowHidden: setShowHidden,
            onRestoreHidden: restoreHiddenNodes,
            relations: relations,
            collections: collections,
            projects: projects,
            stats: stats,
            view: knView,
            onView: setKnView,
            selection: graphSelection,
            initialConfig: graphView,
            onSelect: onSelectGraphNode,
            onOpenNode: openKnowledgeNode,
            onMultiSelect: setGraphSelection,
            onClearSelection: () => {
              setSelectedNodeId('')
              setSelectedId('')
              setGraphSelection([])
            },
            onCreate: (parent) =>
              setModal({
                type: 'node',
                node: null,
                defaultParentId: parent && parent.id ? parent.id : '',
                defaultType: parent && parent.id ? 'concept' : 'concept'
              }),
            onCreateRelation: (node) => setModal({ type: 'nodeRelation', sourceId: node.id }),
            onDecideRelation: decideRelation,
            frames: frames,
            layout: data.layout || { positions: {}, updatedAt: '' },
            onSaveFrame: saveFrame,
            onSaveLayout: saveLayout,
            onLayoutChange: saveLayoutQuiet,
            onBatchAction: batchAction,
            onOpenTidy: () => setNav({ kind: 'tidy', id: '' }),
            onRequestDeleteNode: requestDeleteNode,
            onState: onGraphState
          })
        }        if (nav.kind === 'graph') {
          return h(GraphView, {
            key: nav.id || 'graph',
            t: t,
            meta: meta,
            entries: visibleEntries,
            relations: relations,
            hiddenNodes: hiddenNodes,
            showHidden: showHidden,
            onRestoreHidden: restoreHiddenNodes,
            collections: collections,
            projects: projects,
            stats: stats,
            selection: graphSelection,
            initialConfig: graphView,
            onSelect: onSelectGraphNode,
            onMultiSelect: setGraphSelection,
            onClearSelection: () => {
              setSelectedId('')
              setGraphSelection([])
            },
            onCreateRelation: (sourceId, targetId) =>
              setModal({ type: 'relation', sourceId: sourceId, targetId: targetId }),
            onSelectFrame: (frame) => {
              setGraphSelection(frame.memberIds.slice())
              setSelectedId('')
            },
            onRenameFrame: (frame) => setModal({ type: 'frameName', frame: frame }),
            onUpdateFrame: (frame, rect) => saveFrame({ id: frame.id, name: frame.name, rect: rect }),
            onSearchArea: (frame) => {
              setSelectedId('')
              setGraphSelection([])
              setNav({ kind: 'area', id: frame.id })
            },
            onDeleteFrame: deleteFrame,
            onRequestDeleteNode: requestDeleteNode,
            onCreateFrame: (draft) => {
              const frames = data.frames || []
              setModal({
                type: 'frameName',
                frame: {
                  name: t('graph.frameName') + ' ' + (frames.length + 1),
                  color: COLLECTION_COLORS[frames.length % COLLECTION_COLORS.length],
                  rect: draft.rect,
                  memberIds: draft.memberIds || []
                }
              })
            },
            onDecideRelation: decideRelation,
            onSaveView: () => setModal({ type: 'saveView' }),
            onOpenTidy: () => setNav({ kind: 'tidy', id: '' }),
            frames: data.frames || [],
            layout: data.layout || { positions: {}, updatedAt: '' },
            onSaveFrame: saveFrame,
            onSaveLayout: saveLayout,
            onLayoutChange: saveLayoutQuiet,
            onBatchAction: batchAction,
            onState: onGraphState
          })
        }
        return h(
          React.Fragment,
          null,
          h(FilterBar, {
            t: t,
            meta: meta,
            filters: filters,
            counts: counts,
            tagOptions: tagOptions,
            layout: layout,
            onLayout: setLayout,
            sort: sort,
            onSort: setSort,
            onChange: setFilters
          }),
          (nodeHits.length || collectionHits.length || projectHits.length) && search.trim()
            ? h(
                'div',
                { className: 'zw-hitGroups' },
                nodeHits.length
                  ? h(
                      'div',
                      { className: 'zw-knHits' },
                      h('div', { className: 'zw-knHitsHead' }, t('kn.objects') + ' · ' + nodeHits.length),
                      nodeHits.slice(0, 8).map((node) =>
                        h(
                          'button',
                          {
                            key: node.id,
                            type: 'button',
                            className: 'zw-knHit',
                            onClick: () => {
                              setNav({ kind: 'knowledge', id: '' })
                              openKnowledgeNode(node)
                            }
                          },
                          h(Icon, { name: 'layers', size: 13 }),
                          h('span', { className: 'zw-knHitTitle' }, node.title),
                          h('span', { className: 'zw-badge zw-badgeNeutral' }, labelOf(t, meta.nodeTypes, node.nodeType, 'type'))
                        )
                      )
                    )
                  : null,
                collectionHits.length
                  ? h(
                      'div',
                      { className: 'zw-knHits' },
                      h('div', { className: 'zw-knHitsHead' }, t('search.collections') + ' · ' + collectionHits.length),
                      collectionHits.map((collection) =>
                        h(
                          'button',
                          {
                            key: collection.id,
                            type: 'button',
                            className: 'zw-knHit',
                            onClick: () => setNav({ kind: 'collection', id: collection.id })
                          },
                          h(Icon, { name: 'folder', size: 13 }),
                          h('span', { className: 'zw-knHitTitle' }, collection.name),
                          h('span', { className: 'zw-badge zw-badgeNeutral' }, (collection.memberIds || []).length + ' ' + t('collections.members'))
                        )
                      )
                    )
                  : null,
                projectHits.length
                  ? h(
                      'div',
                      { className: 'zw-knHits' },
                      h('div', { className: 'zw-knHitsHead' }, t('search.projects') + ' · ' + projectHits.length),
                      projectHits.map((project) =>
                        h(
                          'button',
                          {
                            key: project.id,
                            type: 'button',
                            className: 'zw-knHit',
                            onClick: () => setNav({ kind: 'project', id: project.id })
                          },
                          h(Icon, { name: 'home', size: 13 }),
                          h('span', { className: 'zw-knHitTitle' }, project.name)
                        )
                      )
                    )
                  : null
              )
            : null,
          h(MemoryList, {
            t: t,
            meta: meta,
            entries: navEntries,
            layout: layout,
            selectedId: selectedId,
            selection: checked,
            onOpen: openEntry,
            onCheck: toggleChecked,
            onStar: starEntry,
            collectionsFor: collectionsOf,
            relationCount: relationCount,
            onNew: () => setModal({ type: 'quick' })
          })
        )
      })()

      return h(
        'div',
        { className: 'zw-root', 'data-zw-theme': theme },
        h('style', null, CSS),
        h(
          'div',
          { className: 'zw-app' + (detailCollapsed ? ' zw-appDetailCollapsed' : '') },
          h(LeftRail, {
            t: t,
            nav: nav,
            collapsed: railCollapsed,
            stats: stats,
            tidyCount: (stats.pendingProposals || 0) + (stats.suggestedRelations || 0) + (stats.inbox || 0),
            projects: projects,
            projectCounts: projectCounts,
            views: data.views || [],
            onNav: setNavKind,
            onNew: () => setModal({ type: 'quick' }),
            onToggleCollapsed: () => {
              const next = !railCollapsed
              setRailCollapsed(next)
              writeFlag('railCollapsed', next)
            },
            onOpenView: restoreView,
            onDeleteView: deleteView,
            onCreateProject: () => setModal({ type: 'project', mode: 'create' }),
            onProjectMenu: openProjectMenu,
            onProjectDragStart: (id) => {
              dragProject.current = id
            },
            onProjectDragOver: (id) => {
              if (!id || !dragProject.current || id === dragProject.current) return
              const ids = projects.map((item) => item.id)
              const from = ids.indexOf(dragProject.current)
              const to = ids.indexOf(id)
              if (from < 0 || to < 0 || from === to) return
              ids.splice(to, 0, ids.splice(from, 1)[0])
              pendingProjects.current = ids
            },
            onProjectDrop: () => {
              const ids = pendingProjects.current
              pendingProjects.current = null
              dragProject.current = ''
              if (ids) reorderProjects(ids)
            },
            onRefresh: load
          }),
          h(
            'section',
            { className: 'zw-center' },
            h(
              'div',
              { className: 'zw-topbar' },
              h(
                'div',
                { className: 'zw-titleRow' },
                h(
                  'div',
                  { className: 'zw-titleMain' },
                  h('h1', { className: 'zw-viewTitle' }, viewTitle),
                  h(
                    'span',
                    { className: 'zw-viewSub' },
                    nav.kind === 'graph'
                      ? t('graph.subtitle')
                      : navEntries.length + ' ' + t('common.items')
                  )
                ),
                h(
                  'div',
                  { className: 'zw-search' },
                  h(Icon, { name: 'search', size: 14 }),
                  h('input', {
                    className: 'zw-searchInput',
                    value: search,
                    placeholder: t('list.searchPlaceholder') + ' · ' + t('search.openHint'),
                    ref: searchRef,
                    onChange: (event) => setSearch(event.target.value),
                    onKeyDown: (event) => {
                      if (event.key !== 'Enter') return
                      const first = navEntries[0]
                      if (first) {
                        event.preventDefault()
                        openEntry(first.id)
                      }
                    }
                  }),
                  search
                    ? h(
                        'button',
                        {
                          type: 'button',
                          className: 'zw-searchX',
                          onClick: () => setSearch('')
                        },
                        h(Icon, { name: 'close', size: 11 })
                      )
                    : null
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-iconBtn',
                    title: t('action.observe'),
                    onClick: () => setModal({ type: 'observe', result: null })
                  },
                  h(Icon, { name: 'sparkle', size: 14 })
                ),
                h(
                  'button',
                  {
                    type: 'button',
                    className: 'zw-btn zw-btnSm zw-btnPrimary',
                    onClick: () => setModal({ type: 'quick' })
                  },
                  h(Icon, { name: 'plus', size: 13 }),
                  t('action.new')
                )
              )
            ),
            h(
              'div',
              { className: 'zw-bodyArea' },
              data.status === 'error'
                ? h(
                    'div',
                    { className: 'zw-empty' },
                    h('div', { className: 'zw-emptyIcon' }, h(Icon, { name: 'warning', size: 22 })),
                    h('div', { className: 'zw-emptyTitle' }, data.error || t('error.load')),
                    h(
                      'button',
                      { type: 'button', className: 'zw-btn zw-btnSm', onClick: load },
                      t('action.retry')
                    )
                  )
                : centerBody
            ),
            batchIds.length > 1
              ? h(
                  'div',
                  { className: 'zw-batchWrap' },
                  h(
                    'div',
                    { className: 'zw-batchbar' },
                    h('span', { className: 'zw-batchCount' }, batchIds.length + ' ' + t('batch.selected')),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: () => setModal({ type: 'batchCollection', ids: batchIds.slice() })
                      },
                      h(Icon, { name: 'folder', size: 12 }),
                      t('batch.addToCollection')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: async () => {
                          await mutate(
                            { action: 'entry-bulk', ids: batchIds.slice(), op: 'status', status: 'active' },
                            t('toast.saved')
                          )
                          clearBatch()
                        }
                      },
                      h(Icon, { name: 'check', size: 12 }),
                      t('batch.setStatus')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: async () => {
                          await mutate(
                            { action: 'entry-bulk', ids: batchIds.slice(), op: 'status', status: 'archived' },
                            t('toast.archived')
                          )
                          clearBatch()
                        }
                      },
                      h(Icon, { name: 'bookmark', size: 12 }),
                      t('batch.archive')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm',
                        onClick: () => setModal({ type: 'batchTags', ids: batchIds.slice() })
                      },
                      h(Icon, { name: 'tag', size: 12 }),
                      t('batch.tag')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm zw-btnGhost',
                        onClick: () => setModal({ type: 'batchDelete', ids: batchIds.slice() })
                      },
                      h(Icon, { name: 'trash', size: 12 }),
                      t('batch.delete')
                    ),
                    h(
                      'button',
                      {
                        type: 'button',
                        className: 'zw-btn zw-btnSm zw-btnGhost',
                        onClick: clearBatch
                      },
                      t('batch.clear')
                    )
                  )
                )
              : null,
            busy
              ? h('div', { className: 'zw-loadingBar' }, h('div', { className: 'zw-loadingFill' }))
              : null
          ),
          selectedNode
            ? h(
                'aside',
                { className: 'zw-detail', 'data-collapsed': 'false' },
                h(NodeDetail, { onRestoreVersion: restoreNodeVersion,
                  t: t,
                  meta: meta,
                  node: selectedNode,
                  nodes: nodes,
                  entries: entries,
                  projects: projects,
                  relations: relations
                    .filter((relation) => relation.sourceId === selectedNode.id || relation.targetId === selectedNode.id)
                    .filter((relation) => relation.sourceType === 'node' && relation.targetType === 'node'),
                  onOpenNode: openKnowledgeNode,
                  onOpenEntry: openEntry,
                  onEdit: (node) => setModal({ type: 'node', node: node }),
                  onArchive: archiveNode,
                  onMerge: (node) => setModal({ type: 'nodeMerge', node: node }),
            onCorrect: (node) => setModal({ type: 'preferenceFix', node: node }),
                  onLinkMemory: (node) => setModal({ type: 'nodeMemory', nodeId: node.id }),
                  onUnlinkMemory: unlinkMemoryFromNode,
                  onCreateRelation: (node) => setModal({ type: 'nodeRelation', sourceId: node.id }),
                  onDecideRelation: decideRelation,
                  onDeleteRelation: (relation) => deleteRelation(relation.id),
                  hiddenIds: hiddenNodes,
                  onToggleHidden: toggleHiddenNode,
                  onClose: () => setSelectedNodeId('')
                })
              )
            : selectedEntry
            ? h(DetailRail, {            t: t,
            meta: meta,
            entry: selectedEntry,
            collections: selectedEntry ? collectionsOf(selectedEntry.id) : [],
            relationGroups: selectedEntry ? groupedRelations(selectedEntry.id) : [],
            relationCount: selectedEntry ? relationCount(selectedEntry.id) : 0,
            collapsed: detailCollapsed,
            onExpand: () => setDetailCollapsed(false),
            onCollapse: () => setDetailCollapsed(true),
            onStar: starEntry,
            onEdit: (id) => setModal({ type: 'editor', id: id }),
            onSetStatus: setStatus,
            onCreateLink: (sourceId) => setModal({ type: 'relation', sourceId: sourceId, targetId: '' }),
            onEditCollections: (id) => setModal({ type: 'entryCollections', id: id }),
            onDecideRelation: decideRelation,
            onDeleteRelation: deleteRelation,
            onOpen: openNode,
            onOpenCollection: (id) => setNav({ kind: 'collection', id: id }),
            nodesOf: (entry) => nodes.filter((node) => (node.relatedMemoryIds || []).indexOf(entry.id) >= 0),
            onOpenNode: openKnowledgeNode,
            onDelete: deleteEntry,
            assist: {
              busy: assist.busy && assist.entryId === selectedId,
              action: assist.entryId === selectedId ? assist.action : '',
              result: assist.entryId === selectedId ? assist.result : null,
              error: assist.entryId === selectedId ? assist.error : '',
              onClose: closeAssist
            },
            onAssist: runAssist,
            onApplyOrganize: applyOrganize,
            onSplitSegment: splitSegment,
            onRelateSuggestion: relateSuggestion,
            onResolveConflict: resolveConflict,
            onProtect: protectEntry,
            onRestoreVersion: restoreVersion,
            onAddEvidence: addEvidenceTo,
            onDecideProposal: decideProposal,
            pendingProposals: selectedEntry
              ? proposals.filter((proposal) => proposal.memoryId === selectedEntry.id && proposal.status === 'pending')
              : [],
            onShowMembers: (ids) => {
              setChecked(ids.slice())
              setNav({ kind: 'all', id: '' })
            }
          }) : null
        ),
        h(ToastHost, { toasts: toasts }),
        menu
          ? h(ContextMenu, {
              x: menu.x,
              y: menu.y,
              items: menu.items,
              onClose: () => setMenu(null)
            })
          : null,
        modal && modal.type === 'project'
          ? h(ProjectDialog, {
              t: t,
              mode: modal.mode,
              project: modal.project,
              saving: busy === 'project',
              onSave: (name, description) => {
                setModal(null)
                mutate(
                  { action: 'project-save', id: modal.project ? modal.project.id : undefined, name: name, description: description },
                  t('toast.projectSaved')
                )
              },
              onDelete: (project) => {
                setModal(null)
                mutate({ action: 'project-delete', id: project.id }, t('toast.projectDeleted'))
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'observe'
          ? h(ObserveDialog, {
              t: t,
              busy: busy === 'memory-observe',
              result: modal.result || null,
              onRun: observeContent,
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'summary'
          ? h(
              Modal,
              {
                title: t('assist.summary'),
                icon: 'sparkle',
                wide: true,
                onClose: () => setModal(null),
                closeLabel: t('action.close')
              },
              h(AssistResult, {
                t: t,
                meta: meta,
                result: modal.result,
                onOpenEntry: openEntry,
                onShowMembers: (ids) => {
                  setModal(null)
                  setChecked(ids.slice())
                  setNav({ kind: 'all', id: '' })
                }
              })
            )
          : null,
        modal && modal.type === 'quick'
          ? h(QuickAdd, {
              t: t,
              meta: meta,
              projects: projects,
              defaultProjectId: defaultProjectId,
              saving: busy === 'quick',
              onSuggest: askSuggestRelations,
              onSave: quickSave,
              onSaveSegment: async (segment) => {
                await mutate(
                  Object.assign({ action: 'entry-save', status: 'pending', source: { kind: 'ai', label: t('assist.segments') } }, segment),
                  t('toast.segmentAdded')
                )
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'editor'
          ? h(EntryEditor, {
              t: t,
              meta: meta,
              entry: entryById.get(modal.id) || null,
              projects: projects,
              allCollections: collections,
              defaultProjectId: defaultProjectId,
              collectionsOf: collectionsOf,
              saving: busy === 'entry-save',
              onSave: saveEntry,
              onDelete: deleteEntry,
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'relation'
          ? h(RelationDialog, {
              t: t,
              meta: meta,
              entries: entries,
              sourceId: modal.sourceId,
              initialTargetId: modal.targetId,
              saving: busy === 'relation-create',
              onSave: createRelation,
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'collection'
          ? h(CollectionCreate, {
              t: t,
              projects: projects,
              defaultProjectId: defaultProjectId,
              collection: modal.collection || null,
              saving: busy === 'collection-save',
              onCreate: saveCollection,
              onSave: (patch) =>
                updateCollection(Object.assign({ id: modal.collection.id }, patch)),
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'members'
          ? h(MembersPicker, {
              t: t,
              meta: meta,
              entries: entries,
              memberIds: collectionById.has(modal.collectionId)
                ? collectionById.get(modal.collectionId).memberIds
                : [],
              saving: busy === 'collection-members',
              onApply: (ids) =>
                modal.sync ? syncMembers(modal.collectionId, ids) : addMembers(modal.collectionId, ids),
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'batchTags'
          ? h(BatchTagDialog, {
              t: t,
              saving: busy === 'entry-bulk',
              onClose: () => setModal(null),
              onApply: async (tag) => {
                await mutate(
                  { action: 'entry-bulk', ids: modal.ids, op: 'addTag', value: tag },
                  t('toast.tagged')
                )
                setModal(null)
                clearBatch()
              }
            })
          : null,
        modal && modal.type === 'batchDelete'
          ? h(
              Modal,
              {
                title: t('batch.deleteTitle'),
                icon: 'trash',
                onClose: () => setModal(null),
                footer: [
                  h('button', { key: 'cancel', type: 'button', className: 'zw-btn zw-btnGhost', onClick: () => setModal(null) }, t('action.cancel')),
                  h(
                    ConfirmButton,
                    {
                      key: 'ok',
                      label: t('action.delete'),
                      confirmLabel: t('action.deleteConfirm'),
                      disabled: busy === 'entry-bulk',
                      onConfirm: async () => {
                        await mutate({ action: 'entry-bulk', ids: modal.ids, op: 'delete' }, t('toast.deleted'))
                        setModal(null)
                        clearBatch()
                      }
                    }
                  )
                ]
              },
              h('p', { className: 'zw-proseP' }, t('batch.deleteText'))
            )
          : null,
        modal && modal.type === 'batchCollection'
          ? h(CollectionPicker, {
              t: t,
              collections: collections.filter((collection) => collection.status !== 'suggested'),
              onCreate: createCollectionInline,
              title: t('batch.pickCollection'),
              saving: busy === 'entry-bulk',
              onApply: async (ids) => {
                for (let index = 0; index < ids.length; index += 1) {
                  await mutate({
                    action: 'entry-bulk',
                    ids: modal.ids,
                    op: 'addCollection',
                    collectionId: ids[index]
                  })
                }
                setChecked([])
                setModal(null)
                if (ids.length) notify(t('toast.membersAdded'), 'ok')
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'entryCollections'
          ? h(CollectionPicker, {
              t: t,
              collections: collections.filter((collection) => collection.status !== 'suggested'),
              onCreate: createCollectionInline,
              title: t('detail.collections'),
              value: collectionsOf(modal.id).map((collection) => collection.id),
              saving: busy === 'entry-collections',
              onApply: async (ids) => {
                const current = collectionsOf(modal.id).map((collection) => collection.id)
                await mutate({
                  action: 'entry-collections',
                  id: modal.id,
                  add: ids.filter((id) => !current.includes(id)),
                  remove: current.filter((id) => !ids.includes(id))
                })
                setModal(null)
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'node'
          ? h(NodeDialog, {
              t: t,
              meta: meta,
              projects: projects,
              nodes: nodes,
              node: modal.node || null,
              defaultParentId: modal.defaultParentId || '',
              defaultType: modal.defaultType || 'concept',
              defaultProjectId: defaultProjectId,
              saving: busy === 'node',
              onSave: saveNode,
              onOpenNode: (node) => {
                setModal({ type: 'node', node: node })
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'nodeRelation'
          ? h(NodeRelationDialog, {
              t: t,
              meta: meta,
              source: nodeById.get(modal.sourceId) || { id: modal.sourceId, title: '' },
              nodes: nodes,
              entries: entries,
              saving: busy === 'relation',
              onSave: createNodeRelation,
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'nodeMemory'
          ? h(NodeMemoryPicker, {
              t: t,
              meta: meta,
              node: nodeById.get(modal.nodeId) || null,
              entries: entries,
              saving: busy === 'node-link',
              onPick: (entry) => linkMemoryToNode(nodeById.get(modal.nodeId), entry.id),
              onClose: () => setModal(null)
            })
          : null,        modal && modal.type === 'saveView'
          ? h(NameDialog, {
              t: t,
              title: t('graph.saveView'),
              label: t('graph.viewName'),
              placeholder: t('graph.viewNamePlaceholder'),
              icon: 'bookmark',
              onSave: saveView,
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'project'
          ? h(NameDialog, {
              t: t,
              title: t('nav.newProject'),
              label: t('common.name'),
              icon: 'folder',
              onSave: async (name) => {
                setModal(null)
                await mutate({ action: 'project-save', name: name }, t('toast.saved'))
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'frameName'
          ? h(NameDialog, {
              t: t,
              title: modal.frame.id ? t('graph.frameRenameTitle') : t('graph.frameCreateTitle'),
              label: t('common.name'),
              value: modal.frame.name,
              icon: 'frame',
              onSave: async (name) => {
                const frame = modal.frame
                setModal(null)
                if (frame.id) {
                  await mutate({ action: 'frame-save', id: frame.id, name: name }, t('graph.frameRenamed'))
                } else {
                  await saveFrame({
                    name: name,
                    color: frame.color,
                    rect: frame.rect,
                    memberIds: frame.memberIds
                  })
                }
              },
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'nodeDelete'
          ? h(
              Modal,
              {
                title: t('kn.deleteTitle'),
                icon: 'trash',
                onClose: () => setModal(null),
                footer: h(
                  'div',
                  { className: 'zw-modalFoot' },
                  h(
                    'button',
                    { className: 'zw-btn zw-btnGhost', type: 'button', onClick: () => setModal(null) },
                    t('action.cancel')
                  ),
                  h(
                    'button',
                    { className: 'zw-btn', type: 'button', disabled: busy === 'node', onClick: () => archiveNode(modal.node) },
                    t('kn.archiveAction')
                  ),
                  h(ConfirmButton, {
                    className: 'zw-btn zw-btnDanger',
                    label: t('kn.deleteHard'),
                    confirmLabel: t('action.deleteConfirm'),
                    onConfirm: () => hardDeleteNode(modal.node)
                  })
                )
              },
              h(
                'div',
                { className: 'zw-form' },
                h('div', { className: 'zw-hint' }, t('kn.deleteText')),
                h('div', { className: 'zw-nodeMeta' }, modal.node.title + ' · ' + labelOf(t, meta.nodeTypes, modal.node.nodeType, 'type')),
                h('div', { className: 'zw-hint' }, t('kn.deleteArchiveHint'))
              )
            )
          : null,
        modal && modal.type === 'nodeTypeConfirm'
          ? h(
              Modal,
              {
                title: t('kn.typeChangeTitle'),
                icon: 'warning',
                onClose: () => setModal(null),
                footer: h(
                  'div',
                  { className: 'zw-modalFoot' },
                  h('button', { className: 'zw-btn zw-btnGhost', type: 'button', onClick: () => setModal(null) }, t('action.cancel')),
                  h(
                    'button',
                    {
                      className: 'zw-btn zw-btnPrimary',
                      type: 'button',
                      onClick: () => saveNode(Object.assign({}, modal.payload, { forceTypeChange: true }))
                    },
                    t('kn.typeChangeConfirm')
                  )
                )
              },
              h(
                'div',
                { className: 'zw-form' },
                h('div', { className: 'zw-hint' }, t('kn.typeChangeText')),
                h(
                  'div',
                  { className: 'zw-assistList' },
                  (modal.affected || []).map((relation) =>
                    h(
                      'div',
                      { className: 'zw-assistItem', key: relation.id },
                      h('div', { className: 'zw-assistItemTop' }, labelOf(t, meta.relationTypes, relation.relationType, 'relation')),
                      relation.description ? h('div', { className: 'zw-assistReason' }, relation.description) : null
                    )
                  )
                )
              )
            )
          : null,
        modal && modal.type === 'preferenceFix'
          ? h(PreferenceFixDialog, {
              t: t,
              node: modal.node,
              onSave: (fix) => correctPreference(modal.node, fix),
              onClose: () => setModal(null)
            })
          : null,
        modal && modal.type === 'nodeMerge'
          ? h(NodeMergeDialog, {
              t: t,
              meta: meta,
              node: modal.node,
              nodes: nodes,
              entries: entries,
              saving: busy === 'node',
              onSave: (targetId, sourceId) => mergeKnowledgeNodes(targetId, sourceId),
              onClose: () => setModal(null)
            })
          : null,
      )
    }


    function apply(ctx) {
      const t = ctx.locale.bind(NS)
      ctx.effect(() => ctx.locale.register(NS, 'zh', ZH), 'zhiwei: zh dictionary')
      ctx.effect(() => ctx.locale.register(NS, 'en', EN), 'zhiwei: en dictionary')
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
      // 设置进 DSH 自己的设置页（储物位置 / 整理用的模型 / 导入导出）。
      ctx.slots.inject('settings.section', () =>
        ctx.slots.register(
          {
            name: 'settings.section',
            id: PANEL_ID,
            order: 120,
            label: () => t('settings.sectionLabel')
          },
          (props) =>
            h(SettingsSection, {
              t: t,
              close: props && typeof props.close === 'function' ? props.close : () => {}
            })
        )
      )
    }

    return { inject: ['slots', 'locale'], apply }
  }
})

