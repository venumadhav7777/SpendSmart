import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090';
const api = axios.create({
  baseURL: 'http://localhost:9090',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('Response error:', error);
    if (error.response) {
      // The request was made and the server responded with a status code
      // that falls out of the range of 2xx
      console.error('Error response:', error.response.data);
      return Promise.reject(error);
    } else if (error.request) {
      // The request was made but no response was received
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server'));
    } else {
      // Something happened in setting up the request that triggered an Error
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

export const login = (email, password) => {
  console.log('Attempting login for:', email);
  return api.post('/api/auth/login', { email, password });
};

export const register = (name, email, password) => {
  console.log('Attempting registration for:', email);
  return api.post('/api/auth/register', { name, email, password });
};

export const fetchProfile = () => {
  return api.get('/api/users/profile');
};

export const fetchBudgets = () => {
  return api.get('/api/budgets/');
};

export const createBudget = (budgetData) => {
  return api.post('/api/budgets/', budgetData);
};

export const fetchSavings = () => {
  return api.get('/api/savings/');
};

export const createSavings = (savingsData) => {
  return api.post('/api/savings/', savingsData);
};

export const fetchTransactions = (startDate, endDate) => {
  return api.post('/api/transactions/get', { start_date: startDate, end_date: endDate });
};

export const syncTransactions = (count) => {
  return api.post('/api/transactions/sync', { count });
};

export const refreshTransactions = () => {
  return api.post('/api/transactions/refresh');
};

// Updated functions for public token creation and exchange token
export const createPublicToken = () => {
  return api.post('/api/transactions/public_token', {
    institution_id: "ins_20",
    initial_products: ["transactions"]
  });
};

export const exchangePublicToken = () => {
  return api.post('/api/transactions/exchange_token', {});
};

export const fetchTransactionsFromDB = async () => {
  return api.get(`/api/transactions/db`);
};

export const getBalance = async () => {
  return api.get('/api/transactions/balance');
};

export const chatWithAI = async (messages) => {
  return fetch(`${API_BASE_URL}/api/ai-advisor/chat/stream`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${localStorage.getItem('token')}`
    },
    body: JSON.stringify({ messages })
  });
};
