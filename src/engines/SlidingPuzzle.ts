import { RNG } from '../utils/rng';

export interface SlidingPuzzleData {
  grid: number[][];
  flatGrid: number[];
  emptyPos: { r: number; c: number; idx: number };
  size: number;
}

export class SlidingPuzzleEngine {
  static generate(size: number, seed: number): SlidingPuzzleData {
    const rng = new RNG(seed);
    const n = size;
    const total = n * n;
    
    // Start with solved state
    const flatGrid = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    
    // Perform K random valid moves to shuffle
    // K scales with size to ensure good mixing
    let k = n * n * 20; 
    if (n <= 4) k = Math.max(k, 200); // More shuffles for small grids
    if (n > 20) k = n * 50; // Cap for very large grids to keep generation fast
    
    let emptyIdx = total - 1;
    
    for (let i = 0; i < k; i++) {
      const r = Math.floor(emptyIdx / n);
      const c = emptyIdx % n;
      
      const possibleMoves: number[] = [];
      if (r > 0) possibleMoves.push(emptyIdx - n); // Up
      if (r < n - 1) possibleMoves.push(emptyIdx + n); // Down
      if (c > 0) possibleMoves.push(emptyIdx - 1); // Left
      if (c < n - 1) possibleMoves.push(emptyIdx + 1); // Right
      
      const nextIdx = possibleMoves[rng.nextInt(0, possibleMoves.length - 1)];
      
      // Swap
      [flatGrid[emptyIdx], flatGrid[nextIdx]] = [flatGrid[nextIdx], flatGrid[emptyIdx]];
      emptyIdx = nextIdx;
    }
    
    // Convert to 2D for rendering
    const grid: number[][] = [];
    for (let r = 0; r < n; r++) {
      grid[r] = flatGrid.slice(r * n, (r + 1) * n);
    }
    
    return { 
      grid, 
      flatGrid, 
      emptyPos: { 
        r: Math.floor(emptyIdx / n), 
        c: emptyIdx % n, 
        idx: emptyIdx 
      },
      size: n
    };
  }

  static isSolvable(flat: number[], n: number): boolean {
    let inversions = 0;
    const tiles = flat.filter(x => x !== 0);
    for (let i = 0; i < tiles.length; i++) {
      for (let j = i + 1; j < tiles.length; j++) {
        if (tiles[i] > tiles[j]) inversions++;
      }
    }

    if (n % 2 !== 0) {
      return inversions % 2 === 0;
    } else {
      const emptyIdx = flat.indexOf(0);
      const emptyRowFromBottom = n - Math.floor(emptyIdx / n);
      if (emptyRowFromBottom % 2 !== 0) {
        return inversions % 2 === 0;
      } else {
        return inversions % 2 !== 0;
      }
    }
  }
}
