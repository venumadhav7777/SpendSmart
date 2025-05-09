import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import { format } from 'date-fns';

// Styles for table headers and cells
const HEADER_STYLE = {
  fillColor: [33, 150, 243],
  textColor: 255,
  fontStyle: 'bold',
  halign: 'center',
  fontSize: 12,
};

const CELL_STYLE = {
  cellPadding: 4,
  fontSize: 10,
};

const GRID_STYLE = {
  theme: 'grid',
  styles: CELL_STYLE,
  headStyles: HEADER_STYLE,
  alternateRowStyles: { fillColor: [245, 245, 245] },
  tableLineWidth: 0.1,
  tableLineColor: 200,
};

const MARGIN = { left: 14, right: 14, top: 20, bottom: 20 };

// Helper function to format currency
const currencyFormatter = (amount) => {
  if (typeof amount !== 'number') {
    amount = parseFloat(amount);
    if (isNaN(amount)) amount = 0;
  }
  return `Rs. ${amount.toFixed(2)}`;
};

// Initialize jsPDF document with custom font
function createDoc() {
  const doc = new jsPDF();
  doc.setFont('helvetica');
  return doc;
}

// Add header to document
function addHeader(doc, title) {
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Add logo or title
  doc.setFontSize(20);
  doc.setTextColor(33, 150, 243); // Blue color
  doc.text('SpendSmart', MARGIN.left, MARGIN.top);
  
  // Add title
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0); // Black color
  doc.text(title, pageWidth / 2, MARGIN.top, { align: 'center' });
  
  // Add date
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100); // Gray color
  doc.text(`Generated on: ${format(new Date(), 'dd MMM yyyy, hh:mm a')}`, pageWidth - MARGIN.right, MARGIN.top, { align: 'right' });
  
  return MARGIN.top + 10; // Return y position for next content
}

// Add footer to document
function addFooter(doc) {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100); // Gray color
  doc.text('© 2024 SpendSmart. All rights reserved.', pageWidth / 2, pageHeight - MARGIN.bottom, { align: 'center' });
  doc.text(`Page ${doc.internal.getNumberOfPages()}`, pageWidth - MARGIN.right, pageHeight - MARGIN.bottom, { align: 'right' });
}

// Export budgets to PDF
export function exportBudgetsToPDF(budgets) {
  const doc = createDoc();
  let y = addHeader(doc, 'Budgets Report');

  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', MARGIN.left, y);
  y += 8;

  const totalLimit = budgets.reduce((sum, b) => sum + b.limit, 0);
  const totalSpent = budgets.reduce((sum, b) => sum + (b.spent || 0), 0);
  const totalRemaining = totalLimit - totalSpent;
  const overallProgress = (totalSpent / totalLimit) * 100;

  doc.setFontSize(10);
  doc.text(`Total Budget: ${currencyFormatter(totalLimit)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Total Spent: ${currencyFormatter(totalSpent)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Total Remaining: ${currencyFormatter(totalRemaining)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Overall Progress: ${overallProgress.toFixed(1)}%`, MARGIN.left, y);
  y += 10;

  // Add budgets table
  autoTable(doc, {
    head: [['Name', 'Category', 'Limit', 'Spent', 'Remaining', 'Progress', 'Status']],
    body: budgets.map(b => {
      const percentage = (b.spent / b.limit) * 100;
      let status = 'Good';
      if (percentage >= 100) status = 'Exceeded';
      else if (percentage >= 80) status = 'Warning';
      return [
        b.name,
        b.category || '',
        currencyFormatter(b.limit),
        currencyFormatter(b.spent || 0),
        currencyFormatter(b.remaining || 0),
        `${b.percentUsed || 0}%`,
        status
      ];
    }),
    startY: y,
    margin: MARGIN,
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'right' },
      4: { halign: 'right' },
      5: { halign: 'right' },
      6: { halign: 'center' }
    },
    ...GRID_STYLE,
  });

  addFooter(doc);
  doc.save('budgets_report.pdf');
}

