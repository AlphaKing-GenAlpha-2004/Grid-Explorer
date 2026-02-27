export type PuzzleType = 
  | 'math-latin-square'
  | 'sudoku' 
  | 'maze' 
  | 'n-queens' 
  | 'minesweeper' 
  | 'nonogram' 
  | 'kenken' 
  | 'sliding-puzzle';

export type AlgorithmType =
  | 'astar-manhattan'
  | 'astar-hamming'
  | 'bfs'
  | 'dfs'
  | 'dijkstra'
  | 'idastar'
  | 'greedy'
  | 'backtracking'
  | 'backtracking-mrv'
  | 'forward-checking'
  | 'ac3'
  | 'constructive'
  | 'logical-deduction'
  | 'probabilistic'
  | 'constraint-propagation'
  | 'hybrid';

export type ThemeType = 
  | 'dark' 
  | 'light' 
  | 'royal-blue' 
  | 'emerald-green' 
  | 'crimson-red' 
  | 'violet-purple';

export type MazeGenAlgorithm =
  | 'dfs'
  | 'prim'
  | 'kruskal'
  | 'binary-tree'
  | 'eller';

export interface SolverConfig {
  algorithm: AlgorithmType;
  genAlgorithm?: MazeGenAlgorithm;
  speed: number; // 0-100
  instant: boolean;
}

export interface MazeData {
  grid: number[][];
  start: { r: number; c: number };
  end: { r: number; c: number };
  carvedCount: number;
}

export type MathOp = '+' | '-' | '*' | '/';

export interface MathLatinSquareData {
  grid: number[][]; // User input grid
  solution: number[][];
  rowOps: MathOp[][]; // [row][op_index]
  colOps: MathOp[][]; // [col][op_index]
  rowTargets: number[];
  colTargets: number[];
}

export interface SolveStats {
  timeMs: number;
  steps: number;
  iterations: number;
  depth: number;
  nodesExpanded: number;
  pathLength?: number;
}

export interface NonogramData {
  rowClues: number[][];
  colClues: number[][];
  solution: number[][];
  userGrid: number[][]; // 0: empty, 1: filled, -1: marked (X)
}

export type KenKenOp = '+' | '-' | '*' | '/' | 'none';

export interface KenKenCage {
  cells: { r: number; c: number }[];
  target: number;
  op: KenKenOp;
}

export interface KenKenData {
  grid: number[][]; // User input grid
  solution: number[][];
  cages: KenKenCage[];
}

export interface PuzzleState {
  type: PuzzleType;
  size: number;
  rows?: number;
  cols?: number;
  seed: number | null; // null means random
  actualSeed: number;
  generationId: number;
  data: any;
  initialData: any;
  solution?: any;
  isSolved: boolean;
  solveStats?: SolveStats;
  solvingProgress?: number; // 0-1
  moves?: number;
  startTime?: number;
}

export interface WorkerRequest {
  type: PuzzleType;
  algorithm: AlgorithmType;
  data: any;
  size: number;
  rows?: number;
  cols?: number;
}

export interface WorkerResponse {
  solution: any;
  stats: SolveStats;
  error?: string;
}
