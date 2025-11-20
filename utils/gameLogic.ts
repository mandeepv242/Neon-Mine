import { CellData, GameConfig } from '../types';

const directions = [
  [-1, -1], [-1, 0], [-1, 1],
  [0, -1],           [0, 1],
  [1, -1],  [1, 0],  [1, 1]
];

export const createBoard = (config: GameConfig): CellData[][] => {
  const board: CellData[][] = [];
  for (let r = 0; r < config.rows; r++) {
    const row: CellData[] = [];
    for (let c = 0; c < config.cols; c++) {
      row.push({
        row: r,
        col: c,
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        neighborCount: 0
      });
    }
    board.push(row);
  }
  return board;
};

export const placeMines = (board: CellData[][], mines: number, safeRow: number, safeCol: number) => {
  const rows = board.length;
  const cols = board[0].length;
  let minesPlaced = 0;

  // For very small boards (like 3x3), strictly protecting neighbors makes mine placement impossible if clicking center.
  // We relax the safe zone for small boards.
  const isSmallBoard = rows * cols <= 9;

  while (minesPlaced < mines) {
    const r = Math.floor(Math.random() * rows);
    const c = Math.floor(Math.random() * cols);

    // Avoid placing mine on the first clicked cell.
    // On larger boards, also avoid immediate neighbors to give a "starting opening".
    let isSafeZone = (r === safeRow && c === safeCol);
    
    if (!isSmallBoard) {
        isSafeZone = Math.abs(r - safeRow) <= 1 && Math.abs(c - safeCol) <= 1;
    }

    if (!board[r][c].isMine && !isSafeZone) {
      board[r][c].isMine = true;
      minesPlaced++;
    }
  }

  // Calculate neighbors
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (!board[r][c].isMine) {
        let count = 0;
        directions.forEach(([dr, dc]) => {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < rows && nc >= 0 && nc < cols && board[nr][nc].isMine) {
            count++;
          }
        });
        board[r][c].neighborCount = count;
      }
    }
  }
};

export const revealCell = (board: CellData[][], row: number, col: number): { board: CellData[][], revealedCount: number, hitMine: boolean } => {
  const newBoard = board.map(r => r.map(c => ({ ...c }))); // Deep copy
  const cell = newBoard[row][col];
  let revealedCount = 0;

  if (cell.isFlagged || cell.isRevealed) {
    return { board: newBoard, revealedCount: 0, hitMine: false };
  }

  if (cell.isMine) {
    cell.isRevealed = true;
    return { board: newBoard, revealedCount: 1, hitMine: true };
  }

  // Flood fill
  const stack = [[row, col]];
  while (stack.length > 0) {
    const [currR, currC] = stack.pop()!;
    const curr = newBoard[currR][currC];

    if (!curr.isRevealed && !curr.isFlagged) {
      curr.isRevealed = true;
      revealedCount++;

      if (curr.neighborCount === 0) {
        directions.forEach(([dr, dc]) => {
          const nr = currR + dr;
          const nc = currC + dc;
          if (nr >= 0 && nr < newBoard.length && nc >= 0 && nc < newBoard[0].length) {
            if (!newBoard[nr][nc].isRevealed && !newBoard[nr][nc].isFlagged) {
              stack.push([nr, nc]);
            }
          }
        });
      }
    }
  }

  return { board: newBoard, revealedCount, hitMine: false };
};

export const calculateWin = (board: CellData[][], mines: number): boolean => {
  const rows = board.length;
  const cols = board[0].length;
  let revealedCount = 0;
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if (board[r][c].isRevealed) revealedCount++;
    }
  }
  return revealedCount === (rows * cols - mines);
};

export const getSmartProbability = (board: CellData[][], r: number, c: number): number | null => {
    // If cell is not revealed, we try to estimate risk from neighbors
    // This is a simplistic heuristic for the "Probability Feature"
    let totalWeight = 0;
    let contributingNeighbors = 0;
    
    directions.forEach(([dr, dc]) => {
        const nr = r + dr;
        const nc = c + dc;
        if (nr >= 0 && nr < board.length && nc >= 0 && nc < board[0].length) {
            const neighbor = board[nr][nc];
            if (neighbor.isRevealed && neighbor.neighborCount > 0) {
                // Count how many hidden neighbors this revealed cell has
                let hiddenNeighbors = 0;
                let flaggedNeighbors = 0;
                directions.forEach(([ddr, ddc]) => {
                    const nnr = nr + ddr;
                    const nnc = nc + ddc;
                    if (nnr >= 0 && nnr < board.length && nnc >= 0 && nnc < board[0].length) {
                        if (!board[nnr][nnc].isRevealed) hiddenNeighbors++;
                        if (board[nnr][nnc].isFlagged) flaggedNeighbors++;
                    }
                });
                
                // Basic probability contributed by this neighbor
                // Remaining mines to find around this neighbor / Hidden neighbors
                const remainingMines = neighbor.neighborCount - flaggedNeighbors;
                if (hiddenNeighbors > 0 && remainingMines > 0) {
                   totalWeight += (remainingMines / hiddenNeighbors);
                   contributingNeighbors++;
                }
            }
        }
    });

    if (contributingNeighbors === 0) return null;
    // Average the risk from all clues. Cap at 1.0
    return Math.min(totalWeight / contributingNeighbors, 1.0);
}