// Export transactions to PDF
export function exportTransactionsToPDF(transactions) {
  const doc = createDoc();
  let y = addHeader(doc, 'Transactions Report');

  // Add summary section
  doc.setFontSize(14);
  doc.setTextColor(0, 0, 0);
  doc.text('Summary', MARGIN.left, y);
  y += 8;

  const totalAmount = transactions.reduce((sum, tx) => sum + tx.amount, 0);
  const income = transactions.filter(tx => tx.amount > 0).reduce((sum, tx) => sum + tx.amount, 0);
  const expenses = transactions.filter(tx => tx.amount < 0).reduce((sum, tx) => sum + tx.amount, 0);

  doc.setFontSize(10);
  doc.text(`Total Transactions: ${transactions.length}`, MARGIN.left, y);
  y += 6;
  doc.text(`Total Income: ${currencyFormatter(income)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Total Expenses: ${currencyFormatter(Math.abs(expenses))}`, MARGIN.left, y);
  y += 6;
  doc.text(`Net Amount: ${currencyFormatter(totalAmount)}`, MARGIN.left, y);
  y += 10;

  // Add transactions table
  autoTable(doc, {
    head: [['Date', 'Description', 'Category', 'Amount', 'Type']],
    body: transactions.map(tx => [
      format(new Date(tx.date), 'dd MMM yyyy'),
      tx.name,
      tx.mapped_category?.primary
        ? tx.mapped_category.primary.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : Array.isArray(tx.category)
          ? tx.category.join(', ')
          : (tx.category || ''),
      currencyFormatter(tx.amount),
      tx.amount > 0 ? 'Income' : 'Expense'
    ]),
    startY: y,
    margin: MARGIN,
    columnStyles: {
      3: { halign: 'right' },
      4: { halign: 'center' }
    },
    ...GRID_STYLE,
  });

  addFooter(doc);
  doc.save('transactions_report.pdf');
}

// Export financial reports to PDF
export function exportReportsToPDF(data) {
  const { balance, monthlyData, savingsRate, spendingData, detailedSpendingData } = data;
  const doc = createDoc();
  let y = addHeader(doc, 'Financial Reports');

  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', MARGIN.left, y);
  y += 8;
  doc.setFontSize(10);
  doc.text(`Total Balance: ${currencyFormatter(balance)}`, MARGIN.left, y);
  y += 6;
  const lastMonth = monthlyData.at(-1) || { income: 0, expenses: 0 };
  doc.text(`Monthly Income: ${currencyFormatter(lastMonth.income)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Monthly Expenses: ${currencyFormatter(lastMonth.expenses)}`, MARGIN.left, y);
  y += 6;
  doc.text(`Savings Rate: ${savingsRate.toFixed(2)}%`, MARGIN.left, y);
  y += 10;

  // Income vs Expenses table
  doc.setFontSize(14);
  doc.text('Monthly Income vs Expenses', MARGIN.left, y);
  y += 6;
  autoTable(doc, {
    head: [['Month', 'Income', 'Expenses', 'Net']],
    body: monthlyData.map(m => [
      m.name,
      currencyFormatter(m.income),
      currencyFormatter(m.expenses),
      currencyFormatter(m.income - m.expenses)
    ]),
    startY: y,
    margin: MARGIN,
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'right' }
    },
    ...GRID_STYLE,
  });
  y = doc.lastAutoTable.finalY + 10;

  // Spending by Category table
  doc.setFontSize(14);
  doc.text('Spending by Category', MARGIN.left, y);
  y += 6;
  autoTable(doc, {
    head: [['Category', 'Amount', 'Percentage']],
    body: detailedSpendingData.map(d => [
      d.name,
      currencyFormatter(d.value),
      `${d.percentage.toFixed(1)}%`
    ]),
    startY: y,
    margin: MARGIN,
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' }
    },
    ...GRID_STYLE,
  });

  addFooter(doc);
  doc.save('financial_reports.pdf');
}
