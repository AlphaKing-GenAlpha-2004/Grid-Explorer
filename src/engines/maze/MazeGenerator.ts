import { RNG } from '../../utils/rng';
import { MazeGenAlgorithm, MazeData } from '../../types';
import { DFSGenerator } from './DFSGenerator';
import { PrimGenerator } from './PrimGenerator';
import { KruskalGenerator } from './KruskalGenerator';
import { BinaryTreeGenerator } from './BinaryTreeGenerator';

export class MazeGenerator {
  static generate(size: number, seed: number, algorithm: MazeGenAlgorithm = 'dfs'): MazeData {
    const rng = new RNG(seed);
    let grid: number[][];

    // Ensure size is odd for wall-based mazes
    const actualSize = size % 2 === 0 ? size + 1 : size;

    switch (algorithm) {
      case 'prim':
        grid = PrimGenerator.generate(actualSize, rng);
        break;
      case 'kruskal':
        grid = KruskalGenerator.generate(actualSize, rng);
        break;
      case 'binary-tree':
        grid = BinaryTreeGenerator.generate(actualSize, rng);
        break;
      case 'dfs':
      default:
        grid = DFSGenerator.generate(actualSize, rng);
        break;
    }

    // Start and End nodes
    const start = { r: 0, c: 0 };
    const end = { r: actualSize - 1, c: actualSize - 1 };
    
    // Ensure end is reachable (sometimes generators leave it as wall if size is even)
    if (grid[end.r][end.c] === 1) {
      // Find nearest path
      if (grid[end.r - 1][end.c] === 0) grid[end.r][end.c] = 0;
      else if (grid[end.r][end.c - 1] === 0) grid[end.r][end.c] = 0;
      else {
        grid[end.r][end.c] = 0;
        grid[end.r - 1][end.c] = 0;
      }
    }

    let carvedCount = 0;
    for (let r = 0; r < actualSize; r++) {
      for (let c = 0; c < actualSize; c++) {
        if (grid[r][c] === 0) carvedCount++;
      }
    }

    return { grid, start, end, carvedCount };
  }
}
