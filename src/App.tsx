import { useState, useEffect } from 'react';
import { 
  Shield, 
  Activity, 
  AlertTriangle, 
  Terminal, 
  Server, 
  Cpu, 
  Database,
  Search,
  BookOpen,
  Github,
  CheckCircle2,
  Lock,
  ChevronRight,
  RefreshCcw,
  Zap
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend
} from 'recharts';
import { motion, AnimatePresence } from 'motion/react';
import { format } from 'date-fns';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Utility for tailwind classes
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Stats {
  activeUsers: number;
  uptime: string;
  totalLogsProcessed: number;
  threatsDetected: number;
  systemHealth: string;
  activeBlocks: number;
  cpuUsage: { time: string; value: number }[];
  threatDistribution: { name: string; value: number }[];
}

interface Alert {
  id: number;
  type: 'CRITICAL' | 'WARNING' | 'INFO';
  source: string;
  message: string;
  timestamp: string;
}

interface Block {
  ip: string;
  reason: string;
  expiry: string;
}

// --- Components ---

const StatCard = ({ title, value, icon: Icon, trend }: any) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[#151619] border border-[#2D2E35] p-6 rounded-xl hover:border-blue-500/50 transition-all group"
  >
    <div className="flex justify-between items-start mb-4">
      <div className="p-2 bg-blue-500/10 rounded-lg group-hover:bg-blue-500/20 transition-colors">
        <Icon className="w-5 h-5 text-blue-400" />
      </div>
      {trend && (
        <span className="text-xs font-medium text-green-400 bg-green-400/10 px-2 py-1 rounded-full">
          {trend}
        </span>
      )}
    </div>
    <p className="text-[#8E9299] text-sm font-medium mb-1 uppercase tracking-wider">{title}</p>
    <p className="text-2xl font-bold text-white tracking-tight">{value}</p>
  </motion.div>
);

const LogEntry = ({ alert }: { alert: Alert }) => (
  <div className="flex items-center gap-4 py-3 border-b border-[#2D2E35] hover:bg-[#202124] transition-colors px-4 group">
    <div className={cn(
      "w-2 h-2 rounded-full ring-2 ring-offset-2 ring-offset-[#151619]",
      alert.type === 'CRITICAL' ? "bg-red-500 ring-red-500/20" :
      alert.type === 'WARNING' ? "bg-amber-500 ring-amber-500/20" : "bg-blue-500 ring-blue-500/20"
    )} />
    <span className="text-xs font-mono text-[#8E9299] w-32">{format(new Date(alert.timestamp), 'HH:mm:ss')}</span>
    <span className="text-xs font-bold px-2 py-0.5 rounded bg-[#2D2E35] text-white w-20 text-center">{alert.source}</span>
    <p className="text-sm text-gray-300 flex-1 truncate">{alert.message}</p>
    <Search className="w-4 h-4 text-[#8E9299] opacity-0 group-hover:opacity-100 cursor-pointer" />
  </div>
);

