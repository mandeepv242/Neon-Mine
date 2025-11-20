import React, { useState, useEffect } from 'react';
import Game from './components/Game';
import { Difficulty, ScoreEntry } from './types';
import { STORAGE_KEY, SCORES, TOTAL_LIVES } from './constants';
import { Bomb, Trophy, Play, ShieldAlert, ChevronDown, ChevronUp, BarChart, User } from 'lucide-react';

enum AppScreen {
  START,
  GAME,
  LEADERBOARD
}

// Extracting StartScreen to prevent re-mounting on state change (fixing input focus loss)
const StartScreen = ({
  playerName,
  setPlayerName,
  difficulty,
  setDifficulty,
  showRules,
  setShowRules,
  onStart,
  onOpenLeaderboard
}: {
  playerName: string;
  setPlayerName: (name: string) => void;
  difficulty: Difficulty;
  setDifficulty: (d: Difficulty) => void;
  showRules: boolean;
  setShowRules: (show: boolean) => void;
  onStart: () => void;
  onOpenLeaderboard: () => void;
}) => (
    <div className="flex flex-col items-center justify-center min-h-screen w-full p-4 animate-in fade-in duration-500">
        <div className="w-full max-w-md space-y-6">
            {/* Logo Section */}
            <div className="text-center space-y-4">
                <div className="inline-flex p-5 bg-slate-800/50 rounded-full border border-slate-700 shadow-2xl shadow-cyan-500/10 mb-2 relative group">
                   <div className="absolute inset-0 bg-cyan-500/20 rounded-full blur-xl group-hover:blur-2xl transition-all"></div>
                   <Bomb size={56} className="text-cyan-400 relative z-10" />
                </div>
                <h1 className="text-6xl font-black tracking-tighter text-transparent bg-clip-text bg-gradient-to-b from-white to-slate-500 drop-shadow-sm">
                    NEON<span className="text-cyan-400">MINES</span>
                </h1>
            </div>

            {/* Main Card */}
            <div className="bg-slate-800/80 backdrop-blur border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-6">
                
                {/* Input Section */}
                <div className="space-y-4">
                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400 font-bold ml-1">Operative ID</label>
                        <div className="relative">
                            <User className="absolute left-3 top-3 text-slate-500" size={20} />
                            <input 
                                type="text" 
                                value={playerName}
                                onChange={(e) => setPlayerName(e.target.value)}
                                placeholder="Enter Codename"
                                className="w-full bg-slate-900 border border-slate-700 rounded-lg py-3 pl-10 pr-4 text-white placeholder-slate-600 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 transition-all font-mono"
                                maxLength={30}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label className="text-xs uppercase tracking-widest text-slate-400 font-bold ml-1">Difficulty Class</label>
                        <div className="grid grid-cols-3 gap-2 bg-slate-900 p-1 rounded-lg">
                            {Object.values(Difficulty).map((d) => (
                                <button
                                    key={d}
                                    onClick={() => setDifficulty(d)}
                                    className={`py-2 text-xs font-bold rounded transition-all flex flex-col items-center justify-center gap-1 ${
                                        difficulty === d 
                                        ? 'bg-cyan-600 text-white shadow-lg' 
                                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                                    }`}
                                >
                                    <span>{d}</span>
                                    <span className="text-[10px] opacity-70 font-normal">
                                        {d === Difficulty.EASY ? '3x3' : d === Difficulty.MEDIUM ? '5x5' : '9x9'}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Rules Toggle */}
                <div className="border border-slate-700 rounded-lg overflow-hidden bg-slate-900/50">
                    <button 
                        onClick={() => setShowRules(!showRules)}
                        className="w-full flex items-center justify-between p-3 text-sm font-bold text-slate-300 hover:bg-slate-800/50 transition"
                    >
                        <span className="flex items-center gap-2"><ShieldAlert size={16} className="text-cyan-400"/> MISSION BRIEFING</span>
                        {showRules ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    
                    {showRules && (
                        <div className="p-4 text-xs text-slate-400 space-y-2 border-t border-slate-700 bg-slate-900/80">
                            <p className="flex items-start gap-2">
                                <span className="text-cyan-500 font-bold">•</span>
                                Clear the grid. Avoid mines.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-cyan-500 font-bold">•</span>
                                You have <strong className="text-white">{TOTAL_LIVES} Lives</strong>. Hitting a mine costs 1 life.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-cyan-500 font-bold">•</span>
                                Use <strong className="text-white">Right Click</strong> to flag suspicious sectors.
                            </p>
                            <p className="flex items-start gap-2">
                                <span className="text-cyan-500 font-bold">•</span>
                                <strong>Power-Up:</strong> Use "Lucky Reveal" for a guaranteed safe spot.
                            </p>
                        </div>
                    )}
                </div>

                {/* Action Buttons */}
                <div className="space-y-3 pt-2">
                    <button 
                        onClick={onStart}
                        className="group w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 rounded-xl font-display font-bold text-xl text-white shadow-lg shadow-cyan-500/20 overflow-hidden transition-all active:scale-95 hover:scale-[1.02] hover:shadow-cyan-500/40"
                    >
                        <span className="flex items-center justify-center gap-2">
                            <Play size={24} className="fill-current" /> INITIATE MISSION
                        </span>
                    </button>
                    
                    <button 
                        onClick={onOpenLeaderboard}
                        className="w-full py-3 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition"
                    >
                        <BarChart size={16} /> HALL OF FAME
                    </button>
                </div>
            </div>
        </div>
    </div>
);

// Extracting LeaderboardScreen as well
const LeaderboardScreen = ({
    leaderboard,
    onBack
}: {
    leaderboard: ScoreEntry[];
    onBack: () => void;
}) => (
      <div className="min-h-screen flex flex-col items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl">
              <div className="flex justify-between items-center mb-6">
                  <h2 className="text-3xl font-display font-bold text-white">Top Operatives</h2>
                  <Trophy className="text-yellow-500" size={32} />
              </div>

              <div className="bg-slate-900 rounded-lg overflow-hidden mb-6">
                  <table className="w-full text-left">
                      <thead className="bg-slate-950 text-slate-400 text-xs uppercase">
                          <tr>
                              <th className="p-4">Rank</th>
                              <th className="p-4">Agent</th>
                              <th className="p-4">Score</th>
                              <th className="p-4">Diff</th>
                          </tr>
                      </thead>
                      <tbody className="text-sm">
                          {leaderboard.length === 0 ? (
                              <tr>
                                  <td colSpan={4} className="p-8 text-center text-slate-500">No records found. Be the first.</td>
                              </tr>
                          ) : (
                              leaderboard.map((entry, idx) => (
                                  <tr key={idx} className="border-b border-slate-800 hover:bg-slate-800/50 transition">
                                      <td className="p-4 font-mono text-slate-500">#{idx + 1}</td>
                                      <td className="p-4 font-bold text-white max-w-[200px] truncate" title={entry.name}>{entry.name}</td>
                                      <td className="p-4 font-bold text-cyan-400">{entry.score}</td>
                                      <td className="p-4">
                                          <span className={`text-[10px] uppercase px-2 py-1 rounded ${
                                              entry.difficulty === Difficulty.HARD ? 'bg-rose-900 text-rose-300' :
                                              entry.difficulty === Difficulty.MEDIUM ? 'bg-yellow-900 text-yellow-300' :
                                              'bg-green-900 text-green-300'
                                          }`}>
                                              {entry.difficulty}
                                          </span>
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>

              <button onClick={onBack} className="w-full py-3 bg-slate-700 hover:bg-slate-600 rounded-lg font-bold text-white transition">
                  RETURN TO BASE
              </button>
          </div>
      </div>
);

function App() {
  const [screen, setScreen] = useState<AppScreen>(AppScreen.START);
  const [difficulty, setDifficulty] = useState<Difficulty>(Difficulty.EASY);
  const [leaderboard, setLeaderboard] = useState<ScoreEntry[]>([]);
  const [playerName, setPlayerName] = useState('');
  const [showRules, setShowRules] = useState(true);

  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
        setLeaderboard(JSON.parse(raw));
    }
  }, [screen]);

  const handleStart = () => {
      if (!playerName.trim()) {
          alert("Please identify yourself, Operative.");
          return;
      }
      setScreen(AppScreen.GAME);
  }

  return (
    <div className="min-h-screen bg-slate-900 text-slate-100 selection:bg-cyan-500/30 font-sans">
        {/* Background decoration */}
        <div className="fixed inset-0 pointer-events-none overflow-hidden">
            <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] rounded-full bg-cyan-900/20 blur-[120px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-purple-900/20 blur-[120px]"></div>
        </div>

        <div className="relative z-10">
            {screen === AppScreen.START && (
                <StartScreen 
                    playerName={playerName}
                    setPlayerName={setPlayerName}
                    difficulty={difficulty}
                    setDifficulty={setDifficulty}
                    showRules={showRules}
                    setShowRules={setShowRules}
                    onStart={handleStart}
                    onOpenLeaderboard={() => setScreen(AppScreen.LEADERBOARD)}
                />
            )}
            {screen === AppScreen.LEADERBOARD && (
                <LeaderboardScreen 
                    leaderboard={leaderboard}
                    onBack={() => setScreen(AppScreen.START)}
                />
            )}
            {screen === AppScreen.GAME && (
                <Game 
                    difficulty={difficulty} 
                    playerName={playerName}
                    onExit={() => setScreen(AppScreen.START)} 
                />
            )}
        </div>
    </div>
  );
}

export default App;