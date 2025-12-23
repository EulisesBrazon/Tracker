import { ExchangeRate } from '../types';
import { getMockData } from './mockData';

// Simulates an API call - replace with real fetch when ready
export async function fetchExchangeRates(): Promise<ExchangeRate[]> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 300));
  
  return getMockData();
}

export async function fetchLatestRate(): Promise<ExchangeRate> {
  const data = await fetchExchangeRates();
  return data[data.length - 1];
}
