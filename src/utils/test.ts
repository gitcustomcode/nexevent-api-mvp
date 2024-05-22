export interface StateSumsFunc {
  [key: string]: {
    count: number;
    ticketSum: number;
  };
}

export function getMaxParticipantsState(stateSums: StateSumsFunc): {
  state: string;
  count: number;
} {
  let maxState: string | null = null;
  let maxCount = 0;

  for (const [state, { count }] of Object.entries(stateSums)) {
    if (count > maxCount) {
      maxCount = count;
      maxState = state;
    }
  }

  return { state: maxState!, count: maxCount }; // Usando `!` porque sabemos que `maxState` não será nulo após o loop
}

// Função para encontrar o estado com o maior total de vendas
export function getMaxSalesState(stateSums: StateSumsFunc): {
  state: string;
  total: number;
} {
  let maxState: string | null = null;
  let maxTotal = 0;

  for (const [state, { ticketSum }] of Object.entries(stateSums)) {
    if (ticketSum > maxTotal) {
      maxTotal = ticketSum;
      maxState = state;
    }
  }

  return { state: maxState!, total: maxTotal }; // Usando `!` porque sabemos que `maxState` não será nulo após o loop
}
