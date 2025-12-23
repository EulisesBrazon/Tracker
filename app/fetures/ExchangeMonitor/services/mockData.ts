import { ExchangeRate } from '../types';

// Generate realistic mock data for the past year
export function generateMockData(): ExchangeRate[] {
  const data: ExchangeRate[] = [];
  const today = new Date();
  const startDate = new Date(today);
  startDate.setFullYear(startDate.getFullYear() - 1);

  let bcvBase = 36.5;
  let paraleloBase = 40.2;

  for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
    // Add some realistic daily variation
    const bcvVariation = (Math.random() - 0.48) * 0.3;
    const paraleloVariation = (Math.random() - 0.45) * 0.5;

    bcvBase = Math.max(35, Math.min(48, bcvBase + bcvVariation));
    paraleloBase = Math.max(bcvBase * 1.05, Math.min(55, paraleloBase + paraleloVariation));

    // Ensure paralelo is always higher than BCV
    if (paraleloBase <= bcvBase) {
      paraleloBase = bcvBase * (1.08 + Math.random() * 0.07);
    }

    data.push({
      fecha: new Date(d).toISOString().split('T')[0],
      bcv: Number(bcvBase.toFixed(2)),
      paralelo: Number(paraleloBase.toFixed(2)),
    });
  }

  return data;
}

// Cache the generated data
let cachedData: ExchangeRate[] | null = null;

export function getMockData(): ExchangeRate[] {
  if (!cachedData) {
    cachedData = generateMockData();
  }
  return cachedData;
}
