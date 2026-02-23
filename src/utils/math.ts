/**
 * Logarithmic math utilities for state space calculations
 */

export function log10Factorial(n: number): number {
  if (n < 2) return 0;
  // Stirling's approximation: log10(n!) ≈ n log10(n) - n log10(e) + 0.5 log10(2πn)
  return n * Math.log10(n) - n * Math.log10(Math.E) + 0.5 * Math.log10(2 * Math.PI * n);
}

export function formatStateSpace(exponent: number): string {
  if (exponent > 1e6) {
    return `10^(${exponent.toExponential(4)})`;
  }
  return `10^(${exponent.toFixed(6)})`;
}

export function calculateStateSpace(type: string, n: number): number {
  switch (type) {
    case 'latin-square':
      // Lower bound for Latin Squares: (n!)^(2n) / n^(n^2) is too complex
      // Rough estimate: n^(n^2)
      return n * n * Math.log10(n);
    
    case 'sudoku':
      if (n === 9) return 21.82; // Known constant for 9x9
      return n * n * Math.log10(n); // Fallback
    
    case 'maze':
      // Number of spanning trees in a grid graph is roughly 3.2^N
      return n * n * Math.log10(3.2);
    
    case 'n-queens':
      // n! permutations
      return log10Factorial(n);
    
    case 'minesweeper':
      // 2^(n^2)
      return n * n * Math.log10(2);
    
    case 'nonogram':
      // 2^(n^2)
      return n * n * Math.log10(2);
    
    case 'sliding-puzzle':
      // (n^2)! / 2
      return log10Factorial(n * n) - Math.log10(2);
    
    case 'kenken':
      // Similar to Latin Square
      return n * n * Math.log10(n);
    
    default:
      return 0;
  }
}
