import React, { useState, useEffect } from 'react';
import {
  UserProfile,
  TrainingPlan,
  WorkoutSession,
  VO2TestRecord,
  CheckInAssessment,
  WorkoutLog,
} from './types';
import {
  getProfile,
  getActivePlan,
  saveActivePlan,
  getAllVO2Tests,
  getLatestVO2Test,
  getTodayCheckIn,
  getAllWorkoutLogs,
  saveProfile,
} from './storage/indexedDB';
import { generateMacrocyclePlan } from './calculations/trainingCalculator';
import { Navigation } from './components/Navigation';
import { Onboarding } from './components/Onboarding';
import { HomeView } from './components/Home/HomeView';
import { CoachCheckIn } from './components/Coach/CoachCheckIn';
import { WorkoutView } from './components/Workout/WorkoutView';
import { WorkoutExecution } from './components/Workout/WorkoutExecution';
import { VO2TestHub } from './components/VO2Test/VO2TestHub';
import { EvolutionView } from './components/Evolution/EvolutionView';
import { ProfileView } from './components/Profile/ProfileView';
import { MathSelfTests } from './components/Diagnostic/MathSelfTests';
import { RefreshCw } from 'lucide-react';

export default function App() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'home' | 'treinos' | 'treinador' | 'evolucao' | 'perfil'>('home');

  // Core Data State
  const [loading, setLoading] = useState<boolean>(true);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [plan, setPlan] = useState<TrainingPlan | null>(null);
  const [latestTest, setLatestTest] = useState<VO2TestRecord | null>(null);
  const [allTests, setAllTests] = useState<VO2TestRecord[]>([]);
  const [todayCheckIn, setTodayCheckIn] = useState<CheckInAssessment | null>(null);
  const [workoutLogs, setWorkoutLogs] = useState<WorkoutLog[]>([]);

  // Modal overlays
  const [activeRunningSession, setActiveRunningSession] = useState<{
    session: WorkoutSession;
    weekNumber: number;
  } | null>(null);
  const [showVO2TestHub, setShowVO2TestHub] = useState<boolean>(false);
  const [showMathSelfTests, setShowMathSelfTests] = useState<boolean>(false);

  // Initial load from IndexedDB
  const loadAppData = async () => {
    try {
      const p = await getProfile();
      if (p) {
        setProfile(p);
        let activeP = await getActivePlan();
        if (!activeP || activeP.totalWeeks !== 4) {
          const latestT = await getLatestVO2Test();
          activeP = generateMacrocyclePlan(p, latestT ?? undefined);
          await saveActivePlan(activeP);
        }
        setPlan(activeP);

        const tests = await getAllVO2Tests();
        setAllTests(tests);
        const lTest = await getLatestVO2Test();
        setLatestTest(lTest);

        const cIn = await getTodayCheckIn();
        setTodayCheckIn(cIn);

        const logs = await getAllWorkoutLogs();
        setWorkoutLogs(logs);
      }
    } catch (err) {
      console.error('Error loading local applet data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAppData();
  }, []);

  // Handle Onboarding Completion
  const handleOnboardingComplete = async (newProfile: UserProfile) => {
    await saveProfile(newProfile);
    setProfile(newProfile);
    const newPlan = generateMacrocyclePlan(newProfile);
    await saveActivePlan(newPlan);
    setPlan(newPlan);
    setActiveTab('home');
  };

  // Find today's session based on day of week
  const getTodaySession = (): WorkoutSession | null => {
    if (!plan || plan.weeks.length === 0) return null;
    const currentWeek = plan.weeks[plan.currentWeekIndex || 0] || plan.weeks[0];

    // Day of week index (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
    const todayIndex = new Date().getDay();
    // In our model: 0=Dom, 1=Seg, 2=Ter, 3=Qua, 4=Qui, 5=Sex, 6=Sab
    const dayMap = [0, 1, 2, 3, 4, 5, 6];
    const sessionIndex = dayMap[todayIndex] % currentWeek.sessions.length;

    return currentWeek.sessions[sessionIndex] || currentWeek.sessions[0];
  };

  const todaySession = getTodaySession();

  // Loading Screen
  if (loading) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex flex-col items-center justify-center p-6 space-y-4 font-sans">
        <div className="w-12 h-12 rounded-2xl bg-[#111111] border border-[#222222] flex items-center justify-center text-[#FF5500] animate-spin">
          <RefreshCw className="w-6 h-6" />
        </div>
        <div className="text-center">
          <h2 className="text-lg font-black text-white">MINHA ASSESSORIA</h2>
          <p className="text-xs text-[#777777] mt-1">Carregando seus dados locais...</p>
        </div>
      </div>
    );
  }

  // If no profile, show Onboarding
  if (!profile || !profile.termsAccepted) {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // If plan not yet generated, fallback
  const currentPlan = plan || generateMacrocyclePlan(profile, latestTest ?? undefined);

  return (
    <div className="min-h-screen bg-[#000000] text-[#FFFFFF] font-sans antialiased selection:bg-[#FF5500] selection:text-black">
      {/* Top and Bottom Shell Navigation */}
      <Navigation
        currentTab={activeTab}
        onTabChange={(tab) => {
          setShowVO2TestHub(false);
          setActiveTab(tab);
        }}
      />

      {/* Main Tab Views */}
      <main className="min-h-screen">
        {activeTab === 'home' && (
          <HomeView
            profile={profile}
            plan={currentPlan}
            todaySession={todaySession}
            latestTest={latestTest}
            todayCheckIn={todayCheckIn}
            workoutLogs={workoutLogs}
            onStartSession={(session, weekNum) => {
              setActiveRunningSession({ session, weekNumber: weekNum });
            }}
            onOpenCheckIn={() => setActiveTab('treinador')}
            onOpenTestHub={() => setShowVO2TestHub(true)}
            onGoToPlan={() => setActiveTab('treinos')}
            onGoToEvolution={() => setActiveTab('evolucao')}
          />
        )}

        {activeTab === 'treinos' && (
          <WorkoutView
            profile={profile}
            plan={currentPlan}
            latestTest={latestTest}
            allTests={allTests}
            workoutLogs={workoutLogs}
            onStartSession={(session, weekNum) => {
              setActiveRunningSession({ session, weekNumber: weekNum });
            }}
            onUpdatePlan={async (updatedPlan) => {
              await saveActivePlan(updatedPlan);
              setPlan(updatedPlan);
            }}
            onOpenTestHub={() => setShowVO2TestHub(true)}
            onGoBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'treinador' && (
          <CoachCheckIn
            todaySession={todaySession}
            existingCheckIn={todayCheckIn}
            onCheckInComplete={(assessment) => {
              setTodayCheckIn(assessment);
            }}
            onGoToWorkout={() => {
              if (todaySession && !todaySession.isRestDay) {
                setActiveRunningSession({
                  session: todaySession,
                  weekNumber: currentPlan.currentWeekIndex + 1,
                });
              } else {
                setActiveTab('treinos');
              }
            }}
            onGoBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'evolucao' && (
          <EvolutionView
            tests={allTests}
            logs={workoutLogs}
            onOpenTestHub={() => setShowVO2TestHub(true)}
            onGoBack={() => setActiveTab('home')}
          />
        )}

        {activeTab === 'perfil' && (
          <ProfileView
            profile={profile}
            onProfileUpdated={(updated) => {
              setProfile(updated);
              // Regenerate plan if frequency or target changed
              const regPlan = generateMacrocyclePlan(updated, latestTest ?? undefined);
              saveActivePlan(regPlan);
              setPlan(regPlan);
            }}
            onDataReset={() => {
              setProfile(null);
              setPlan(null);
              setLatestTest(null);
              setAllTests([]);
              setTodayCheckIn(null);
              setWorkoutLogs([]);
            }}
            onOpenSelfTests={() => setShowMathSelfTests(true)}
            onGoBack={() => setActiveTab('home')}
          />
        )}
      </main>

      {/* VO2 Test Hub Modal */}
      {showVO2TestHub && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md overflow-y-auto">
          <div className="p-4 flex justify-end max-w-xl mx-auto">
            <button
              onClick={() => setShowVO2TestHub(false)}
              className="py-1.5 px-3 bg-[#1c1c1c] text-xs font-bold text-white rounded-xl border border-[#2a2a2a]"
            >
              ✕ Fechar
            </button>
          </div>
          <VO2TestHub
            profile={profile}
            onTestSaved={async (savedTest) => {
              setLatestTest(savedTest);
              const updatedTests = await getAllVO2Tests();
              setAllTests(updatedTests);
              // Re-calibrate plan with new VO2 test
              const updatedPlan = generateMacrocyclePlan(profile, savedTest);
              await saveActivePlan(updatedPlan);
              setPlan(updatedPlan);
            }}
            onClose={() => setShowVO2TestHub(false)}
          />
        </div>
      )}

      {/* Live Workout Execution Player Overlay */}
      {activeRunningSession && (
        <WorkoutExecution
          session={activeRunningSession.session}
          weekNumber={activeRunningSession.weekNumber}
          onFinish={async (newLog) => {
            const updatedLogs = await getAllWorkoutLogs();
            setWorkoutLogs(updatedLogs);
            setActiveRunningSession(null);
            setActiveTab('home');
          }}
          onCancel={() => setActiveRunningSession(null)}
        />
      )}

      {/* Mathematical Diagnostic Self-Tests Modal */}
      {showMathSelfTests && (
        <MathSelfTests onClose={() => setShowMathSelfTests(false)} />
      )}
    </div>
  );
}
