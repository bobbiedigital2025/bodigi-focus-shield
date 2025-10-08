import React, { useEffect, useMemo, useRef, useState } from "react";
// BoDiGi Focus Shield — v4
// Pastel + Learning + Affirmations + Tooling + Cloud Ops + Deploy Panel
// Single‑file React app. Everything persists to localStorage and is easy to tweak.

// ===== Editable Defaults =====
const DEFAULT_AFFIRMATIONS = [
  "You’re building a legacy, one commit at a time.",
  "Small steps compound. Ship the next brick.",
  "Your future self thanks you for today’s focus.",
  "You are capable, creative, and unstoppable.",
  "Progress over perfection. Keep going.",
];

const DEFAULT_LEARNING_TOPICS: LearningTopic[] = [
  { id: uid(), title: "Git & GitHub Basics", minutes: 20, link: "https://docs.github.com/" },
  { id: uid(), title: "GitHub Actions (CI)", minutes: 20, link: "https://docs.github.com/actions" },
  { id: uid(), title: "Docker 101", minutes: 20, link: "https://docs.docker.com/get-started/" },
  { id: uid(), title: "Vercel Deploy", minutes: 15, link: "https://vercel.com/docs" },
  { id: uid(), title: "Supabase + Auth", minutes: 20, link: "https://supabase.com/docs" },
];

const DEFAULT_TOOLING: ToolItem[] = [
  { id: uid(), label: "BoDiGi Cloud (self‑host later)", done: false },
  { id: uid(), label: "Deployment Orchestrator (one‑click, multi‑target)", done: false },
  { id: uid(), label: "Cost Monitor (usage + alerts)", done: false },
  { id: uid(), label: "AI Trainer (Ollama/LoRA local)", done: false },
  { id: uid(), label: "Template Marketplace (agents/apps)", done: false },
];

const DEFAULT_DEPLOY_STEPS: StepItem[] = [
  { id: uid(), label: "Push repo to GitHub", done: false },
  { id: uid(), label: "Vercel: connect repo + set env", done: false },
  { id: uid(), label: "Local: Docker compose up", done: false },
  { id: uid(), label: "GCP: build + push image", done: false },
  { id: uid(), label: "Cloud Run deploy", done: false },
];

