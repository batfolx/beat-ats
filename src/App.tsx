import React from 'react';
import { CssBaseline, ThemeProvider, createTheme } from '@mui/material';
import PDFModifier from './components/PDFModifier';

// Create a dark mode theme
const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#90caf9', // Customize primary color if needed
    },
    secondary: {
      main: '#f48fb1', // Customize secondary color if needed
    },
    background: {
      default: '#121212', // Dark background color
      paper: '#1e1e1e',   // Dark color for paper elements
    },
    text: {
      primary: '#ffffff', // Text color
    },
  },
});

const App: React.FC = () => {
  return (
    <ThemeProvider theme={darkTheme}>
      <CssBaseline />
      <PDFModifier />
    </ThemeProvider>
  );
};

export default App;
