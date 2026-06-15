const TERMINAL_AGENT_LOCALES = {
  zh: {
    meta: {
      name: 'Eclospy732',
      badge: 'site agent',
      prompt: 'eclospy732::$'
    },
    launcher: {
      label: 'Eclospy732',
      caption: 'site agent',
      states: ['idle', 'monitoring', 'standby', 'routing'],
      activeState: 'listening'
    },
    header: {
      title: 'Eclospy732',
      subtitle: 'public relay // advisory shell'
    },
    session: {
      bootLines: [
        'Boot flag accepted.',
        'Public surface relay attached.',
        'Eclospy732 online.'
      ],
      emptyTitle: '代理舱待命中',
      emptyBody: '这里不是另一个工具箱。更像一个站内代理节点。',
      hints: [
        'help 查看可用命令',
        'signal 查看站内信号',
        'drift 进行随机跳转'
      ]
    },
    ui: {
      inputPlaceholder: '输入命令，或先试试 help',
      openLabel: '唤醒 Eclospy732',
      closeLabel: '关闭 Eclospy732',
      dismissLabel: '收起代理舱',
      statusLabel: 'agent status'
    },
    labels: {
      articles: '文章',
      projects: '项目',
      tools: '核心入口',
      currentRoute: '当前页面',
      latestSignal: '最新信号',
      theme: '主题',
      locale: '语言',
      memory: '记忆',
      mode: '模式'
    },
    values: {
      themeLight: 'Light',
      themeDark: 'Dark',
      memoryWarm: 'Warm',
      memoryCold: 'Cold',
      modePublic: 'Public relay'
    },
    system: {
      unknownCommand: '命令不存在：{command}',
      unknownHint: '输入 help 查看可用交互。',
      driftFallback: '目标暂时失联，已回退到首页。'
    },
    commands: {
      help: {
        description: '显示可用交互',
        intro: '可用命令如下。'
      },
      whoami: {
        description: '查看代理说明',
        blocks: [
          {
            type: 'text',
            content: '我是 Eclospy732。负责做站内代理，不负责假装成另一个聊天壳。'
          },
          {
            type: 'text',
            content: '你可以把这里当作一个人格化入口：负责引导、提示、随机偏航，以及以后接入轻量 AI。'
          },
          {
            type: 'status',
            items: [
              { label: 'temperament', value: 'dry but stable' },
              { label: 'role', value: 'site-side relay' },
              { label: 'scope', value: 'public routes only' },
              { label: 'future slot', value: 'lightweight AI' }
            ]
          }
        ]
      },
      signal: {
        description: '查看站内信号',
        intro: '公共面已经整理好。当前信号如下。'
      },
      recent: {
        description: '查看最近内容',
        intro: '最近几条内容入口已经整理出来了。'
      },
      capsule: {
        description: '查看今日拆句',
        intro: '今日拆句已经挂上来了。',
        empty: '今日拆句暂时还没生成出来。',
        openAnalyzerLabel: '一句话命题解析器',
        openAnalyzerMeta: '进入工作台继续拆'
      },
      drift: {
        description: '随机跳转到一个站内目标',
        response: '已转向 {target}。'
      },
      status: {
        description: '查看代理状态',
        intro: '运行状态如下。'
      },
      ask: {
        description: '查看 AI 入口',
        intro: 'AI 没被塞进一个聊天壳里，而是被拆成了几个更具体的站内入口。',
        analyzerLabel: '一句话命题解析器',
        analyzerMeta: '公开展示思路拆解',
        blogAssistantLabel: 'Blog Assistant 2.0',
        blogAssistantMeta: '用于起稿和提炼写作命题'
      },
      clear: {
        description: '清空当前输出'
      }
    },
    commandOrder: ['help', 'whoami', 'signal', 'recent', 'capsule', 'drift', 'status', 'ask', 'clear']
  },
  en: {
    meta: {
      name: 'Eclospy732',
      badge: 'site agent',
      prompt: 'eclospy732::$'
    },
    launcher: {
      label: 'Eclospy732',
      caption: 'site agent',
      states: ['idle', 'monitoring', 'standby', 'routing'],
      activeState: 'listening'
    },
    header: {
      title: 'Eclospy732',
      subtitle: 'public relay // advisory shell'
    },
    session: {
      bootLines: [
        'Boot flag accepted.',
        'Public surface relay attached.',
        'Eclospy732 online.'
      ],
      emptyTitle: 'Agent standing by',
      emptyBody: 'This is a site-side relay, not another toolbox clone.',
      hints: [
        'help for commands',
        'signal for site status',
        'drift for a random jump'
      ]
    },
    ui: {
      inputPlaceholder: 'Type a command, or start with help',
      openLabel: 'Wake Eclospy732',
      closeLabel: 'Close Eclospy732',
      dismissLabel: 'Close terminal panel',
      statusLabel: 'agent status'
    },
    labels: {
      articles: 'Articles',
      projects: 'Projects',
      tools: 'Core entries',
      currentRoute: 'Current route',
      latestSignal: 'Latest signal',
      theme: 'Theme',
      locale: 'Locale',
      memory: 'Memory',
      mode: 'Mode'
    },
    values: {
      themeLight: 'Light',
      themeDark: 'Dark',
      memoryWarm: 'Warm',
      memoryCold: 'Cold',
      modePublic: 'Public relay'
    },
    system: {
      unknownCommand: 'Unknown command: {command}',
      unknownHint: 'Type help to inspect the available commands.',
      driftFallback: 'Target lost. Fell back to home.'
    },
    commands: {
      help: {
        description: 'Show available commands',
        intro: 'Available commands are listed below.'
      },
      whoami: {
        description: 'Inspect the agent profile',
        blocks: [
          {
            type: 'text',
            content: 'I am Eclospy732. A site-side relay, not another chat shell.'
          },
          {
            type: 'text',
            content: 'Use this shell for navigation, direction, and the future lightweight AI slot.'
          }
        ]
      },
      signal: {
        description: 'Inspect public site signals',
        intro: 'The public surface is stable. Current signals follow.'
      },
      recent: {
        description: 'Show recent content',
        intro: 'Recent entries are staged below.'
      },
      capsule: {
        description: 'Inspect today\'s capsule',
        intro: 'Today\'s capsule is already staged.',
        empty: 'Today\'s capsule has not been generated yet.',
        openAnalyzerLabel: 'Thesis Parser',
        openAnalyzerMeta: 'Continue the breakdown in the workspace'
      },
      drift: {
        description: 'Jump to a random site target',
        response: 'Rerouted to {target}.'
      },
      status: {
        description: 'Inspect relay runtime status',
        intro: 'Runtime state follows.'
      },
      ask: {
        description: 'Inspect AI entry points',
        intro: 'The AI layer is not a chat shell here. It has been split into narrower entry points.',
        analyzerLabel: 'Thesis Parser',
        analyzerMeta: 'Public-facing proposition breakdown',
        blogAssistantLabel: 'Blog Assistant 2.0',
        blogAssistantMeta: 'Draft angles and writing hooks'
      },
      clear: {
        description: 'Clear current output'
      }
    },
    commandOrder: ['help', 'whoami', 'signal', 'recent', 'capsule', 'drift', 'status', 'ask', 'clear']
  }
}

export const terminalAgentMeta = {
  storageKey: 'terminal.agent.booted'
}

export function getTerminalAgentLocale(locale = 'zh') {
  return locale === 'en' ? 'en' : 'zh'
}

export function getTerminalAgentCopy(locale = 'zh') {
  return TERMINAL_AGENT_LOCALES[getTerminalAgentLocale(locale)]
}