export default function App() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [blocks, setBlocks] = useState<Block[]>([]);
  const [activeTab, setActiveTab] = useState<'overview' | 'logs' | 'ai' | 'docs'>('overview');
  const [analysisInput, setAnalysisInput] = useState('');
  const [analysisResult, setAnalysisResult] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const COLORS = ['#3B82F6', '#EF4444', '#F59E0B', '#10B981'];

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [statsRes, alertsRes, blocksRes] = await Promise.all([
          fetch('/api/stats'),
          fetch('/api/alerts'),
          fetch('/api/active-blocks')
        ]);
        setStats(await statsRes.json());
        setAlerts(await alertsRes.json());
        setBlocks(await blocksRes.json());
      } catch (err) {
        console.error("Failed to fetch data:", err);
      }
    };
    fetchData();
  }, []);

  const handleAIAnalyze = async () => {
    if (!analysisInput) return;
    setIsAnalyzing(true);
    try {
      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ logEntry: analysisInput })
      });
      const data = await res.json();
      setAnalysisResult(data.analysis);
    } catch (err) {
      setAnalysisResult("Failed to analyze. Check API Key configuration.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-blue-500/30">
      {/* --- Sidebar --- */}
      <nav className="fixed left-0 top-0 bottom-0 w-64 bg-[#151619] border-r border-[#2D2E35] p-6 z-50">
        <div className="flex items-center gap-3 mb-10 px-2">
          <div className="bg-red-600 p-2 rounded-lg shine-glow">
            <Lock className="w-6 h-6 text-white" />
          </div>
          <h1 className="text-xl font-bold tracking-tight">SentinelLog <span className="text-red-500">SOAR</span></h1>
        </div>

        <div className="space-y-2">
          {[
            { id: 'overview', icon: Activity, label: 'Visual Intelligence' },
            { id: 'logs', icon: Terminal, label: 'Security Stream' },
            { id: 'ai', icon: Zap, label: 'AI SOC Analyst' },
            { id: 'docs', icon: BookOpen, label: 'System Blueprint' },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id as any)}
              className={cn(
                "w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all font-medium",
                activeTab === item.id 
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" 
                  : "text-[#8E9299] hover:bg-white/5 hover:text-white"
              )}
            >
              <item.icon className="w-5 h-5" />
              {item.label}
            </button>
          ))}
        </div>

        <div className="absolute bottom-6 left-6 right-6">
          <div className="p-4 bg-[#202124] rounded-xl border border-[#2D2E35]">
            <p className="text-xs text-[#8E9299] mb-1 font-bold uppercase">Node Status</p>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              <span className="text-sm font-mono tracking-tight">SOC-USA-01-LIVE</span>
            </div>
          </div>
        </div>
      </nav>

      {/* --- Main Content --- */}
      <main className="pl-64 min-h-screen">
        <header className="h-20 border-b border-[#2D2E35] flex items-center justify-between px-10 bg-[#0A0A0B]/80 backdrop-blur-md sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <h2 className="text-lg font-semibold capitalize">{activeTab.replace('-', ' ')}</h2>
            <div className="h-4 w-[1px] bg-[#2D2E35]" />
            <div className="text-sm text-[#8E9299] flex items-center gap-2">
              <RefreshCcw className="w-3 h-3 animate-spin-slow" />
              Real-time synchronization active
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 px-4 py-2 bg-[#202124] border border-[#2D2E35] rounded-lg text-sm hover:bg-[#2D2E35] transition-colors">
              <Lock className="w-4 h-4" />
              Security Hardening
            </button>
            <button className="p-2 bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors shadow-lg shadow-blue-900/20">
              <RefreshCcw className="w-5 h-5" />
            </button>
          </div>
        </header>

        <div className="p-10 max-w-7xl mx-auto">
          <AnimatePresence mode="wait">
            {activeTab === 'overview' && (
              <motion.div 
                key="overview"
                initial={{ opacity: 0, scale: 0.98 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.98 }}
                className="space-y-8"
              >
                {/* Stats Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <StatCard title="Active Signals" value={stats?.activeUsers || 0} icon={Server} trend="+5.2%" />
                  <StatCard title="Uptime" value={stats?.uptime || '---'} icon={Activity} />
                  <StatCard title="Log Flowrate" value="1.2k/m" icon={Terminal} trend="+12%" />
                  <StatCard title="Active Jailhouse" value={stats?.activeBlocks || 0} icon={Lock} trend="Mitigated" />
                </div>

                {/* Charts & Blocks Section */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                  <div className="lg:col-span-2 space-y-8">
                    <div className="bg-[#151619] border border-[#2D2E35] p-8 rounded-2xl">
                      <div className="flex justify-between items-center mb-10">
                        <h3 className="font-bold text-lg flex items-center gap-2">
                          <Cpu className="w-5 h-5 text-blue-500" />
                          Infrastructure Telemetry
                        </h3>
                        <div className="flex items-center gap-2">
                          <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
                          <span className="text-xs font-mono text-blue-400">Live Stream</span>
                        </div>
                      </div>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={stats?.cpuUsage}>
                            <defs>
                              <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                              </linearGradient>
                            </defs>
                            <CartesianGrid strokeDasharray="3 3" stroke="#2D2E35" vertical={false} />
                            <XAxis dataKey="time" stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
                            <YAxis stroke="#52525B" fontSize={12} tickLine={false} axisLine={false} />
                            <Tooltip 
                              contentStyle={{ backgroundColor: '#151619', borderColor: '#2D2E35', borderRadius: '12px', fontSize: '12px' }}
                            />
                            <Area type="monotone" dataKey="value" stroke="#3B82F6" fillOpacity={1} fill="url(#colorValue)" strokeWidth={2} />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </div>

                    <div className="bg-[#151619] border border-[#2D2E35] p-8 rounded-2xl">
                      <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
                        <Lock className="w-5 h-5 text-red-500" />
                        Active Quarantine (SOAR)
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-xs font-bold text-[#8E9299] uppercase tracking-wider border-b border-[#2D2E35]">
                              <th className="pb-4">Target IP</th>
                              <th className="pb-4">Incident Category</th>
                              <th className="pb-4">Remediation Status</th>
                              <th className="pb-4">Auto-Relink In</th>
                            </tr>
                          </thead>
                          <tbody className="text-sm font-mono text-gray-300">
                            {blocks.map((block, i) => (
                              <tr key={i} className="border-b border-[#2D2E35]/50 group">
                                <td className="py-4 text-blue-400 font-bold">{block.ip}</td>
                                <td className="py-4">{block.reason}</td>
                                <td className="py-4">
                                  <span className="bg-red-500/10 text-red-400 px-2 py-0.5 rounded border border-red-500/20">DROP (iptables)</span>
                                </td>
                                <td className="py-4 text-[#8E9299]">
                                  {format(new Date(block.expiry), 'mm:ss')}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div className="bg-[#151619] border border-[#2D2E35] p-8 rounded-2xl flex flex-col">
                      <h3 className="font-bold text-lg mb-10 flex items-center gap-2">
                        <AlertTriangle className="w-5 h-5 text-red-500" />
                        Threat Surface
                      </h3>
                      <div className="flex-1 flex flex-col items-center justify-center">
                        <div className="h-[200px] w-full">
                          <ResponsiveContainer width="100%" height="100%">
                            <PieChart>
                              <Pie
                                data={stats?.threatDistribution}
                                innerRadius={60}
                                outerRadius={80}
                                paddingAngle={5}
                                dataKey="value"
                              >
                                {stats?.threatDistribution.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="none" />
                                ))}
                              </Pie>
                              <Tooltip 
                                contentStyle={{ backgroundColor: '#151619', borderColor: '#2D2E35', borderRadius: '12px', fontSize: '10px' }}
                              />
                              <Legend verticalAlign="bottom" align="center" content={({ payload }: any) => (
                                <div className="mt-8 grid grid-cols-2 gap-4">
                                  {payload.map((entry: any, index: number) => (
                                    <div key={index} className="flex items-center gap-2">
                                      <div className="w-2 h-2 rounded-full" style={{ backgroundColor: entry.color }} />
                                      <span className="text-[10px] text-[#8E9299] font-medium uppercase">{entry.value}</span>
                                    </div>
                                  ))}
                                </div>
                              )}/>
                            </PieChart>
                          </ResponsiveContainer>
                        </div>
                      </div>
                    </div>

                    <div className="bg-[#151619] border border-[#2D2E35] p-8 rounded-2xl">
                      <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
                        <Zap className="w-5 h-5 text-yellow-500" />
                        SOAR Health
                      </h3>
                      <div className="space-y-4">
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E9299]">Auto-Mitigation Rate</span>
                          <span className="text-green-400">98.2%</span>
                        </div>
                        <div className="w-full bg-[#202124] h-1 rounded-full overflow-hidden">
                          <div className="bg-green-500 h-full w-[98.2%]" />
                        </div>
                        <div className="flex justify-between text-xs">
                          <span className="text-[#8E9299]">False Positive Ratio</span>
                          <span className="text-amber-400">0.4%</span>
                        </div>
                        <div className="w-full bg-[#202124] h-1 rounded-full overflow-hidden">
                          <div className="bg-amber-500 h-full w-[4%]" />
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {activeTab === 'logs' && (
              <motion.div 
                key="logs"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-[#151619] border border-[#2D2E35] rounded-2xl overflow-hidden shadow-2xl"
              >
                <div className="bg-[#202124] p-4 flex justify-between items-center border-b border-[#2D2E35]">
                  <div className="flex items-center gap-4">
                    <div className="flex gap-1.5 pl-2">
                      <div className="w-3 h-3 rounded-full bg-red-500/50" />
                      <div className="w-3 h-3 rounded-full bg-amber-500/50" />
                      <div className="w-3 h-3 rounded-full bg-green-500/50" />
                    </div>
                    <span className="text-xs font-mono text-[#8E9299]">Live Terminal (tail -F) active...</span>
                  </div>
                  <div className="flex gap-2">
                    <span className="text-[10px] font-bold text-blue-400 bg-blue-500/10 px-2 py-1 rounded">FILTER: ALL</span>
                  </div>
                </div>
                <div className="h-[600px] overflow-y-auto no-scrollbar">
                  {alerts.map((alert) => (
                    <LogEntry key={alert.id} alert={alert} />
                  ))}
                  {/* Simulated extra lines */}
                  {Array.from({length: 15}).map((_, i) => (
                    <div key={i} className="px-4 py-2 border-b border-[#2D2E35] opacity-30 text-xs font-mono text-[#8E9299]">
                      {new Date().toISOString()} [INFO] System audit log initialized - kernel ring buffer entry {1000 + i}
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === 'ai' && (
              <motion.div 
                key="ai"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="max-w-3xl mx-auto space-y-8"
              >
                <div className="text-center space-y-4 mb-10">
                  <div className="inline-block p-4 bg-blue-500/10 rounded-full mb-2">
                    <Zap className="w-8 h-8 text-blue-400" />
                  </div>
                  <h3 className="text-3xl font-bold tracking-tight">AI Security Analyst</h3>
                  <p className="text-[#8E9299]">Decode complex Linux security logs instantly with AI-powered threat intelligence.</p>
                </div>

                <div className="bg-[#151619] border border-[#2D2E35] p-8 rounded-2xl shadow-xl space-y-6">
                  <div className="space-y-4">
                    <label className="text-xs font-bold text-[#8E9299] uppercase tracking-wider">Intercepted Log Entry</label>
                    <textarea 
                      className="w-full h-32 bg-[#202124] border border-[#2D2E35] rounded-xl p-4 text-sm font-mono text-white focus:outline-none focus:ring-1 focus:ring-blue-500/50 resize-none"
                      placeholder="Paste log from syslog, auth.log, or nginx here..."
                      value={analysisInput}
                      onChange={(e) => setAnalysisInput(e.target.value)}
                    />
                  </div>

                  <button 
                    onClick={handleAIAnalyze}
                    disabled={isAnalyzing || !analysisInput}
                    className="w-full py-4 bg-blue-600 rounded-xl font-bold hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isAnalyzing ? (
                    <>
                      <RefreshCcw className="w-5 h-5 animate-spin" />
                      Engaging Intelligence Engine...
                    </>
                    ) : (
                    <>
                      <Zap className="w-5 h-5" />
                      Decode Neural Signature
                    </>
                    )}
                  </button>
                </div>

                {analysisResult && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-blue-500/5 border border-blue-500/20 p-8 rounded-2xl space-y-4"
                  >
                    <div className="flex items-center gap-2 text-blue-400">
                      <Shield className="w-5 h-5" />
                      <span className="text-xs font-bold uppercase tracking-widest">Intelligence Report</span>
                    </div>
                    <div className="prose prose-invert text-gray-300 text-sm leading-relaxed whitespace-pre-wrap">
                      {analysisResult}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}

            {activeTab === 'docs' && (
              <motion.div 
                key="docs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-12 pb-20"
              >
                <section className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-tight border-b border-[#2D2E35] pb-4">Production Deployment</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="p-6 bg-[#151619] border border-[#2D2E35] rounded-xl">
                      <h4 className="font-bold flex items-center gap-2 mb-4">
                        <Terminal className="w-4 h-4 text-blue-400" />
                        1. Systemd Integration
                      </h4>
                      <code className="text-xs font-mono text-gray-400 block bg-[#0A0A0B] p-4 rounded-lg overflow-x-auto">
                        [Unit]<br/>
                        Description=SentinelLog Monitor<br/>
                        After=network.target<br/><br/>
                        [Service]<br/>
                        ExecStart=/usr/local/bin/monitor.sh<br/>
                        Restart=on-failure<br/>
                        User=root<br/><br/>
                        [Install]<br/>
                        WantedBy=multi-user.target
                      </code>
                    </div>
                    <div className="p-6 bg-[#151619] border border-[#2D2E35] rounded-xl">
                      <h4 className="font-bold flex items-center gap-2 mb-4">
                        <Database className="w-4 h-4 text-purple-400" />
                        2. Anomaly Tuning
                      </h4>
                      <p className="text-sm text-[#8E9299] leading-relaxed">
                        Customize regular expressions in <code className="text-blue-400">anomaly_detection.py</code> to target specific enterprise applications. Support for horizontal scaling via Redis pub/sub.
                      </p>
                      <div className="mt-4 flex flex-wrap gap-2">
                        {['Nginx', 'Apache', 'SSHD', 'Kube-Audit'].map(tech => (
                          <span key={tech} className="text-[10px] font-bold px-2 py-1 rounded bg-[#2D2E35] text-white underline underline-offset-4 decoration-blue-500/50">{tech}</span>
                        ))}
                      </div>
                    </div>
                  </div>
                </section>

                <section className="space-y-6">
                  <h3 className="text-2xl font-bold tracking-tight border-b border-[#2D2E35] pb-4">Resume Optimized Impact</h3>
                  <div className="bg-[#151619] border border-l-4 border-l-blue-500 border-[#2D2E35] p-8 rounded-r-2xl">
                    <ul className="space-y-4">
                      {[
                        "Architected an enterprise-grade Linux Log Monitoring Framework using Bash and Python, reducing Mean Time to Detection (MTTD) by 65%.",
                        "Implemented real-time anomaly detection using multi-threaded regex parsing, identifying over 500+ daily brute-force attempts.",
                        "Integrated Google Gemini Pro AI to automate 90% of initial log triage and incident classification.",
                        "Designed a high-availability telemetry dashboard with Recharts, providing 100% visibility into infrastructure security posture."
                      ].map((bullet, i) => (
                        <li key={i} className="flex gap-4 items-start text-sm text-gray-300">
                          <CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                </section>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}
