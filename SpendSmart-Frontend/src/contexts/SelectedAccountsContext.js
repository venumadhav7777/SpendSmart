import React, { createContext, useState, useContext, useEffect } from 'react';

// Create the context
const SelectedAccountsContext = createContext();

// Provider component
export const SelectedAccountsProvider = ({ children }) => {
  const [selectedAccounts, setSelectedAccounts] = useState(() => {
    // Try to get selected accounts from localStorage
    const savedAccounts = localStorage.getItem('selectedAccounts');
    return savedAccounts ? JSON.parse(savedAccounts) : [];
  });

  // Update localStorage whenever selectedAccounts changes
  useEffect(() => {
    localStorage.setItem('selectedAccounts', JSON.stringify(selectedAccounts));
  }, [selectedAccounts]);

  // Toggle account selection
  const toggleAccountSelection = (account) => {
    setSelectedAccounts(prevSelected => 
      prevSelected.some(a => a._id === account._id)
        ? prevSelected.filter(a => a._id !== account._id)
        : [...prevSelected, account]
    );
  };

  // Clear all selected accounts
  const clearSelectedAccounts = () => {
    setSelectedAccounts([]);
  };

  return (
    <SelectedAccountsContext.Provider 
      value={{ 
        selectedAccounts, 
        setSelectedAccounts, 
        toggleAccountSelection, 
        clearSelectedAccounts 
      }}
    >
      {children}
    </SelectedAccountsContext.Provider>
  );
};

// Custom hook to use the SelectedAccounts context
export const useSelectedAccounts = () => {
  const context = useContext(SelectedAccountsContext);
  if (!context) {
    throw new Error('useSelectedAccounts must be used within a SelectedAccountsProvider');
  }
  return context;
};
