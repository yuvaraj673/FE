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
  Save
} from 'lucide-react';
import { analyzeEmergency, getChatResponse } from '../services/geminiService';
import { FirstAidResponse, UrgencyLevel, EmergencyType, ChatMessage, Hospital } from '../types';

interface PatientInfo {
  name: string;
  age: string;
  bloodType: string;
  allergies: string;
  medications: string;
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
    emergencyContact: ''
  });
  const [isMedicalIdOpen, setIsMedicalIdOpen] = useState(false);

  // Load patient info from localStorage
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
      recognition.lang = 'en-US';

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
  }, []);

  const toggleRecording = () => {
    if (isRecording) {
      recognitionRef.current?.stop();
    } else {
      setInput('');
      recognitionRef.current?.start();
      setIsRecording(true);
    }
  };

  const handleAnalyze = async (textOverride?: string) => {
    const textToUse = textOverride || input;
    if (!textToUse.trim()) return;

    setLoading(true);
    setResult(null);
    setActiveStep(0);

    try {
      const response = await analyzeEmergency(textToUse);
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
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNextStep = () => {
    if (result && activeStep < result.steps.length - 1) {
      const next = activeStep + 1;
      setActiveStep(next);
      if (!isMuted) {
        speak(result.steps[next]);
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

      const response = await getChatResponse(userMsg.content, history);
      
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
  };

  const quickActions = [
    { label: 'Unconscious/CPR', type: EmergencyType.CARDIAC_ARREST, icon: Heart, prompt: 'Person is unconscious and not breathing, need CPR' },
    { label: 'Choking', type: EmergencyType.CHOKING, icon: Baby, prompt: 'Someone is choking and cannot breathe' },
    { label: 'Heavy Bleeding', type: EmergencyType.BLEEDING, icon: Activity, prompt: 'Severe bleeding from a wound' },
    { label: 'Shaking/Seizure', type: EmergencyType.SEIZURE, icon: RefreshCcw, prompt: 'Person is having a seizure and shaking uncontrollably' },
    { label: 'Allergy/Swelling', type: EmergencyType.ALLERGIC_REACTION, icon: Stethoscope, prompt: 'Severe allergic reaction with swelling and difficulty breathing' },
  ];

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
        
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setIsMedicalIdOpen(true)}
            className="p-2.5 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-all shadow-lg"
            title="Medical ID"
          >
            <User className="w-5 h-5" />
          </button>
          
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
              <h2 className="text-3xl md:text-5xl font-extrabold text-slate-100">What is the emergency?</h2>
              <p className="text-slate-400 max-w-lg mx-auto">Speak or type clearly. We will guide you through the process as help arrives.</p>
              
              <div className="relative group max-w-2xl mx-auto">
                <input 
                  type="text" 
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  placeholder="Describe the situation..."
                  className="w-full bg-slate-900 border-2 border-slate-800 focus:border-red-500 rounded-2xl px-6 py-6 text-xl outline-none transition-all pr-32 text-slate-100 placeholder:text-slate-400"
                />
                <div className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button 
                    onClick={toggleRecording}
                    className={`p-3 rounded-xl transition-colors ${isRecording ? 'bg-red-600 animate-pulse text-white' : 'bg-slate-800 hover:bg-slate-700 text-slate-400'}`}
                  >
                    {isRecording ? <MicOff className="w-6 h-6" /> : <Mic className="w-6 h-6" />}
                  </button>
                  <button 
                    onClick={() => handleAnalyze()}
                    disabled={loading || !input.trim()}
                    className="bg-slate-50 text-slate-950 p-3 rounded-xl hover:opacity-90 disabled:opacity-50 disabled:grayscale transition-all active:scale-95"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="space-y-4">
              <p className="text-xs uppercase tracking-widest text-slate-500 font-black ml-1">Emergency Presets</p>
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
                  <h4 className="font-black text-xs uppercase tracking-[0.2em] text-slate-400">Step-by-Step Instructions</h4>
                  <span className="text-slate-500 font-mono text-xs font-bold tracking-tighter">{activeStep + 1} OF {result.steps.length}</span>
                </div>
                
                <div className="flex-grow p-8 flex flex-col justify-center items-center text-center space-y-8 min-h-[350px]">
                  <AnimatePresence mode="wait">
                    <motion.p 
                      key={activeStep}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 1.05 }}
                      className="text-3xl md:text-5xl font-black leading-tight text-slate-100"
                    >
                      {result.steps[activeStep]}
                    </motion.p>
                  </AnimatePresence>
                </div>

                <div className="p-6 bg-slate-800/30 grid grid-cols-2 gap-4 border-t border-slate-800">
                  <button 
                    disabled={activeStep === 0}
                    onClick={() => setActiveStep(prev => prev - 1)}
                    className="py-4 bg-slate-800 text-slate-300 hover:bg-slate-700 disabled:opacity-20 rounded-2xl font-black text-xs uppercase tracking-widest transition-all active:scale-95 border border-slate-700"
                  >
                    Back
                  </button>
                  <button 
                    onClick={activeStep === result.steps.length - 1 ? handleReset : handleNextStep}
                    className="py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex justify-center items-center gap-2 shadow-lg shadow-red-900/20"
                  >
                    <span>{activeStep === result.steps.length - 1 ? 'End Event' : 'Next'}</span>
                    {activeStep !== result.steps.length - 1 && <ChevronRight className="w-4 h-4" />}
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
          <span>POWERED BY GOOGLE GEMINI</span>
          <span className="w-1 h-1 bg-slate-700 rounded-full"></span>
          <span>GUARDIAN AI SYSTEM V1.0</span>
        </p>
      </footer>

      {/* Chat Bot UI */}
      <div className="fixed bottom-6 right-6 z-40">
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
                    <h3 className="font-black text-xs uppercase tracking-widest text-slate-100">Rescue Assistant</h3>
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
                    <p className="text-xs font-black uppercase tracking-widest text-slate-500">Ask any medical question</p>
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
                    placeholder="Type a vital question..."
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
              <span className="font-bold text-sm hidden md:block">Rescue Chat</span>
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
                <p className="text-xs text-slate-500 uppercase font-black tracking-widest">Patient Information</p>
                
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
    </div>
  );
}
