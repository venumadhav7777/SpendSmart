import axios from 'axios';

const API_BASE_URL = 'http://localhost:9090';
const api = axios.create({
  baseURL: API_BASE_URL,
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
      console.error('Error response:', error.response.data);
      return Promise.reject(error);
    } else if (error.request) {
      console.error('No response received:', error.request);
      return Promise.reject(new Error('No response from server'));
    } else {
      console.error('Request setup error:', error.message);
      return Promise.reject(error);
    }
  }
);

export const login = (email, password) => {
  return api.post('/api/auth/login', { email, password });
};

export const register = (name, email, password) => {
  return api.post('/api/auth/register', { name, email, password });
};

export const fetchProfile = () => {
  return api.get('/api/users/profile');
};

export const updateProfile = (profileData) => {
  return api.put('/api/users/profile', profileData);
};

export const fetchBudgets = () => {
  return api.get('/api/budgets/');
};

export const fetchBudgetSummary = () => {
  return api.get('/api/budgets/summary/transactions');
};

export const fetchBudgetSummaryWithTransactions = () => {
  return api.get('/api/budgets/summary/transactions');
};

// Account-related API methods
export const fetchAccounts = () => {
  return api.get('/api/accounts/');
};

export const updateAccount = (accountId, accountData) => {
  return api.put(`/api/accounts/${accountId}`, accountData);
};

export const createAccount = (accountData) => {
  return api.post('/api/accounts/', accountData);
};

export const deleteAccount = (accountId) => {
  return api.delete(`/api/accounts/${accountId}`);
};

export const createBudget = (budgetData) => {
  return api.post('/api/budgets/', budgetData);
};

export const updateBudget = (budgetId, budgetData) => {
  return api.put(`/api/budgets/${budgetId}`, budgetData);
};

export const deleteBudget = (budgetId) => {
  return api.delete(`/api/budgets/${budgetId}`);
};

export const fetchSavings = () => {
  return api.get('/api/savings/');
};

export const createSavings = (savingsData) => {
  return api.post('/api/savings/', savingsData);
};

export const deleteSavings = (goalId) => {
  return api.delete(`/api/savings/${goalId}`);
};

export const updateSavings = (goalId, updateData) => {
  return api.put(`/api/savings/${goalId}`, updateData);
};

// Transaction-related API methods
export const fetchTransactions = async () => {
  return api.get('/api/transactions/');
};

export const fetchTransactionsByAccount = (accountId) => {
  return api.get(`/api/transactions/account/${accountId}`);
};

export const createTransaction = (accountId, transactionData) => {
  return api.post('/api/transactions/', {
    ...transactionData,
    accountId
  });
};

export const updateTransaction = (transactionId, transactionData) => {
  return api.put(`/api/transactions/${transactionId}`, transactionData);
};

export const deleteTransaction = (transactionId) => {
  return api.delete(`/api/transactions/${transactionId}`);
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
