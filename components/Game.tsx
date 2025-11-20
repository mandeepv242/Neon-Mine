
import React, { useState, useEffect, useRef, useCallback } from 'react';
import { CellData, GameConfig, GameStatus, Difficulty, ScoreEntry } from '../types';
import { DIFFICULTIES, SCORES, STORAGE_KEY, MAX_LEADERBOARD_ENTRIES } from '../constants';
import { createBoard, placeMines, revealCell, calculateWin, getSmartProbability } from '../utils/gameLogic';
import { audioController } from '../utils/audio';
import Cell from './Cell';
import { Timer, RefreshCw, Zap, Trophy, Heart, Volume2, VolumeX, Skull } from 'lucide-react';

interface GameProps {
  difficulty: Difficulty;
  playerName: string;
  onExit: () => void;
}

const Game: React.FC<GameProps> = ({ difficulty, playerName, onExit }) => {
  const [config] = useState<GameConfig>(DIFFICULTIES[difficulty]);
  const [board, setBoard] = useState<CellData[][]>([]);
  const [status, setStatus] = useState<GameStatus>(GameStatus.IDLE);
  const [lives, setLives] = useState(DIFFICULTIES[difficulty].lives);
  const [timer, setTimer] = useState(0);
  const [score, setScore] = useState(0);
  const [hoveredRisk, setHoveredRisk] = useState<number | null>(null);
  const [powerupUsed, setPowerupUsed] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isFirstClick, setIsFirstClick] = useState(true);

  const timerRef = useRef<number | null>(null);

  // Initialize Board
  useEffect(() => {
    setBoard(createBoard(config));
    setLives(config.lives);
    setScore(0);
    setTimer(0);
    setStatus(GameStatus.IDLE);
    setIsFirstClick(true);
    return () => stopTimer();
  }, [config]);

  const startTimer = () => {
    if (timerRef.current) return;
    timerRef.current = window.setInterval(() => {
      setTimer((t) => t + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleCellClick = (r: number, c: number) => {
    if (status === GameStatus.WON || status === GameStatus.LOST || board[r][c].isFlagged || board[r][c].isRevealed) return;

    // First Click Logic: Generate mines now to ensure safety
    let currentBoard = [...board];
    if (isFirstClick) {
      setStatus(GameStatus.PLAYING);
      startTimer();
      setIsFirstClick(false);
      placeMines(currentBoard, config.mines, r, c);
      // No update to state yet, wait for reveal
    }

    const cell = currentBoard[r][c];

    // MINE HIT LOGIC
    if (cell.isMine) {
      audioController.playExplode();
      
      const newLives = lives - 1;
      setLives(newLives);

      // Create a copy of the board to update the specific cell
      const newBoard = currentBoard.map(row => [...row]);
      newBoard[r][c].isRevealed = true; // Show ONLY this mine
      setBoard(newBoard);

      // Shake effect
      const root = document.getElementById('root');
      if (root) {
        root.classList.remove('shake');
        void root.offsetWidth;
        root.classList.add('shake');
      }

      if (newLives <= 0) {
        handleGameOver(newBoard);
      }
      return;
    }

    // SAFE CLICK LOGIC
    audioController.playClick();
    const { board: newBoard, revealedCount } = revealCell(currentBoard, r, c);
    setBoard(newBoard);
    setScore((s) => s + revealedCount * SCORES.REVEAL_SAFE);

    if (calculateWin(newBoard, config.mines)) {
      handleWin();
    }
  };

  const handleContextMenu = (e: React.MouseEvent, r: number, c: number) => {
    e.preventDefault();
    if (status !== GameStatus.PLAYING && status !== GameStatus.IDLE) return;
    if (board[r][c].isRevealed) return;

    if (status === GameStatus.IDLE) {
        setStatus(GameStatus.PLAYING);
        startTimer();
    }

    const newBoard = [...board];
    newBoard[r][c].isFlagged = !newBoard[r][c].isFlagged;
    setBoard(newBoard);
    audioController.playFlag();

    // Score penalty if flagging safe cell (calculated loosely here, applied immediately for simplicity)
    if (!newBoard[r][c].isFlagged && !board[r][c].isMine) {
        // Unflagging doesn't return points to avoid spam exploits
    } else if (newBoard[r][c].isFlagged && !board[r][c].isMine) {
       setScore(s => Math.max(0, s - SCORES.WRONG_FLAG_PENALTY));
    }
  };

  const handleGameOver = (finalBoard: CellData[][]) => {
    setStatus(GameStatus.LOST);
    stopTimer();
    
    // Reveal ALL mines on game over
    const revealedBoard = finalBoard.map(row => 
        row.map(cell => ({
            ...cell,
            isRevealed: cell.isMine ? true : cell.isRevealed
        }))
    );
    setBoard(revealedBoard);
  };

  const handleWin = () => {
    setStatus(GameStatus.WON);
    stopTimer();
    audioController.playWin();

    let finalScore = score + SCORES.WIN_BONUS;
    if (!powerupUsed) finalScore += SCORES.NO_POWERUP_BONUS;
    setScore(finalScore);

    saveScore(finalScore);
  };

  const saveScore = (finalScore: number) => {
    const newEntry: ScoreEntry = {
      name: playerName,
      score: finalScore,
      difficulty,
      date: new Date().toLocaleDateString()
    };

    const existingRaw = localStorage.getItem(STORAGE_KEY);
    let entries: ScoreEntry[] = existingRaw ? JSON.parse(existingRaw) : [];
    entries.push(newEntry);
    entries.sort((a, b) => b.score - a.score);
    entries = entries.slice(0, MAX_LEADERBOARD_ENTRIES);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  };

  const triggerPowerUp = () => {
    if (powerupUsed || status !== GameStatus.PLAYING) return;
    
    // Find a safe, unrevealed cell
    const candidates: {r: number, c: number}[] = [];
    board.forEach(row => {
        row.forEach(cell => {
            if (!cell.isMine && !cell.isRevealed && !cell.isFlagged) {
                candidates.push({ r: cell.row, c: cell.col });
            }
        });
    });

    if (candidates.length > 0) {
        const randomIdx = Math.floor(Math.random() * candidates.length);
        const { r, c } = candidates[randomIdx];
        handleCellClick(r, c);
        setPowerupUsed(true);
        audioController.playPowerup();
    }
  };

  const handleHover = useCallback((r: number, c: number) => {
      const prob = getSmartProbability(board, r, c);
      setHoveredRisk(prob);
  }, [board]);

  const toggleMute = () => {
    audioController.toggleMute();
    setIsMuted(audioController.isMuted());
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4 w-full max-w-4xl mx-auto animate-in fade-in zoom-in duration-300">
      
      {/* Full Screen Game Over / Win Overlay */}
      {(status === GameStatus.WON || status === GameStatus.LOST) && (
             <div className="fixed inset-0 z-50 bg-slate-900/90 backdrop-blur-md flex flex-col items-center justify-center animate-in fade-in duration-500 p-6 text-center">
                 <h2 className={`text-5xl md:text-7xl font-black font-display mb-8 ${status === GameStatus.WON ? 'text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]' : 'text-rose-500 drop-shadow-[0_0_20px_rgba(244,63,94,0.6)]'}`}>
                     {status === GameStatus.WON ? 'MISSION ACCOMPLISHED' : 'CRITICAL FAILURE'}
                 </h2>
                 
                 <div className="mb-8 text-2xl font-mono text-slate-300">
                    SCORE: <span className="text-yellow-400 font-bold">{score}</span>
                 </div>

                 <div className="flex flex-col sm:flex-row gap-4 mt-6">
                     <button 
                        onClick={onExit} 
                        className="w-40 px-6 py-4 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-bold transition border border-slate-600"
                     >
                         ABORT
                     </button>
                     <button 
                        onClick={() => {
                            setBoard(createBoard(config));
                            setStatus(GameStatus.IDLE);
                            setScore(0);
                            setTimer(0);
                            setLives(config.lives);
                            setPowerupUsed(false);
                            setIsFirstClick(true);
                        }} 
                        className="w-40 px-6 py-4 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-bold shadow-xl shadow-cyan-500/20 transition flex items-center justify-center gap-2 hover:scale-105"
                     >
                         <RefreshCw size={20} /> RETRY
                     </button>
                 </div>
             </div>
         )}

      {/* HUD */}
      <div className="w-full bg-slate-800/90 border border-slate-700 rounded-xl p-4 mb-6 shadow-2xl flex flex-wrap items-center justify-between gap-4">
        
        {/* Left: Lives & Timer */}
        <div className="flex items-center gap-6">
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700">
                {lives > 0 ? <Heart className="text-rose-500 fill-rose-500" /> : <Skull className="text-gray-400" />}
                <span className="font-display text-xl font-bold text-white">{lives}</span>
            </div>
            <div className="flex items-center gap-2 bg-slate-900/50 px-3 py-2 rounded-lg border border-slate-700">
                <Timer className="text-cyan-400" />
                <span className="font-mono text-xl text-white w-12 text-center">{timer}s</span>
            </div>
        </div>

        {/* Center: Status / Name */}
        <div className="flex flex-col items-center">
             <div className="text-xs text-slate-400 font-bold uppercase tracking-widest mb-1">Operative</div>
             <div className="text-cyan-400 font-display font-bold text-lg max-w-[150px] truncate" title={playerName}>
                 {playerName}
             </div>
        </div>

        {/* Right: Score & Controls */}
        <div className="flex items-center gap-4">
             <div className="text-right">
                <div className="text-xs text-slate-500 font-bold">SCORE</div>
                <div className="font-mono text-2xl text-yellow-400 font-bold leading-none">{score}</div>
             </div>
             <button onClick={toggleMute} className="p-2 hover:bg-slate-700 rounded-full transition text-slate-400">
                 {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
             </button>
        </div>
      </div>

      {/* Grid Container */}
      <div className="relative bg-slate-900 p-3 rounded-lg border-2 border-slate-700 shadow-2xl overflow-hidden">
         
         {/* Probability Visualizer (Top Bar) */}
         <div className="h-1 w-full bg-slate-800 mb-2 overflow-hidden flex">
             <div 
                className="h-full transition-all duration-300 bg-gradient-to-r from-green-500 to-rose-500"
                style={{ width: hoveredRisk !== null ? `${hoveredRisk * 100}%` : '0%', opacity: hoveredRisk !== null ? 1 : 0 }}
             />
         </div>

         <div 
            className="grid gap-1"
            style={{ 
                gridTemplateColumns: `repeat(${config.cols}, minmax(0, 1fr))` 
            }}
         >
             {board.map((row, rIndex) => (
                 row.map((cell, cIndex) => (
                     <Cell 
                        key={`${rIndex}-${cIndex}`} 
                        data={cell} 
                        onClick={handleCellClick}
                        onContextMenu={handleContextMenu}
                        onHover={handleHover}
                        isGameOver={status === GameStatus.WON || status === GameStatus.LOST}
                        highRisk={hoveredRisk !== null && hoveredRisk > 0.6}
                     />
                 ))
             ))}
         </div>
      </div>

      {/* Bottom Controls */}
      <div className="mt-6 flex gap-4">
          <button 
            onClick={triggerPowerUp}
            disabled={powerupUsed || status !== GameStatus.PLAYING}
            className={`
                flex items-center gap-2 px-6 py-3 rounded-xl font-bold transition-all border border-slate-700
                ${powerupUsed 
                    ? 'bg-slate-800 text-slate-600 cursor-not-allowed' 
                    : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg shadow-indigo-500/20 hover:scale-105'}
            `}
          >
              <Zap size={18} className={!powerupUsed ? "fill-yellow-400 text-yellow-400" : ""} />
              {powerupUsed ? 'POWER-UP DEPLETED' : 'LUCKY REVEAL'}
          </button>
      </div>

    </div>
  );
};

export default Game;
