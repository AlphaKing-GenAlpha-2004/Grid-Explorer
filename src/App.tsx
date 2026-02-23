import { useState, useEffect, useCallback } from 'react';
import { PuzzleType, ThemeType, PuzzleState, SolverConfig } from './types';
import { Background } from './components/Backgrounds';
import { Controls } from './components/Controls';
import { StatsPanel } from './components/StatsPanel';
import { GridRenderer } from './components/GridRenderer';
import { LatinSquareEngine } from './engines/LatinSquare';
import { SudokuEngine } from './engines/Sudoku';
import { MazeEngine } from './engines/Maze';
import { NQueensEngine } from './engines/NQueens';
import { MinesweeperEngine } from './engines/Minesweeper';
import { NonogramEngine } from './engines/Nonogram';
import { KenKenEngine } from './engines/KenKen';
import { SlidingPuzzleEngine } from './engines/SlidingPuzzle';
import { SolverEngine } from './solvers/SolverEngine';
import { calculateStateSpace } from './utils/math';
import { motion, AnimatePresence } from 'motion/react';
import { Github, Info, AlertTriangle } from 'lucide-react';

export default function App() {
  const [puzzleType, setPuzzleType] = useState<PuzzleType>('latin-square');
  const [gridSize, setGridSize] = useState<number>(5);
  const [seed, setSeed] = useState<number | null>(123456);
  const [theme, setTheme] = useState<ThemeType>(() => {
    const saved = localStorage.getItem('grid-explorer-theme');
    return (saved as ThemeType) || 'dark';
  });

  useEffect(() => {
    localStorage.setItem('grid-explorer-theme', theme);
  }, [theme]);
  const [solverConfig, setSolverConfig] = useState<SolverConfig>({
    algorithm: 'backtracking',
    speed: 50,
    instant: true
  });
  const [puzzle, setPuzzle] = useState<PuzzleState | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const [genTime, setGenTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [generationCount, setGenerationCount] = useState(0);

  const generatePuzzle = useCallback(() => {
    const startTime = performance.now();
    let data: any;
    let solution: any;
    const currentSeed = seed === null ? Math.floor(Math.random() * 1e12) : seed;
    
    console.log(`[Engine] Generating ${puzzleType} | Size: ${gridSize} | Seed: ${currentSeed} | GenID: ${generationCount}`);

    try {
      switch (puzzleType) {
        case 'latin-square':
          data = LatinSquareEngine.generate(gridSize, currentSeed);
          break;
        case 'sudoku': {
          const sudokuData = SudokuEngine.generate(gridSize, currentSeed);
          data = sudokuData.grid;
          solution = sudokuData.solution;
          break;
        }
        case 'maze':
          data = MazeEngine.generate(gridSize, currentSeed, solverConfig.genAlgorithm);
          break;
        case 'n-queens':
          data = NQueensEngine.generate(gridSize, currentSeed);
          break;
        case 'minesweeper':
          data = MinesweeperEngine.generate(gridSize, currentSeed);
          break;
        case 'nonogram':
          data = NonogramEngine.generate(gridSize, currentSeed);
          break;
        case 'kenken':
          data = KenKenEngine.generate(gridSize, currentSeed);
          break;
        case 'sliding-puzzle':
          data = SlidingPuzzleEngine.generate(gridSize, currentSeed);
          break;
      }

      setPuzzle({
        type: puzzleType,
        size: gridSize,
        seed: seed,
        actualSeed: currentSeed,
        generationId: generationCount,
        data: data,
        solution: solution,
        isSolved: false
      });
      setGenTime(performance.now() - startTime);
      setError(null);
    } catch (err) {
      console.error("Generation failed:", err);
      setError("Generation failed for this size/type combination.");
    }
  }, [puzzleType, gridSize, seed, solverConfig.genAlgorithm, generationCount]);

  useEffect(() => {
    generatePuzzle();
  }, [puzzleType, gridSize, seed, solverConfig.genAlgorithm, generationCount]);

  const handleGenerate = () => {
    setGenerationCount(prev => prev + 1);
  };

  const handleSolve = async () => {
    if (!puzzle || isSolving) return;
    setIsSolving(true);
    setError(null);
    
    try {
      const result = await SolverEngine.solve(puzzle.type, solverConfig.algorithm, puzzle.data, puzzle.size);
      
      const shouldAnimate = puzzle.type === 'maze' && !solverConfig.instant && result.visited && puzzle.size <= 300;
      
      if (shouldAnimate) {
        // Animate maze solving
        let speed = Math.max(1, 101 - solverConfig.speed);
        if (puzzle.size > 100) speed = Math.max(speed, 10); // Limit speed for medium grids
        
        const visited = result.visited!;
        const frontier = result.frontier || [];
        
        const stepSize = puzzle.size > 100 ? Math.max(5, Math.floor(visited.length / 100)) : 1;
        
        for (let i = 0; i < visited.length; i += stepSize) {
          if (!isSolving) break; // Check if cancelled
          
          setPuzzle(prev => prev ? {
            ...prev,
            data: {
              ...prev.data,
              currentVisited: visited.slice(0, i + 1),
              currentFrontier: frontier.slice(0, i + 1)
            }
          } : null);
          
          await new Promise(r => setTimeout(r, speed));
        }
      }

      setPuzzle(prev => prev ? {
        ...prev,
        solution: result.solution,
        isSolved: true,
        solveStats: result.stats
      } : null);
    } catch (err: any) {
      setError(err.message || "Solving failed.");
    } finally {
      setIsSolving(false);
    }
  };

  const handleCancel = () => {
    SolverEngine.terminate();
    setIsSolving(false);
  };

  const handleCellClick = (r: number, c: number) => {
    if (!puzzle || isSolving || puzzle.isSolved) return;

    if (puzzle.type === 'sliding-puzzle') {
      const { grid, emptyPos } = puzzle.data;
      const dr = Math.abs(r - emptyPos.r);
      const dc = Math.abs(c - emptyPos.c);
      if ((dr === 1 && dc === 0) || (dr === 0 && dc === 1)) {
        const newGrid = grid.map((row: any) => [...row]);
        newGrid[emptyPos.r][emptyPos.c] = newGrid[r][c];
        newGrid[r][c] = 0;
        setPuzzle({
          ...puzzle,
          data: { grid: newGrid, emptyPos: { r, c } }
        });
      }
    } else if (puzzle.type === 'minesweeper') {
      if (puzzle.data.revealed[r][c]) return;
      const newRevealed = puzzle.data.revealed.map((row: any) => [...row]);
      newRevealed[r][c] = true;
      if (puzzle.data.grid[r][c] === -1) {
        setError("Game Over! You hit a mine.");
        setPuzzle({ ...puzzle, isSolved: true });
      } else {
        setPuzzle({
          ...puzzle,
          data: { ...puzzle.data, revealed: newRevealed }
        });
      }
    } else if (puzzle.type === 'maze') {
      if (puzzle.data.grid[r][c] === 1) return; // Cannot place on wall
      
      const isStart = r === puzzle.data.start.r && c === puzzle.data.start.c;
      const isEnd = r === puzzle.data.end.r && c === puzzle.data.end.c;
      
      if (isStart || isEnd) return; // Already there

      const distStart = Math.abs(r - puzzle.data.start.r) + Math.abs(c - puzzle.data.start.c);
      const distEnd = Math.abs(r - puzzle.data.end.r) + Math.abs(c - puzzle.data.end.c);
      
      if (distStart < distEnd) {
        setPuzzle({
          ...puzzle,
          data: { ...puzzle.data, start: { r, c } },
          isSolved: false,
          solution: undefined
        });
      } else {
        setPuzzle({
          ...puzzle,
          data: { ...puzzle.data, end: { r, c } },
          isSolved: false,
          solution: undefined
        });
      }
    } else if (puzzle.type === 'nonogram') {
      const newGrid = puzzle.data.userGrid.map((row: any) => [...row]);
      // Cycle: 0 -> 1 -> -1 -> 0
      if (newGrid[r][c] === 0) newGrid[r][c] = 1;
      else if (newGrid[r][c] === 1) newGrid[r][c] = -1;
      else newGrid[r][c] = 0;
      
      setPuzzle({
        ...puzzle,
        data: { ...puzzle.data, userGrid: newGrid }
      });
    } else if (puzzle.type === 'kenken') {
      const val = prompt(`Enter number (1-${puzzle.size}):`);
      if (val === null) return;
      const num = parseInt(val);
      if (isNaN(num) || num < 0 || num > puzzle.size) return;
      
      const newGrid = puzzle.data.grid.map((row: any) => [...row]);
      newGrid[r][c] = num;
      setPuzzle({
        ...puzzle,
        data: { ...puzzle.data, grid: newGrid }
      });
    }
  };

  const handleCheckSolution = () => {
    if (!puzzle) return;
    let isCorrect = false;
    if (puzzle.type === 'nonogram') {
      isCorrect = puzzle.data.userGrid.every((row: any, r: number) => 
        row.every((val: number, c: number) => {
          const expected = puzzle.data.solution[r][c];
          const actual = val === 1 ? 1 : 0;
          return expected === actual;
        })
      );
    } else if (puzzle.type === 'kenken') {
      isCorrect = puzzle.data.grid.every((row: any, r: number) => 
        row.every((val: number, c: number) => val === puzzle.data.solution[r][c])
      );
    } else {
      isCorrect = JSON.stringify(puzzle.data) === JSON.stringify(puzzle.solution);
    }

    if (isCorrect) {
      setPuzzle({ ...puzzle, isSolved: true, solution: puzzle.data.solution || puzzle.solution });
    } else {
      setError("Solution is incorrect. Keep trying!");
    }
  };

  const handleRevealSolution = () => {
    if (!puzzle) return;
    setPuzzle({
      ...puzzle,
      isSolved: true,
      solution: puzzle.data.solution || puzzle.solution
    });
  };

  const stateSpace = calculateStateSpace(puzzleType, gridSize);

  return (
    <div className="min-h-screen flex flex-col items-center p-4 md:p-8 font-sans transition-colors duration-500">
      <Background theme={theme} />
      
      <header className="w-full max-w-6xl flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="flex flex-col"
        >
          <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase italic">
            Grid Explorer
          </h1>
          <p className="text-xs font-bold tracking-[0.3em] uppercase opacity-50">
            Interactive AI Puzzle Platform
          </p>
        </motion.div>

        <div className="flex gap-4">
          <a href="#" className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <Github size={20} />
          </a>
          <button className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition-colors">
            <Info size={20} />
          </button>
        </div>
      </header>

      <main className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-[400px_1fr] gap-8 items-start">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Controls 
            puzzleType={puzzleType}
            setPuzzleType={setPuzzleType}
            gridSize={gridSize}
            setGridSize={setGridSize}
            seed={seed}
            setSeed={setSeed}
            theme={theme}
            setTheme={setTheme}
            solverConfig={solverConfig}
            setSolverConfig={setSolverConfig}
            onGenerate={handleGenerate}
            onSolve={handleSolve}
            onCancel={handleCancel}
            onCheck={handleCheckSolution}
            onReveal={handleRevealSolution}
            isSolving={isSolving}
          />
        </motion.div>

        <motion.div 
          className="flex flex-col gap-6 items-center"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.2 }}
        >
          <StatsPanel 
            gridSize={gridSize}
            seed={seed}
            actualSeed={puzzle?.actualSeed}
            stateSpace={stateSpace}
            genTime={genTime}
            solveStats={puzzle?.solveStats}
          />

          {error && (
            <motion.div 
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="w-full flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 text-sm"
            >
              <AlertTriangle size={18} />
              {error}
            </motion.div>
          )}

          <AnimatePresence mode="wait">
            <motion.div
              key={`${puzzleType}-${gridSize}-${seed}-${puzzle?.generationId}-${puzzle?.isSolved}`}
              initial={{ opacity: 0, rotateY: 10 }}
              animate={{ opacity: 1, rotateY: 0 }}
              exit={{ opacity: 0, rotateY: -10 }}
              className="w-full flex justify-center relative"
            >
              {puzzle && puzzle.type === 'sliding-puzzle' && puzzle.size > 4 && puzzle.isSolved && (
                <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/80 backdrop-blur-sm p-8 text-center rounded-xl">
                  <div className="max-w-xs">
                    <h3 className="text-xl font-bold text-blue-400 mb-2">Complexity Limit</h3>
                    <p className="text-sm opacity-80">
                      For grids larger than 4×4, the state space (10^{calculateStateSpace('sliding-puzzle', puzzle.size).toFixed(2)}) 
                      leads to exponential explosion in A* search. Full pathfinding is disabled to prevent UI freeze.
                    </p>
                  </div>
                </div>
              )}
              {puzzle && (
                <GridRenderer 
                  type={puzzle.type}
                  size={puzzle.size}
                  data={puzzle.data}
                  solution={puzzle.solution}
                  isSolved={puzzle.isSolved}
                  onCellClick={handleCellClick}
                />
              )}
            </motion.div>
          </AnimatePresence>
        </motion.div>
      </main>

      <footer className="mt-auto pt-12 pb-4 text-[10px] uppercase tracking-widest opacity-30 font-bold">
        Deterministic Neural Grid Engine v1.1.0 // Stateless Architecture
      </footer>
    </div>
  );
}
