import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Search, 
  User as UserIcon, 
  Briefcase, 
  TrendingUp, 
  Bell, 
  SearchCheck, 
  Building2, 
  MapPin, 
  Calendar, 
  ExternalLink,
  ChevronRight,
  BrainCircuit,
  Mail,
  CheckCircle2,
  AlertCircle,
  Loader2,
  LogOut,
  LogIn
} from 'lucide-react';
import { INITIAL_PROFILE, INITIAL_POSITIONS } from './constants';
import { Profile, PhDPosition, CareerInsight } from './types';
import { getMarketTrends, analyzeMatch } from './services/gemini';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';
import { auth, signInWithGoogle, db } from './lib/firebase';
import { onAuthStateChanged, signOut, User } from 'firebase/auth';
import { 
  collection, 
  doc, 
  getDoc, 
  setDoc, 
  onSnapshot, 
  query, 
  where,
  Timestamp,
  addDoc
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from './lib/firestoreUtils';

function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'discover' | 'profile' | 'guidance' | 'tracker'>('discover');
  const [profile, setProfile] = useState<Profile>(INITIAL_PROFILE);
  const [positions, setPositions] = useState<PhDPosition[]>(INITIAL_POSITIONS);
  const [applications, setApplications] = useState<any[]>([]);
  const [trends, setTrends] = useState<CareerInsight | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [notifications, setNotifications] = useState<string[]>([]);
  const [locationFilter, setLocationFilter] = useState('');
  const [universityFilter, setUniversityFilter] = useState('');
  const [minMatchScore, setMinMatchScore] = useState(0);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setAuthLoading(false);
      if (u) {
        syncProfile(u);
        const appUnsubscribe = listenToApplications(u.uid);
        return () => appUnsubscribe();
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    loadTrends();
  }, []);

  const syncProfile = async (u: User) => {
    try {
      const docRef = doc(db, 'profiles', u.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          name: u.displayName || "Researcher",
          email: u.email || "",
          education: INITIAL_PROFILE.education,
          skills: INITIAL_PROFILE.skills,
          interests: INITIAL_PROFILE.interests,
          bio: INITIAL_PROFILE.bio,
          lastAnalyzedAt: new Date().toISOString()
        });
      } else {
        setProfile(docSnap.data() as Profile);
      }
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, `profiles/${u.uid}`);
    }
  };

  const listenToApplications = (uid: string) => {
    const q = query(collection(db, 'applications'), where('userId', '==', uid));
    return onSnapshot(q, (snapshot) => {
      const apps = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setApplications(apps);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'applications');
    });
  };

  const loadTrends = async () => {
    const data = await getMarketTrends();
    setTrends(data);
  };

  const handleAgentSearch = async () => {
    setIsSearching(true);
    await new Promise(r => setTimeout(r, 3000));
    
    const newJob: PhDPosition = {
      id: "unipi-ai-human-" + Date.now(),
      title: "Research Position in Trustworthy AI for Human-Machine Teaming",
      university: "University of Pisa",
      location: "Pisa, Italy",
      deadline: "2026-08-30",
      applyLink: "https://www.unipi.it/index.php/vacancies",
      description: "Developing safe and transparent interaction between AI models and human operators in high-stakes environments.",
      contactEmail: "phd-info@di.unipi.it",
      matchScore: 92,
      matchAnalysis: "Highly relevant given your current residence in Italy (Verona) and focus on safety-critical aviation support. Direct application of your XAI skills."
    };

    setPositions(prev => [newJob, ...prev]);
    setIsSearching(false);
    setNotifications(prev => ["Agent found a new matching position at University of Pisa!", ...prev]);
  };

  const filteredPositions = positions.filter(pos => {
    const matchesLocation = pos.location.toLowerCase().includes(locationFilter.toLowerCase());
    const matchesUniversity = pos.university.toLowerCase().includes(universityFilter.toLowerCase());
    const matchesScore = pos.matchScore >= minMatchScore;
    return matchesLocation && matchesUniversity && matchesScore;
  });

  const handleTrackJob = async (job: PhDPosition) => {
    if (!user) {
      signInWithGoogle();
      return;
    }
    // Check if already tracking
    if (applications.some(a => a.jobId === job.id)) {
      setNotifications(prev => ["You are already tracking this position.", ...prev]);
      return;
    }

    try {
      await addDoc(collection(db, 'applications'), {
        userId: user.uid,
        jobId: job.id,
        title: job.title,
        university: job.university,
        deadline: job.deadline,
        status: 'interested',
        updatedAt: Timestamp.now()
      });
      setNotifications(prev => [`Added ${job.title} to your tracker.`, ...prev]);
    } catch (e) {
      handleFirestoreError(e, OperationType.WRITE, 'applications');
    }
  };

  if (authLoading) {
    return (
      <div className="h-screen w-screen flex items-center justify-center bg-[#F5F5F5]">
        <Loader2 className="w-8 h-8 animate-spin text-[#141414]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="h-screen w-screen flex flex-col items-center justify-center bg-slate-950 p-6 text-center text-slate-200">
        <div className="w-20 h-20 bg-sky-500 rounded-3xl flex items-center justify-center mb-8 shadow-2xl shadow-sky-500/20 rotate-3 transform hover:rotate-0 transition-transform duration-500">
          <BrainCircuit className="text-slate-950 w-12 h-12" />
        </div>
        <h1 className="text-5xl font-black tracking-tighter mb-4 text-white">EuroPhD Agent</h1>
        <p className="text-slate-400 max-w-md mb-10 leading-relaxed text-lg font-medium">
          The autonomous discovery agent for <span className="text-sky-400">CS Research</span> in Europe.
          Start your journey with a profile-matched search.
        </p>
        <button 
          onClick={signInWithGoogle}
          className="flex items-center gap-3 bg-sky-500 text-slate-950 px-10 py-4 rounded-3xl font-bold hover:bg-sky-400 transition-all active:scale-95 shadow-xl shadow-sky-500/20 group"
        >
          <LogIn className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
          Connect Researcher Account
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 font-sans text-slate-200 overflow-hidden flex p-4 gap-4">
      {/* Navigation Sidebar */}
      <nav className="w-64 bg-slate-900 border border-slate-800 rounded-[2rem] flex flex-col h-[calc(100vh-2rem)] shadow-2xl relative overflow-hidden">
        <div className="p-8 border-b border-slate-800/50">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-sky-500 rounded-xl flex items-center justify-center shadow-lg shadow-sky-500/10">
              <BrainCircuit className="text-slate-950 w-6 h-6" />
            </div>
            <h1 className="font-black text-xl tracking-tighter text-white">EURO-PHD</h1>
          </div>
          <p className="text-[10px] uppercase tracking-[0.2em] text-slate-500 font-black">Career Intel Agent</p>
        </div>

        <div className="flex-1 py-6 px-4 space-y-2">
          <NavItem active={activeTab === 'discover'} onClick={() => setActiveTab('discover')} icon={<Search className="w-4 h-4" />} label="Discover" />
          <NavItem active={activeTab === 'profile'} onClick={() => setActiveTab('profile')} icon={<UserIcon className="w-4 h-4" />} label="Profile" />
          <NavItem active={activeTab === 'guidance'} onClick={() => setActiveTab('guidance')} icon={<TrendingUp className="w-4 h-4" />} label="Trends" />
          <NavItem active={activeTab === 'tracker'} onClick={() => setActiveTab('tracker')} icon={<Briefcase className="w-4 h-4" />} label="Tracker" />
        </div>

        <div className="p-6 bg-slate-800/30">
          <div className="bg-slate-950/50 border border-slate-800 rounded-2xl p-4 mb-4">
            <p className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-widest">Agent Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
              <span className="text-xs font-bold text-slate-300">Scanning Platforms</span>
            </div>
          </div>
          <button 
            onClick={() => signOut(auth)}
            className="flex items-center gap-2 text-xs font-bold text-slate-500 hover:text-red-400 hover:bg-red-500/5 w-full p-2 rounded-xl transition-all"
          >
            <LogOut className="w-4 h-4" /> Sign Out
          </button>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col h-[calc(100vh-2rem)] overflow-hidden">
        {/* Top Header */}
        <header className="h-20 bg-slate-900 border border-slate-800 rounded-3xl px-8 flex items-center justify-between mb-4 shadow-xl">
          <div className="flex items-center gap-4">
            <h2 className="font-bold text-xs uppercase tracking-widest text-slate-500">
              {activeTab === 'discover' && "Discovery Engine"}
              {activeTab === 'profile' && "Researcher Identity"}
              {activeTab === 'guidance' && "Market Intelligence"}
              {activeTab === 'tracker' && "Active Applications"}
            </h2>
          </div>
          <div className="flex items-center gap-6">
            {activeTab === 'discover' && (
              <button 
                onClick={handleAgentSearch}
                disabled={isSearching}
                className="flex items-center gap-2 bg-sky-500 text-slate-950 px-5 py-2 rounded-2xl text-xs font-black hover:bg-sky-400 transition-all disabled:opacity-50 shadow-lg shadow-sky-500/10"
              >
                {isSearching ? <Loader2 className="w-3 h-3 animate-spin" /> : <SearchCheck className="w-3 h-3" />}
                <span>Agent Search</span>
              </button>
            )}
            <div className="relative group cursor-pointer p-2 rounded-xl hover:bg-slate-800 transition-colors">
              <Bell className="w-5 h-5 text-slate-400 group-hover:text-white" />
              {notifications.length > 0 && (
                <div className="absolute top-1.5 right-1.5 w-2.5 h-2.5 bg-orange-500 rounded-full border-2 border-slate-900" />
              )}
            </div>
            <div className="flex items-center gap-3 pl-6 border-l border-slate-800">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-white leading-none mb-1">{user.displayName || "Researcher"}</p>
                <p className="text-[10px] font-medium text-slate-500 leading-none">Senior Profile</p>
              </div>
              <div className="w-10 h-10 rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center overflow-hidden">
                 {user.photoURL ? <img src={user.photoURL} alt="Avatar" referrerPolicy="no-referrer" /> : <span className="text-xs font-black">AH</span>}
              </div>
            </div>
          </div>
        </header>

        {/* Dynamic Section Container */}
        <div className="flex-1 overflow-y-auto pr-2 custom-scrollbar">
          <AnimatePresence mode="wait">
            {activeTab === 'discover' && (
              <motion.div 
                key="discover" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl space-y-6"
              >
                <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-6">
                  <div>
                    <h3 className="text-3xl font-bold tracking-tight mb-2">High Potential Matches</h3>
                    <p className="text-sm text-slate-500 font-medium">AI agent analyzed your profile against active vacancies in Europe.</p>
                  </div>
                  
                  <div className="bg-slate-900 border border-slate-800 p-4 rounded-[2rem] flex flex-wrap items-center gap-4 shadow-xl">
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl">
                      <MapPin className="w-3 h-3 text-sky-500" />
                      <input 
                        type="text" 
                        placeholder="Location..." 
                        value={locationFilter}
                        onChange={(e) => setLocationFilter(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold text-white placeholder-slate-600 focus:ring-0 w-24 outline-none uppercase tracking-widest"
                      />
                    </div>
                    
                    <div className="flex items-center gap-2 px-4 py-2 bg-slate-950 border border-slate-800 rounded-2xl">
                      <Building2 className="w-3 h-3 text-sky-500" />
                      <input 
                        type="text" 
                        placeholder="University..." 
                        value={universityFilter}
                        onChange={(e) => setUniversityFilter(e.target.value)}
                        className="bg-transparent border-none text-[11px] font-bold text-white placeholder-slate-600 focus:ring-0 w-24 outline-none uppercase tracking-widest"
                      />
                    </div>

                    <div className="flex items-center gap-4 pl-2">
                      <div className="flex flex-col">
                        <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">Min Match</span>
                        <span className="text-[11px] font-black text-sky-500 tracking-tighter">{minMatchScore}%</span>
                      </div>
                      <input 
                        type="range" 
                        min="0" 
                        max="100" 
                        value={minMatchScore}
                        onChange={(e) => setMinMatchScore(parseInt(e.target.value))}
                        className="w-24 h-1 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-sky-500"
                      />
                    </div>

                    {(locationFilter || universityFilter || minMatchScore > 0) && (
                      <button 
                        onClick={() => { setLocationFilter(''); setUniversityFilter(''); setMinMatchScore(0); }}
                        className="text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest pl-2"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                </div>

                <div className="grid gap-4 pb-12">
                  {filteredPositions.length > 0 ? (
                    filteredPositions.map((pos) => (
                      <PositionCard key={pos.id} position={pos} onTrack={() => handleTrackJob(pos)} />
                    ))
                  ) : (
                    <div className="p-20 text-center bg-slate-900 border border-slate-800 rounded-[3rem] text-slate-500 italic font-medium">
                      No positions match your current filters.
                    </div>
                  )}
                </div>
              </motion.div>
            )}

            {activeTab === 'profile' && (
              <motion.div 
                key="profile" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl"
              >
                <ProfileView profile={profile} user={user} />
              </motion.div>
            )}

            {activeTab === 'guidance' && (
              <motion.div 
                key="guidance" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl"
              >
                <GuidanceView trends={trends} profile={profile} />
              </motion.div>
            )}

            {activeTab === 'tracker' && (
              <motion.div 
                key="tracker" 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="max-w-4xl"
              >
                <TrackerView applications={applications} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ active, onClick, icon, label }: { active: boolean, onClick: () => void, icon: React.ReactNode, label: string }) {
  return (
    <button 
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-6 py-3.5 text-sm font-bold transition-all rounded-2xl mb-1",
        active 
          ? "bg-sky-500 text-slate-950 shadow-lg shadow-sky-500/10" 
          : "text-slate-400 hover:text-white hover:bg-slate-800"
      )}
    >
      <span className={cn("transition-colors", active ? "text-slate-950" : "text-sky-500")}>
        {icon}
      </span>
      {label}
    </button>
  );
}

function PositionCard({ position, onTrack }: { position: PhDPosition, onTrack: () => void }) {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden hover:border-slate-700 transition-all group shadow-xl">
      <div className="p-8">
        <div className="flex justify-between items-start mb-6">
          <div className="flex-1 pr-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-sky-500" />
              <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-500">{position.university}</span>
            </div>
            <h4 className="text-2xl font-black group-hover:text-sky-400 transition-colors leading-tight tracking-tighter text-white">{position.title}</h4>
            <div className="flex items-center gap-5 mt-4">
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                <MapPin className="w-3.5 h-3.5 text-slate-600" />
                {position.location}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-400 font-bold uppercase tracking-wide">
                <Calendar className="w-3.5 h-3.5 text-slate-600" />
                Until {position.deadline}
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">
              {position.matchScore}% Strength
            </div>
          </div>
        </div>

        <p className="text-sm text-slate-400 line-clamp-3 mb-6 leading-relaxed font-medium">
          {position.description}
        </p>

        <div className="bg-slate-950/50 rounded-2xl p-5 mb-8 border border-slate-800 group-hover:border-slate-700 transition-colors">
          <p className="text-[10px] font-black uppercase text-slate-600 mb-2 tracking-[0.2em]">Agent Intelligence Cross-Check</p>
          <p className="text-xs text-slate-300 italic font-medium leading-relaxed">
            "{position.matchAnalysis}"
          </p>
        </div>

        <div className="flex items-center justify-between pt-6 border-t border-slate-800/50">
          <div className="flex gap-3">
            <a 
              href={position.applyLink} 
              target="_blank" 
              className="flex items-center gap-2 px-6 py-2.5 bg-sky-500 text-slate-950 rounded-xl text-xs font-black hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/10"
            >
              Apply Portal <ExternalLink className="w-3.5 h-3.5" />
            </a>
            {position.contactEmail && (
              <a 
                href={`mailto:${position.contactEmail}`}
                className="flex items-center gap-2 px-6 py-2.5 bg-slate-800 text-slate-300 rounded-xl text-xs font-black hover:bg-slate-700 transition-all"
              >
                Inquire <Mail className="w-3.5 h-3.5" />
              </a>
            )}
          </div>
          <button 
            onClick={onTrack}
            title="Track Application"
            className="text-slate-500 hover:text-emerald-400 p-2.5 transition-all flex items-center gap-2 rounded-xl hover:bg-slate-800"
          >
            <CheckCircle2 className="w-6 h-6" />
            <span className="text-[10px] font-black uppercase tracking-widest hidden sm:block">Track</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ProfileView({ profile, user }: { profile: Profile, user: User }) {
  return (
    <div className="space-y-8 pb-12">
      <div className="bg-slate-900 border border-slate-800 rounded-[3rem] p-10 flex items-center gap-8 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-sky-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
        <div className="w-32 h-32 rounded-[2.5rem] bg-slate-800 border-4 border-slate-950 shadow-2xl overflow-hidden flex items-center justify-center text-white text-4xl font-black relative z-10 shrink-0">
          {user.photoURL ? <img src={user.photoURL} alt="User" referrerPolicy="no-referrer" /> : "AH"}
        </div>
        <div className="relative z-10">
          <h3 className="text-5xl font-black tracking-tighter text-white mb-2">{profile.name}</h3>
          <p className="text-slate-500 font-bold mb-5 flex items-center gap-2">
            <Mail className="w-4 h-4 text-sky-500" /> {profile.email}
          </p>
          <div className="flex gap-3">
             <span className="px-4 py-1.5 bg-sky-500/10 text-sky-400 rounded-full text-[10px] font-black border border-sky-500/20 uppercase tracking-widest">PhD Candidate</span>
             <span className="px-4 py-1.5 bg-emerald-500/10 text-emerald-400 rounded-full text-[10px] font-black border border-emerald-500/20 uppercase tracking-widest">XAI Researcher</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-8 space-y-6">
          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
            <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-6 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-sky-500" /> Research Narrative
            </h4>
            <p className="text-xl font-medium leading-relaxed text-slate-300">
              {profile.bio}
            </p>
          </section>

          <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
             <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-8 flex items-center gap-3">
              <span className="w-8 h-[2px] bg-sky-500" /> Education History
            </h4>
            <div className="space-y-6">
              {profile.education.map((edu, idx) => (
                <div key={idx} className="flex gap-6 group">
                  <div className="w-1.5 h-1.5 bg-sky-500 rounded-full mt-2 group-hover:scale-150 transition-transform shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
                  <div>
                    <p className="font-black text-lg tracking-tight text-white group-hover:text-sky-400 transition-colors uppercase">{edu.degree}</p>
                    <p className="text-xs font-bold text-slate-500 mt-1 uppercase tracking-wider">{edu.uni} • {edu.year}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="col-span-12 lg:col-span-4 space-y-6">
           <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
             <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-6">Expertise Matrix</h4>
             <div className="flex flex-wrap gap-2.5">
               {profile.skills.map((skill, idx) => (
                 <span key={idx} className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-[11px] font-bold text-slate-300 hover:border-sky-500/50 transition-colors cursor-default capitalize">
                   {skill}
                 </span>
               ))}
             </div>
           </section>

           <section className="bg-slate-900 border border-slate-800 rounded-[2.5rem] p-8 shadow-xl">
             <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-8">Research Focus</h4>
             <div className="space-y-4">
               {profile.interests.map((interest, idx) => (
                 <div key={idx} className="flex items-center gap-3 text-xs font-bold text-slate-400 uppercase tracking-widest hover:text-white transition-colors cursor-default">
                   <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                   {interest}
                 </div>
               ))}
             </div>
           </section>
        </div>
      </div>
    </div>
  );
}

function GuidanceView({ trends, profile }: { trends: CareerInsight | null, profile: Profile }) {
  if (!trends) return <div className="flex items-center justify-center h-64"><Loader2 className="animate-spin text-sky-500" /></div>;

  return (
    <div className="space-y-6">
      <div className="bg-slate-900 text-white p-10 rounded-[3rem] border border-slate-800 relative overflow-hidden shadow-2xl flex flex-col md:flex-row gap-10">
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-sky-500/10 rounded-full blur-[100px]" />
        <div className="relative z-10 flex-1">
          <p className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500 mb-4">CS Market Sentiment (EU 2026)</p>
          <h3 className="text-6xl font-black mb-8 tracking-tighter leading-[0.9] text-white">
            {trends.marketTrend}
          </h3>
          <p className="text-xl text-slate-400 leading-relaxed font-medium">
            {trends.guidance}
          </p>
        </div>
        <div className="w-full md:w-64 shrink-0 relative z-10 flex flex-col justify-end">
           <div className="bg-slate-950 border border-slate-800 rounded-3xl p-6 shadow-inner">
             <p className="text-[10px] font-black text-slate-600 uppercase mb-4 tracking-widest text-center">Stability Index</p>
             <div className="h-24 flex items-end gap-2 justify-center">
               <div className="w-4 bg-slate-800 h-[30%] rounded-md" />
               <div className="w-4 bg-slate-800 h-[50%] rounded-md" />
               <div className="w-4 bg-slate-800 h-[45%] rounded-md" />
               <div className="w-4 bg-sky-500 h-[80%] rounded-md animate-pulse" />
               <div className="w-4 bg-sky-400 h-[95%] rounded-md shadow-[0_0_15px_rgba(56,189,248,0.5)]" />
             </div>
           </div>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-6">
        <div className="col-span-12 lg:col-span-5 space-y-4">
          <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-2">High Demand Verticals</h4>
          <div className="space-y-2.5">
            {trends.inDemandSkills.map((skill, idx) => (
              <div key={idx} className="flex items-center justify-between p-6 bg-slate-900 border border-slate-800 rounded-3xl group hover:border-sky-500/50 transition-all cursor-default shadow-lg">
                 <span className="font-black text-sm tracking-widest uppercase text-white group-hover:text-sky-400 transition-colors">{skill}</span>
                 <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-sky-500 transition-all translate-x-0 group-hover:translate-x-1" />
              </div>
            ))}
          </div>
        </div>

        <div className="col-span-12 lg:col-span-7 space-y-6">
           <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-2">Researcher Strategy Report</h4>
           <div className="p-10 bg-slate-900 border border-slate-800 rounded-[2.5rem] relative overflow-hidden shadow-xl">
             <div className="absolute top-0 left-0 w-1.5 h-full bg-orange-500" />
             <p className="text-2xl font-medium text-slate-300 italic leading-relaxed">
              "Based on your profile, your unique combination of <strong className="text-white">Aviation Safety Knowledge</strong> and <strong className="text-white">Modern AI Pipelines</strong> 
              is extremely rare. In Europe, especially in the Netherlands and Germany, there is a massive surge in funding for 
              <strong className="text-sky-400">Trustworthy AI for Transport</strong>. Focus your cover letters on 'Human-Systems Integration' to maximize success."
             </p>
           </div>
           
           <div className="grid grid-cols-2 gap-6">
             <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-lg group hover:border-emerald-500/30 transition-all">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Candidacy Power</p>
               <p className="text-5xl font-black text-emerald-400 tracking-tighter">88%</p>
               <div className="w-12 h-1 bg-slate-800 mx-auto mt-4 rounded-full overflow-hidden">
                 <div className="bg-emerald-500 h-full w-[88%] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
               </div>
             </div>
             <div className="p-8 bg-slate-900 border border-slate-800 rounded-3xl text-center shadow-lg group hover:border-sky-500/30 transition-all">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Alignment Index</p>
               <p className="text-5xl font-black text-sky-400 tracking-tighter">MAX</p>
               <div className="w-12 h-1 bg-slate-800 mx-auto mt-4 rounded-full overflow-hidden">
                 <div className="bg-sky-500 h-full w-full shadow-[0_0_8px_rgba(14,165,233,0.5)]" />
               </div>
             </div>
           </div>
        </div>
      </div>
    </div>
  );
}

function TrackerView({ applications }: { applications: any[] }) {
  const interested = applications.filter(a => a.status === 'interested').length;
  const applied = applications.filter(a => a.status === 'applied').length;

  return (
    <div className="space-y-6">
       <div className="grid grid-cols-12 gap-6 items-center">
         <div className="col-span-12 lg:col-span-8 flex justify-between items-center bg-slate-900 p-8 rounded-[2rem] border border-slate-800 shadow-xl overflow-hidden relative">
           <div className="absolute top-0 left-0 w-32 h-32 bg-sky-500/5 rounded-full blur-2xl -translate-x-1/2 -translate-y-1/2" />
           <div className="flex items-center gap-10 relative z-10">
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Shortlisted</p>
               <p className="text-4xl font-black text-white tracking-tighter">{interested}</p>
             </div>
             <div className="h-10 w-px bg-slate-800" />
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Active Apps</p>
               <p className="text-4xl font-black text-white tracking-tighter">{applied}</p>
             </div>
             <div className="h-10 w-px bg-slate-800" />
             <div className="text-center">
               <p className="text-[10px] font-black text-slate-600 uppercase mb-2 tracking-widest">Urgent</p>
               <p className="text-4xl font-black text-orange-500 tracking-tighter">{applications.length}</p>
             </div>
           </div>
           <button className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest bg-sky-500 text-slate-950 px-8 py-3 rounded-2xl hover:bg-sky-400 transition-all shadow-lg shadow-sky-500/10">
             Generate PDF Summary
           </button>
         </div>

         <div className="col-span-12 lg:col-span-4 bg-slate-900 p-8 rounded-3xl border border-slate-800 shadow-xl flex items-center justify-between">
            <div>
              <p className="text-[10px] font-black text-slate-600 uppercase mb-1 tracking-widest text-left">Pipeline Velocity</p>
              <p className="text-2xl font-black text-emerald-400 uppercase tracking-tighter">Accelerating</p>
            </div>
            <TrendingUp className="w-10 h-10 text-emerald-500 opacity-20" />
         </div>
       </div>

       <div className="space-y-4">
         <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-2">Active Pipeline Index</h4>
         {applications.length === 0 ? (
           <div className="p-20 text-center bg-slate-900 border border-slate-800 rounded-[3rem] text-slate-600 italic font-medium">
             No applications tracked yet. Start discovering positions!
           </div>
         ) : (
           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {applications.map((app) => (
               <div key={app.id} className="p-6 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-between group shadow-xl hover:border-slate-700 transition-all cursor-pointer">
                  <div className="flex items-center gap-5">
                    <div className="w-12 h-12 bg-slate-950 border border-slate-800 rounded-2xl flex items-center justify-center font-black text-sm uppercase group-hover:bg-sky-500 group-hover:text-slate-950 transition-all shadow-inner tracking-tighter">
                      {app.university.substring(0, 2)}
                    </div>
                    <div>
                      <p className="font-black text-base tracking-tighter text-white group-hover:text-sky-400 transition-colors uppercase leading-tight">{app.title}</p>
                      <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">{app.university} • {app.deadline}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6 shrink-0">
                    <div className="flex flex-col items-end">
                       <span className="text-[9px] font-black uppercase text-slate-700 mb-1 tracking-widest">Phase</span>
                       <span className={cn(
                         "text-[10px] font-black py-1.5 px-3 rounded-full uppercase tracking-wider",
                         app.status === 'interested' ? "bg-sky-500/10 text-sky-400 border border-sky-500/20" : "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                       )}>
                         {app.status}
                       </span>
                    </div>
                    <ChevronRight className="w-5 h-5 text-slate-800 group-hover:text-sky-500 transition-colors" />
                  </div>
               </div>
             ))}
           </div>
         )}
       </div>

       <div className="p-10 bg-slate-900 border border-slate-800 rounded-[3rem] shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <h4 className="text-[10px] uppercase tracking-[0.4em] font-black text-slate-600 mb-8 flex items-center gap-3">
            <span className="w-8 h-[2px] bg-orange-500" /> Automated Reminder System (Email)
          </h4>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-6 bg-slate-950 border-r-4 border-orange-500 rounded-3xl shadow-inner group hover:bg-slate-900 transition-colors transition-all">
              <div className="flex items-center gap-5">
                <div className="w-10 h-10 bg-orange-500/10 rounded-xl flex items-center justify-center border border-orange-500/20">
                  <AlertCircle className="w-5 h-5 text-orange-500" />
                </div>
                <div>
                  <p className="text-sm font-black text-white tracking-widest uppercase">Utrecht University application deadline in 12 days.</p>
                  <p className="text-[10px] font-bold text-slate-500 uppercase tracking-widest mt-1">Alert dispatched to abhishek.hirve97@gmail.com</p>
                </div>
              </div>
              <button className="px-5 py-2 bg-orange-500/10 text-orange-500 rounded-xl text-[10px] font-black uppercase tracking-widest border border-orange-500/20 hover:bg-orange-500 hover:text-white transition-all">
                Dismiss
              </button>
            </div>
            <div className="p-5 border border-slate-800 rounded-2xl text-[10px] font-bold text-slate-600 uppercase tracking-[0.2em] italic text-center">
              Intelligent notifications are calibrated to your verified researcher email.
            </div>
          </div>
       </div>
    </div>
  );
}
