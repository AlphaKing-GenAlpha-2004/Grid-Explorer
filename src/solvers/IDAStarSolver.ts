import { SolverResult } from './AStarSolver';

export class IDAStarSolver {
  static solveSliding(grid: number[][]): SolverResult {
    const startTime = performance.now();
    const size = grid.length;
    const total = size * size;
    
    const startFlat = grid.flat();
    const targetFlat = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    const targetStr = targetFlat.join(',');

    const targetPos: { r: number; c: number }[] = Array(total);
    for (let i = 0; i < total; i++) {
      const val = targetFlat[i];
      targetPos[val] = { r: Math.floor(i / size), c: i % size };
    }

    const manhattan = (flat: number[]): number => {
      let dist = 0;
      for (let i = 0; i < total; i++) {
        const val = flat[i];
        if (val !== 0) {
          const tPos = targetPos[val];
          dist += Math.abs(Math.floor(i / size) - tPos.r) + Math.abs((i % size) - tPos.c);
        }
      }
      return dist;
    };

    let iterations = 0;
    let nodesExpanded = 0;
    const path: number[][] = [startFlat];
    
    const search = (flat: number[], emptyIdx: number, gScore: number, bound: number): number => {
      iterations++;
      nodesExpanded++;
      const h = manhattan(flat);
      const f = gScore + h;
      if (f > bound) return f;
      if (h === 0) return -1;
      
      let min = Infinity;
      const r = Math.floor(emptyIdx / size);
      const c = emptyIdx % size;
      
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(emptyIdx - size);
      if (r < size - 1) neighbors.push(emptyIdx + size);
      if (c > 0) neighbors.push(emptyIdx - 1);
      if (c < size - 1) neighbors.push(emptyIdx + 1);
      
      for (const nextIdx of neighbors) {
        const nextFlat = [...flat];
        [nextFlat[emptyIdx], nextFlat[nextIdx]] = [nextFlat[nextIdx], nextFlat[emptyIdx]];
        
        const nextStr = nextFlat.join(',');
        if (path.some(p => p.join(',') === nextStr)) continue;
        
        path.push(nextFlat);
        const t = search(nextFlat, nextIdx, gScore + 1, bound);
        if (t === -1) return -1;
        if (t < min) min = t;
        path.pop();
      }
      return min;
    };

    let threshold = manhattan(startFlat);
    const startEmptyIdx = startFlat.indexOf(0);

    while (true) {
      if (performance.now() - startTime > 5000) break; // 5s timeout
      const t = search(startFlat, startEmptyIdx, 0, threshold);
      if (t === -1) {
        const solution = path.map(p => {
          const grid2D: number[][] = [];
          for (let r = 0; r < size; r++) grid2D.push(p.slice(r * size, (r + 1) * size));
          return grid2D;
        });
        return {
          solution,
          stats: { timeMs: performance.now() - startTime, steps: solution.length - 1, iterations, depth: threshold, nodesExpanded }
        };
      }
      if (t === Infinity) break;
      threshold = t;
    }

    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static getTarget(size: number): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size * size - 1; i++) {
      grid[Math.floor(i / size)][i % size] = i + 1;
    }
    return grid;
  }
}
