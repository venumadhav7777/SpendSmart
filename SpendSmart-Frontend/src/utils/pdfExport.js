import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

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

const MARGIN = { left: 14, right: 14 };

// Currency formatter using "Rs." prefix
const currencyFormatter = (value) => `Rs. ${value.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

// Initialize jsPDF document without custom font embedding
function createDoc() {
  const doc = new jsPDF();
  // Use default font, no custom font embedding
  return doc;
}

// Export budgets to PDF
export function exportBudgetsToPDF(budgets) {
  const doc = createDoc();
  doc.setFontSize(16);
  doc.text('Budgets Report', MARGIN.left, 20);

  autoTable(doc, {
    head: [['Name', 'Category', 'Limit', 'Period']],
    body: budgets.map(b => [
      b.name,
      b.category || '',
      currencyFormatter(b.limit),
      b.period,
    ]),
    startY: 30,
    margin: MARGIN,
    columnStyles: { 2: { halign: 'right', cellWidth: 30 } },
    ...GRID_STYLE,
  });

  doc.save('budgets_report.pdf');
}

// Export transactions to PDF
export function exportTransactionsToPDF(transactions) {
  const doc = createDoc();
  doc.setFontSize(16);
  doc.text('Transactions Report', MARGIN.left, 20);

  autoTable(doc, {
    head: [['ID', 'Date', 'Name', 'Amount', 'Category']],
    body: transactions.map(tx => [
      tx.transaction_id,
      tx.date,
      tx.name,
      currencyFormatter(tx.amount),
      tx.mapped_category?.primary
        ? tx.mapped_category.primary.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
        : Array.isArray(tx.category)
          ? tx.category.join(', ')
          : (tx.category || ''),
    ]),
    startY: 30,
    margin: MARGIN,
    columnStyles: {
      3: { halign: 'right', cellWidth: 30 },
      0: { cellWidth: 20 },
      1: { cellWidth: 25 },
    },
    ...GRID_STYLE,
  });

  doc.save('transactions_report.pdf');
}

// Export financial reports to PDF
export function exportReportsToPDF(data) {
  const { balance, monthlyData, savingsRate, spendingData, detailedSpendingData } = data;
  const doc = createDoc();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Title and date
  doc.setFontSize(18);
  doc.text('Financial Reports', pageWidth / 2, 15, { align: 'center' });
  doc.setFontSize(11);
  doc.text(`Date: ${new Date().toLocaleDateString('en-IN')}`, pageWidth - MARGIN.right, 25, { align: 'right' });

  let y = 35;

  // Summary section
  doc.setFontSize(14);
  doc.text('Summary', MARGIN.left, y);
  y += 8;
  doc.setFontSize(11);
  doc.text(`Total Balance: ${currencyFormatter(balance)}`, MARGIN.left, y);
  y += 7;
  const lastMonth = monthlyData.at(-1) || { income: 0, expenses: 0 };
  doc.text(`Monthly Income: ${currencyFormatter(lastMonth.income)}`, MARGIN.left, y);
  y += 7;
  doc.text(`Monthly Expenses: ${currencyFormatter(lastMonth.expenses)}`, MARGIN.left, y);
  y += 7;
  doc.text(`Savings Rate: ${savingsRate.toFixed(2)}%`, MARGIN.left, y);
  y += 10;

  // Income vs Expenses table
  doc.setFontSize(14);
  doc.text('Monthly Income vs Expenses', MARGIN.left, y);
  y += 6;
  autoTable(doc, {
    head: [['Month', 'Income', 'Expenses']],
    body: monthlyData.map(m => [
      m.name,
      currencyFormatter(m.income),
      currencyFormatter(m.expenses),
    ]),
    startY: y,
    margin: MARGIN,
    columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
    ...GRID_STYLE,
  });
  y = doc.lastAutoTable.finalY + 10;

  // Spending by Category table
  doc.setFontSize(14);
  doc.text('Spending by Category', MARGIN.left, y);
  y += 6;
  autoTable(doc, {
    head: [['Category', 'Amount']],
    body: spendingData.map(s => [s.name, currencyFormatter(s.value)]),
    startY: y,
    margin: MARGIN,
    columnStyles: { 1: { halign: 'right' } },
    ...GRID_STYLE,
  });
  y = doc.lastAutoTable.finalY + 10;

  // Detailed Spending Analysis table
  if (detailedSpendingData?.length) {
    doc.setFontSize(14);
    doc.text('Detailed Spending Analysis', MARGIN.left, y);
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
      columnStyles: { 1: { halign: 'right' }, 2: { halign: 'right' } },
      ...GRID_STYLE,
    });
  }

  doc.save('financial_reports.pdf');
}
