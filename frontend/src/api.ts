import axios from 'axios';

const API_URL = import.meta.env.PROD ? '/api' : 'http://localhost:8001';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export interface UserData {
  age: number;
  gender: string;
  smoking: boolean;
  alcohol: string;
  sport: string;
  chronic_diseases: boolean;
  health_score: number;
  income: number;
  expenses: number;
  savings: number;
  retirement_age: number;
  desired_pension: number;
  token?: string;
}

export interface TimeResult {
  years: number;
  months: number;
  weeks: number;
  days: number;
  active_days: number;
}

export interface MoneyResult {
  savings_at_retirement: number;
  monthly_pension: number;
  desired_pension: number;
  gap: number;
  needed_monthly_savings: number;
}

export interface Explanation {
  name: string;
  value: string;
  description: string;
}

export interface Recommendation {
  priority: 'high' | 'medium' | 'low';
  title: string;
  impact: string;
  description: string;
  actions: string[];
}

export interface CalculateResult {
  time: TimeResult;
  money: MoneyResult;
  explanations?: {
    health_factors: Explanation[];
    financial_breakdown: Explanation[];
  };
  recommendations?: {
    health: Recommendation[];
    financial: Recommendation[];
    is_premium: boolean;
  };
}

export const register = async (email: string, password: string) => {
  const response = await api.post('/register', { email, password });
  return response.data;
};

export const login = async (email: string, password: string) => {
  const response = await api.post('/login', { email, password });
  return response.data;
};

export const verifyToken = async (token: string) => {
  const response = await api.post('/verify-token', { token });
  return response.data;
};

export const calculate = async (data: UserData): Promise<CalculateResult> => {
  const response = await api.post('/calculate', data);
  return response.data;
};

export default api;