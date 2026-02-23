import React, { useState } from 'react';
import { PuzzleType, ThemeType, AlgorithmType, SolverConfig } from '../types';
import { RefreshCw, Play, Shuffle, X, Settings2 } from 'lucide-react';
import { getAlgorithmsForPuzzle, MAZE_GEN_ALGORITHMS } from '../core/AlgorithmRegistry';

interface ControlsProps {
  puzzleType: PuzzleType;
  setPuzzleType: (t: PuzzleType) => void;
  gridSize: number;
  setGridSize: (s: number) => void;
  seed: number | null;
  setSeed: (s: number | null) => void;
  theme: ThemeType;
  setTheme: (t: ThemeType) => void;
  solverConfig: SolverConfig;
  setSolverConfig: (c: SolverConfig) => void;
  onGenerate: () => void;
  onSolve: () => void;
  onCancel: () => void;
  onCheck: () => void;
  onReveal: () => void;
  isSolving: boolean;
}

export const Controls: React.FC<ControlsProps> = ({
  puzzleType, setPuzzleType,
  gridSize, setGridSize,
  seed, setSeed,
  theme, setTheme,
  solverConfig, setSolverConfig,
  onGenerate, onSolve, onCancel, onCheck, onReveal,
  isSolving
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const puzzleTypes: { value: PuzzleType; label: string }[] = [
    { value: 'latin-square', label: 'Latin Square' },
    { value: 'sudoku', label: 'Sudoku' },
    { value: 'maze', label: 'Maze' },
    { value: 'n-queens', label: 'N-Queens' },
    { value: 'minesweeper', label: 'Minesweeper' },
    { value: 'nonogram', label: 'Nonogram' },
    { value: 'kenken', label: 'KenKen' },
    { value: 'sliding-puzzle', label: 'Sliding Puzzle' },
  ];

  const themes: { value: ThemeType; label: string; color: string }[] = [
    { value: 'dark', label: 'Dark Mode', color: '#111827' },
    { value: 'light', label: 'Light Mode', color: '#F9FAFB' },
    { value: 'royal-blue', label: 'Royal Blue', color: '#1E3A8A' },
    { value: 'emerald-green', label: 'Emerald Green', color: '#065F46' },
    { value: 'crimson-red', label: 'Crimson Red', color: '#7F1D1D' },
    { value: 'violet-purple', label: 'Violet / Purple', color: '#4C1D95' },
  ];

  const algorithms = getAlgorithmsForPuzzle(puzzleType, gridSize);

  const handleRandomSeed = () => {
    setSeed(Math.floor(Math.random() * 1e12));
  };

  const toggleRandomMode = () => {
    if (seed === null) {
      setSeed(123456);
    } else {
      setSeed(null);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-6 bg-white/5 backdrop-blur-md rounded-2xl border border-theme-line shadow-2xl w-full max-w-md text-theme-text">
      <div className="flex justify-between items-center">
        <h2 className="text-lg font-black uppercase tracking-tighter italic">Engine Config</h2>
        <button 
          onClick={() => setShowAdvanced(!showAdvanced)}
          className={`p-2 rounded-lg transition-colors ${showAdvanced ? 'bg-blue-500/20 text-blue-400' : 'hover:bg-white/10'}`}
        >
          <Settings2 size={20} />
        </button>
      </div>

        <div className="space-y-4">
          {puzzleType === 'maze' && (
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Maze Generation Algorithm</label>
              <select
                value={solverConfig.genAlgorithm || 'dfs'}
                onChange={(e) => setSolverConfig({ ...solverConfig, genAlgorithm: e.target.value as any })}
                className="w-full bg-black/20 border border-theme-line rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer text-theme-text"
              >
                {MAZE_GEN_ALGORITHMS.map(a => (
                  <option key={a.value} value={a.value} className="bg-neutral-900">{a.label}</option>
                ))}
              </select>
            </div>
          )}

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Puzzle Type</label>
            <select
              value={puzzleType}
              onChange={(e) => {
                const newType = e.target.value as PuzzleType;
                setPuzzleType(newType);
                
                // Auto-adjust grid size for Sudoku
                if (newType === 'sudoku') {
                  const root = Math.sqrt(gridSize);
                  if (!Number.isInteger(root)) {
                    const nearestRoot = Math.round(root);
                    const nearestSquare = Math.max(4, nearestRoot * nearestRoot);
                    setGridSize(nearestSquare);
                  }
                }

                // Reset algorithm if not valid for new type
                const newAlgos = getAlgorithmsForPuzzle(newType, gridSize);
                if (!newAlgos.find(a => a.value === solverConfig.algorithm)) {
                  setSolverConfig({ ...solverConfig, algorithm: newAlgos[0].value });
                }
              }}
              className="w-full bg-black/20 border border-theme-line rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer text-theme-text"
            >
            {puzzleTypes.map(t => (
              <option key={t.value} value={t.value} className="bg-neutral-900">{t.label}</option>
            ))}
          </select>
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Grid Size: {gridSize}</label>
            {puzzleType === 'sudoku' && (
              <span className="text-[8px] font-bold text-blue-400 uppercase tracking-tighter">Perfect Square Required</span>
            )}
          </div>
          <input
            type="range"
            min="3"
            max="500"
            value={gridSize}
            onChange={(e) => {
              let val = parseInt(e.target.value);
              if (puzzleType === 'sudoku') {
                const root = Math.sqrt(val);
                if (!Number.isInteger(root)) {
                  const nearestRoot = Math.round(root);
                  val = Math.max(4, nearestRoot * nearestRoot);
                }
              }
              setGridSize(val);
            }}
            className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
        </div>

        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Generation Mode</label>
            <button 
              onClick={toggleRandomMode}
              className={`text-[10px] font-bold px-2 py-0.5 rounded transition-colors ${seed === null ? 'bg-emerald-500/20 text-emerald-400' : 'bg-blue-500/20 text-blue-400'}`}
            >
              {seed === null ? 'RANDOM' : 'SEED'}
            </button>
          </div>
          {seed !== null && (
            <div className="flex gap-2">
              <input
                type="number"
                value={seed}
                onChange={(e) => setSeed(parseInt(e.target.value) || 0)}
                className="flex-1 bg-black/20 border border-theme-line rounded-xl p-3 outline-none focus:border-blue-500 transition-all font-mono text-sm text-theme-text"
              />
              <button
                onClick={handleRandomSeed}
                className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"
                title="Random Seed"
              >
                <Shuffle size={18} />
              </button>
            </div>
          )}
        </div>
      </div>

      {showAdvanced && (
        <div className="space-y-4 pt-4 border-t border-theme-line animate-in fade-in slide-in-from-top-2">
          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Solving Algorithm</label>
            <select
              value={solverConfig.algorithm}
              onChange={(e) => setSolverConfig({ ...solverConfig, algorithm: e.target.value as AlgorithmType })}
              className="w-full bg-black/20 border border-theme-line rounded-xl p-3 outline-none focus:border-blue-500 transition-all appearance-none cursor-pointer text-theme-text"
            >
              {algorithms.map(a => (
                <option key={a.value} value={a.value} className="bg-neutral-900">{a.label}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Animation Speed</label>
              <span className="text-[10px] font-mono opacity-60">{solverConfig.speed}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="100"
              value={solverConfig.speed}
              onChange={(e) => setSolverConfig({ ...solverConfig, speed: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-emerald-500"
            />
          </div>

          <div className="flex items-center justify-between p-3 bg-black/20 rounded-xl border border-white/5">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Instant Solve</label>
            <button 
              onClick={() => setSolverConfig({ ...solverConfig, instant: !solverConfig.instant })}
              className={`w-10 h-5 rounded-full transition-colors relative ${solverConfig.instant ? 'bg-blue-500' : 'bg-white/10'}`}
            >
              <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${solverConfig.instant ? 'left-6' : 'left-1'}`} />
            </button>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-bold uppercase tracking-widest opacity-60">Theme</label>
            <div className="flex flex-wrap gap-3">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setTheme(t.value)}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${theme === t.value ? 'border-blue-500 scale-110 shadow-lg' : 'border-white/10 hover:border-white/30'}`}
                  style={{ backgroundColor: t.color }}
                  title={t.label}
                />
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          onClick={onGenerate}
          disabled={isSolving}
          className="flex-1 flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-500 disabled:bg-neutral-700 disabled:opacity-50 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-900/20 text-sm"
        >
          <RefreshCw size={16} className={isSolving ? 'animate-spin' : ''} />
          Generate
        </button>
        
        {isSolving ? (
          <button
            onClick={onCancel}
            className="flex-1 flex items-center justify-center gap-2 bg-red-600 hover:bg-red-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-red-900/20 text-sm"
          >
            <X size={16} />
            Cancel
          </button>
        ) : (
          <button
            onClick={onSolve}
            className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-emerald-900/20 text-sm"
          >
            <Play size={16} />
            AI Solve
          </button>
        )}
      </div>

      {(puzzleType === 'nonogram' || puzzleType === 'kenken') && !isSolving && (
        <div className="flex gap-2">
          <button
            onClick={onCheck}
            className="flex-1 bg-amber-600 hover:bg-amber-500 text-white font-bold py-2 rounded-xl transition-all active:scale-95 text-xs"
          >
            Check Solution
          </button>
          <button
            onClick={onReveal}
            className="flex-1 bg-purple-600 hover:bg-purple-500 text-white font-bold py-2 rounded-xl transition-all active:scale-95 text-xs"
          >
            Reveal Solution
          </button>
        </div>
      )}
    </div>
  );
};
