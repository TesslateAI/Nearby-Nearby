import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';
import { ModalsProvider } from '@mantine/modals';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './utils/AuthContext';

// Import CSS files
import 'leaflet/dist/leaflet.css';
import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/dropzone/styles.css';
import '@mantine/notifications/styles.css';
import '@mantine/tiptap/styles.css';
import './animations.css'; // Import our new animations

// Define the theme based on the "Nearby Nearby" site
const theme = createTheme({
  colors: {
    'deep-purple': [
      '#F3E5F5', '#E1BEE7', '#CE93D8', '#BA68C8', '#AB47BC', '#9C27B0',
      '#8E24AA', '#5A2C6C', '#6A1B9A', '#4A148C',
    ],
    'brand-green': [
      '#E4F8F0', '#B4EAD7', '#86DDC4', '#58CFB1', '#34BE82', '#2BAA74',
      '#239566', '#1B8158', '#146D4A', '#0D583C',
    ],
  },
  
  primaryColor: 'deep-purple',
  primaryShade: 7,

  fontFamily: 'Poppins, sans-serif',
  headings: {
    fontFamily: 'Poppins, sans-serif',
    fontWeight: '600',
  },
  
  defaultRadius: 'md',

  components: {
    Button: {
      defaultProps: {
        color: 'brand-green.4',
      },
      styles: {
        root: {
          transition: 'transform 0.1s ease-in-out, background-color 0.2s ease',
          '&:hover': {
            transform: 'scale(1.02)',
          },
        },
      },
    },
    Paper: {
        defaultProps: {
            withBorder: true,
            shadow: 'sm',
            p: 'xl',
            radius: 'lg',
        },
        styles: {
            root: {
                position: 'relative',
                zIndex: 1,
            }
        }
    },
    NavLink: {
        styles: (theme) => ({
            root: {
                borderRadius: theme.radius.md,
                transition: 'background-color 0.2s ease, color 0.2s ease',
                '&[dataActive]': {
                    backgroundColor: theme.colors['deep-purple'][0],
                    color: theme.colors['deep-purple'][8],
                },
            },
            label: {
                fontWeight: 500,
            },
        }),
    },
    Table: {
        styles: (theme) => ({
            thead: {
                backgroundColor: theme.colors.gray[0],
            },
            th: {
                fontWeight: 600,
            }
        })
    }
  },
});

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <MantineProvider theme={theme}>
      <ModalsProvider>
        <Notifications position="top-right" />
        <BrowserRouter>
          <AuthProvider>
            <App />
          </AuthProvider>
        </BrowserRouter>
      </ModalsProvider>
    </MantineProvider>
  </React.StrictMode>
);