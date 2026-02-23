export interface SolverResult {
  solution: any;
  visited?: { r: number; c: number }[];
  frontier?: { r: number; c: number }[];
  stats: {
    timeMs: number;
    steps: number;
    iterations: number;
    depth: number;
    nodesExpanded: number;
    pathLength?: number;
  };
}

export class AStarSolver {
  static solveMaze(grid: number[][], start: { r: number; c: number }, end: { r: number; c: number }, algorithm: string = 'astar-manhattan'): SolverResult {
    const startTime = performance.now();
    const size = grid.length;
    const openSet: { r: number; c: number; g: number; f: number; parent?: any }[] = [];
    const closedSet = new Set<string>();
    
    openSet.push({ ...start, g: 0, f: this.heuristic(start, end) });
    
    let iterations = 0;
    let nodesExpanded = 0;
    const visited: { r: number; c: number }[] = [];
    
    while (openSet.length > 0) {
      iterations++;
      if (iterations > 100000) break;
      
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      nodesExpanded++;
      visited.push({ r: current.r, c: current.c });
      
      if (current.r === end.r && current.c === end.c) {
        const path: { r: number; c: number }[] = [];
        let temp: any = current;
        while (temp) {
          path.push({ r: temp.r, c: temp.c });
          temp = temp.parent;
        }
        return {
          solution: path.reverse(),
          visited,
          frontier: openSet.map(o => ({ r: o.r, c: o.c })),
          stats: { timeMs: performance.now() - startTime, steps: path.length, iterations, depth: current.g, nodesExpanded, pathLength: path.length }
        };
      }
      
      closedSet.add(`${current.r},${current.c}`);
      
      const neighbors = [
        { r: current.r + 1, c: current.c },
        { r: current.r - 1, c: current.c },
        { r: current.r, c: current.c + 1 },
        { r: current.r, c: current.c - 1 }
      ].filter(n => n.r >= 0 && n.r < size && n.c >= 0 && n.c < size && grid[n.r][n.c] === 0 && !closedSet.has(`${n.r},${n.c}`));
      
      for (const neighbor of neighbors) {
        const g = current.g + 1;
        const h = this.heuristic(neighbor, end);
        const f = algorithm === 'greedy' ? h : g + h;
        
        const existing = openSet.find(o => o.r === neighbor.r && o.c === neighbor.c);
        if (!existing) {
          openSet.push({ ...neighbor, g, f, parent: current });
        } else if (g < existing.g && algorithm !== 'greedy') {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  static solveSliding(grid: number[][], algorithm: string = 'astar-manhattan'): SolverResult {
    const startTime = performance.now();
    const size = grid.length;
    const total = size * size;
    
    // Convert to 1D for efficiency
    const startFlat = grid.flat();
    const targetFlat = Array.from({ length: total }, (_, i) => (i === total - 1 ? 0 : i + 1));
    const targetStr = targetFlat.join(',');
    
    // Pre-calculate target positions for Manhattan distance
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

    const hamming = (flat: number[]): number => {
      let dist = 0;
      for (let i = 0; i < total; i++) {
        if (flat[i] !== 0 && flat[i] !== targetFlat[i]) dist++;
      }
      return dist;
    };

    const getH = (flat: number[]) => algorithm === 'astar-hamming' ? hamming(flat) : manhattan(flat);

    const openSet: { flat: number[]; g: number; f: number; emptyIdx: number; parent?: any }[] = [];
    const closedSet = new Set<string>();
    
    const startEmptyIdx = startFlat.indexOf(0);
    openSet.push({ flat: startFlat, g: 0, f: getH(startFlat), emptyIdx: startEmptyIdx });
    
    let iterations = 0;
    let nodesExpanded = 0;
    
    while (openSet.length > 0) {
      iterations++;
      // Limit iterations to prevent UI freeze, though Web Worker handles it
      if (iterations > 100000) break;
      if (iterations % 1000 === 0 && performance.now() - startTime > 3000) break;
      
      openSet.sort((a, b) => a.f - b.f);
      const current = openSet.shift()!;
      nodesExpanded++;
      
      const currentStr = current.flat.join(',');
      if (currentStr === targetStr) {
        const path: number[][][] = [];
        let temp: any = current;
        while (temp) {
          const grid2D: number[][] = [];
          for (let r = 0; r < size; r++) grid2D.push(temp.flat.slice(r * size, (r + 1) * size));
          path.push(grid2D);
          temp = temp.parent;
        }
        return {
          solution: path.reverse(),
          stats: { timeMs: performance.now() - startTime, steps: path.length - 1, iterations, depth: current.g, nodesExpanded }
        };
      }
      
      closedSet.add(currentStr);
      
      const r = Math.floor(current.emptyIdx / size);
      const c = current.emptyIdx % size;
      
      const neighbors: number[] = [];
      if (r > 0) neighbors.push(current.emptyIdx - size);
      if (r < size - 1) neighbors.push(current.emptyIdx + size);
      if (c > 0) neighbors.push(current.emptyIdx - 1);
      if (c < size - 1) neighbors.push(current.emptyIdx + 1);
      
      for (const nextIdx of neighbors) {
        const nextFlat = [...current.flat];
        [nextFlat[current.emptyIdx], nextFlat[nextIdx]] = [nextFlat[nextIdx], nextFlat[current.emptyIdx]];
        
        const nextStr = nextFlat.join(',');
        if (closedSet.has(nextStr)) continue;
        
        const g = current.g + 1;
        const h = getH(nextFlat);
        const f = algorithm === 'greedy' ? h : g + h;
        
        // Check if already in openSet with better g
        // This is still O(N) but better than nothing. 
        // In a real app we'd use a Priority Queue + Map.
        const existing = openSet.find(o => o.flat.join(',') === nextStr);
        if (!existing) {
          openSet.push({ flat: nextFlat, g, f, emptyIdx: nextIdx, parent: current });
        } else if (g < existing.g && algorithm !== 'greedy') {
          existing.g = g;
          existing.f = f;
          existing.parent = current;
        }
      }
    }
    
    return { solution: null, stats: { timeMs: performance.now() - startTime, steps: 0, iterations, depth: 0, nodesExpanded } };
  }

  private static getHeuristic(grid: number[][], target: number[][], algorithm: string): number {
    if (algorithm === 'astar-hamming') {
      return this.hamming(grid, target);
    }
    return this.manhattan(grid, target);
  }

  private static heuristic(a: { r: number; c: number }, b: { r: number; c: number }): number {
    return Math.abs(a.r - b.r) + Math.abs(a.c - b.c);
  }

  private static hamming(grid: number[][], target: number[][]): number {
    let dist = 0;
    const size = grid.length;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        if (grid[r][c] !== 0 && grid[r][c] !== target[r][c]) {
          dist++;
        }
      }
    }
    return dist;
  }

  private static manhattan(grid: number[][], target: number[][]): number {
    let dist = 0;
    const size = grid.length;
    const posMap: Record<number, { r: number; c: number }> = {};
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        posMap[target[r][c]] = { r, c };
      }
    }
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const val = grid[r][c];
        if (val !== 0) {
          const targetPos = posMap[val];
          dist += Math.abs(r - targetPos.r) + Math.abs(c - targetPos.c);
        }
      }
    }
    return dist;
  }

  private static findEmpty(grid: number[][]) {
    for (let r = 0; r < grid.length; r++) {
      for (let c = 0; c < grid[r].length; c++) {
        if (grid[r][c] === 0) return { r, c };
      }
    }
    return { r: 0, c: 0 };
  }

  private static getTarget(size: number): number[][] {
    const grid = Array.from({ length: size }, () => Array(size).fill(0));
    for (let i = 0; i < size * size - 1; i++) {
      grid[Math.floor(i / size)][i % size] = i + 1;
    }
    return grid;
  }
}
