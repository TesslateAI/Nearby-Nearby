import '@testing-library/jest-dom';

// jsdom does not implement window.matchMedia; Mantine's MantineProvider calls it
// on mount to detect the user's preferred color scheme. Mock it globally so that
// every test file that renders Mantine components doesn't crash.
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: (query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
  }),
});
