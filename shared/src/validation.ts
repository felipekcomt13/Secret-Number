import { Operation } from './types/enums';

/**
 * Cuenta cuántos números entre `lo` y `hi` (exclusivos) contienen el dígito 0.
 * Ej: entre 44 y 88 → 50, 60, 70, 80 → 4
 */
function countNumbersWithZero(a: number, b: number): number {
  const lo = Math.min(a, b);
  const hi = Math.max(a, b);
  let count = 0;
  for (let n = lo + 1; n < hi; n++) {
    if (String(n).includes('0')) count++;
  }
  return count;
}

export function computeOperation(a: number, b: number, op: Operation): number | string | null {
  switch (op) {
    // Suma: revela la suma si está entre 20 y 180, sino indica el rango
    case Operation.ADD: {
      const sum = a + b;
      if (sum > 180) return 'La suma es mayor a 180';
      if (sum < 20) return 'La suma es menor a 20';
      return sum;
    }

    // Multiplicación: revela solo el último dígito del producto
    case Operation.MULTIPLY:
      return (a * b) % 10;

    // División: mayor ÷ menor, descartando decimales
    case Operation.DIVIDE: {
      const big = Math.max(a, b);
      const small = Math.min(a, b);
      if (small === 0) return null;
      return Math.floor(big / small);
    }

    // Carta Cero: cantidad de números con dígito 0 entre ambos (exclusivo)
    case Operation.ZERO_CARD:
      return countNumbersWithZero(a, b);
  }
}

export function isOperationAvailable(
  playerAOps: Operation[],
  playerBOps: Operation[],
  operation: Operation
): boolean {
  return playerAOps.includes(operation) && playerBOps.includes(operation);
}
