import { RNG } from '../utils/rng';

export interface SudokuData {
  grid: number[][];
  solution: number[][];
}

export class SudokuEngine {
  static generate(size: number, seed: number): SudokuData {
    const rng = new RNG(seed);
    const n = Math.sqrt(size);
    if (!Number.isInteger(n)) {
      throw new Error("Sudoku size must be a perfect square (e.g., 4, 9, 16, 25, 36).");
    }

    // 1. Generate complete valid Sudoku solution using pattern
    const solution = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        solution[r][c] = ((r * n + Math.floor(r / n) + c) % size) + 1;
      }
    }

    // 2. Apply random permutations that preserve Sudoku properties
    // Shuffle numbers
    const nums = rng.shuffle(Array.from({ length: size }, (_, i) => i + 1));
    const map = new Map<number, number>();
    nums.forEach((v, i) => map.set(i + 1, v));
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        solution[r][c] = map.get(solution[r][c])!;
      }
    }

    // Shuffle row bands
    const bandIndices = rng.shuffle(Array.from({ length: n }, (_, i) => i));
    const rowPermutation: number[] = [];
    bandIndices.forEach(b => {
      const rowsInBand = rng.shuffle(Array.from({ length: n }, (_, i) => b * n + i));
      rowPermutation.push(...rowsInBand);
    });

    // Shuffle column stacks
    const stackIndices = rng.shuffle(Array.from({ length: n }, (_, i) => i));
    const colPermutation: number[] = [];
    stackIndices.forEach(s => {
      const colsInStack = rng.shuffle(Array.from({ length: n }, (_, i) => s * n + i));
      colPermutation.push(...colsInStack);
    });

    const finalSolution = Array.from({ length: size }, () => Array(size).fill(0));
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        finalSolution[r][c] = solution[rowPermutation[r]][colPermutation[c]];
      }
    }

    // 3. Create puzzle by removing cells
    const puzzle = finalSolution.map(row => [...row]);
    
    // Difficulty-based density
    // For 9x9, we want ~30 clues on average.
    // For larger grids, we need higher density to keep it solvable/interesting.
    const density = size <= 9 ? 0.35 : 0.45;
    
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (rng.next() > density) {
          puzzle[r][c] = 0;
        }
      }
    }

    // Ensure minimum clues for 9x9
    if (size === 9) {
      let clues = 0;
      puzzle.forEach(row => row.forEach(v => { if (v !== 0) clues++; }));
      while (clues < 17) {
        const r = rng.nextInt(0, 8);
        const c = rng.nextInt(0, 8);
        if (puzzle[r][c] === 0) {
          puzzle[r][c] = finalSolution[r][c];
          clues++;
        }
      }
    }

    return { grid: puzzle, solution: finalSolution };
  }
}
