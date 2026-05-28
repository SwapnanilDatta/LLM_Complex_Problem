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
    'ui.disclaimer': 'SolveX can make mistakes. Please verify important information.',
  },

  // ── Hindi ──────────────────────────────────────────────────────────────────
  hi: {
    'welcome.subtitle': 'AI-संचालित शिक्षा',
    'welcome.description': 'उन्नत शिक्षा के लिए आपका विशेष AI सहायक।',
    'welcome.choose': 'शुरू करने के लिए अपना विषय चुनें।',
    'welcome.start': 'चैट शुरू करें',
    'welcome.footer': 'प्रत्येक एजेंट का अपना विशेष ज्ञान आधार और बातचीत इतिहास है।',

    'sidebar.new_chat': 'नई चैट',
    'sidebar.history': 'इतिहास',
    'sidebar.no_conversations': 'अभी तक कोई बातचीत नहीं',
    'sidebar.start_new': 'शुरू करने के लिए नई चैट शुरू करें',
    'sidebar.today': 'आज',
    'sidebar.yesterday': 'कल',
    'sidebar.previous_7_days': 'पिछले 7 दिन',
    'sidebar.older': 'पुराने',

    'agent.maths.title': 'गणित',
    'agent.maths.desc': 'LaTeX रेंडरिंग के साथ जटिल समीकरण हल करें, प्रमेय सिद्ध करें और गणितीय अवधारणाएं जानें।',
    'agent.ml.title': 'मशीन लर्निंग',
    'agent.ml.desc': 'मॉडल बनाएं, डेटासेट का विश्लेषण करें और कोड उदाहरणों के साथ ML एल्गोरिदम समझें।',
    'agent.automata.title': 'ऑटोमेटा थ्योरी',
    'agent.automata.desc': 'स्टेट मशीनें डिज़ाइन करें, औपचारिक भाषाओं का विश्लेषण करें और इंटरेक्टिव आरेखों के साथ ऑटोमेटा देखें।',

    'input.placeholder.maths': 'समीकरण, प्रमाण, कैलकुलस के बारे में पूछें...',
    'input.placeholder.ml': 'न्यूरल नेटवर्क, ट्रेनिंग, डेटासेट के बारे में पूछें...',
    'input.placeholder.automata': 'स्टेट मशीन, भाषाएं, ट्यूरिंग मशीन के बारे में पूछें...',

    'ui.theoretical_output': 'सैद्धांतिक आउटपुट और ट्रांज़िशन टेबल',
    'ui.algorithm_solution': 'एल्गोरिदम समाधान और आउटपुट',
    'ui.disclaimer': 'SolveX गलती कर सकता है। कृपया महत्वपूर्ण जानकारी सत्यापित करें।',
  },

  // ── Bengali ────────────────────────────────────────────────────────────────
  bn: {
    'welcome.subtitle': 'AI-চালিত শিক্ষা',
    'welcome.description': 'উন্নত একাডেমিক্সের জন্য আপনার বিশেষজ্ঞ AI সহায়ক।',
    'welcome.choose': 'শুরু করতে আপনার বিষয় বেছে নিন।',
    'welcome.start': 'চ্যাট শুরু করুন',
    'welcome.footer': 'প্রতিটি এজেন্টের নিজস্ব বিশেষ জ্ঞানভান্ডার এবং কথোপকথন ইতিহাস রয়েছে।',

    'sidebar.new_chat': 'নতুন চ্যাট',
    'sidebar.history': 'ইতিহাস',
    'sidebar.no_conversations': 'এখনও কোনো কথোপকথন নেই',
    'sidebar.start_new': 'শুরু করতে নতুন চ্যাট শুরু করুন',
    'sidebar.today': 'আজ',
    'sidebar.yesterday': 'গতকাল',
    'sidebar.previous_7_days': 'গত ৭ দিন',
    'sidebar.older': 'পুরনো',

    'agent.maths.title': 'গণিত',
    'agent.maths.desc': 'LaTeX রেন্ডারিং সহ জটিল সমীকরণ সমাধান করুন, উপপাদ্য প্রমাণ করুন এবং গাণিতিক ধারণা অন্বেষণ করুন।',
    'agent.ml.title': 'মেশিন লার্নিং',
    'agent.ml.desc': 'মডেল তৈরি করুন, ডেটাসেট বিশ্লেষণ করুন এবং কোড উদাহরণ সহ ML অ্যালগরিদম বুঝুন।',
    'agent.automata.title': 'অটোমাটা থিওরি',
    'agent.automata.desc': 'স্টেট মেশিন ডিজাইন করুন, আনুষ্ঠানিক ভাষা বিশ্লেষণ করুন এবং ইন্টারেক্টিভ ডায়াগ্রাম সহ অটোমাটা দেখুন।',

    'input.placeholder.maths': 'সমীকরণ, প্রমাণ, ক্যালকুলাস সম্পর্কে জিজ্ঞাসা করুন...',
    'input.placeholder.ml': 'নিউরাল নেটওয়ার্ক, প্রশিক্ষণ, ডেটাসেট সম্পর্কে জিজ্ঞাসা করুন...',
    'input.placeholder.automata': 'স্টেট মেশিন, ভাষা, টুরিং মেশিন সম্পর্কে জিজ্ঞাসা করুন...',

    'ui.theoretical_output': 'তাত্ত্বিক আউটপুট এবং ট্রানজিশন টেবিল',
    'ui.algorithm_solution': 'অ্যালগরিদম সমাধান এবং আউটপুট',
    'ui.disclaimer': 'SolveX ভুল করতে পারে। দয়া করে গুরুত্বপূর্ণ তথ্য যাচাই করুন।',
  },

  // ── Telugu ─────────────────────────────────────────────────────────────────
  te: {
    'welcome.subtitle': 'AI-ఆధారిత అభ్యాసం',
    'welcome.description': 'అధునాతన విద్య కోసం మీ ప్రత్యేక AI సహాయకుడు।',
    'welcome.choose': 'ప్రారంభించడానికి మీ రంగాన్ని ఎంచుకోండి।',
    'welcome.start': 'చాట్ ప్రారంభించండి',
    'welcome.footer': 'ప్రతి ఏజెంట్‌కు దాని స్వంత ప్రత్యేక జ్ఞాన బేస్ మరియు సంభాషణ చరిత్ర ఉంది।',

    'sidebar.new_chat': 'కొత్త చాట్',
    'sidebar.history': 'చరిత్ర',
    'sidebar.no_conversations': 'ఇంకా సంభాషణలు లేవు',
    'sidebar.start_new': 'ప్రారంభించడానికి కొత్త చాట్ ప్రారంభించండి',
    'sidebar.today': 'ఈరోజు',
    'sidebar.yesterday': 'నిన్న',
    'sidebar.previous_7_days': 'గత 7 రోజులు',
    'sidebar.older': 'పాతవి',

    'agent.maths.title': 'గణితం',
    'agent.maths.desc': 'LaTeX రెండరింగ్‌తో సంక్లిష్ట సమీకరణాలు పరిష్కరించండి, సిద్ధాంతాలు నిరూపించండి మరియు గణిత భావనలు అన్వేషించండి।',
    'agent.ml.title': 'మెషిన్ లెర్నింగ్',
    'agent.ml.desc': 'మోడల్స్ నిర్మించండి, డేటాసెట్‌లు విశ్లేషించండి మరియు కోడ్ ఉదాహరణలతో ML అల్గోరిథమ్‌లు అర్థం చేసుకోండి।',
    'agent.automata.title': 'ఆటోమేటా థియరీ',
    'agent.automata.desc': 'స్టేట్ మెషీన్‌లు డిజైన్ చేయండి, ఫార్మల్ భాషలు విశ్లేషించండి మరియు ఇంటరాక్టివ్ డయాగ్రామ్‌లతో ఆటోమేటాను చూడండి।',

    'input.placeholder.maths': 'సమీకరణాలు, నిరూపణలు, కాలిక్యులస్ గురించి అడగండి...',
    'input.placeholder.ml': 'న్యూరల్ నెట్‌వర్క్‌లు, శిక్షణ, డేటాసెట్‌లు గురించి అడగండి...',
    'input.placeholder.automata': 'స్టేట్ మెషీన్‌లు, భాషలు, ట్యూరింగ్ మెషీన్‌లు గురించి అడగండి...',

    'ui.theoretical_output': 'సైద్ధాంతిక అవుట్‌పుట్ మరియు ట్రాన్సిషన్ టేబుల్‌లు',
    'ui.algorithm_solution': 'అల్గోరిథమ్ పరిష్కారం మరియు అవుట్‌పుట్',
    'ui.disclaimer': 'SolveX తప్పులు చేయవచ్చు. దయచేసి ముఖ్యమైన సమాచారాన్ని ధృవీకరించండి।',
  },

  // ── Marathi ────────────────────────────────────────────────────────────────
  mr: {
    'welcome.subtitle': 'AI-संचालित शिक्षण',
    'welcome.description': 'प्रगत शिक्षणासाठी तुमचा विशेष AI सहाय्यक।',
    'welcome.choose': 'सुरू करण्यासाठी तुमचे क्षेत्र निवडा।',
    'welcome.start': 'चॅट सुरू करा',
    'welcome.footer': 'प्रत्येक एजंटचा स्वतःचा विशेष ज्ञान आधार आणि संभाषण इतिहास आहे।',

    'sidebar.new_chat': 'नवीन चॅट',
    'sidebar.history': 'इतिहास',
    'sidebar.no_conversations': 'अद्याप कोणतेही संभाषण नाही',
    'sidebar.start_new': 'सुरू करण्यासाठी नवीन चॅट सुरू करा',
    'sidebar.today': 'आज',
    'sidebar.yesterday': 'काल',
    'sidebar.previous_7_days': 'मागील ७ दिवस',
    'sidebar.older': 'जुने',

    'agent.maths.title': 'गणित',
    'agent.maths.desc': 'LaTeX रेंडरिंगसह जटिल समीकरणे सोडवा, प्रमेय सिद्ध करा आणि गणितीय संकल्पना जाणून घ्या।',
    'agent.ml.title': 'मशीन लर्निंग',
    'agent.ml.desc': 'मॉडेल तयार करा, डेटासेट विश्लेषण करा आणि कोड उदाहरणांसह ML अल्गोरिदम समजून घ्या।',
    'agent.automata.title': 'ऑटोमेटा थिअरी',
    'agent.automata.desc': 'स्टेट मशीन डिझाइन करा, औपचारिक भाषांचे विश्लेषण करा आणि इंटरेक्टिव्ह आकृत्यांसह ऑटोमेटा पाहा।',

    'input.placeholder.maths': 'समीकरणे, पुरावे, कॅल्क्युलस बद्दल विचारा...',
    'input.placeholder.ml': 'न्यूरल नेटवर्क, प्रशिक्षण, डेटासेट बद्दल विचारा...',
    'input.placeholder.automata': 'स्टेट मशीन, भाषा, ट्यूरिंग मशीन बद्दल विचारा...',

    'ui.theoretical_output': 'सैद्धांतिक आउटपुट आणि ट्रांझिशन टेबल',
    'ui.algorithm_solution': 'अल्गोरिदम समाधान आणि आउटपुट',
    'ui.disclaimer': 'SolveX चुका करू शकते. कृपया महत्त्वाची माहिती सत्यापित करा।',
  },

  // ── Tamil ──────────────────────────────────────────────────────────────────
  ta: {
    'welcome.subtitle': 'AI-இயக்கப்படும் கற்றல்',
    'welcome.description': 'மேம்பட்ட கல்விக்கான உங்கள் சிறப்பு AI உதவியாளர்.',
    'welcome.choose': 'தொடங்க உங்கள் துறையை தேர்ந்தெடுக்கவும்.',
    'welcome.start': 'அரட்டையைத் தொடங்கு',
    'welcome.footer': 'ஒவ்வொரு முகவருக்கும் அதன் சொந்த சிறப்பு அறிவுத் தளம் மற்றும் உரையாடல் வரலாறு உள்ளது.',

    'sidebar.new_chat': 'புதிய அரட்டை',
    'sidebar.history': 'வரலாறு',
    'sidebar.no_conversations': 'இன்னும் உரையாடல்கள் இல்லை',
    'sidebar.start_new': 'தொடங்க புதிய அரட்டையை தொடங்கவும்',
    'sidebar.today': 'இன்று',
    'sidebar.yesterday': 'நேற்று',
    'sidebar.previous_7_days': 'கடந்த 7 நாட்கள்',
    'sidebar.older': 'பழையவை',

    'agent.maths.title': 'கணிதம்',
    'agent.maths.desc': 'LaTeX ரெண்டரிங்குடன் சிக்கலான சமன்பாடுகளை தீர்க்கவும், தேற்றங்களை நிரூபிக்கவும்.',
    'agent.ml.title': 'இயந்திர கற்றல்',
    'agent.ml.desc': 'மாடல்களை உருவாக்கவும், தரவுத்தொகுப்புகளை பகுப்பாய்வு செய்யவும் மற்றும் ML வழிமுறைகளை புரிந்துகொள்ளவும்.',
    'agent.automata.title': 'ஆட்டோமேட்டா கோட்பாடு',
    'agent.automata.desc': 'நிலை இயந்திரங்களை வடிவமைக்கவும், முறையான மொழிகளை பகுப்பாய்வு செய்யவும்.',

    'input.placeholder.maths': 'சமன்பாடுகள், நிரூபணங்கள், கால்குலஸ் பற்றி கேளுங்கள்...',
    'input.placeholder.ml': 'நரம்பியல் வலைப்பின்னல்கள், பயிற்சி, தரவுத்தொகுப்புகள் பற்றி கேளுங்கள்...',
    'input.placeholder.automata': 'நிலை இயந்திரங்கள், மொழிகள், டூரிங் இயந்திரங்கள் பற்றி கேளுங்கள்...',

    'ui.theoretical_output': 'கோட்பாட்டு வெளியீடு மற்றும் மாற்றம் அட்டவணைகள்',
    'ui.algorithm_solution': 'வழிமுறை தீர்வு மற்றும் வெளியீடு',
    'ui.disclaimer': 'SolveX தவறுகள் செய்யலாம். முக்கியமான தகவல்களை சரிபார்க்கவும்.',
  },

  // ── Gujarati ───────────────────────────────────────────────────────────────
  gu: {
    'welcome.subtitle': 'AI-સંચાલિત શિક્ષણ',
    'welcome.description': 'અદ્યતન શૈક્ષણિક માટે તમારો વિશેષ AI સહાયક।',
    'welcome.choose': 'શરૂ કરવા માટે તમારું ક્ષેત્ર પસંદ કરો।',
    'welcome.start': 'ચેટ શરૂ કરો',
    'welcome.footer': 'દરેક એજન્ટ પાસે તેનો પોતાનો વિશેષ જ્ઞાન આધાર અને વાર્તાલાપ ઇતિહાસ છે।',

    'sidebar.new_chat': 'નવી ચેટ',
    'sidebar.history': 'ઇતિહાસ',
    'sidebar.no_conversations': 'હજી સુધી કોઈ વાર્તાલાપ નથી',
    'sidebar.start_new': 'શરૂ કરવા નવી ચેટ શરૂ કરો',
    'sidebar.today': 'આજ',
    'sidebar.yesterday': 'ગઈ કાલ',
    'sidebar.previous_7_days': 'છેલ્લા ૭ દિવસ',
    'sidebar.older': 'જૂના',

    'agent.maths.title': 'ગણિત',
    'agent.maths.desc': 'LaTeX રેન્ડરિંગ સાથે જટિલ સમીકરણો ઉકેલો, પ્રમેય સાબિત કરો અને ગાણિતિક ખ્યાલો અન્વેષણ કરો।',
    'agent.ml.title': 'મશીન લર્નિંગ',
    'agent.ml.desc': 'મોડલ બનાવો, ડેટાસેટ વિશ્લેષણ કરો અને કોડ ઉદાહરણો સાથે ML અલ્ગોરિધમ સમજો।',
    'agent.automata.title': 'ઑટોમેટા થિયરી',
    'agent.automata.desc': 'સ્ટેટ મશીન ડિઝાઇન કરો, ઔપચારિક ભાષાઓ વિશ્લેષણ કરો અને ઇન્ટરેક્ટિવ ડાયાગ્રામ સાથે ઑટોમેટા જુઓ।',

    'input.placeholder.maths': 'સમીકરણો, પ્રમાણ, કેલ્ક્યુલસ વિશે પૂછો...',
    'input.placeholder.ml': 'ન્યુરલ નેટવર્ક, ટ્રેઇનિંગ, ડેટાસેટ વિશે પૂછો...',
    'input.placeholder.automata': 'સ્ટેટ મશીન, ભાષાઓ, ટ્યુરિંગ મશીન વિશે પૂછો...',

    'ui.theoretical_output': 'સૈદ્ધાંતિક આઉટપુટ અને ટ્રાન્ઝિશન ટેબલ',
    'ui.algorithm_solution': 'અલ્ગોરિધમ સમાધાન અને આઉટપુટ',
    'ui.disclaimer': 'SolveX ભૂલ કરી શકે છે. કૃપા કરી મહત્વની માહિતી ચકાસો।',
  },

  // ── Kannada ────────────────────────────────────────────────────────────────
  kn: {
    'welcome.subtitle': 'AI-ಚಾಲಿತ ಕಲಿಕೆ',
    'welcome.description': 'ಸುಧಾರಿತ ಶೈಕ್ಷಣಿಕಕ್ಕಾಗಿ ನಿಮ್ಮ ವಿಶೇಷ AI ಸಹಾಯಕ.',
    'welcome.choose': 'ಪ್ರಾರಂಭಿಸಲು ನಿಮ್ಮ ಕ್ಷೇತ್ರವನ್ನು ಆಯ್ಕೆ ಮಾಡಿ.',
    'welcome.start': 'ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ',
    'welcome.footer': 'ಪ್ರತಿ ಏಜೆಂಟ್ ತನ್ನದೇ ವಿಶೇಷ ಜ್ಞಾನ ಆಧಾರ ಮತ್ತು ಸಂಭಾಷಣೆ ಇತಿಹಾಸ ಹೊಂದಿದೆ.',

    'sidebar.new_chat': 'ಹೊಸ ಚಾಟ್',
    'sidebar.history': 'ಇತಿಹಾಸ',
    'sidebar.no_conversations': 'ಇನ್ನೂ ಯಾವುದೇ ಸಂಭಾಷಣೆಗಳಿಲ್ಲ',
    'sidebar.start_new': 'ಪ್ರಾರಂಭಿಸಲು ಹೊಸ ಚಾಟ್ ಪ್ರಾರಂಭಿಸಿ',
    'sidebar.today': 'ಇಂದು',
    'sidebar.yesterday': 'ನಿನ್ನೆ',
    'sidebar.previous_7_days': 'ಕಳೆದ 7 ದಿನಗಳು',
    'sidebar.older': 'ಹಳೆಯದು',

    'agent.maths.title': 'ಗಣಿತ',
    'agent.maths.desc': 'LaTeX ರೆಂಡರಿಂಗ್‌ನೊಂದಿಗೆ ಸಂಕೀರ್ಣ ಸಮೀಕರಣಗಳನ್ನು ಪರಿಹರಿಸಿ, ಪ್ರಮೇಯಗಳನ್ನು ಸಾಬೀತುಪಡಿಸಿ.',
    'agent.ml.title': 'ಮೆಷಿನ್ ಲರ್ನಿಂಗ್',
    'agent.ml.desc': 'ಮಾದರಿಗಳನ್ನು ನಿರ್ಮಿಸಿ, ಡೇಟಾಸೆಟ್‌ಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ ಮತ್ತು ML ಅಲ್ಗಾರಿದಮ್‌ಗಳನ್ನು ಅರ್ಥಮಾಡಿಕೊಳ್ಳಿ.',
    'agent.automata.title': 'ಆಟೊಮೇಟಾ ಸಿದ್ಧಾಂತ',
    'agent.automata.desc': 'ಸ್ಥಿತಿ ಯಂತ್ರಗಳನ್ನು ವಿನ್ಯಾಸಗೊಳಿಸಿ, ಔಪಚಾರಿಕ ಭಾಷೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಿ.',

    'input.placeholder.maths': 'ಸಮೀಕರಣಗಳು, ಪ್ರಮಾಣಗಳು, ಕ್ಯಾಲ್ಕ್ಯುಲಸ್ ಬಗ್ಗೆ ಕೇಳಿ...',
    'input.placeholder.ml': 'ನ್ಯೂರಲ್ ನೆಟ್‌ವರ್ಕ್‌ಗಳು, ತರಬೇತಿ, ಡೇಟಾಸೆಟ್‌ಗಳ ಬಗ್ಗೆ ಕೇಳಿ...',
    'input.placeholder.automata': 'ಸ್ಥಿತಿ ಯಂತ್ರಗಳು, ಭಾಷೆಗಳು, ಟ್ಯೂರಿಂಗ್ ಯಂತ್ರಗಳ ಬಗ್ಗೆ ಕೇಳಿ...',

    'ui.theoretical_output': 'ಸೈದ್ಧಾಂತಿಕ ಔಟ್‌ಪುಟ್ ಮತ್ತು ಪರಿವರ್ತನೆ ಕೋಷ್ಟಕಗಳು',
    'ui.algorithm_solution': 'ಅಲ್ಗಾರಿದಮ್ ಪರಿಹಾರ ಮತ್ತು ಔಟ್‌ಪುಟ್',
    'ui.disclaimer': 'SolveX ತಪ್ಪುಗಳನ್ನು ಮಾಡಬಹುದು. ದಯವಿಟ್ಟು ಮಹತ್ವದ ಮಾಹಿತಿಯನ್ನು ಪರಿಶೀಲಿಸಿ.',
  },

  // ── Malayalam ──────────────────────────────────────────────────────────────
  ml: {
    'welcome.subtitle': 'AI-ഒരുക്കിയ പഠനം',
    'welcome.description': 'വിദ്യാഭ്യാസത്തിനുള്ള നിങ്ങളുടെ പ്രത്യേക AI സഹായി.',
    'welcome.choose': 'ആരംഭിക്കാൻ നിങ്ങളുടെ മേഖല തിരഞ്ഞെടുക്കുക.',
    'welcome.start': 'ചാറ്റ് ആരംഭിക്കുക',
    'welcome.footer': 'ഓരോ ഏജൻ്റിനും അതിൻ്റേതായ ജ്ഞാന അടിത്തറയും സംഭാഷണ ചരിത്രവും ഉണ്ട്.',

    'sidebar.new_chat': 'പുതിയ ചാറ്റ്',
    'sidebar.history': 'ചരിത്രം',
    'sidebar.no_conversations': 'ഇതുവരെ സംഭാഷണങ്ങൾ ഇല്ല',
    'sidebar.start_new': 'ആരംഭിക്കാൻ പുതിയ ചാറ്റ് തുടങ്ങുക',
    'sidebar.today': 'ഇന്ന്',
    'sidebar.yesterday': 'ഇന്നലെ',
    'sidebar.previous_7_days': 'കഴിഞ്ഞ 7 ദിവസം',
    'sidebar.older': 'പഴയത്',

    'agent.maths.title': 'ഗണിതം',
    'agent.maths.desc': 'LaTeX റെൻഡറിങ്ങോടെ സങ്കീർണ്ണ സമവാക്യങ്ങൾ പരിഹരിക്കുക, സിദ്ധാന്തങ്ങൾ തെളിയിക്കുക.',
    'agent.ml.title': 'മെഷീൻ ലേർണിംഗ്',
    'agent.ml.desc': 'മോഡലുകൾ നിർമ്മിക്കുക, ഡേറ്റാ സെറ്റുകൾ വിശകലനം ചെയ്യുക, ML അൽഗോരിതങ്ങൾ മനസ്സിലാക്കുക.',
    'agent.automata.title': 'ഓട്ടോമേറ്റ തിയറി',
    'agent.automata.desc': 'സ്റ്റേറ്റ് മെഷീനുകൾ ഡിസൈൻ ചെയ്യുക, ഔപചാരിക ഭാഷകൾ വിശകലനം ചെയ്യുക.',

    'input.placeholder.maths': 'സമവാക്യങ്ങൾ, തെളിവുകൾ, കാൽക്കുലസ് ചോദിക്കുക...',
    'input.placeholder.ml': 'ന്യൂറൽ നെറ്റ്‌വർക്കുകൾ, പരിശീലനം, ഡേറ്റാ സെറ്റുകൾ ചോദിക്കുക...',
    'input.placeholder.automata': 'സ്റ്റേറ്റ് മെഷീനുകൾ, ഭാഷകൾ, ട്യൂറിംഗ് മെഷീനുകൾ ചോദിക്കുക...',

    'ui.theoretical_output': 'സൈദ്ധാന്തിക ഔട്ട്‌പുട്ടും ട്രാൻസിഷൻ ടേബിളുകളും',
    'ui.algorithm_solution': 'അൽഗോരിതം പരിഹാരവും ഔട്ട്‌പുട്ടും',
    'ui.disclaimer': 'SolveX തെറ്റ് ചെയ്യാം. പ്രധാന വിവരങ്ങൾ സ്ഥിരീകരിക്കുക.',
  },

  // ── Punjabi ────────────────────────────────────────────────────────────────
  pa: {
    'welcome.subtitle': 'AI-ਸੰਚਾਲਿਤ ਸਿੱਖਿਆ',
    'welcome.description': 'ਉੱਨਤ ਵਿੱਦਿਆ ਲਈ ਤੁਹਾਡਾ ਵਿਸ਼ੇਸ਼ AI ਸਹਾਇਕ।',
    'welcome.choose': 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਆਪਣਾ ਖੇਤਰ ਚੁਣੋ।',
    'welcome.start': 'ਚੈਟ ਸ਼ੁਰੂ ਕਰੋ',
    'welcome.footer': 'ਹਰ ਏਜੰਟ ਦਾ ਆਪਣਾ ਵਿਸ਼ੇਸ਼ ਗਿਆਨ ਅਧਾਰ ਅਤੇ ਗੱਲਬਾਤ ਇਤਿਹਾਸ ਹੈ।',

    'sidebar.new_chat': 'ਨਵੀਂ ਚੈਟ',
    'sidebar.history': 'ਇਤਿਹਾਸ',
    'sidebar.no_conversations': 'ਅਜੇ ਕੋਈ ਗੱਲਬਾਤ ਨਹੀਂ',
    'sidebar.start_new': 'ਸ਼ੁਰੂ ਕਰਨ ਲਈ ਨਵੀਂ ਚੈਟ ਸ਼ੁਰੂ ਕਰੋ',
    'sidebar.today': 'ਅੱਜ',
    'sidebar.yesterday': 'ਕੱਲ੍ਹ',
    'sidebar.previous_7_days': 'ਪਿਛਲੇ 7 ਦਿਨ',
    'sidebar.older': 'ਪੁਰਾਣੇ',

    'agent.maths.title': 'ਗਣਿਤ',
    'agent.maths.desc': 'LaTeX ਰੈਂਡਰਿੰਗ ਨਾਲ ਗੁੰਝਲਦਾਰ ਸਮੀਕਰਨ ਹੱਲ ਕਰੋ, ਸਿਧਾਂਤ ਸਾਬਿਤ ਕਰੋ।',
    'agent.ml.title': 'ਮਸ਼ੀਨ ਲਰਨਿੰਗ',
    'agent.ml.desc': 'ਮਾਡਲ ਬਣਾਓ, ਡੇਟਾਸੈੱਟ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ ਅਤੇ ML ਐਲਗੋਰਿਦਮ ਸਮਝੋ।',
    'agent.automata.title': 'ਆਟੋਮੇਟਾ ਸਿਧਾਂਤ',
    'agent.automata.desc': 'ਸਟੇਟ ਮਸ਼ੀਨਾਂ ਡਿਜ਼ਾਈਨ ਕਰੋ, ਰਸਮੀ ਭਾਸ਼ਾਵਾਂ ਦਾ ਵਿਸ਼ਲੇਸ਼ਣ ਕਰੋ।',

    'input.placeholder.maths': 'ਸਮੀਕਰਨਾਂ, ਪ੍ਰਮਾਣਾਂ, ਕੈਲਕੁਲਸ ਬਾਰੇ ਪੁੱਛੋ...',
    'input.placeholder.ml': 'ਨਿਊਰਲ ਨੈੱਟਵਰਕ, ਸਿਖਲਾਈ, ਡੇਟਾਸੈੱਟ ਬਾਰੇ ਪੁੱਛੋ...',
    'input.placeholder.automata': 'ਸਟੇਟ ਮਸ਼ੀਨਾਂ, ਭਾਸ਼ਾਵਾਂ, ਟਿਊਰਿੰਗ ਮਸ਼ੀਨਾਂ ਬਾਰੇ ਪੁੱਛੋ...',

    'ui.theoretical_output': 'ਸਿਧਾਂਤਕ ਆਉਟਪੁੱਟ ਅਤੇ ਟ੍ਰਾਂਜ਼ੀਸ਼ਨ ਟੇਬਲ',
    'ui.algorithm_solution': 'ਐਲਗੋਰਿਦਮ ਹੱਲ ਅਤੇ ਆਉਟਪੁੱਟ',
    'ui.disclaimer': 'SolveX ਗਲਤੀਆਂ ਕਰ ਸਕਦਾ ਹੈ। ਕਿਰਪਾ ਕਰਕੇ ਮਹੱਤਵਪੂਰਨ ਜਾਣਕਾਰੀ ਦੀ ਪੁਸ਼ਟੀ ਕਰੋ।',
  },

  // ── Urdu ───────────────────────────────────────────────────────────────────
  ur: {
    'welcome.subtitle': 'AI سے چلنے والی تعلیم',
    'welcome.description': 'اعلیٰ تعلیم کے لیے آپ کا خصوصی AI معاون۔',
    'welcome.choose': 'شروع کرنے کے لیے اپنا شعبہ منتخب کریں۔',
    'welcome.start': 'چیٹ شروع کریں',
    'welcome.footer': 'ہر ایجنٹ کا اپنا خصوصی علمی ذخیرہ اور گفتگو کی تاریخ ہے۔',

    'sidebar.new_chat': 'نئی چیٹ',
    'sidebar.history': 'تاریخ',
    'sidebar.no_conversations': 'ابھی تک کوئی گفتگو نہیں',
    'sidebar.start_new': 'شروع کرنے کے لیے نئی چیٹ شروع کریں',
    'sidebar.today': 'آج',
    'sidebar.yesterday': 'کل',
    'sidebar.previous_7_days': 'پچھلے 7 دن',
    'sidebar.older': 'پرانے',

    'agent.maths.title': 'ریاضی',
    'agent.maths.desc': 'LaTeX رینڈرنگ کے ساتھ پیچیدہ مساوات حل کریں، نظریات ثابت کریں۔',
    'agent.ml.title': 'مشین لرننگ',
    'agent.ml.desc': 'ماڈل بنائیں، ڈیٹا سیٹ تجزیہ کریں اور ML الگورتھم سمجھیں۔',
    'agent.automata.title': 'آٹومیٹا نظریہ',
    'agent.automata.desc': 'سٹیٹ مشینیں ڈیزائن کریں، رسمی زبانوں کا تجزیہ کریں۔',

    'input.placeholder.maths': 'مساوات، ثبوت، حساب کے بارے میں پوچھیں...',
    'input.placeholder.ml': 'نیورل نیٹ ورک، تربیت، ڈیٹا سیٹ کے بارے میں پوچھیں...',
    'input.placeholder.automata': 'سٹیٹ مشینیں، زبانیں، ٹیورنگ مشینوں کے بارے میں پوچھیں...',

    'ui.theoretical_output': 'نظری آؤٹ پٹ اور منتقلی جداول',
    'ui.algorithm_solution': 'الگورتھم حل اور آؤٹ پٹ',
    'ui.disclaimer': 'SolveX غلطیاں کر سکتا ہے۔ براہ کرم اہم معلومات کی تصدیق کریں۔',
  },

  // ── Spanish ────────────────────────────────────────────────────────────────
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
    'ui.disclaimer': 'SolveX puede cometer errores. Por favor verifica la información importante.',
  },

  // ── French ─────────────────────────────────────────────────────────────────
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
    'sidebar.today': "Aujourd'hui",
    'sidebar.yesterday': 'Hier',
    'sidebar.previous_7_days': '7 derniers jours',
    'sidebar.older': 'Ancien',

    'agent.maths.title': 'Mathématiques',
    'agent.maths.desc': 'Résolvez des équations complexes et explorez des concepts avec le rendu LaTeX.',
    'agent.ml.title': 'Apprentissage Automatique',
    'agent.ml.desc': "Construisez des modèles, analysez des données et comprenez les algorithmes ML.",
    'agent.automata.title': 'Théorie des Automates',
    'agent.automata.desc': "Concevez des machines à états, analysez des langages et visualisez des automates.",

    'input.placeholder.maths': 'Posez des questions sur les équations, le calcul...',
    'input.placeholder.ml': "Questions sur les réseaux neuronaux, l'entraînement...",
    'input.placeholder.automata': 'Questions sur les machines à états, les langages...',

    'ui.theoretical_output': 'Sortie Théorique & Tables de Transition',
    'ui.algorithm_solution': "Solution de l'Algorithme & Sortie",
    'ui.disclaimer': 'SolveX peut faire des erreurs. Veuillez vérifier les informations.',
  },

  // ── German ─────────────────────────────────────────────────────────────────
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
    'ui.disclaimer': 'SolveX kann Fehler machen. Überprüfen Sie wichtige Informationen.',
  },

  // ── Chinese ────────────────────────────────────────────────────────────────
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
    'ui.disclaimer': 'SolveX 可能会犯错。 请验证重要信息。',
  },

  // ── Japanese ───────────────────────────────────────────────────────────────
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
    'ui.disclaimer': 'SolveXは間違うことがあります。重要な情報は確認してください。',
  },
}

export function useTranslation() {
  const language = useChatStore((state) => state.language)

  const t = (key: string): string => {
    return translations[language]?.[key] || translations['en']?.[key] || key
  }

  return { t, language }
}
