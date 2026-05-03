/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Mic, 
  MicOff, 
  Phone, 
  Shield, 
  ChevronRight, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  Volume2, 
  VolumeX,
  RefreshCcw,
  Flame,
  Heart,
  Baby,
  Stethoscope,
  MapPin,
  Map,
  Navigation,
  Activity,
  MessageCircle,
  X,
  Send,
  User,
  ClipboardList,
  Save,
  MoreVertical,
  FileText,
  Plus,
  Globe,
  Image as ImageIcon,
  Trash2,
  LogOut,
  Star
} from 'lucide-react';
import { analyzeEmergency, getChatResponse } from '../services/geminiService';
import { FirstAidResponse, UrgencyLevel, EmergencyType, ChatMessage, Hospital } from '../types';

interface PatientInfo {
  name: string;
  age: string;
  bloodType: string;
  allergies: string;
  medications: string;
  medicalHistory: string;
  emergencyContact: string;
}

export default function EmergencyDashboard() {
  const [input, setInput] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<FirstAidResponse | null>(null);
  const [activeStep, setActiveStep] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);
  
  // Patient info state
  const [patientInfo, setPatientInfo] = useState<PatientInfo>({
    name: '',
    age: '',
    bloodType: '',
    allergies: '',
    medications: '',
    medicalHistory: '',
    emergencyContact: ''
  });
  const [isMedicalIdOpen, setIsMedicalIdOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showQuickSummary, setShowQuickSummary] = useState(false);
  const [language, setLanguage] = useState<'en-US' | 'hi-IN' | 'es-ES' | 'ta-IN' | 'kn-IN' | 'te-IN'>('en-US');
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [attachedImage, setAttachedImage] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [rating, setRating] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const languages = [
    { code: 'en-US', label: 'English', native: 'English' },
    { code: 'hi-IN', label: 'Hindi', native: 'हिन्दी' },
    { code: 'ta-IN', label: 'Tamil', native: 'தமிழ்' },
    { code: 'kn-IN', label: 'Kannada', native: 'ಕನ್ನಡ' },
    { code: 'te-IN', label: 'Telugu', native: 'తెలుగు' },
    { code: 'es-ES', label: 'Spanish', native: 'Español' }
  ] as const;

  const uiTranslations = {
    'en-US': {
      voiceTip: "TAP HEART OR DESCRIBE EVENT",
      emergencyCall: "EMERGENCY CALL",
      medicalId: "Medical ID",
      liveGps: "Live GPS",
      summary: "Summary",
      next: "Next",
      back: "Back",
      endEvent: "End Event",
      searching: "SEARCHING FOR HOSPITALS...",
      hospitalsNearby: "Hospitals Nearby",
      chatTitle: "AI RESCUE CHAT",
      chatPlaceholder: "Ask anything about this emergency...",
      stepsTitle: "Step-by-Step Instructions",
      medHistory: "Medical History",
      profile: "Patient Profile",
      vitalsHistory: "Vitals & History",
      updateLocation: "Update Location",
      shareGuardian: "Share Guardian",
      quickSummary: "Quick Summary",
      vitalSummary: "Vital Summary",
      editInfo: "Edit Information",
      exit: "Exit",
      thankYou: "Thank You",
      rateExperience: "How was your experience?",
      backToHome: "Back to Home",
      presets: "Emergency Presets",
      cpr: "Unconscious/CPR",
      accident: "Accident",
      bleeding: "Heavy Bleeding",
      asthma: "Asthma",
      allergy: "Allergy/Swelling"
    },
    'hi-IN': {
      voiceTip: "दिल दबाएं या घटना बताएं",
      emergencyCall: "आपातकालीन कॉल",
      medicalId: "मेडिकल आईडी",
      liveGps: "लाइव जीपीएस",
      summary: "सारांश",
      next: "अगला",
      back: "पीछे",
      endEvent: "इवेंट समाप्त",
      searching: "अस्पतालों की खोज...",
      hospitalsNearby: "पास के अस्पताल",
      chatTitle: "एआई रेस्क्यू चैट",
      chatPlaceholder: "इस आपातकाल के बारे में कुछ भी पूछें...",
      stepsTitle: "चरण-दर-चरण निर्देश",
      medHistory: "चिकित्सा इतिहास",
      profile: "रोगी प्रोफ़ाइल",
      vitalsHistory: "वाइटल्स और इतिहास",
      updateLocation: "स्थान अपडेट करें",
      shareGuardian: "गार्जियन साझा करें",
      quickSummary: "त्वरित सारांश",
      vitalSummary: "महत्वपूर्ण सारांश",
      editInfo: "जानकारी संपादित करें",
      exit: "निकास",
      thankYou: "धन्यवाद",
      rateExperience: "आपका अनुभव कैसा रहा?",
      backToHome: "मुख्य पृष्ठ पर लौटें",
      presets: "आपातकालीन प्रीसेट",
      cpr: "बेहोش/सीपीआर",
      accident: "दुर्घटना",
      bleeding: "भारी रक्तस్రాव",
      asthma: "अस्थमा",
      allergy: "एलर्जी/सूजन"
    },
    'ta-IN': {
      voiceTip: "இதயத்தை அழுத்தவும் அல்லது விவரிக்கவும்",
      emergencyCall: "அவசர அழைப்பு",
      medicalId: "மருத்துவ ஐடி",
      liveGps: "ஜிபிஎஸ்",
      summary: "சுருக்கம்",
      next: "அடுத்து",
      back: "பின்னால்",
      endEvent: "முடி",
      searching: "தேடுகிறது...",
      hospitalsNearby: "அருகிலுள்ளவை",
      chatTitle: "மீட்பு அரட்டை",
      chatPlaceholder: "கேளுங்கள்...",
      stepsTitle: "வழிமுறைகள்",
      medHistory: "மருத்துவ வரலாறு",
      profile: "நோயாளி விவரம்",
      vitalsHistory: "வரலாறு",
      updateLocation: "இடத்தைப் புதுப்பி",
      shareGuardian: "பகிர்",
      quickSummary: "சுருக்கம்",
      vitalSummary: "முக்கிய சுருக்கம்",
      editInfo: "தொகு",
      exit: "வெளியேறு",
      thankYou: "நன்றி",
      rateExperience: "உங்கள் அனுபவம் எப்படி இருந்தது?",
      backToHome: "முகப்புக்குச் செல்",
      presets: "அவசர முன்னமைவுகள்",
      cpr: "உணர்வுற்ற/சிபிஆர்",
      accident: "விபத்து",
      bleeding: "அதிக இரத்தப்போக்கு",
      asthma: "ஆஸ்துமா",
      allergy: "ஒவ்வாமை/வீக்கம்"
    },
    'kn-IN': {
      voiceTip: "ಹೃದಯ ಸ್ಪರ್ಶಿಸಿ ಅಥವಾ ವಿವರಿಸಿ",
      emergencyCall: "ತುರ್ತು ಕರೆ",
      medicalId: "ವೈದ್ಯಕೀಯ ಐಡಿ",
      liveGps: "ಜಿಪಿಎಸ್",
      summary: "ಸಾರಾಂಶ",
      next: "ಮುಂದೆ",
      back: "ಹಿಂದೆ",
      endEvent: "ಅಂತ್ಯ",
      searching: "ಹುಡುಕಲಾಗುತ್ತಿದೆ...",
      hospitalsNearby: "ಹತ್ತಿರದ ಆಸ್ಪತ್ರೆಗಳು",
      chatTitle: "ಪಾರುಗಾಣಿಕಾ ಚಾಟ್",
      chatPlaceholder: "ಕೇಳಿ...",
      stepsTitle: "ಸೂಚನೆಗಳು",
      medHistory: "ವೈದ್ಯಕೀಯ ಇತಿಹಾಸ",
      profile: "ರೋಗಿಯ ವಿವರ",
      vitalsHistory: "ಇತಿಹಾಸ",
      updateLocation: "ಸ್ಥಳವನ್ನು ನವೀಕರಿಸಿ",
      shareGuardian: "ಹಂಚಿಕೊಳ್ಳಿ",
      quickSummary: "ಸಾರಾಂಶ",
      vitalSummary: "ಪ್ರಮುಖ ಸಾರಾಂಶ",
      editInfo: "ತಿದ್ದಿ",
      exit: "ನಿರ್ಗಮನ",
      thankYou: "ಧನ್ಯವಾದಗಳು",
      rateExperience: "ನಿಮ್ಮ ಅನುಭವ ಹೇಗಿತ್ತು?",
      backToHome: "ಮುಖಪುಟಕ್ಕೆ ಹಿಂತಿರುಗಿ",
      presets: "ತುರ್ತು ಪೂರ್ವನಿಗದಿಗಳು",
      cpr: "ಪ್ರಜ್ಞಾಹೀನ/ಸಿಪಿಆರ್",
      accident: "ಅಪಘಾತ",
      bleeding: "ಅತಿಯಾದ ರಕ್ತಸ್ರಾವ",
      asthma: "ಅಸ್ತಮಾ",
      allergy: "ಅಲರ್ಜಿ/ಊತ"
    },
    'te-IN': {
      voiceTip: "గుండెను తాకండి లేదా వివరించండి",
      emergencyCall: "అత్యవసర కాల్",
      medicalId: "మెడికల్ ఐడి",
      liveGps: "జీపీఎస్",
      summary: "సారాంశం",
      next: "తరువాత",
      back: "వెనుకకు",
      endEvent: "ముగింపు",
      searching: "వెతుకుతోంది...",
      hospitalsNearby: "దగ్గరివి",
      chatTitle: "రెస్క్యూ చాట్",
      chatPlaceholder: "అడగండి...",
      stepsTitle: "సూచనలు",
      medHistory: "వైద్య చరిత్ర",
      profile: "రోగి ప్రొఫైల్",
      vitalsHistory: "చరిత్ర",
      updateLocation: "స్థానాన్ని నవీకరించు",
      shareGuardian: "షేర్ చేయండి",
      quickSummary: "సారాంశం",
      vitalSummary: "కీలక సారాంశం",
      editInfo: "సవరించు",
      exit: "నిష్క్రమణ",
      thankYou: "ధన్యవాదాలు",
      rateExperience: "మీ అనుభవం ఎలా ఉంది?",
      backToHome: "హోమ్‌కి తిరిగి వెళ్లు",
      presets: "అత్యవసర ప్రీసెట్లు",
      cpr: "స్పృహతప్పడం/సిపిఆర్",
      accident: "ప్రమాదం",
      bleeding: "అధిక రక్తస్రావం",
      asthma: "ఆస్తమా",
      allergy: "అలర్జీ/వాపు"
    },
    'es-ES': {
      voiceTip: "TOCA O DESCRIBE EL EVENTO",
      emergencyCall: "EMERGENCIA",
      medicalId: "ID Médico",
      liveGps: "GPS",
      summary: "Resumen",
      next: "Siguiente",
      back: "Atrás",
      endEvent: "Finalizar",
      searching: "BUSCANDO...",
      hospitalsNearby: "Hospitales cercanos",
      chatTitle: "CHAT DE RESCATE",
      chatPlaceholder: "Pregunta...",
      stepsTitle: "Instrucciones",
      medHistory: "Historia Médica",
      profile: "Perfil del Paciente",
      vitalsHistory: "Signos y Historia",
      updateLocation: "Actualizar GPS",
      shareGuardian: "Compartir",
      quickSummary: "Resumen Rápido",
      vitalSummary: "Resumen Vital",
      editInfo: "Editar Información",
      exit: "Salir",
      thankYou: "Gracias",
      rateExperience: "¿Cómo fue tu experiencia?",
      backToHome: "Volver al Inicio",
      presets: "Emergency Presets",
      cpr: "Unconscious/CPR",
      accident: "Accidente",
      bleeding: "Heavy Bleeding",
      asthma: "Asma",
      allergy: "Allergy/Swelling"
    }
  } as const;

  const t = uiTranslations[language];

  const quickActions = [
    { label: t.cpr, type: EmergencyType.CARDIAC_ARREST, icon: Heart, prompt: 'Person is unconscious and not breathing, need CPR' },
    { label: t.accident, type: EmergencyType.ACCIDENT, icon: AlertTriangle, prompt: 'There has been an accident' },
    { label: t.bleeding, type: EmergencyType.BLEEDING, icon: Activity, prompt: 'Severe bleeding from a wound' },
    { label: t.asthma, type: EmergencyType.ASTHMA, icon: RefreshCcw, prompt: 'Person is having an asthma attack and difficulty breathing' },
    { label: t.allergy, type: EmergencyType.ALLERGIC_REACTION, icon: Stethoscope, prompt: 'Severe allergic reaction with swelling and difficulty breathing' },
  ];
  useEffect(() => {
    const saved = localStorage.getItem('guardian_medical_id');
    if (saved) {
      try {
        setPatientInfo(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse medical id", e);
      }
    }
  }, []);

  const savePatientInfo = () => {
    localStorage.setItem('guardian_medical_id', JSON.stringify(patientInfo));
    setIsMedicalIdOpen(false);
  };
  
  // Location & Hospitals State
  const [location, setLocation] = useState<{lat: number, lng: number} | null>(null);
  const [hospitals, setHospitals] = useState<Hospital[]>([]);
  const [isLocating, setIsLocating] = useState(false);

  const recognitionRef = useRef<any>(null);
  const timerIntervalRef = useRef<any>(null);

  // Get Location on Mount or when Emergency happens
  useEffect(() => {
    requestLocation();
  }, []);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      setIsLocating(true);
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setIsLocating(false);
          // Simulate finding hospitals
          findHospitals();
        },
        (error) => {
          console.error("Location error:", error);
          setIsLocating(false);
        }
      );
    }
  };

  const findHospitals = () => {
    // In a real app, we'd use Places API. Simulating for now.
    setHospitals([
      { name: "Centra Care Emergency", distance: "0.8 miles", address: "123 Medical Dr", rating: 4.8 },
      { name: "Global Health Hospital", distance: "1.5 miles", address: "456 Recovery St", rating: 4.5 },
      { name: "St. Jude Rescue Center", distance: "2.3 miles", address: "789 Help Blvd", rating: 4.7 },
    ]);
  };

  // Timer logic
  useEffect(() => {
    if (isTimerRunning) {
      timerIntervalRef.current = setInterval(() => {
        setTimerSeconds(prev => prev + 1);
      }, 1000);
    } else {
      clearInterval(timerIntervalRef.current);
    }
    return () => clearInterval(timerIntervalRef.current);
  }, [isTimerRunning]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Chat State
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isChatOpen]);

  // Initialize Speech Recognition
  useEffect(() => {
    if ('webkitSpeechRecognition' in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = language;

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInput(transcript);
        handleAnalyze(transcript);
      };

      recognition.onend = () => {
        setIsRecording(false);
      };

      recognitionRef.current = recognition;
    }
  }, [language]);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setAttachedImage(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleAnalyze = async (textOverride?: string) => {
    const textToUse = textOverride || input;
    if (!textToUse.trim()) return;

    setLoading(true);
    setResult(null);
    setActiveStep(0);

    try {
      const response = await analyzeEmergency(textToUse, language);
      setResult(response);
      setIsTimerRunning(true);
      if (!isMuted) {
        speak(response.voiceInstruction);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const speak = (text: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = language;
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNextStep = () => {
    if (result && activeStep < result.steps.length) {
      const next = activeStep + 1;
      setActiveStep(next);
      if (!isMuted && next < result.steps.length) {
        speak(result.steps[next]);
      } else if (!isMuted && next === result.steps.length) {
        speak("Displaying medical ID information for first responders.");
      }
    }
  };

  const handleSendMessage = async () => {
    if (!chatInput.trim() || isChatLoading) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: chatInput,
      timestamp: Date.now()
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput('');
    setIsChatLoading(true);

    try {
      const history = chatMessages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user' as any,
        parts: [{ text: m.content }]
      }));

      const response = await getChatResponse(userMsg.content, history, language);
      
      const botMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response,
        timestamp: Date.now()
      };

      setChatMessages(prev => [...prev, botMsg]);
      if (!isMuted) {
        speak(response);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsChatLoading(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setIsTimerRunning(false);
    setTimerSeconds(0);
    setShowFeedback(true);
    setRating(0);
  };

  const PulseCircle = () => (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden z-0">
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.5, 2.5], 
          opacity: [0.3, 0.1, 0] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity,
          ease: "linear"
        }}
        className="w-[400px] h-[400px] border border-red-500/20 rounded-full"
      />
      <motion.div 
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ 
          scale: [0.8, 1.5, 2.5], 
          opacity: [0.3, 0.1, 0] 
        }}
        transition={{ 
          duration: 4, 
          repeat: Infinity, 
          delay: 2,
          ease: "linear"
        }}
        className="w-[400px] h-[400px] border border-red-500/10 rounded-full"
      />
    </div>
  );

  return (
    <div className="min-h-screen bg-slate-950 text-slate-50 font-sans p-4 md:p-8 flex flex-col items-center relative overflow-hidden">
      {/* Vital Pulse Animation */}
      {result && result.urgency === UrgencyLevel.HIGH && <PulseCircle />}
      {/* Header */}
      <header className="w-full max-w-4xl flex justify-between items-center mb-6 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="bg-red-600 p-2 rounded-xl shadow-lg shadow-red-900/20">
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg md:text-xl font-black tracking-tight leading-none text-slate-50">Guardian<span className="text-red-600">AI</span></h1>
            <p className="text-[10px] uppercase font-bold tracking-widest text-slate-500">Emergency Hub</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 relative">
          {/* Language Selector */}
          <div className="relative">
            <button 
              onClick={() => setIsLanguageMenuOpen(!isLanguageMenuOpen)}
              className={`p-2.5 rounded-xl border transition-all shadow-lg flex items-center gap-2 ${isLanguageMenuOpen ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              title="Change Language"
            >
              <Globe className="w-5 h-5" />
              <span className="text-[10px] font-black uppercase tracking-widest hidden lg:block">
                {languages.find(l => l.code === language)?.label}
              </span>
            </button>

            <AnimatePresence>
              {isLanguageMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsLanguageMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                  >
                    {languages.map((lang) => (
                      <button
                        key={lang.code}
                        onClick={() => {
                          setLanguage(lang.code);
                          setIsLanguageMenuOpen(false);
                        }}
                        className={`w-full flex items-center justify-between p-3 text-left rounded-xl transition-colors ${language === lang.code ? 'bg-red-600/10 text-red-500' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                      >
                        <div className="flex flex-col">
                          <span className="text-xs font-black uppercase tracking-widest">{lang.label}</span>
                          <span className="text-[9px] font-bold opacity-60 uppercase">{lang.native}</span>
                        </div>
                        {language === lang.code && <CheckCircle2 className="w-3 h-3" />}
                      </button>
                    ))}
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>

          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`p-2.5 rounded-xl border transition-all shadow-lg ${isMenuOpen ? 'bg-slate-800 border-slate-700 text-white' : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'}`}
              title="Options"
            >
              <MoreVertical className="w-5 h-5" />
            </button>

            <AnimatePresence>
              {isMenuOpen && (
                <>
                  <div 
                    className="fixed inset-0 z-40" 
                    onClick={() => setIsMenuOpen(false)} 
                  />
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    className="absolute right-0 mt-3 w-56 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-2 z-50 backdrop-blur-xl"
                  >
                    <button 
                      onClick={() => {
                        setIsMedicalIdOpen(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-colors group"
                    >
                      <div className="bg-red-600/10 p-2 rounded-lg group-hover:bg-red-600/20 transition-colors">
                        <User className="w-4 h-4 text-red-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-widest">Medical ID</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Patient Profile</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        setShowQuickSummary(true);
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-colors group"
                    >
                      <div className="bg-blue-600/10 p-2 rounded-lg group-hover:bg-blue-600/20 transition-colors">
                        <FileText className="w-4 h-4 text-blue-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-widest">Summary</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Vitals & History</span>
                      </div>
                    </button>

                    <button 
                      onClick={() => {
                        requestLocation();
                        setIsMenuOpen(false);
                      }}
                      className="w-full flex items-center gap-3 p-3 text-left hover:bg-slate-800 rounded-xl transition-colors group"
                    >
                      <div className="bg-emerald-600/10 p-2 rounded-lg group-hover:bg-emerald-600/20 transition-colors">
                        <MapPin className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-slate-100 uppercase tracking-widest">Live GPS</span>
                        <span className="text-[9px] text-slate-500 font-bold uppercase">Update Location</span>
                      </div>
                    </button>

                    <div className="border-t border-slate-800 my-1" />
                  </motion.div>
                </>
              )}
            </AnimatePresence>
          </div>
          
          <a 
            href="tel:100"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-900/30"
          >
            <Shield className="w-4 h-4" />
            <span className="hidden sm:inline">POLICE</span>
            <span className="sm:hidden text-white">100</span>
          </a>
          
          <a 
            href="tel:108"
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2.5 rounded-xl font-black text-xs md:text-sm flex items-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/30"
          >
            <Phone className="w-4 h-4" />
            <span className="hidden sm:inline">CALL 108</span>
            <span className="sm:hidden text-white">108</span>
          </a>
        </div>
      </header>

      {/* Disclaimer */}
      <div className="w-full max-w-4xl mb-8 bg-slate-900/50 border border-slate-800 p-3 rounded-lg text-xs text-slate-400 text-center">
        <p>⚠️ EMERGENCY USE ONLY. This tool is NOT a replacement for professional medical services. Always call emergency responders first.</p>
      </div>

      <main className="w-full max-w-4xl flex-grow space-y-8">
        {!result ? (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-12"
          >
            {/* Main Input Area */}
            <div className="text-center space-y-6">
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100">{language === 'hi-IN' ? 'आपातकाल क्या है?' : language === 'ta-IN' ? 'அவசரநிலை என்ன?' : language === 'kn-IN' ? 'ತುರ್ತು ಪರಿಸ್ಥಿತಿ ಏನು?' : language === 'te-IN' ? 'అత్యవసర పరిస్థితి ఏమిటి?' : language === 'es-ES' ? '¿Cuál es la emergencia?' : 'What is the emergency?'}</h2>
              <p className="text-slate-400 max-w-lg mx-auto">{language === 'hi-IN' ? 'स्पष्ट रूप से बोलें या टाइप करें। सहायता आने पर हम प्रक्रिया में आपका मार्गदर्शन करेंगे।' : language === 'ta-IN' ? 'தெளிவாக பேசவும் அல்லது தட்டச்சு செய்யவும். உதவி வரும்போது நாங்கள் உங்களுக்கு வழிகாட்டுவோம்.' : language === 'kn-IN' ? 'ಸ್ಪಷ್ಟವಾಗಿ ಮಾತನಾಡಿ ಅಥವಾ ಟೈಪ್ ಮಾಡಿ. ಸಹಾಯ ಬಂದಾಗ ನಾವು ನಿಮಗೆ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತೇವೆ.' : language === 'te-IN' ? 'స్పష్టంగా మాట్లాడండి లేదా టైప్ చేయండి. సాయం అందే వరకు మేము మీకు మార్గనిర్దేశం చేస్తాము.' : language === 'es-ES' ? 'Habla o escribe claramente. Te guiaremos a medida que llega la ayuda.' : 'Speak or type clearly. We will guide you through the process as help arrives.'}</p>
              
              <div className="relative group max-w-2xl mx-auto">
                {attachedImage && (
                  <div className="absolute -top-20 left-0 flex items-center gap-2 bg-slate-900/90 border border-slate-700 p-2 rounded-2xl animate-in fade-in slide-in-from-bottom-4">
                    <img src={attachedImage} alt="Preview" className="w-12 h-12 rounded-lg object-cover" />
                    <button 
                      onClick={clearImage}
                      className="p-1 px-2 text-[10px] font-black uppercase text-red-500 hover:text-red-400"
                    >
                      Remove
                    </button>
                  </div>
                )}
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder={language === 'hi-IN' ? 'स्थिति का वर्णन करें...' : language === 'ta-IN' ? 'சூழ்நிலையை விவரிக்கவும்...' : language === 'kn-IN' ? 'ಪರಿಸ್ಥಿತಿಯನ್ನು ವಿವರಿಸಿ...' : language === 'te-IN' ? 'పరిస్థితిని వివరించండి...' : language === 'es-ES' ? 'Describe la situación...' : 'Describe the situation...'}
                  className="w-full bg-slate-900 border-2 border-slate-800 focus:border-red-500 rounded-2xl px-6 py-6 text-xl outline-none transition-all pr-44 text-slate-100 placeholder:text-slate-400"
                />
                <input 
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/*"
                  className="hidden"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-400 transition-colors"
                    title="Upload Photo"
                  >
                    <Plus className="w-6 h-6" />
                  </button>
                  <button 
                    onClick={toggleRecording}
                    className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => handleAnalyze()}
                    disabled={loading || (!input.trim() && !attachedImage)}
                    className="bg-slate-50 text-slate-950 p-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-black ml-1">{t.presets}</p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {quickActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => {
                      setInput(action.prompt);
                      handleAnalyze(action.prompt);
                    }}
                    className="flex flex-col items-center justify-center gap-3 p-6 bg-slate-900 border border-slate-800 rounded-3xl hover:border-red-500/50 hover:bg-slate-800/50 transition-all group active:scale-95 shadow-sm"
                  >
                    <action.icon className="w-8 h-8 text-slate-400 group-hover:text-red-500 transition-colors" />
                    <span className="text-xs font-black uppercase tracking-tight text-slate-300">{action.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            {/* Urgency Alert */}
            <div className={`p-4 rounded-2xl flex items-center justify-between shadow-2xl transition-colors duration-500 ${
              result.urgency === UrgencyLevel.HIGH ? 'bg-red-950/40 border border-red-500/50 text-red-100' :
              result.urgency === UrgencyLevel.MEDIUM ? 'bg-yellow-950/40 border border-yellow-500/50 text-yellow-100' :
              'bg-emerald-950/40 border border-emerald-500/50 text-emerald-100'
            }`}>
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl shadow-lg ${
                  result.urgency === UrgencyLevel.HIGH ? 'bg-red-500' :
                  result.urgency === UrgencyLevel.MEDIUM ? 'bg-yellow-500' :
                  'bg-emerald-500'
                }`}>
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="text-[10px] uppercase tracking-[0.3em] font-black opacity-60 leading-none mb-1">{result.urgency} URGENCY</h3>
                  <p className="text-xl font-black tracking-tight">{result.situation}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <div className="bg-slate-800 px-4 py-2 rounded-xl flex items-center gap-2 border border-slate-700 shadow-inner">
                   <Activity className="w-4 h-4 text-red-500 animate-pulse" />
                   <span className="font-mono font-black text-lg text-slate-100">{formatTime(timerSeconds)}</span>
                </div>
                <button 
                  onClick={() => setIsMuted(!isMuted)}
                  className="p-3 bg-slate-800/50 rounded-xl hover:bg-slate-800 border border-slate-700 transition-colors shadow-sm"
                >
                  {isMuted ? <VolumeX className="w-6 h-6 text-slate-500" /> : <Volume2 className="w-6 h-6 text-slate-500" />}
                </button>
              </div>
            </div>

            {/* Steps Engine */}
            <div className="grid md:grid-cols-3 gap-6">
              <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden flex flex-col shadow-xl">
                <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-900/50">
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">
                    {activeStep === result.steps.length ? t.profile : t.stepsTitle}
                  </h4>
                  <span className="text-slate-500 font-mono text-xs font-bold tracking-tighter">
                    {activeStep === result.steps.length ? 'FINAL' : `${activeStep + 1} OF ${result.steps.length}`}
                  </span>
                </div>
                
                <div className="flex-grow p-8 flex flex-col justify-center items-center text-center space-y-8 min-h-[350px]">
                  <AnimatePresence mode="wait">
                    {activeStep < result.steps.length ? (
                      <motion.p 
                        key={`step-${activeStep}`}
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 1.05 }}
                        className="text-3xl md:text-5xl font-black leading-tight text-slate-100"
                      >
                        {result.steps[activeStep]}
                      </motion.p>
                    ) : (
                      <motion.div
                        key="medical-id-summary"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className="w-full max-w-lg space-y-6 text-left"
                      >
                        <div className="bg-red-600/10 border border-red-500/20 p-6 rounded-[2rem] space-y-4">
                          <div className="flex items-center gap-4 mb-2">
                            <div className="bg-red-600 p-2 rounded-xl">
                              <ClipboardList className="w-5 h-5 text-white" />
                            </div>
                            <h3 className="text-xl font-black text-slate-100 uppercase tracking-widest">{t.quickSummary}</h3>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Patient</p>
                              <p className="text-lg font-bold text-slate-100">{patientInfo.name || 'Not Provided'}</p>
                            </div>
                            <div>
                              <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Blood Type</p>
                              <p className="text-lg font-bold text-red-500">{patientInfo.bloodType || 'Unknown'}</p>
                            </div>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Allergies</p>
                            <p className="text-sm font-bold text-slate-200">{patientInfo.allergies || 'No known allergies'}</p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Current Medications</p>
                            <p className="text-sm font-bold text-slate-200">{patientInfo.medications || 'None listed'}</p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Medical History</p>
                            <p className="text-sm font-bold text-slate-200">{patientInfo.medicalHistory || 'None provided'}</p>
                          </div>

                          <div>
                            <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Emergency Contact</p>
                            <p className="text-sm font-bold text-slate-200">{patientInfo.emergencyContact || 'None listed'}</p>
                          </div>
                        </div>
                        <p className="text-center text-[10px] text-slate-500 font-bold uppercase tracking-widest animate-pulse">Present this info to paramedics</p>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="p-6 bg-slate-800/30 grid grid-cols-2 gap-4 border-t border-slate-800">
                  <button 
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-slate-700"
                  >
                    {t.back}
                  </button>
                  <button 
                    onClick={activeStep === result.steps.length ? handleReset : handleNextStep}
                    className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-red-900/20"
                  >
                    <span>{activeStep === result.steps.length ? t.endEvent : t.next}</span>
                    {activeStep !== result.steps.length && <ChevronRight className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Sides: DO / DON'T */}
              <div className="space-y-4">
                <div className="bg-emerald-950/20 border border-emerald-500/20 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-400 font-black uppercase text-[10px] tracking-widest mb-4">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Important Dos</span>
                  </div>
                  <ul className="space-y-3 text-sm font-medium text-slate-300">
                    {result.dos.map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-emerald-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="bg-red-950/20 border border-red-500/20 p-6 rounded-3xl shadow-sm">
                  <div className="flex items-center gap-2 text-red-400 font-black uppercase text-[10px] tracking-widest mb-4">
                    <XCircle className="w-4 h-4" />
                    <span>Crucial Don'ts</span>
                  </div>
                  <ul className="space-y-3 text-sm font-medium text-slate-300">
                    {result.donts.map((item, idx) => (
                      <li key={idx} className="flex gap-2">
                        <span className="text-red-500">•</span>
                        <span>{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button 
                  onClick={handleReset}
                  className="w-full py-4 border border-slate-700 text-slate-400 hover:text-slate-200 hover:border-slate-500 rounded-2xl flex justify-center items-center gap-2 transition-all font-black text-xs uppercase tracking-widest"
                >
                  <RefreshCcw className="w-4 h-4" />
                  <span>Dismiss</span>
                </button>

                {/* Nearby Hospitals Section */}
                {result.urgency === UrgencyLevel.HIGH && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="space-y-4 pt-4"
                  >
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase tracking-widest font-black text-slate-500">Live Situation Map</p>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => requestLocation()}
                          className="text-[9px] font-bold text-emerald-500 flex items-center gap-1 hover:underline"
                        >
                          <RefreshCcw className="w-3 h-3" />
                          REFRESH
                        </button>
                        <button 
                          onClick={() => window.open(`https://www.google.com/maps/search/hospital/@${location?.lat},${location?.lng},14z`)}
                          className="text-[9px] font-bold text-red-500 flex items-center gap-1 hover:underline"
                        >
                          <Map className="w-3 h-3" />
                          OPEN FULL
                        </button>
                      </div>
                    </div>

                    {/* Embedded Map */}
                    <div className="w-full h-48 bg-slate-900 rounded-[2rem] overflow-hidden border border-slate-800 shadow-inner relative group">
                      {location ? (
                        <iframe
                          width="100%"
                          height="100%"
                          style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) brightness(95%) contrast(90%)' }}
                          loading="lazy"
                          allowFullScreen
                          referrerPolicy="no-referrer"
                          src={`https://maps.google.com/maps?q=${location.lat},${location.lng}&z=15&output=embed`}
                        ></iframe>
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-500">
                          <Activity className="w-6 h-6 animate-pulse text-red-500" />
                          <span className="text-[10px] font-black uppercase tracking-tighter">Acquiring GPS Signal...</span>
                        </div>
                      )}
                      
                      {/* Map Overlay for Style */}
                      <div className="absolute inset-0 pointer-events-none border-2 border-inset border-white/5 rounded-[2rem]"></div>
                    </div>

                    <div className="space-y-2">
                       <p className="text-[10px] uppercase tracking-widest font-black text-slate-500 mt-2">Recommended Facilities</p>
                       {hospitals.map((h, i) => (
                         <div key={i} className="p-3 bg-slate-800/50 border border-slate-800 rounded-2xl flex items-center justify-between group hover:border-red-500/30 transition-all">
                           <div className="flex items-center gap-3">
                             <div className="bg-red-500/10 p-2 rounded-lg text-red-500">
                               <MapPin className="w-4 h-4" />
                             </div>
                             <div>
                               <p className="text-xs font-black text-slate-200">{h.name}</p>
                               <p className="text-[10px] text-slate-500">{h.distance} • {h.address}</p>
                             </div>
                           </div>
                           <button 
                             onClick={() => window.open(`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(h.name + ' ' + h.address)}`)}
                             className="p-2 bg-slate-700 rounded-lg text-slate-500 hover:text-red-500 transition-colors"
                           >
                             <Navigation className="w-3 h-3" />
                           </button>
                         </div>
                       ))}
                    </div>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </main>

      {/* Loading Overlay */}
      <AnimatePresence>
        {loading && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-slate-950/80 backdrop-blur-md flex flex-col items-center justify-center z-50 p-8"
          >
            <div className="relative">
               <div className="w-24 h-24 border-4 border-red-500/20 border-t-red-600 rounded-full animate-spin"></div>
               <AlertTriangle className="w-8 h-8 text-red-600 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
            </div>
            <p className="mt-8 text-2xl font-black text-slate-100 animate-pulse text-center">Analysing situation...</p>
            <p className="mt-2 text-slate-500 text-sm">Please stay calm. Guidance appearing in seconds.</p>
          </motion.div>
        )}
      </AnimatePresence>

      <footer className="w-full max-w-4xl mt-12 mb-4 text-center">
        <p className="text-slate-500 text-xs flex items-center justify-center gap-2">
          <span className="font-bold">POWERED BY CODE HACKERS</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <span>GUARDIAN AI SYSTEM V1.0</span>
        </p>
      </footer>

      {/* Chat Bot UI */}
      <div className="fixed bottom-6 right-6 z-40 flex flex-col items-end gap-3">
        <AnimatePresence>
          {result && !isChatOpen && (
            <motion.button
              initial={{ opacity: 0, scale: 0.8, x: 20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.8, x: 20 }}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleReset}
              className="p-4 bg-slate-900 border border-slate-800 text-red-500 rounded-full shadow-2xl flex items-center gap-3 transition-all hover:bg-red-600 hover:text-white group"
              title="Exit Emergency"
            >
              <LogOut className="w-5 h-5 group-hover:-translate-x-0.5 transition-transform" />
              <span className="font-black text-xs uppercase tracking-widest hidden md:block">{t.exit}</span>
            </motion.button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isChatOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="absolute bottom-20 right-0 w-[320px] sm:w-[400px] md:w-[450px] max-h-[600px] h-[70vh] bg-slate-900 border border-slate-800 rounded-[2.5rem] shadow-2xl flex flex-col overflow-hidden transition-colors"
            >
              {/* Chat Header */}
              <div className="p-5 bg-slate-800 border-b border-slate-700 flex justify-between items-center transition-colors">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-xl shadow-md">
                    <MessageCircle className="w-4 h-4 text-white" />
                  </div>
                  <div>
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-100">{t.chatTitle}</h3>
                    <p className="text-[9px] text-emerald-500 font-black uppercase tracking-tighter">AI Responder Online</p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsChatOpen(false)}
                  className="p-2 hover:bg-slate-700 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Chat Messages */}
              <div className="flex-grow overflow-y-auto p-6 space-y-4 scroll-smooth bg-slate-950">
                {chatMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-center p-8 opacity-40">
                    <div className="bg-slate-800 p-5 rounded-3xl mb-4">
                      <Stethoscope className="w-10 h-10 text-slate-400" />
                    </div>
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">{t.chatPlaceholder}</p>
                  </div>
                )}
                {chatMessages.map((msg) => (
                  <div 
                    key={msg.id} 
                    className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[85%] p-4 rounded-[1.5rem] text-sm font-medium leading-relaxed shadow-sm ${
                      msg.role === 'user' 
                        ? 'bg-red-600 text-white rounded-tr-none' 
                        : 'bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700'
                    }`}>
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isChatLoading && (
                  <div className="flex justify-start">
                    <div className="bg-slate-800 p-4 rounded-[1.5rem] rounded-tl-none border border-slate-700">
                      <div className="flex gap-1.5">
                        <span className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                        <span className="w-2 h-2 bg-red-600/50 rounded-full animate-bounce [animation-delay:0.4s]"></span>
                      </div>
                    </div>
                  </div>
                )}
                <div ref={chatEndRef} />
              </div>

              {/* Chat Input */}
              <div className="p-5 bg-slate-900 border-t border-slate-800">
                <div className="relative">
                  <input 
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    placeholder={t.chatPlaceholder}
                    className="w-full bg-slate-800 border border-slate-700 rounded-2xl px-5 py-4 text-sm outline-none focus:border-red-500 transition-all pr-14 text-slate-100 shadow-inner"
                  />
                  <button 
                    onClick={handleSendMessage}
                    disabled={!chatInput.trim() || isChatLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white rounded-xl transition-all active:scale-95 shadow-md"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setIsChatOpen(!isChatOpen)}
          className={`p-4 rounded-full shadow-2xl flex items-center gap-2 transition-all duration-300 ${isChatOpen ? 'bg-slate-800 text-slate-300' : 'bg-red-600 text-white'}`}
        >
          {isChatOpen ? <X className="w-6 h-6" /> : (
            <>
              <MessageCircle className="w-6 h-6" />
              <span className="font-bold text-sm hidden md:block">{t.chatTitle}</span>
            </>
          )}
        </motion.button>
      </div>

      {/* Medical ID Slide-over Panel */}
      <AnimatePresence>
        {isMedicalIdOpen && (
          <>
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMedicalIdOpen(false)}
              className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm z-[60]"
            />
            <motion.div 
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed right-0 top-0 bottom-0 w-full max-w-md bg-slate-900 z-[70] shadow-2xl border-l border-slate-800 flex flex-col p-6 md:p-8"
            >
              <div className="flex justify-between items-center mb-8">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-xl">
                    <ClipboardList className="w-5 h-5 text-white" />
                  </div>
                  <h2 className="text-xl font-black uppercase tracking-widest text-slate-100">Medical ID</h2>
                </div>
                <button 
                  onClick={() => setIsMedicalIdOpen(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="flex-grow overflow-y-auto space-y-6 pr-2 custom-scrollbar">
                {/* Quick Glance Summary Section */}
                {(patientInfo.allergies || patientInfo.medications || patientInfo.medicalHistory) && (
                  <div className="bg-red-600/10 border border-red-500/20 p-5 rounded-3xl space-y-4 mb-2">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-[0.2em] mb-1">Vital Summary</p>
                    {patientInfo.allergies && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Allergies</p>
                        <p className="text-sm font-bold text-slate-200">{patientInfo.allergies}</p>
                      </div>
                    )}
                    {patientInfo.medications && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Medications</p>
                        <p className="text-sm font-bold text-slate-200">{patientInfo.medications}</p>
                      </div>
                    )}
                    {patientInfo.medicalHistory && (
                      <div>
                        <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Med History</p>
                        <p className="text-sm font-bold text-slate-200 line-clamp-2">{patientInfo.medicalHistory}</p>
                      </div>
                    )}
                  </div>
                )}

                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Edit Information</p>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Full Name</label>
                    <input 
                      type="text"
                      value={patientInfo.name}
                      onChange={(e) => setPatientInfo({...patientInfo, name: e.target.value})}
                      placeholder="e.g. John Doe"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Age</label>
                      <input 
                        type="text"
                        value={patientInfo.age}
                        onChange={(e) => setPatientInfo({...patientInfo, age: e.target.value})}
                        placeholder="e.g. 35"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Blood Type</label>
                      <input 
                        type="text"
                        value={patientInfo.bloodType}
                        onChange={(e) => setPatientInfo({...patientInfo, bloodType: e.target.value})}
                        placeholder="e.g. O+"
                        className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Allergies</label>
                    <textarea 
                      value={patientInfo.allergies}
                      onChange={(e) => setPatientInfo({...patientInfo, allergies: e.target.value})}
                      placeholder="List any drug or food allergies..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Medications</label>
                    <textarea 
                      value={patientInfo.medications}
                      onChange={(e) => setPatientInfo({...patientInfo, medications: e.target.value})}
                      placeholder="Current medications..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Medical History</label>
                    <textarea 
                      value={patientInfo.medicalHistory}
                      onChange={(e) => setPatientInfo({...patientInfo, medicalHistory: e.target.value})}
                      placeholder="Surgeries, chronic conditions, etc..."
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold min-h-[80px]"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] uppercase font-black text-slate-400 tracking-tighter">Emergency Contact</label>
                    <input 
                      type="text"
                      value={patientInfo.emergencyContact}
                      onChange={(e) => setPatientInfo({...patientInfo, emergencyContact: e.target.value})}
                      placeholder="Name and Phone Number"
                      className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-slate-100 outline-none focus:border-red-500 transition-all font-bold"
                    />
                  </div>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-800">
                <button 
                  onClick={savePatientInfo}
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-4 rounded-2xl font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-red-900/20"
                >
                  <Save className="w-5 h-5" />
                  Save Medical ID
                </button>
                <p className="mt-4 text-[10px] text-slate-500 text-center font-bold">This info is stored only on this device.</p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Quick Summary Modal */}
      <AnimatePresence>
        {showQuickSummary && (
          <div className="fixed inset-0 flex items-center justify-center z-[100] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowQuickSummary(false)}
              className="absolute inset-0 bg-slate-950/80 backdrop-blur-md"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-2xl overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-500 via-blue-500 to-red-500"></div>
              
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-3">
                  <div className="bg-red-600 p-2 rounded-xl">
                    <FileText className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="text-lg font-black text-slate-100 uppercase tracking-widest">{t.quickSummary}</h3>
                </div>
                <button 
                  onClick={() => setShowQuickSummary(false)}
                  className="p-2 hover:bg-slate-800 rounded-xl text-slate-400 transition-colors"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Blood Type</p>
                    <p className="text-xl font-black text-red-500">{patientInfo.bloodType || 'Unknown'}</p>
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Age</p>
                    <p className="text-xl font-black text-slate-100">{patientInfo.age || 'N/A'}</p>
                  </div>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Allergies</p>
                  <p className="text-sm font-bold text-slate-200">{patientInfo.allergies || 'No known allergies reported'}</p>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">Medications</p>
                  <p className="text-sm font-bold text-slate-200">{patientInfo.medications || 'None listed'}</p>
                </div>

                <div className="p-4 bg-slate-800/50 rounded-2xl border border-slate-700/50">
                  <p className="text-[10px] font-black text-slate-500 uppercase tracking-tighter mb-1">History</p>
                  <p className="text-sm font-bold text-slate-200 line-clamp-3">{patientInfo.medicalHistory || 'No history recorded'}</p>
                </div>

                <button 
                  onClick={() => {
                    setShowQuickSummary(false);
                    setIsMedicalIdOpen(true);
                  }}
                  className="w-full py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest hover:text-slate-300 transition-colors"
                >
                  {t.medicalId}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      {/* Feedback Modal */}
      <AnimatePresence>
        {showFeedback && (
          <div className="fixed inset-0 flex items-center justify-center z-[110] p-4">
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowFeedback(false)}
              className="absolute inset-0 bg-slate-950/90 backdrop-blur-xl"
            />
            <motion.div 
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="relative w-full max-w-sm bg-slate-900 border border-slate-800 rounded-[3rem] p-10 shadow-2xl overflow-hidden text-center"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-red-600 via-emerald-500 to-red-600"></div>
              
              <div className="flex justify-center mb-6">
                <div className="bg-emerald-600/10 p-4 rounded-full border border-emerald-500/20">
                  <CheckCircle2 className="w-12 h-12 text-emerald-500" />
                </div>
              </div>

              <h3 className="text-3xl font-black text-slate-100 uppercase tracking-tighter mb-2">{t.thankYou}</h3>
              <p className="text-slate-400 text-sm font-medium mb-8 uppercase tracking-widest">{t.rateExperience}</p>

              <div className="flex justify-center gap-2 mb-10">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform active:scale-90"
                  >
                    <Star 
                      className={`w-8 h-8 transition-colors ${
                        star <= rating ? 'fill-yellow-500 text-yellow-500' : 'text-slate-700 hover:text-slate-500'
                      }`}
                    />
                  </button>
                ))}
              </div>

              <button 
                onClick={() => setShowFeedback(false)}
                className="w-full py-4 bg-slate-100 text-slate-950 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 shadow-xl shadow-white/5"
              >
                {t.backToHome}
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
