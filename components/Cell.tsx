import React, { memo } from 'react';
import { CellData } from '../types';
import { Flag, Bomb, Zap } from 'lucide-react';
import { COLORS } from '../constants';

interface CellProps {
  data: CellData;
  onClick: (r: number, c: number) => void;
  onContextMenu: (e: React.MouseEvent, r: number, c: number) => void;
  onHover: (r: number, c: number) => void;
  isGameOver: boolean;
  highRisk?: boolean; // Visual cue for probability
}

const Cell: React.FC<CellProps> = ({ data, onClick, onContextMenu, onHover, isGameOver, highRisk }) => {
  const { row, col, isRevealed, isFlagged, isMine, neighborCount } = data;

  const handleEnter = () => {
    if (!isRevealed && !isGameOver) {
        onHover(row, col);
    }
  };

  const getCellContent = () => {
    if (isFlagged) return <Flag size={18} className="text-amber-400 fill-amber-400" />;
    if (isRevealed) {
      if (isMine) return <Bomb size={20} className="text-rose-600 fill-rose-900 animate-pulse" />;
      return neighborCount > 0 ? <span className={`font-bold text-xl ${COLORS[neighborCount as keyof typeof COLORS]}`}>{neighborCount}</span> : null;
    }
    return null;
  };

  // Styles
  const baseStyle = "w-8 h-8 md:w-10 md:h-10 flex items-center justify-center cursor-pointer select-none border-b border-r border-slate-900/50 transition-all duration-200 rounded-sm";
  
  let stateStyle = "";
  if (!isRevealed) {
    stateStyle = "cell-hidden hover:brightness-110";
    if (highRisk && !isFlagged && !isGameOver) {
        // Red tint if high probability
        stateStyle += " bg-rose-900/40 border-rose-500/50 border"; 
    }
  } else {
    stateStyle = "bg-slate-700/50 shadow-inner";
    if (isMine) stateStyle = "bg-rose-500/20 ring-2 ring-rose-500 ring-inset";
  }

  return (
    <div
      className={`${baseStyle} ${stateStyle}`}
      onClick={() => onClick(row, col)}
      onContextMenu={(e) => onContextMenu(e, row, col)}
      onMouseEnter={handleEnter}
    >
      {getCellContent()}
    </div>
  );
};

export default memo(Cell); // Optimize rendering