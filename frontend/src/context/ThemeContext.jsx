import React, { createContext, useState, useEffect, useContext } from 'react';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

export const ThemeProvider = ({ children }) => {
  const [theme, setTheme] = useState(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) return savedTheme;
    return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
  });

  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem('accentColor') || '#e63358'; // default red-pink
  });

  const [borderRadius, setBorderRadius] = useState(() => {
    return localStorage.getItem('borderRadius') || '12px'; // default rounded-lg
  });

  const [businessName, setBusinessName] = useState(() => {
    return localStorage.getItem('businessName') || 'Sys-Teck';
  });

  const [businessLogo, setBusinessLogo] = useState(() => {
    return localStorage.getItem('businessLogo') || '';
  });

  useEffect(() => {
    localStorage.setItem('businessName', businessName);
  }, [businessName]);

  useEffect(() => {
    localStorage.setItem('businessLogo', businessLogo);
  }, [businessLogo]);

  useEffect(() => {
    const root = window.document.documentElement;
    root.setAttribute('data-theme', theme);
    localStorage.setItem('theme', theme);
  }, [theme]);

  // Apply accent color and radius updates globally
  useEffect(() => {
    const root = window.document.documentElement;
    
    // Inject accent colors
    root.style.setProperty('--color-primary', accentColor);
    
    // Helper to convert hex to rgb
    const hexToRgb = (hex) => {
      const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
      const fullHex = hex.replace(shorthandRegex, (m, r, g, b) => r + r + g + g + b + b);
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(fullHex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : null;
    };

    const rgb = hexToRgb(accentColor);
    if (rgb) {
      root.style.setProperty('--color-primary-rgb', `${rgb.r}, ${rgb.g}, ${rgb.b}`);
    }
    
    // Calculate darker variant for button active/hover states
    // A simple programmatic darkened hex fallback or mix
    let darkAccent = '#c42040';
    if (accentColor === '#3b82f6') darkAccent = '#1d4ed8'; // Blue
    else if (accentColor === '#10b981') darkAccent = '#047857'; // Green
    else if (accentColor === '#f59e0b') darkAccent = '#b45309'; // Amber
    else if (accentColor === '#a855f7') darkAccent = '#7e22ce'; // Violet
    else if (accentColor === '#e63358') darkAccent = '#c42040'; // Original red-pink
    
    root.style.setProperty('--color-primary-dark', darkAccent);
    root.style.setProperty('--color-primary-muted', `${accentColor}1e`); // 12% opacity approx hex
    
    localStorage.setItem('accentColor', accentColor);
  }, [accentColor]);

  useEffect(() => {
    const root = window.document.documentElement;
    // Update border radius vars
    root.style.setProperty('--radius-lg', borderRadius);
    // Derived values
    const numRadius = parseInt(borderRadius);
    root.style.setProperty('--radius-md', `${Math.max(4, numRadius - 4)}px`);
    root.style.setProperty('--radius-sm', `${Math.max(2, numRadius - 8)}px`);
    
    localStorage.setItem('borderRadius', borderRadius);
  }, [borderRadius]);

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  return (
    <ThemeContext.Provider value={{ 
      theme, 
      toggleTheme, 
      accentColor, 
      setAccentColor, 
      borderRadius, 
      setBorderRadius,
      businessName,
      setBusinessName,
      businessLogo,
      setBusinessLogo
    }}>
      {children}
    </ThemeContext.Provider>
  );
};
