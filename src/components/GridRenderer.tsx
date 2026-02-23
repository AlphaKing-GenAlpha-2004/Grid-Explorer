import React, { useEffect, useRef } from 'react';
import { PuzzleType } from '../types';
import { motion } from 'motion/react';

interface GridRendererProps {
  type: PuzzleType;
  size: number;
  data: any;
  solution?: any;
  isSolved: boolean;
  onCellClick?: (r: number, c: number) => void;
}

export const GridRenderer: React.FC<GridRendererProps> = ({
  type, size, data, solution, isSolved, onCellClick
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (size > 200) {
      renderCanvas();
    }
  }, [type, size, data, solution, isSolved]);

  const renderCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * dpr;
    canvas.height = rect.height * dpr;
    ctx.scale(dpr, dpr);

    const w = rect.width;
    const h = rect.height;
    const cellSize = Math.min(w, h) / size;

    ctx.clearRect(0, 0, w, h);
    const themeLine = getComputedStyle(document.body).getPropertyValue('--theme-line');
    ctx.strokeStyle = themeLine || 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;

    if (type === 'maze') {
      const mazeData = data.grid;
      const start = data.start;
      const end = data.end;
      const visited = data.currentVisited || [];
      const frontier = data.currentFrontier || [];
      const path = isSolved && solution ? solution : [];

      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          if (mazeData[r][c] === 1) {
            ctx.fillStyle = '#333';
            ctx.fillRect(c * cellSize, r * cellSize, cellSize, cellSize);
          }
        }
      }

      // Draw visited
      ctx.fillStyle = 'rgba(59, 130, 246, 0.2)';
      for (const v of visited) {
        ctx.fillRect(v.c * cellSize, v.r * cellSize, cellSize, cellSize);
      }

      // Draw frontier
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      for (const f of frontier) {
        ctx.fillRect(f.c * cellSize, f.r * cellSize, cellSize, cellSize);
      }

      // Draw path
      if (path.length > 0) {
        ctx.strokeStyle = '#3b82f6';
        ctx.lineWidth = cellSize * 0.4;
        ctx.lineCap = 'round';
        ctx.lineJoin = 'round';
        ctx.beginPath();
        ctx.moveTo(path[0].c * cellSize + cellSize / 2, path[0].r * cellSize + cellSize / 2);
        for (let i = 1; i < path.length; i++) {
          ctx.lineTo(path[i].c * cellSize + cellSize / 2, path[i].r * cellSize + cellSize / 2);
        }
        ctx.stroke();
      }

      // Draw Start/End
      ctx.fillStyle = '#10b981';
      ctx.beginPath();
      ctx.arc(start.c * cellSize + cellSize / 2, start.r * cellSize + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#ef4444';
      ctx.beginPath();
      ctx.arc(end.c * cellSize + cellSize / 2, end.r * cellSize + cellSize / 2, cellSize * 0.4, 0, Math.PI * 2);
      ctx.fill();
    } else {
      for (let r = 0; r < size; r++) {
        for (let c = 0; c < size; c++) {
          ctx.strokeRect(c * cellSize, r * cellSize, cellSize, cellSize);
        }
      }
    }
  };

  if (type === 'nonogram') {
    return renderNonogram(size, data, solution, isSolved, onCellClick);
  }

  if (size > 200) {
    return (
      <div className="relative w-full aspect-square max-w-[600px] bg-black/10 rounded-xl overflow-hidden border border-theme-line">
        <canvas ref={canvasRef} className="w-full h-full" />
        <div className="absolute bottom-2 right-2 text-[10px] opacity-50 font-mono">Canvas Rendering Mode (N={size})</div>
      </div>
    );
  }

  return (
    <div 
      className="grid bg-black/10 p-2 rounded-xl border border-theme-line shadow-inner"
      style={{
        gridTemplateColumns: `repeat(${size}, 1fr)`,
        width: '100%',
        maxWidth: '600px',
        aspectRatio: '1/1'
      }}
    >
      {renderDOMGrid(type, size, data, solution, isSolved, onCellClick)}
    </div>
  );
};

