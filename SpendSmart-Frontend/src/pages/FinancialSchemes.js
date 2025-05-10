import React, { useState, useEffect, useMemo } from 'react';
import {
  Typography,
  Box,
  Card,
  CardContent,
  CardActions,
  Button,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  InputAdornment,
  IconButton,
  Tooltip,
  useTheme,
  alpha
} from '@mui/material';
import {
  Search as SearchIcon,
  FilterList as FilterIcon,
  AccountBalance as GovernmentIcon,
  Business as BusinessIcon,
  Savings as SavingsIcon,
  School as SchoolIcon,
  Home as HomeIcon
} from '@mui/icons-material';

// Mock data - In a real app, this would come from an API
const mockSchemes = [
  {
    id: 1,
    name: "Pradhan Mantri Jan Dhan Yojana",
    type: "Government",
    description: "A national mission for financial inclusion to ensure access to financial services.",
    eligibility: "All Indian citizens above 10 years of age",
    url: "https://pmjdy.gov.in",
    category: "savings"
  },
  {
    id: 2,
    name: "Sukanya Samriddhi Yojana",
    type: "Government",
    description: "A small deposit scheme for the girl child to ensure her education and marriage expenses.",
    eligibility: "Parents/legal guardians of girl child below 10 years",
    url: "https://www.indiapost.gov.in",
    category: "education"
  },
  {
    id: 3,
    name: "HDFC Home Loan",
    type: "Private",
    description: "Competitive home loan rates with flexible repayment options.",
    eligibility: "Salaried/self-employed individuals with stable income",
    url: "https://www.hdfc.com",
    category: "housing"
  },
  {
    id: 4,
    name: "LIC Jeevan Anand",
    type: "Private",
    description: "A participating non-linked plan offering both death and maturity benefits.",
    eligibility: "Individuals between 18-50 years",
    url: "https://licindia.in/lic-s-new-jeevan-anand-plan-no.-915-uin-no.-512n279v02-",
    category: "insurance"
  },
  {
    id: 5,
    name: "PM Awas Yojana",
    type: "Government",
    description: "Housing for all by 2022 - affordable housing scheme.",
    eligibility: "Economically weaker sections and low-income groups",
    url: "https://pmaymis.gov.in",
    category: "housing"
  }
];

const categories = [
  { value: 'all', label: 'All Categories', icon: <FilterIcon /> },
  { value: 'savings', label: 'Savings', icon: <SavingsIcon /> },
  { value: 'education', label: 'Education', icon: <SchoolIcon /> },
  { value: 'housing', label: 'Housing', icon: <HomeIcon /> },
  { value: 'insurance', label: 'Insurance', icon: <BusinessIcon /> }
];

function FinancialSchemes() {
  const theme = useTheme();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [schemes, setSchemes] = useState(mockSchemes);

  // Filter schemes based on search term and category
  const filteredSchemes = useMemo(() => {
    return schemes.filter(scheme => {
      const matchesSearch = scheme.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          scheme.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = selectedCategory === 'all' || scheme.category === selectedCategory;
      return matchesSearch && matchesCategory;
    });
  }, [schemes, searchTerm, selectedCategory]);

  const handleSearch = (event) => {
    setSearchTerm(event.target.value);
  };

  const handleCategoryChange = (event) => {
    setSelectedCategory(event.target.value);
  };

  const getCategoryIcon = (category) => {
    const found = categories.find(c => c.value === category);
    return found ? found.icon : <FilterIcon />;
  };

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: 600 }}>
        Financial Schemes
      </Typography>

      {/* Search and Filter Section */}
      <Card sx={{ mb: 4, p: 2, bgcolor: alpha(theme.palette.background.paper, 0.8) }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              placeholder="Search schemes..."
              value={searchTerm}
              onChange={handleSearch}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                  '&:hover': {
                    '& > fieldset': {
                      borderColor: 'primary.main',
                    },
                  },
                },
              }}
            />
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={handleCategoryChange}
                label="Category"
                startAdornment={getCategoryIcon(selectedCategory)}
                sx={{
                  borderRadius: 2,
                  '& .MuiOutlinedInput-notchedOutline': {
                    '&:hover': {
                      borderColor: 'primary.main',
                    },
                  },
                }}
              >
                {categories.map((category) => (
                  <MenuItem key={category.value} value={category.value}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {category.icon}
                      {category.label}
                    </Box>
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
        </Grid>
      </Card>

      {/* Schemes Grid */}
      <Grid container spacing={3}>
        {filteredSchemes.map((scheme) => (
          <Grid item xs={12} sm={6} md={4} key={scheme.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'all 0.3s ease',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: theme.shadows[8],
                },
              }}
            >
              <CardContent sx={{ flexGrow: 1 }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                  <Typography variant="h6" component="div" sx={{ fontWeight: 600 }}>
                    {scheme.name}
                  </Typography>
                  <Chip
                    label={scheme.type}
                    color={scheme.type === 'Government' ? 'primary' : 'secondary'}
                    size="small"
                    icon={scheme.type === 'Government' ? <GovernmentIcon /> : <BusinessIcon />}
                  />
                </Box>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  {scheme.description}
                </Typography>
                <Typography variant="subtitle2" color="text.primary" sx={{ fontWeight: 600, mb: 1 }}>
                  Eligibility:
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {scheme.eligibility}
                </Typography>
              </CardContent>
              <CardActions sx={{ p: 2, pt: 0 }}>
                <Button
                  variant="contained"
                  color="primary"
                  fullWidth
                  href={scheme.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  sx={{
                    borderRadius: 2,
                    textTransform: 'none',
                    py: 1,
                  }}
                >
                  View Details
                </Button>
              </CardActions>
            </Card>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default FinancialSchemes; 