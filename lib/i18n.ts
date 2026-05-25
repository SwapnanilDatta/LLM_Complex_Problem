import { useChatStore } from './store'

type Translations = Record<string, Record<string, string>>

const translations: Translations = {
  en: {
    // Welcome Screen
    'welcome.subtitle': 'AI-Powered Learning',
    'welcome.description': 'Your specialized AI companion for advanced academics.',
    'welcome.choose': 'Choose your domain to begin.',
    'welcome.start': 'Start chatting',
    'welcome.footer': 'Each agent has its own specialized knowledge base and conversation history.',

    // Sidebar
    'sidebar.new_chat': 'New Chat',
    'sidebar.history': 'History',
    'sidebar.no_conversations': 'No conversations yet',
    'sidebar.start_new': 'Start a new chat to begin',
    'sidebar.today': 'Today',
    'sidebar.yesterday': 'Yesterday',
    'sidebar.previous_7_days': 'Previous 7 Days',
    'sidebar.older': 'Older',

    // Agents
    'agent.maths.title': 'Mathematics',
    'agent.maths.desc': 'Solve complex equations, prove theorems, and explore mathematical concepts with full LaTeX rendering.',
    'agent.ml.title': 'Machine Learning',
    'agent.ml.desc': 'Build models, analyze datasets, and understand ML algorithms with code examples and visualizations.',
    'agent.automata.title': 'Automata Theory',
    'agent.automata.desc': 'Design state machines, analyze formal languages, and visualize automata with interactive diagrams.',

    // Placeholders
    'input.placeholder.maths': 'Ask about equations, proofs, calculus...',
    'input.placeholder.ml': 'Ask about neural networks, training, datasets...',
    'input.placeholder.automata': 'Ask about state machines, languages, Turing machines...',

    // UI Elements
    'ui.theoretical_output': 'Theoretical Output & Transition Tables',
    'ui.algorithm_solution': 'Algorithm Solution & Output',
    'ui.disclaimer': 'Nexus AI can make mistakes. Please verify important information.',
  },
  es: {
    'welcome.subtitle': 'Aprendizaje con Inteligencia Artificial',
    'welcome.description': 'Tu compañero especializado de IA para académicos avanzados.',
    'welcome.choose': 'Elige tu dominio para comenzar.',
    'welcome.start': 'Comenzar a chatear',
    'welcome.footer': 'Cada agente tiene su propia base de conocimientos y su historial de conversaciones.',

    'sidebar.new_chat': 'Nuevo Chat',
    'sidebar.history': 'Historial',
    'sidebar.no_conversations': 'Aún no hay conversaciones',
    'sidebar.start_new': 'Inicia un nuevo chat para empezar',
    'sidebar.today': 'Hoy',
    'sidebar.yesterday': 'Ayer',
    'sidebar.previous_7_days': 'Últimos 7 días',
    'sidebar.older': 'Anteriores',

    'agent.maths.title': 'Matemáticas',
    'agent.maths.desc': 'Resuelve ecuaciones complejas, prueba teoremas y explora conceptos matemáticos con soporte LaTeX.',
    'agent.ml.title': 'Aprendizaje Automático',
    'agent.ml.desc': 'Construye modelos, analiza conjuntos de datos y entiende algoritmos de ML con visualizaciones.',
    'agent.automata.title': 'Teoría de Autómatas',
    'agent.automata.desc': 'Diseña máquinas de estado, analiza lenguajes formales y visualiza autómatas interactivamente.',

    'input.placeholder.maths': 'Pregunta sobre ecuaciones, pruebas, cálculo...',
    'input.placeholder.ml': 'Pregunta sobre redes neuronales, entrenamiento, datos...',
    'input.placeholder.automata': 'Pregunta sobre máquinas de estado, lenguajes, máquinas de Turing...',

    'ui.theoretical_output': 'Salida Teórica y Tablas de Transición',
    'ui.algorithm_solution': 'Solución del Algoritmo y Salida',
    'ui.disclaimer': 'Nexus AI puede cometer errores. Por favor verifica la información importante.',
  },
  fr: {
    'welcome.subtitle': 'Apprentissage assisté par IA',
    'welcome.description': 'Votre compagnon IA spécialisé pour des études académiques avancées.',
    'welcome.choose': 'Choisissez votre domaine pour commencer.',
    'welcome.start': 'Commencer',
    'welcome.footer': 'Chaque agent a sa propre base de connaissances et son historique.',

    'sidebar.new_chat': 'Nouveau Chat',
    'sidebar.history': 'Historique',
    'sidebar.no_conversations': 'Aucune conversation',
    'sidebar.start_new': 'Démarrez un nouveau chat pour commencer',
    'sidebar.today': 'Aujourd\'hui',
    'sidebar.yesterday': 'Hier',
    'sidebar.previous_7_days': '7 derniers jours',
    'sidebar.older': 'Ancien',

    'agent.maths.title': 'Mathématiques',
    'agent.maths.desc': 'Résolvez des équations complexes et explorez des concepts avec le rendu LaTeX.',
    'agent.ml.title': 'Apprentissage Automatique',
    'agent.ml.desc': 'Construisez des modèles, analysez des données et comprenez les algorithmes ML.',
    'agent.automata.title': 'Théorie des Automates',
    'agent.automata.desc': 'Concevez des machines à états, analysez des langages et visualisez des automates.',

    'input.placeholder.maths': 'Posez des questions sur les équations, le calcul...',
    'input.placeholder.ml': 'Questions sur les réseaux neuronaux, l\'entraînement...',
    'input.placeholder.automata': 'Questions sur les machines à états, les langages...',

    'ui.theoretical_output': 'Sortie Théorique & Tables de Transition',
    'ui.algorithm_solution': 'Solution de l\'Algorithme & Sortie',
    'ui.disclaimer': 'Nexus AI peut faire des erreurs. Veuillez vérifier les informations.',
  },
  de: {
    'welcome.subtitle': 'KI-Gestütztes Lernen',
    'welcome.description': 'Ihr spezialisierter KI-Begleiter für fortgeschrittene Akademiker.',
    'welcome.choose': 'Wählen Sie Ihren Bereich aus, um zu beginnen.',
    'welcome.start': 'Chatten',
    'welcome.footer': 'Jeder Agent hat seine eigene Wissensbasis und seinen eigenen Verlauf.',
    'sidebar.new_chat': 'Neuer Chat',
    'sidebar.history': 'Verlauf',
    'sidebar.no_conversations': 'Noch keine Konversationen',
    'sidebar.start_new': 'Starten Sie einen neuen Chat',
    'sidebar.today': 'Heute',
    'sidebar.yesterday': 'Gestern',
    'sidebar.previous_7_days': 'Letzte 7 Tage',
    'sidebar.older': 'Älter',
    'agent.maths.title': 'Mathematik',
    'agent.maths.desc': 'Lösen Sie komplexe Gleichungen und erforschen Sie Konzepte mit LaTeX-Rendering.',
    'agent.ml.title': 'Maschinelles Lernen',
    'agent.ml.desc': 'Erstellen Sie Modelle, analysieren Sie Daten und verstehen Sie ML-Algorithmen.',
    'agent.automata.title': 'Automatentheorie',
    'agent.automata.desc': 'Entwerfen Sie Zustandsmaschinen, analysieren Sie Sprachen und visualisieren Sie Automaten.',
    'input.placeholder.maths': 'Fragen Sie nach Gleichungen, Beweisen, Kalkül...',
    'input.placeholder.ml': 'Fragen Sie nach neuronalen Netzen, Training, Daten...',
    'input.placeholder.automata': 'Fragen Sie nach Zustandsmaschinen, Sprachen...',
    'ui.theoretical_output': 'Theoretische Ausgabe & Übergangstabellen',
    'ui.algorithm_solution': 'Algorithmus Lösung & Ausgabe',
    'ui.disclaimer': 'Nexus AI kann Fehler machen. Überprüfen Sie wichtige Informationen.',
  },
  zh: {
    'welcome.subtitle': '人工智能辅助学习',
    'welcome.description': '您的高级学术专用 AI 助手。',
    'welcome.choose': '选择您的领域开始。',
    'welcome.start': '开始聊天',
    'welcome.footer': '每个代理都有其自己的专门知识库和对话历史。',
    'sidebar.new_chat': '新聊天',
    'sidebar.history': '历史',
    'sidebar.no_conversations': '还没有对话',
    'sidebar.start_new': '开始一个新聊天',
    'sidebar.today': '今天',
    'sidebar.yesterday': '昨天',
    'sidebar.previous_7_days': '过去 7 天',
    'sidebar.older': '更早',
    'agent.maths.title': '数学',
    'agent.maths.desc': '用 LaTeX 渲染解决复杂方程、证明定理和探索数学概念。',
    'agent.ml.title': '机器学习',
    'agent.ml.desc': '构建模型、分析数据集并通过可视化了解 ML 算法。',
    'agent.automata.title': '自动机理论',
    'agent.automata.desc': '设计状态机、分析形式语言并通过交互式图表可视化自动机。',
    'input.placeholder.maths': '询问关于方程、证明、微积分...',
    'input.placeholder.ml': '询问关于神经网络、训练、数据集...',
    'input.placeholder.automata': '询问关于状态机、语言、图灵机...',
    'ui.theoretical_output': '理论输出和转换表',
    'ui.algorithm_solution': '算法解决方案和输出',
    'ui.disclaimer': 'Nexus AI 可能会犯错。 请验证重要信息。',
  },
  ja: {
    'welcome.subtitle': 'AI支援学習',
    'welcome.description': '高度な学問のための専門AIアシスタント。',
    'welcome.choose': 'ドメインを選択して開始してください。',
    'welcome.start': 'チャットを開始',
    'welcome.footer': '各エージェントには独自の専門知識ベースと会話履歴があります。',
    'sidebar.new_chat': '新しいチャット',
    'sidebar.history': '履歴',
    'sidebar.no_conversations': '会話はまだありません',
    'sidebar.start_new': '新しいチャットを開始して始める',
    'sidebar.today': '今日',
    'sidebar.yesterday': '昨日',
    'sidebar.previous_7_days': '過去7日間',
    'sidebar.older': '以前',
    'agent.maths.title': '数学',
    'agent.maths.desc': 'LaTeXレンダリングで複雑な方程式を解き、定理を証明し、数学の概念を探ります。',
    'agent.ml.title': '機械学習',
    'agent.ml.desc': 'モデルを構築し、データセットを分析し、コード例と視覚化でMLアルゴリズムを理解します。',
    'agent.automata.title': 'オートマトン理論',
    'agent.automata.desc': '状態機械を設計し、形式言語を分析し、インタラクティブな図でオートマトンを視覚化します。',
    'input.placeholder.maths': '方程式、証明、微積分について尋ねる...',
    'input.placeholder.ml': 'ニューラルネットワーク、トレーニング、データセットについて尋ねる...',
    'input.placeholder.automata': '状態機械、言語、チューリングマシンについて尋ねる...',
    'ui.theoretical_output': '理論的出力と遷移表',
    'ui.algorithm_solution': 'アルゴリズムソリューションと出力',
    'ui.disclaimer': 'Nexus AIは間違うことがあります。重要な情報は確認してください。',
  },
}

export function useTranslation() {
  const language = useChatStore((state) => state.language)

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return { t, language }
}
