const TERMINAL_AGENT_LOCALES = {
  zh: {
    meta: {
      name: 'Eclospy732',
      badge: 'workspace agent',
      prompt: 'workspace::$'
    },
    launcher: {
      label: '工作记录台'
    },
    header: {
      title: '工作记录台',
      subtitle: '随手留下线索，在工作台继续推进'
    },
    states: {
      idle: '待命',
      processing: '处理中',
      saved: '已保存',
      failed: '失败'
    },
    session: {
      bootLines: [
        '工作记录层已连接。',
        '记录只保存在当前浏览器。'
      ],
      emptyTitle: '从一条真实记录开始',
      emptyBody: '这里处理即时想法，不承担站内导航。你保存的内容会立即出现在工作台的“今日痕迹”中。',
      hints: ['记：需要跟进的想法', '拆：需要验证的判断', '回顾今天']
    },
    ui: {
      inputPlaceholder: '输入内容，或点击上方动作',
      openLabel: '打开工作记录台',
      dismissLabel: '收起工作记录台',
      submitLabel: '执行',
      actionsLabel: '快速动作',
      localOnly: '仅保存在当前浏览器',
      actions: {
        capture: '记录',
        analyze: '拆解',
        review: '回顾'
      }
    },
    system: {
      unknownCommand: '我没有执行“{command}”。',
      unknownHint: '请使用“记：内容”“拆：判断”或“回顾今天”。',
      emptyCapture: '“记：”后面需要有具体内容。',
      emptyAnalysis: '“拆：”后面需要有需要分析的判断。',
      processingAnalysis: '正在拆解这条判断…',
      timeout: 'AI 请求超时，请稍后重试。',
      failure: '处理失败：{message}',
      saved: '已写入今日痕迹。',
      cleared: '当前会话已清空。'
    },
    commands: {
      capture: { description: '记：内容 — 保存一条工作线索' },
      analyze: { description: '拆：判断 — 用 AI 拆解并保存' },
      review: { description: '回顾今天 — 汇总今天的记录与工具活动' },
      capsule: { description: 'capsule — 查看今日拆句' },
      help: { description: 'help — 查看使用方式' },
      clear: { description: 'clear — 清空终端会话' }
    },
    responses: {
      captureTitle: '记录',
      analysisTitle: 'AI 拆解',
      analysisLabels: {
        thesis: '核心判断',
        appeal: '吸引力',
        boundary: '适用边界',
        takeaway: '下一步'
      },
      reviewTitle: '今日回顾',
      reviewSummary: '今天留下 {records} 条痕迹，打开 {tools} 个工作工具。',
      reviewEmpty: '今天还没有工作痕迹。可以先记下一条需要继续推进的线索。',
      recordsLabel: '记录',
      toolsLabel: '工具活动',
      capsuleTitle: '今日拆句',
      capsuleEmpty: '今日拆句暂时还没有生成。',
      helpIntro: '三个主动作对应三个清晰结果：',
      sourcePage: '来源：{page}'
    }
  },
  en: {
    meta: {
      name: 'Eclospy732',
      badge: 'workspace agent',
      prompt: 'workspace::$'
    },
    launcher: {
      label: 'Work log'
    },
    header: {
      title: 'Work log',
      subtitle: 'Capture a thread here, continue it from the Desk'
    },
    states: {
      idle: 'Idle',
      processing: 'Processing',
      saved: 'Saved',
      failed: 'Failed'
    },
    session: {
      bootLines: ['Workspace record layer connected.', 'Records stay in this browser.'],
      emptyTitle: 'Start with one real trace',
      emptyBody: 'This surface handles immediate thoughts, not site navigation. Saved items appear in Today\'s traces on the Desk.',
      hints: ['note: something to follow up', 'analyze: a claim to test', 'review']
    },
    ui: {
      inputPlaceholder: 'Type something or choose an action above',
      openLabel: 'Open work log',
      dismissLabel: 'Close work log',
      submitLabel: 'Run',
      actionsLabel: 'Quick actions',
      localOnly: 'Stored in this browser only',
      actions: {
        capture: 'Record',
        analyze: 'Analyze',
        review: 'Review'
      }
    },
    system: {
      unknownCommand: 'I did not run “{command}”.',
      unknownHint: 'Use “note: content”, “analyze: claim”, or “review”.',
      emptyCapture: 'Add some content after “note:”.',
      emptyAnalysis: 'Add a claim after “analyze:”.',
      processingAnalysis: 'Analyzing this claim…',
      timeout: 'The AI request timed out. Please try again.',
      failure: 'Failed: {message}',
      saved: 'Saved to today\'s traces.',
      cleared: 'The current session has been cleared.'
    },
    commands: {
      capture: { description: 'note: content — save a work trace' },
      analyze: { description: 'analyze: claim — analyze with AI and save' },
      review: { description: 'review — summarize today\'s records and tool activity' },
      capsule: { description: 'capsule — show today\'s capsule' },
      help: { description: 'help — show usage' },
      clear: { description: 'clear — clear this terminal session' }
    },
    responses: {
      captureTitle: 'Record',
      analysisTitle: 'AI analysis',
      analysisLabels: {
        thesis: 'Core claim',
        appeal: 'Appeal',
        boundary: 'Boundary',
        takeaway: 'Next step'
      },
      reviewTitle: 'Today review',
      reviewSummary: 'You left {records} traces and opened {tools} work tools today.',
      reviewEmpty: 'There are no work traces today. Start by recording one thread to continue.',
      recordsLabel: 'Records',
      toolsLabel: 'Tool activity',
      capsuleTitle: 'Daily capsule',
      capsuleEmpty: 'Today\'s capsule is not available yet.',
      helpIntro: 'Three primary actions produce three clear outcomes:',
      sourcePage: 'Source: {page}'
    }
  }
}

export const terminalAgentMeta = {
  bootStorageKey: 'terminal.agent.booted',
  historyStorageKey: 'terminal.session',
  commandStorageKey: 'terminal.commands',
  openEvent: 'gworkspace:terminal-open'
}

export function getTerminalAgentLocale(locale = 'zh') {
  return String(locale).toLowerCase().startsWith('en') ? 'en' : 'zh'
}

export function getTerminalAgentCopy(locale = 'zh') {
  return TERMINAL_AGENT_LOCALES[getTerminalAgentLocale(locale)]
}