// ===== Component =====
export default function FocusShieldApp() {
  // Core timers
  const [clockedIn, setClockedIn] = useState(false);
  const [isRunning, setIsRunning] = useState(false);
  const [focusSeconds, setFocusSeconds] = useState(25 * 60);
  const [remaining, setRemaining] = useState(25 * 60);
  const [breakSeconds, setBreakSeconds] = useState(5 * 60);
  const [onBreak, setOnBreak] = useState(false);

  // Overlays
  const [showBreakOverlay, setShowBreakOverlay] = useState(false);
  const [showChecklistOverlay, setShowChecklistOverlay] = useState(false);
  const [showNudgeOverlay, setShowNudgeOverlay] = useState(false);
  const [showAffirmOverlay, setShowAffirmOverlay] = useState<string | null>(null);
  const [showLearningOverlay, setShowLearningOverlay] = useState<LearningTopic | null>(null);

  // Nudges & affirmations
  const [nudgeMin, setNudgeMin] = useState(12);
  const [nudgeMax, setNudgeMax] = useState(20);
  const [affirmEveryMin, setAffirmEveryMin] = useState(30);
  const [affirmations, setAffirmations] = useState<string[]>(DEFAULT_AFFIRMATIONS);

  // Learning blocks
  const [learningEnabled, setLearningEnabled] = useState(true);
  const [learningIntervalMin, setLearningIntervalMin] = useState(45);
  const [learningTopics, setLearningTopics] = useState<LearningTopic[]>(DEFAULT_LEARNING_TOPICS);
  const [learningIndex, setLearningIndex] = useState(0);

  // Checklist
  const [checklist, setChecklist] = useState<string[]>([
    "ONE main goal",
    "ONE active task",
    "Open Focus Shield",
    "Commit once today (git)",
  ]);
  const [checked, setChecked] = useState<Record<string, boolean>>({});

  // Tooling checklist (what we’re building next)
  const [tooling, setTooling] = useState<ToolItem[]>(DEFAULT_TOOLING);

  // Deploy steps checklist
  const [deploySteps, setDeploySteps] = useState<StepItem[]>(DEFAULT_DEPLOY_STEPS);

  // Theme
  const [pastel, setPastel] = useState(true);
  const [playSound, setPlaySound] = useState(true);

  // Cloud Ops state (Google Cloud now → BoDiGi Cloud later)
  const [gcpProject, setGcpProject] = useState("");
  const [gcpRegion, setGcpRegion] = useState("us-central1");
  const [artifactRegion, setArtifactRegion] = useState("us"); // Artifact Registry location
  const [serviceName, setServiceName] = useState("bodigi-core-hub");
  const [imageName, setImageName] = useState("core-api"); // Docker image short name
  const [bucketName, setBucketName] = useState("");
  const [vertexTrain, setVertexTrain] = useState(true); // show Vertex AI commands

  // refs
  const intervalRef = useRef<number | null>(null);
  const nudgeTimeoutRef = useRef<number | null>(null);
  const affirmTimeoutRef = useRef<number | null>(null);
  const learningTimeoutRef = useRef<number | null>(null);
  const bellRef = useRef<HTMLAudioElement | null>(null);

  // ===== Persistence =====
  useEffect(() => {
    try {
      const saved = localStorage.getItem("focusShieldV4");
      if (saved) {
        const d = JSON.parse(saved);
        setClockedIn(!!d.clockedIn);
        setIsRunning(!!d.isRunning);
        setFocusSeconds(d.focusSeconds ?? 1500);
        setRemaining(d.remaining ?? d.focusSeconds ?? 1500);
        setBreakSeconds(d.breakSeconds ?? 300);
        setOnBreak(!!d.onBreak);
        setNudgeMin(d.nudgeMin ?? 12);
        setNudgeMax(d.nudgeMax ?? 20);
        setAffirmEveryMin(d.affirmEveryMin ?? 30);
        setAffirmations(Array.isArray(d.affirmations) ? d.affirmations : DEFAULT_AFFIRMATIONS);
        setLearningEnabled(d.learningEnabled ?? true);
        setLearningIntervalMin(d.learningIntervalMin ?? 45);
        setLearningTopics(Array.isArray(d.learningTopics) ? d.learningTopics : DEFAULT_LEARNING_TOPICS);
        setChecklist(Array.isArray(d.checklist) ? d.checklist : checklist);
        setChecked(d.checked ?? {});
        setPastel(d.pastel ?? true);
        setPlaySound(d.playSound ?? true);
        setTooling(Array.isArray(d.tooling) ? d.tooling : DEFAULT_TOOLING);
        setDeploySteps(Array.isArray(d.deploySteps) ? d.deploySteps : DEFAULT_DEPLOY_STEPS);
        setGcpProject(d.gcpProject ?? "");
        setGcpRegion(d.gcpRegion ?? "us-central1");
        setArtifactRegion(d.artifactRegion ?? "us");
        setServiceName(d.serviceName ?? "bodigi-core-hub");
        setImageName(d.imageName ?? "core-api");
        setBucketName(d.bucketName ?? "");
        setVertexTrain(d.vertexTrain ?? true);
      }
    } catch {}
    // Ask notification permission on first click
    const ask = () => {
      if ("Notification" in window && Notification.permission === "default") Notification.requestPermission();
      window.removeEventListener("click", ask);
    };
    window.addEventListener("click", ask);
    return () => window.removeEventListener("click", ask);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const data = {
      clockedIn, isRunning, focusSeconds, remaining, breakSeconds, onBreak,
      nudgeMin, nudgeMax, affirmEveryMin, affirmations,
      learningEnabled, learningIntervalMin, learningTopics, checklist, checked,
      pastel, playSound, tooling, deploySteps,
      gcpProject, gcpRegion, artifactRegion, serviceName, imageName, bucketName, vertexTrain,
    };
    localStorage.setItem("focusShieldV4", JSON.stringify(data));
  }, [clockedIn, isRunning, focusSeconds, remaining, breakSeconds, onBreak, nudgeMin, nudgeMax, affirmEveryMin, affirmations, learningEnabled, learningIntervalMin, learningTopics, checklist, checked, pastel, playSound, tooling, deploySteps, gcpProject, gcpRegion, artifactRegion, serviceName, imageName, bucketName, vertexTrain]);

  // ===== Utils =====
  const notify = (title: string, body?: string) => {
    if ("Notification" in window && Notification.permission === "granted") new Notification(title, { body });
  };
  const ding = () => {
    if (!playSound) return; try { if (bellRef.current) { bellRef.current.currentTime = 0; bellRef.current.play(); } } catch {}
  };

  // ===== Timer =====
  useEffect(() => {
    if (!isRunning) return;
    if (intervalRef.current) window.clearInterval(intervalRef.current);
    intervalRef.current = window.setInterval(() => {
      setRemaining(prev => {
        if (prev <= 1) {
          window.clearInterval(intervalRef.current!);
          setIsRunning(false);
          if (onBreak) {
            setOnBreak(false);
            setRemaining(focusSeconds);
            setShowNudgeOverlay(false);
            notify("Break finished", "Back to focus ✨");
          } else {
            setOnBreak(true);
            setRemaining(breakSeconds);
            setShowBreakOverlay(true);
            notify("Break time", "Stand up, breathe, water.");
          }
          ding();
          return 0;
        }
        return prev - 1;
      });
    }, 1000) as unknown as number;
    return () => intervalRef.current && window.clearInterval(intervalRef.current);
  }, [isRunning, onBreak, focusSeconds, breakSeconds]);

  useEffect(() => { if (!onBreak) setRemaining(focusSeconds); }, [focusSeconds, onBreak]);

  const hhmmss = useMemo(() => {
    const s = Math.max(0, remaining);
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return (h ? `${h}:` : "") + `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  }, [remaining]);

  // ===== Focus Checks =====
  const scheduleNudge = () => {
    if (nudgeTimeoutRef.current) window.clearTimeout(nudgeTimeoutRef.current);
    const min = Math.max(1, nudgeMin) * 60 * 1000;
    const max = Math.max(min, nudgeMax * 60 * 1000);
    const wait = Math.floor(Math.random() * (max - min + 1)) + min;
    nudgeTimeoutRef.current = window.setTimeout(() => {
      if (clockedIn && !onBreak) { setShowNudgeOverlay(true); notify("Focus check", "Are we still on the ONE task?"); ding(); }
      scheduleNudge();
    }, wait) as unknown as number;
  };
  useEffect(() => { if (clockedIn) scheduleNudge(); return () => nudgeTimeoutRef.current && window.clearTimeout(nudgeTimeoutRef.current); }, [clockedIn, onBreak, nudgeMin, nudgeMax]);

  // ===== Affirmations =====
  const scheduleAffirm = () => {
    if (affirmTimeoutRef.current) window.clearTimeout(affirmTimeoutRef.current);
    const wait = Math.max(1, affirmEveryMin) * 60 * 1000;
    affirmTimeoutRef.current = window.setTimeout(() => {
      if (clockedIn && !onBreak && affirmations.length) {
        const pick = affirmations[Math.floor(Math.random() * affirmations.length)];
        setShowAffirmOverlay(pick); notify("You’ve got this", pick); ding();
      }
      scheduleAffirm();
    }, wait) as unknown as number;
  };
  useEffect(() => { scheduleAffirm(); return () => affirmTimeoutRef.current && window.clearTimeout(affirmTimeoutRef.current); }, [clockedIn, onBreak, affirmEveryMin, affirmations]);

  // ===== Learning Blocks =====
  const scheduleLearning = () => {
    if (learningTimeoutRef.current) window.clearTimeout(learningTimeoutRef.current);
    if (!learningEnabled || !learningTopics.length) return;
    const wait = Math.max(5, learningIntervalMin) * 60 * 1000;
    learningTimeoutRef.current = window.setTimeout(() => {
      if (clockedIn && !onBreak) {
        const topic = learningTopics[learningIndex % learningTopics.length];
        setLearningIndex((i) => i + 1);
        setShowLearningOverlay(topic); notify("Learning Block", topic.title); ding();
      }
      scheduleLearning();
    }, wait) as unknown as number;
  };
  useEffect(() => { scheduleLearning(); return () => learningTimeoutRef.current && window.clearTimeout(learningTimeoutRef.current); }, [clockedIn, onBreak, learningEnabled, learningIntervalMin, learningTopics, learningIndex]);

  // ===== Actions =====
  const toggleRun = () => { if (!clockedIn) setClockedIn(true); setIsRunning((s) => !s); };
  const startFocus = () => { setOnBreak(false); setRemaining(focusSeconds); setIsRunning(true); setShowBreakOverlay(false); setShowNudgeOverlay(false); notify("Focus started", "Deep work mode engaged"); };
  const startBreak = () => { setOnBreak(true); setRemaining(breakSeconds); setIsRunning(true); setShowBreakOverlay(true); notify("Break started", "Stretch, water, breathe"); };
  const clockInOut = () => { if (clockedIn) { setClockedIn(false); setIsRunning(false); setOnBreak(false); setShowBreakOverlay(false); setShowNudgeOverlay(false); setShowAffirmOverlay(null); setShowLearningOverlay(null); setRemaining(focusSeconds); notify("Clocked out", "Great work today ✨"); } else { setClockedIn(true); notify("Clocked in", "Let’s win this session"); } };

  const addChecklistItem = () => { const text = prompt("New checklist item:"); if (!text) return; setChecklist((c) => [...c, text]); };
  const toggleCheck = (item: string) => setChecked((c) => ({ ...c, [item]: !c[item] }));

  const addAffirmation = () => { const t = prompt("Add affirmation:"); if (t) setAffirmations((a) => [...a, t]); };
  const addLearningTopic = () => {
    const title = prompt("Learning topic title:"); if (!title) return;
    const minutes = Number(prompt("Suggested minutes (e.g., 20):") || "20");
    const link = prompt("Optional link (docs/tutorial):", "https://");
    setLearningTopics((ls) => [...ls, { id: uid(), title, minutes: Math.max(5, minutes), link: link || undefined }]);
  };

  // ===== Cloud Commands (copy‑ready) =====
  const artifactRepo = `${artifactRegion}-docker.pkg.dev/${gcpProject}/bodigi/${imageName}`;
  const dockerBuild = `docker build -t ${artifactRepo}:v1 -f infra/docker/core-api.Dockerfile .`;
  const gcloudAuth = `gcloud auth login
 gcloud config set project ${gcpProject}
 gcloud auth configure-docker ${artifactRegion}-docker.pkg.dev`;
  const gcloudCreateRepo = `gcloud artifacts repositories create bodigi --repository-format=docker --location=${artifactRegion}`;
  const dockerPush = `docker push ${artifactRepo}:v1`;
  const cloudRunDeploy = `gcloud run deploy ${serviceName} --image=${artifactRepo}:v1 --region=${gcpRegion} --platform=managed --allow-unauthenticated --set-env-vars NEXT_PUBLIC_SUPABASE_URL=...,NEXT_PUBLIC_SUPABASE_ANON_KEY=...`;
  const gcsMakeBucket = bucketName ? `gsutil mb -l ${gcpRegion} gs://${bucketName}` : "# Set a bucket name above to see the command";
  const vertexTraining = vertexTrain
    ? `# Example: custom training (Docker) on Vertex AI
` +
      `gcloud ai custom-jobs create \
  --region=${gcpRegion} \
  --display-name=trainer-job-$(date +%s) \
  --worker-pool-spec=machine-type=n1-standard-4,replica-count=1,container-image-uri=${artifactRepo}:v1,local-package-path=services/trainer`
    : "# Vertex training disabled";

  // ===== Styling =====
  const pastelPage = pastel ? "bg-gradient-to-b from-rose-50 via-sky-50 to-violet-50 text-slate-700" : "bg-neutral-950 text-neutral-100";
  const card = pastel ? "rounded-2xl border border-white/60 bg-white/70 backdrop-blur p-6 shadow-md" : "rounded-2xl border border-neutral-800 p-6 bg-neutral-900";
  const headerBg = pastel ? "border-b border-white/60 bg-white/70" : "border-b border-neutral-800 bg-neutral-900/70 backdrop-blur";
  const btnPrimary = pastel ? "px-4 py-2 rounded-xl bg-violet-400 hover:bg-violet-300 text-slate-800 font-semibold" : "px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 font-semibold";
  const btn = pastel ? "px-3 py-1 rounded-xl bg-white/70 hover:bg-white/90 text-slate-700" : "px-3 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700";
  const chip = pastel ? "px-2 py-1 rounded-lg text-xs bg-white/70" : "px-2 py-1 rounded-lg text-xs bg-neutral-800";

  // ===== UI =====
  return (
    <div className={`min-h-screen ${pastelPage}`}>
      <audio ref={bellRef} src="https://actions.google.com/sounds/v1/alarms/alarm_clock.ogg" preload="auto" />

      <header className={`sticky top-0 z-10 px-4 py-3 flex items-center justify-between ${headerBg}`}>
        <h1 className="text-xl font-bold">BoDiGi Focus Shield</h1>
        <div className="flex items-center gap-2">
          <button onClick={() => setPastel((p) => !p)} className={btn}>{pastel ? "Pastel On" : "Pastel Off"}</button>
          <button onClick={() => setShowChecklistOverlay(true)} className={btn}>Checklist</button>
          <button onClick={clockInOut} className={clockedIn ? `${btn} !bg-rose-300` : `${btn} !bg-emerald-300`}>{clockedIn ? "Clock Out" : "Clock In"}</button>
        </div>
      </header>

      <main className="max-w-6xl mx-auto p-6 grid xl:grid-cols-4 md:grid-cols-3 gap-6">
        {/* Timer */}
        <section className={card}>
          <div className="flex items-center justify-between gap-4">
            <div>
              <div className="text-sm opacity-70">{onBreak ? "Break" : "Focus"} timer</div>
              <div className="text-6xl font-black tracking-tight mt-1">{hhmmss}</div>
              <div className="mt-2 text-sm opacity-70">Space=start/pause</div>
            </div>
            <div className="flex flex-col gap-2 items-end">
              <button onClick={toggleRun} className={btnPrimary}>{isRunning ? "Pause" : "Start"}</button>
              <div className="flex gap-2">
                <button onClick={startFocus} className={btn}>Focus</button>
                <button onClick={startBreak} className={btn}>Break</button>
              </div>
            </div>
          </div>

          {/* Presets */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-6">
            {[25, 50, 90].map((m) => (
              <button key={m} onClick={() => { setFocusSeconds(m * 60); setRemaining(m * 60); }} className={`${btn} border border-transparent`}>{m}m Focus</button>
            ))}
            <div className="flex items-center gap-2 col-span-2 md:col-span-1">
              <input type="number" min={1} className="w-20 px-2 py-2 rounded-lg border border-black/10 bg-white/80" placeholder="mins" onChange={(e) => { const v = Math.max(1, Number(e.target.value || 0)); setFocusSeconds(v * 60); setRemaining(v * 60); }} />
              <span className="text-sm opacity-70">Custom</span>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Break:</label>
              <select className="px-2 py-2 rounded-lg border border-black/10 bg-white/80" value={breakSeconds} onChange={(e) => setBreakSeconds(Number(e.target.value))}>
                {[5,10,15,20].map(m => <option key={m} value={m*60}>{m}m</option>)}
              </select>
            </div>
            <div className="flex items-center gap-2">
              <label className="text-sm">Sound</label>
              <input type="checkbox" checked={playSound} onChange={(e) => setPlaySound(e.target.checked)} />
            </div>
          </div>
        </section>

        {/* Mindset & Learning */}
        <section className={card}>
          <h2 className="text-lg font-semibold mb-2">Mindset & Checks</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="font-semibold">Focus Checks</h3>
              <div className="mt-2 flex items-center gap-2"><span className="text-sm">Min</span><input type="number" className="w-20 px-2 py-1 rounded border border-black/10 bg-white/80" value={nudgeMin} onChange={(e)=>setNudgeMin(Math.max(1, Number(e.target.value||1)))} /><span className="text-sm">Max</span><input type="number" className="w-20 px-2 py-1 rounded border border-black/10 bg-white/80" value={nudgeMax} onChange={(e)=>setNudgeMax(Math.max(1, Number(e.target.value||1)))} /></div>
              <button onClick={() => { setShowNudgeOverlay(true); ding(); notify("Focus check","Manual check"); }} className={`${btn} mt-2`}>Test Focus Check</button>
            </div>
            <div>
              <h3 className="font-semibold">Affirmations</h3>
              <div className="mt-2 flex items-center gap-2"><span className="text-sm">Every</span><input type="number" className="w-24 px-2 py-1 rounded border border-black/10 bg-white/80" value={affirmEveryMin} onChange={(e)=>setAffirmEveryMin(Math.max(1, Number(e.target.value||1)))} /><span className="text-sm">min</span></div>
              <div className="mt-2 flex gap-2"><button onClick={addAffirmation} className={btn}>Add</button><button onClick={() => { const pick = affirmations[Math.floor(Math.random()*affirmations.length)] || "You got this!"; setShowAffirmOverlay(pick); ding(); }} className={btn}>Test Pop‑Up</button></div>
              <ul className="mt-2 text-sm list-disc pl-4">
                {affirmations.map((a,i)=>(<li key={i} className="flex items-start gap-2"><span className="flex-1">{a}</span><button className={`${chip}`} onClick={()=>setAffirmations(prev=>prev.filter((_,j)=>j!==i))}>remove</button></li>))}
              </ul>
            </div>
          </div>

          <h2 className="text-lg font-semibold mt-6">Learning Blocks</h2>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2"><input type="checkbox" checked={learningEnabled} onChange={(e)=>setLearningEnabled(e.target.checked)} /><span>Enable</span></label>
            <div className="flex items-center gap-2"><span className="text-sm">Every</span><input type="number" className="w-20 px-2 py-1 rounded border border-black/10 bg-white/80" value={learningIntervalMin} onChange={(e)=>setLearningIntervalMin(Math.max(5, Number(e.target.value||5)))} /><span className="text-sm">min</span></div>
            <button onClick={addLearningTopic} className={btn}>Add Topic</button>
            <button onClick={() => { const t = learningTopics[learningIndex % learningTopics.length] || null; if (t){ setShowLearningOverlay(t); ding(); } }} className={btn}>Test Block</button>
          </div>
          <ul className="mt-3 space-y-2">
            {learningTopics.map((t, i)=> (
              <li key={t.id} className="flex items-center gap-2">
                <span className="flex-1"><strong>{i+1}.</strong> {t.title} <span className="opacity-60">({t.minutes}m)</span>{t.link && <> — <a href={t.link} target="_blank" rel="noreferrer" className="underline">docs</a></>}</span>
                <button className={chip} onClick={()=>setLearningTopics(prev=>prev.filter(x=>x.id!==t.id))}>remove</button>
              </li>
            ))}
          </ul>
        </section>

        {/* Tooling Checklist */}
        <section className={card}>
          <h2 className="text-lg font-semibold mb-2">Tooling We’re Building</h2>
          <ul className="space-y-2">
            {tooling.map((t, i) => (
              <li key={t.id} className="flex items-center gap-2">
                <input type="checkbox" checked={t.done} onChange={() => setTooling(prev => prev.map((x,j)=> j===i ? { ...x, done: !x.done } : x))} />
                <span className={t.done ? "line-through opacity-60" : ""}>{t.label}</span>
                <button className={chip} onClick={() => setTooling(prev => prev.filter((_,j)=>j!==i))}>remove</button>
              </li>
            ))}
          </ul>
          <button className={`${btn} mt-3`} onClick={() => {
            const label = prompt("New tool item:");
            if (label) setTooling(prev => [...prev, { id: uid(), label, done: false }]);
          }}>Add Item</button>
        </section>

        {/* Deploy Panel */}
        <section className={card}>
          <h2 className="text-lg font-semibold mb-2">Deploy — step by step</h2>
          <ul className="space-y-2">
            {deploySteps.map((s, i) => (
              <li key={s.id} className="flex items-center gap-2">
                <input type="checkbox" checked={s.done} onChange={() => setDeploySteps(prev => prev.map((x,j)=> j===i ? { ...x, done: !x.done } : x))} />
                <span className={s.done ? "line-through opacity-60" : ""}>{s.label}</span>
              </li>
            ))}
          </ul>

          <h3 className="font-semibold mt-4">A) Vercel (quick public URL)</h3>
          <CmdBlock title="Install + Login" cmd={`npm i -g vercel
vercel login`} btn={btn} />
          <CmdBlock title="Link + Deploy" cmd={`vercel link
vercel --prod`} btn={btn} />

          <h3 className="font-semibold mt-4">B) Local Docker (learn containers)"</h3>
          <CmdBlock title="Compose Up" cmd={`cd infra/docker
docker compose up --build`} btn={btn} />

          <h3 className="font-semibold mt-4">C) Google Cloud Run (scalable)"</h3>
          <p className="text-sm opacity-70">Fill Cloud Ops panel → then do these</p>
          <CmdBlock title="Auth & Project" cmd={`gcloud auth login
gcloud config set project ${gcpProject}`} btn={btn} />
          <CmdBlock title="Build & Push" cmd={`${dockerBuild}
${dockerPush}`} btn={btn} />
          <CmdBlock title="Deploy" cmd={cloudRunDeploy} btn={btn} />
        </section>

        {/* Cloud Ops (Google Cloud now) */}
        <section className={`${card} xl:col-span-1 md:col-span-3`}>
          <h2 className="text-lg font-semibold mb-2">Cloud Ops — Google Cloud (for now)</h2>
          <p className="text-sm opacity-70">Use these copy‑ready commands to deploy on Cloud Run and prep Vertex AI training. Later we’ll replace this with BoDiGi Cloud.</p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3">
            <LabeledInput label="GCP Project" value={gcpProject} onChange={setGcpProject} placeholder="my-gcp-project" />
            <LabeledInput label="Cloud Run Region" value={gcpRegion} onChange={setGcpRegion} placeholder="us-central1" />
            <LabeledInput label="Artifact Region" value={artifactRegion} onChange={setArtifactRegion} placeholder="us" />
            <LabeledInput label="Service Name" value={serviceName} onChange={setServiceName} placeholder="bodigi-core-hub" />
            <LabeledInput label="Image Name" value={imageName} onChange={setImageName} placeholder="core-api" />
            <LabeledInput label="GCS Bucket" value={bucketName} onChange={setBucketName} placeholder="bodigi-train-data" />
          </div>

          <CmdBlock title="Auth & Project" cmd={gcloudAuth} btn={btn} />
          <CmdBlock title="Create Artifact Registry" cmd={gcloudCreateRepo} btn={btn} />
          <CmdBlock title="Docker Build" cmd={dockerBuild} btn={btn} />
          <CmdBlock title="Docker Push" cmd={dockerPush} btn={btn} />
          <CmdBlock title="Deploy to Cloud Run" cmd={cloudRunDeploy} btn={btn} />
          <CmdBlock title="Make GCS Bucket" cmd={gcsMakeBucket} btn={btn} />
          <div className="mt-3 flex items-center gap-2">
            <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={vertexTrain} onChange={(e)=>setVertexTrain(e.target.checked)} />Include Vertex AI job</label>
          </div>
          <CmdBlock title="Vertex AI — Custom Training Job" cmd={vertexTraining} btn={btn} />
          <p className="mt-3 text-xs opacity-70">Note: Replace env vars and make sure your Dockerfile builds the right service. This app generates commands only; run them in your terminal.</p>
        </section>
      </main>

      {/* Overlays */}
      {showBreakOverlay && (
        <Overlay pastel={pastel} onClose={() => setShowBreakOverlay(false)}>
          <h2 className="text-4xl font-black">Break Time</h2>
          <p className="mt-2 opacity-80">Stand up, stretch, hydrate. You deserve it. ✨</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowBreakOverlay(false)} className={btn}>Hide</button>
            <button onClick={startFocus} className={btnPrimary}>Back to Focus</button>
          </div>
        </Overlay>
      )}

      {showChecklistOverlay && (
        <Overlay pastel={pastel} onClose={() => setShowChecklistOverlay(false)}>
          <h2 className="text-3xl font-bold">Session Checklist</h2>
          <ul className="mt-4 space-y-3 max-h-[50vh] overflow-auto">
            {checklist.map((item) => (
              <li key={item} className="flex items-center gap-3">
                <input type="checkbox" checked={!!checked[item]} onChange={() => toggleCheck(item)} />
                <span className={checked[item] ? "line-through opacity-60" : ""}>{item}</span>
              </li>
            ))}
          </ul>
          <div className="mt-6 flex gap-3">
            <button onClick={addChecklistItem} className={btn}>Add Item</button>
            <button onClick={() => setShowChecklistOverlay(false)} className={btnPrimary}>Done</button>
          </div>
        </Overlay>
      )}

      {showNudgeOverlay && (
        <Overlay pastel={pastel} onClose={() => setShowNudgeOverlay(false)}>
          <h2 className="text-4xl font-black">Focus Check</h2>
          <p className="mt-2 opacity-80">Are we on the ONE task? Anything distracting → Parking Lot.</p>
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowNudgeOverlay(false)} className={btnPrimary}>Yes, I’m on task</button>
            <button onClick={() => { setShowChecklistOverlay(true); setShowNudgeOverlay(false); }} className={btn}>Open Checklist</button>
          </div>
        </Overlay>
      )}

      {showAffirmOverlay && (
        <Overlay pastel={pastel} onClose={() => setShowAffirmOverlay(null)}>
          <h2 className="text-3xl font-bold">✨ Affirmation</h2>
          <p className="mt-3 text-xl">{showAffirmOverlay}</p>
          <div className="mt-6">
            <button onClick={() => setShowAffirmOverlay(null)} className={btnPrimary}>Back to work</button>
          </div>
        </Overlay>
      )}

      {showLearningOverlay && (
        <Overlay pastel={pastel} onClose={() => setShowLearningOverlay(null)}>
          <h2 className="text-3xl font-bold">📘 Learning Block</h2>
          <p className="mt-2 text-lg">{showLearningOverlay.title} <span className="opacity-60">({showLearningOverlay.minutes}m)</span></p>
          {showLearningOverlay.link && (
            <p className="mt-3"><a className="underline" href={showLearningOverlay.link} target="_blank" rel="noreferrer">Open reference docs →</a></p>
          )}
          <div className="mt-6 flex gap-3">
            <button onClick={() => setShowLearningOverlay(null)} className={btnPrimary}>Start Learning</button>
            <button onClick={() => setShowLearningOverlay(null)} className={btn}>Later</button>
          </div>
        </Overlay>
      )}

      <footer className="px-4 py-6 text-center text-xs opacity-70">BoDiGi Focus Shield v4 — pastel mode with learning, affirmations, tooling, deploy steps, and Google Cloud Ops 💖</footer>
    </div>
  );
}