const renderNonogram = (size: number, data: any, solution: any, isSolved: boolean, onCellClick?: (r: number, c: number) => void) => {
  const { rowClues, colClues, userGrid } = data;
  const displayGrid = isSolved ? solution : userGrid;
  
  return (
    <div className="flex flex-col items-center gap-2 max-w-full overflow-auto p-4 bg-black/20 rounded-2xl border border-theme-line">
      <div className="flex">
        {/* Corner spacer */}
        <div className="w-16 md:w-24 shrink-0" />
        {/* Column Clues */}
        <div className="flex" style={{ width: 'fit-content' }}>
          {colClues.map((clue: number[], i: number) => (
            <div key={i} className="w-6 md:w-8 flex flex-col justify-end items-center border-x border-theme-line/20 bg-white/5 py-1">
              {clue.map((c, j) => (
                <span key={j} className="text-[8px] md:text-[10px] font-bold leading-tight">{c}</span>
              ))}
            </div>
          ))}
        </div>
      </div>
      
      <div className="flex">
        {/* Row Clues */}
        <div className="flex flex-col shrink-0">
          {rowClues.map((clue: number[], i: number) => (
            <div key={i} className="h-6 md:h-8 flex justify-end items-center border-y border-theme-line/20 bg-white/5 px-2 w-16 md:w-24">
              {clue.map((c, j) => (
                <span key={j} className="text-[8px] md:text-[10px] font-bold mx-0.5">{c}</span>
              ))}
            </div>
          ))}
        </div>
        
        {/* Grid */}
        <div 
          className="grid border border-theme-line"
          style={{
            gridTemplateColumns: `repeat(${size}, 1fr)`,
            width: size * (window.innerWidth < 768 ? 24 : 32) + 'px',
          }}
        >
          {Array.from({ length: size * size }).map((_, i) => {
            const r = Math.floor(i / size);
            const c = i % size;
            const val = displayGrid[r][c];
            let cellClass = "w-6 h-6 md:w-8 md:h-8 border border-theme-line/20 flex items-center justify-center cursor-pointer transition-all";
            
            if (val === 1) cellClass += " bg-theme-text";
            else if (val === -1) cellClass += " bg-red-500/20";
            else cellClass += " hover:bg-white/5";
            
            return (
              <div 
                key={`${r}-${c}`} 
                className={cellClass}
                onClick={() => onCellClick?.(r, c)}
                onContextMenu={(e) => {
                  e.preventDefault();
                  // Right click for marking X
                  onCellClick?.(r, c); // We'll handle toggle in App.tsx
                }}
              >
                {val === -1 && <span className="text-red-500 text-xs">×</span>}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

const renderDOMGrid = (type: PuzzleType, size: number, data: any, solution: any, isSolved: boolean, onCellClick?: (r: number, c: number) => void) => {
  const cells = [];
  const displayData = isSolved && solution ? solution : data;

  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      let content: React.ReactNode = null;
      let cellClass = "border border-theme-line flex items-center justify-center text-xs font-mono transition-all duration-300 select-none text-theme-text";

      if (type === 'latin-square' || type === 'sudoku') {
        const val = Array.isArray(displayData) ? displayData[r][c] : displayData.grid?.[r][c];
        content = val !== 0 ? val : '';
        if (val === 0) cellClass += " bg-white/5";
      } else if (type === 'maze') {
        const isWall = data.grid[r][c] === 1;
        const isStart = data.start.r === r && data.start.c === c;
        const isEnd = data.end.r === r && data.end.c === c;
        const onPath = isSolved && solution && Array.isArray(solution) && solution.some((p: any) => p.r === r && p.c === c);
        const isVisited = data.currentVisited?.some((v: any) => v.r === r && v.c === c);
        const isFrontier = data.currentFrontier?.some((f: any) => f.r === r && f.c === c);

        if (isWall) cellClass += " bg-neutral-800";
        else cellClass += " cursor-pointer hover:bg-white/5";

        if (onPath) cellClass += " bg-blue-500/50 shadow-[0_0_10px_rgba(59,130,246,0.5)] z-10";
        else if (isVisited) cellClass += " bg-blue-500/10";
        else if (isFrontier) cellClass += " bg-emerald-500/20";

        if (isStart) {
          content = <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />;
        } else if (isEnd) {
          content = <div className="w-3 h-3 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />;
        }
      } else if (type === 'n-queens') {
        const queenRow = displayData[c];
        if (queenRow === r) content = '♛';
        if ((r + c) % 2 === 0) cellClass += " bg-white/5";
      } else if (type === 'minesweeper') {
        const val = data.grid[r][c];
        const revealed = isSolved || (data.revealed && data.revealed[r][c]);
        if (revealed) {
          if (val === -1) content = '💣';
          else if (val > 0) content = val;
          cellClass += " bg-white/10";
        } else {
          cellClass += " bg-neutral-700 hover:bg-neutral-600 cursor-pointer";
        }
      } else if (type === 'sliding-puzzle') {
        const grid = Array.isArray(displayData) ? displayData : displayData.grid;
        const val = grid ? grid[r][c] : 0;
        if (val !== 0) {
          content = val;
          cellClass += " bg-blue-600/20 border-blue-500/30 rounded-sm m-[1px] cursor-pointer hover:bg-blue-500/40";
        } else {
          cellClass += " bg-transparent border-none";
        }

        cells.push(
          <motion.div 
            layout
            key={val === 0 ? 'empty' : `tile-${val}`} 
            className={cellClass}
            onClick={() => onCellClick?.(r, c)}
            whileHover={val !== 0 ? { scale: 1.02, backgroundColor: 'rgba(59, 130, 246, 0.4)' } : {}}
            whileTap={val !== 0 ? { scale: 0.95, opacity: 0.9 } : {}}
            transition={{ type: 'spring', stiffness: 500, damping: 35 }}
          >
            {content}
          </motion.div>
        );
        continue;
      } else if (type === 'kenken') {
        const grid = isSolved ? solution : data.grid;
        const val = grid ? grid[r][c] : 0;
        content = val !== 0 ? val : '';
        
        const cage = data.cages?.find((cg: any) => cg.cells.some((cell: any) => cell.r === r && cell.c === c));
        const isCageStart = cage?.cells[0].r === r && cage?.cells[0].c === c;
        
        // Cage borders
        if (cage) {
          const inCage = (nr: number, nc: number) => cage.cells.some((cell: any) => cell.r === nr && cell.c === nc);
          if (!inCage(r - 1, c)) cellClass += " border-t-2 border-t-theme-text/40";
          if (!inCage(r + 1, c)) cellClass += " border-b-2 border-b-theme-text/40";
          if (!inCage(r, c - 1)) cellClass += " border-l-2 border-l-theme-text/40";
          if (!inCage(r, c + 1)) cellClass += " border-r-2 border-r-theme-text/40";
        }

        if (isCageStart && cage) {
          content = (
            <div className="relative w-full h-full flex items-center justify-center">
              <span className="absolute top-0 left-0 text-[7px] md:text-[9px] font-bold opacity-80 p-0.5 leading-none">
                {cage.target}{cage.op !== 'none' ? cage.op : ''}
              </span>
              {val !== 0 && <span className="text-sm md:text-base">{val}</span>}
            </div>
          );
        } else {
          content = val !== 0 ? <span className="text-sm md:text-base">{val}</span> : '';
        }
      }

      cells.push(
        <div 
          key={`${r}-${c}`} 
          className={cellClass}
          onClick={() => onCellClick?.(r, c)}
        >
          {content}
        </div>
      );
    }
  }
  return cells;
};
