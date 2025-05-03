import React from 'react';
import { Paper } from '@mui/material';

const SectionCard = ({ children, sx }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        borderRadius: 3,
        backgroundColor: '#fff',
        color: 'inherit',
        ...sx,
      }}
    >
      {children}
    </Paper>
  );
};

export default SectionCard;