// ===== Small components =====
function Overlay({ children, onClose, pastel }: { children: React.ReactNode; onClose: () => void; pastel: boolean; }) {
  const bg = pastel ? "bg-black/20" : "bg-black/80";
  const panel = pastel ? "max-w-2xl w-full rounded-3xl border border-white/60 bg-white/90 p-8 text-center shadow-2xl" : "max-w-2xl w-full rounded-3xl border border-neutral-800 bg-neutral-900 p-8 text-center shadow-2xl";
  useEffect(() => { const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); }; window.addEventListener("keydown", onKey); return () => window.removeEventListener("keydown", onKey); }, [onClose]);
  return (
    <div className={`fixed inset-0 z-50 grid place-items-center ${bg} p-6`}>
      <div className={panel}>
        {children}
        <div className="mt-6 text-sm opacity-60">Esc to close</div>
      </div>
    </div>
  );
}

function LabeledInput({ label, value, onChange, placeholder }: { label: string; value: string; onChange: (v: string)=>void; placeholder?: string }) {
  return (
    <label className="text-sm">
      <div className="opacity-70 mb-1">{label}</div>
      <input className="w-full px-3 py-2 rounded-lg border border-black/10 bg-white/80" value={value} onChange={(e)=>onChange(e.target.value)} placeholder={placeholder} />
    </label>
  );
}

function CmdBlock({ title, cmd, btn }: { title: string; cmd: string; btn: string }) {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try { await navigator.clipboard.writeText(cmd); setCopied(true); setTimeout(()=>setCopied(false), 1500); } catch {}
  };
  return (
    <div className="mt-3">
      <div className="flex items-center justify-between">
        <h3 className="font-semibold text-sm">{title}</h3>
        <button onClick={copy} className={btn}>{copied ? "Copied" : "Copy"}</button>
      </div>
      <pre className="mt-2 text-xs whitespace-pre-wrap p-3 rounded-xl border border-black/10 bg-white/70">{cmd}</pre>
    </div>
  );
}

// ===== Types & helpers =====
interface LearningTopic { id: string; title: string; minutes: number; link?: string }
interface ToolItem { id: string; label: string; done: boolean }
interface StepItem { id: string; label: string; done: boolean }
function uid() { return Math.random().toString(36).slice(2, 10); }
