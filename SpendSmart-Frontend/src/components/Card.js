import React from 'react';
import { Card as MuiCard, CardContent, Typography, Box, useTheme } from '@mui/material';
import { motion } from 'framer-motion';

const Card = ({ title, value, icon, color, trend, subtitle, children }) => {
  const theme = useTheme();

  return (
    <motion.div
      whileHover={{ y: -5 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
    >
      <MuiCard
        sx={{
          height: '100%',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.background.paper} 100%)`,
          position: 'relative',
          overflow: 'hidden',
          '&:before': {
            content: '""',
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            height: '4px',
            background: color || theme.palette.primary.main,
          },
        }}
      >
        <CardContent>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
            <Box>
              <Typography
                variant="subtitle2"
                color="text.secondary"
                sx={{ mb: 1 }}
              >
                {title}
              </Typography>
              <Typography
                variant="h4"
                sx={{
                  fontWeight: 600,
                  background: color ? `linear-gradient(135deg, ${color} 0%, ${theme.palette.primary.main} 100%)` : undefined,
                  WebkitBackgroundClip: color ? 'text' : undefined,
                  WebkitTextFillColor: color ? 'transparent' : undefined,
                }}
              >
                {value}
              </Typography>
              {subtitle && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  {subtitle}
                </Typography>
              )}
            </Box>
            {icon && (
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: '12px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: color ? `${color}15` : `${theme.palette.primary.main}15`,
                  color: color || theme.palette.primary.main,
                }}
              >
                {icon}
              </Box>
            )}
          </Box>
          {trend && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                mt: 2,
                color: trend.value > 0 ? 'success.main' : 'error.main',
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 500 }}>
                {trend.value > 0 ? '+' : ''}{trend.value}%
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                {trend.label}
              </Typography>
            </Box>
          )}
          {children}
        </CardContent>
      </MuiCard>
    </motion.div>
  );
};

export default Card; 