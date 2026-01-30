import { createTheme } from '@mui/material/styles';

// Premium Color Palette
const colors = {
    // Primary Blue Gradient (Lighter)
    primary: {
        50: '#eff6ff',
        100: '#dbeafe',
        200: '#bfdbfe',
        300: '#93c5fd',
        400: '#60a5fa',
        500: '#3b82f6',
        600: '#2563eb',
        700: '#1d4ed8',
        800: '#1e40af',
        900: '#1e3a8a',
    },
    // Neutral Slate
    slate: {
        50: '#f8fafc',
        100: '#f1f5f9',
        200: '#e2e8f0',
        300: '#cbd5e1',
        400: '#94a3b8',
        500: '#64748b',
        600: '#475569',
        700: '#334155',
        800: '#1e293b',
        900: '#0f172a',
    },
    // Accent Colors
    accent: {
        purple: '#8b5cf6',
        pink: '#ec4899',
        cyan: '#06b6d4',
        emerald: '#10b981',
        amber: '#f59e0b',
    },
};

// Premium Shadows (Layered)
const shadows = {
    xs: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
    sm: '0 1px 3px 0 rgba(0, 0, 0, 0.1), 0 1px 2px -1px rgba(0, 0, 0, 0.1)',
    md: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.1)',
    lg: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -4px rgba(0, 0, 0, 0.1)',
    xl: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)',
    '2xl': '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
    inner: 'inset 0 2px 4px 0 rgba(0, 0, 0, 0.05)',
    // Premium Glass Shadow
    glass: '0 8px 32px 0 rgba(31, 38, 135, 0.15)',
    // Colored Glow
    glow: `0 0 20px ${colors.primary[400]}40, 0 0 40px ${colors.primary[300]}20`,
};

export const theme = createTheme({
    palette: {
        mode: 'light',
        primary: {
            main: colors.primary[600],
            light: colors.primary[400],
            dark: colors.primary[700],
            contrastText: '#ffffff',
        },
        secondary: {
            main: colors.accent.purple,
            light: '#a78bfa',
            dark: '#60a5fa',
        },
        background: {
            default: colors.slate[50],
            paper: '#ffffff',
        },
        text: {
            primary: colors.slate[900],
            secondary: colors.slate[600],
        },
        divider: colors.slate[200],
        success: {
            main: colors.accent.emerald,
        },
        warning: {
            main: colors.accent.amber,
        },
        error: {
            main: '#ef4444',
        },
        info: {
            main: colors.accent.cyan,
        },
    },
    shape: {
        borderRadius: 12,
    },
    typography: {
        fontFamily: '"Inter", "Plus Jakarta Sans", "Outfit", -apple-system, sans-serif',
        h1: {
            fontWeight: 800,
            letterSpacing: '-0.02em',
            fontFamily: '"Outfit", sans-serif',
        },
        h2: {
            fontWeight: 700,
            letterSpacing: '-0.01em',
            fontFamily: '"Outfit", sans-serif',
        },
        h3: {
            fontWeight: 700,
            fontFamily: '"Outfit", sans-serif',
        },
        h4: {
            fontWeight: 600,
            fontFamily: '"Outfit", sans-serif',
        },
        h5: {
            fontWeight: 600,
        },
        h6: {
            fontWeight: 600,
        },
        button: {
            textTransform: 'none',
            fontWeight: 600,
            letterSpacing: '0.01em',
        },
        body1: {
            fontSize: '0.95rem',
            lineHeight: 1.6,
        },
        body2: {
            fontSize: '0.875rem',
            lineHeight: 1.5,
        },
    },
    components: {
        MuiCssBaseline: {
            styleOverrides: {
                body: {
                    scrollbarWidth: 'thin',
                    scrollbarColor: `${colors.slate[300]} transparent`,
                },
            },
        },
        MuiAppBar: {
            styleOverrides: {
                root: {
                    backgroundColor: 'rgba(255, 255, 255, 0.8)',
                    backdropFilter: 'blur(12px)',
                    color: colors.slate[900],
                    boxShadow: shadows.sm,
                    borderBottom: `1px solid ${colors.slate[200]}`,
                },
            },
        },
        MuiButton: {
            styleOverrides: {
                root: {
                    borderRadius: '10px',
                    padding: '10px 20px',
                    fontWeight: 600,
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'translateY(-1px)',
                    },
                },
                contained: {
                    boxShadow: shadows.sm,
                    '&:hover': {
                        boxShadow: shadows.md,
                    },
                },
                containedPrimary: {
                    background: `linear-gradient(135deg, ${colors.primary[600]} 0%, ${colors.primary[700]} 100%)`,
                    '&:hover': {
                        background: `linear-gradient(135deg, ${colors.primary[700]} 0%, ${colors.primary[800]} 100%)`,
                    },
                },
            },
        },
        MuiCard: {
            styleOverrides: {
                root: {
                    borderRadius: '16px',
                    boxShadow: shadows.md,
                    border: `1px solid ${colors.slate[200]}`,
                    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        boxShadow: shadows.lg,
                        transform: 'translateY(-2px)',
                    },
                },
            },
        },
        MuiPaper: {
            styleOverrides: {
                root: {
                    backgroundImage: 'none',
                },
                elevation1: {
                    boxShadow: shadows.sm,
                },
                elevation2: {
                    boxShadow: shadows.md,
                },
                elevation3: {
                    boxShadow: shadows.lg,
                },
            },
        },
        MuiIconButton: {
            styleOverrides: {
                root: {
                    transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                    '&:hover': {
                        transform: 'scale(1.05)',
                    },
                },
            },
        },
        MuiChip: {
            styleOverrides: {
                root: {
                    borderRadius: '8px',
                    fontWeight: 600,
                },
            },
        },
    },
});

// Export utility shadows for direct use
export { shadows, colors };
