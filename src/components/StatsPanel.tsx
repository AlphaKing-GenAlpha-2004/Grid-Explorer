import React from 'react';
import { formatStateSpace } from '../utils/math';
import { SolveStats } from '../types';

interface StatsPanelProps {
  gridSize: number;
  seed: number | null;
  actualSeed?: number;
  stateSpace: number;
  genTime: number;
  solveStats?: SolveStats;
}

export const StatsPanel: React.FC<StatsPanelProps> = ({
  gridSize, seed, actualSeed, stateSpace, genTime, solveStats
}) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 w-full max-w-6xl p-4 bg-white/5 backdrop-blur-sm rounded-2xl border border-theme-line text-theme-text">
      <StatItem label="Grid Size" value={`${gridSize} × ${gridSize}`} />
      <StatItem 
        label="Seed" 
        value={seed !== null ? seed.toString() : (actualSeed ? `R:${actualSeed}` : 'Random')} 
      />
      <StatItem label="State Space" value={formatStateSpace(stateSpace)} />
      <StatItem label="Gen Time" value={`${genTime.toFixed(2)}ms`} />
      <StatItem label="Solve Time" value={solveStats ? `${solveStats.timeMs.toFixed(2)}ms` : '—'} />
      <StatItem label="Nodes Expanded" value={solveStats ? solveStats.nodesExpanded.toLocaleString() : '—'} />
      <StatItem label="Path Length" value={solveStats?.pathLength?.toString() || '—'} />
    </div>
  );
};

const StatItem: React.FC<{ label: string; value: string }> = ({ label, value }) => (
  <div className="flex flex-col">
    <span className="text-[10px] font-bold uppercase tracking-widest opacity-40">{label}</span>
    <span className="text-sm font-mono font-medium truncate">{value}</span>
  </div>
);
