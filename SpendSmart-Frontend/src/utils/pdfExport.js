import jsPDF from 'jspdf';
import 'jspdf-autotable';

export const exportBudgetsToPDF = (budgets) => {
  const doc = new jsPDF();
  doc.text('Budgets Report', 14, 20);
  const tableColumn = ['Name', 'Category', 'Limit', 'Period'];
  const tableRows = [];

  budgets.forEach(budget => {
    const budgetData = [
      budget.name,
      budget.category,
      budget.limit.toString(),
      budget.period,
    ];
    tableRows.push(budgetData);
  });

  doc.autoTable(tableColumn, tableRows, { startY: 30 });
  doc.save('budgets_report.pdf');
};

export const exportTransactionsToPDF = (transactions) => {
  const doc = new jsPDF();
  doc.text('Transactions Report', 14, 20);
  const tableColumn = ['ID', 'Date', 'Name', 'Amount', 'Category'];
  const tableRows = [];

  transactions.forEach(tx => {
    const txData = [
      tx.transaction_id,
      tx.date,
      tx.name,
      tx.amount.toFixed(2),
      tx.category,
    ];
    tableRows.push(txData);
  });

  doc.autoTable(tableColumn, tableRows, { startY: 30 });
  doc.save('transactions_report.pdf');
};
