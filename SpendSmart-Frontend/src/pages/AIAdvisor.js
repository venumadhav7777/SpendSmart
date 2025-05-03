import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  TextField,
  Button,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Divider,
  Chip,
} from '@mui/material';
import {
  TrendingUp as TrendingUpIcon,
  TrendingDown as TrendingDownIcon,
  Savings as SavingsIcon,
  Lightbulb as LightbulbIcon,
  Warning as WarningIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';

const AIAdvisor = () => {
  const [question, setQuestion] = useState('');

  const insights = [
    {
      type: 'savings',
      title: 'Savings Opportunity',
      description: 'You could save an additional $200 per month by reducing dining out expenses.',
      icon: <SavingsIcon />,
      color: '#4CAF50',
    },
    {
      type: 'warning',
      title: 'High Spending Alert',
      description: 'Your entertainment expenses are 30% higher than your monthly average.',
      icon: <WarningIcon />,
      color: '#F44336',
    },
    {
      type: 'tip',
      title: 'Smart Investment',
      description: 'Consider investing in a high-yield savings account for your emergency fund.',
      icon: <LightbulbIcon />,
      color: '#FFC107',
    },
  ];

  const recommendations = [
    {
      title: 'Create a Budget',
      description: 'Set up a detailed monthly budget to track your expenses.',
      status: 'completed',
    },
    {
      title: 'Emergency Fund',
      description: 'Build an emergency fund with 3-6 months of living expenses.',
      status: 'in-progress',
    },
    {
      title: 'Debt Reduction',
      description: 'Focus on paying off high-interest credit card debt.',
      status: 'pending',
    },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 4 }}>
        AI Financial Advisor
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Ask a Question
              </Typography>
              <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
                <TextField
                  fullWidth
                  variant="outlined"
                  placeholder="Ask about your finances..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                />
                <Button variant="contained" color="primary">
                  Ask
                </Button>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Example questions: "How can I save more money?" or "What's my best investment option?"
              </Typography>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Insights
              </Typography>
              <List>
                {insights.map((insight, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <ListItemIcon>
                        <Box
                          sx={{
                            width: 40,
                            height: 40,
                            borderRadius: '50%',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            backgroundColor: `${insight.color}15`,
                            color: insight.color,
                          }}
                        >
                          {insight.icon}
                        </Box>
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {insight.title}
                          </Typography>
                        }
                        secondary={insight.description}
                      />
                    </ListItem>
                    {index < insights.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Your Financial Goals
              </Typography>
              <List>
                {recommendations.map((recommendation, index) => (
                  <React.Fragment key={index}>
                    <ListItem
                      sx={{
                        mb: 2,
                        borderRadius: 2,
                        backgroundColor: 'background.default',
                      }}
                    >
                      <ListItemIcon>
                        <CheckCircleIcon
                          color={
                            recommendation.status === 'completed'
                              ? 'success'
                              : recommendation.status === 'in-progress'
                              ? 'warning'
                              : 'disabled'
                          }
                        />
                      </ListItemIcon>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                              {recommendation.title}
                            </Typography>
                            <Chip
                              label={recommendation.status}
                              size="small"
                              color={
                                recommendation.status === 'completed'
                                  ? 'success'
                                  : recommendation.status === 'in-progress'
                                  ? 'warning'
                                  : 'default'
                              }
                            />
                          </Box>
                        }
                        secondary={recommendation.description}
                      />
                    </ListItem>
                    {index < recommendations.length - 1 && <Divider />}
                  </React.Fragment>
                ))}
              </List>
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Financial Health Score
              </Typography>
              <Box sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h2" color="primary" sx={{ fontWeight: 600 }}>
                  85
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Good financial health
                </Typography>
              </Box>
              <Typography variant="body2" color="text.secondary">
                Your score is based on your spending habits, savings rate, and debt management.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
};

export default AIAdvisor; 