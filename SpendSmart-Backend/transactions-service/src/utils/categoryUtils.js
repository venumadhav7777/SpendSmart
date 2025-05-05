const fs = require('fs');
const path = require('path');
const csv = require('csv-parse/sync');

// Load and parse the PFC taxonomy CSV
const pfcTaxonomyPath = path.join(__dirname, '../../data/pfc_taxonomy.csv');
const pfcTaxonomyData = fs.readFileSync(pfcTaxonomyPath, 'utf-8');
const pfcTaxonomy = csv.parse(pfcTaxonomyData, {
  columns: true,
  skip_empty_lines: true
});

// Create a map for quick lookup
const categoryMap = new Map();
pfcTaxonomy.forEach(row => {
  // Use the correct column names from CSV (PRIMARY, DETAILED)
  categoryMap.set(row.DETAILED, {
    primary: row.PRIMARY,
    detailed: row.DETAILED,
    description: row.DESCRIPTION
  });
});

/**
 * Maps a Plaid personal finance category to our standardized category
 * @param {Object} pfc - Plaid personal finance category object
 * @returns {Object} Mapped category object
 */
const mapPlaidCategory = (pfc) => {
  if (!pfc || !pfc.detailed) {
    return {
      primary: 'OTHER',
      detailed: 'OTHER',
      description: 'Other expenses',
      confidence: 'LOW'
    };
  }

  // Try to find exact match first
  const mappedCategory = categoryMap.get(pfc.detailed);
  if (mappedCategory) {
    return {
      ...mappedCategory,
      confidence: pfc.confidence_level || 'LOW'
    };
  }

  // If no exact match, try to find by primary category
  const primaryMatch = Array.from(categoryMap.values()).find(
    cat => cat.primary === pfc.primary
  );

  if (primaryMatch) {
    return {
      ...primaryMatch,
      confidence: pfc.confidence_level || 'LOW'
    };
  }

  // If still no match, return OTHER
  return {
    primary: 'OTHER',
    detailed: 'OTHER',
    description: 'Other expenses',
    confidence: pfc.confidence_level || 'LOW'
  };
};

// Debug function to check category mapping
const debugCategoryMapping = (pfc) => {
  console.log('Input PFC:', pfc);
  const result = mapPlaidCategory(pfc);
  console.log('Mapped Category:', result);
  return result;
};

module.exports = {
  mapPlaidCategory,
  debugCategoryMapping
}; 