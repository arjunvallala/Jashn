import '@testing-library/jest-dom';
import { vi } from 'vitest';

// Mock Web Speech API
if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'SpeechRecognition', {
    writable: true,
    value: vi.fn().mockImplementation(() => ({
      start: vi.fn(),
      stop: vi.fn(),
      abort: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    })),
  });

  Object.defineProperty(window, 'webkitSpeechRecognition', {
    writable: true,
    value: (window as unknown as { SpeechRecognition: unknown }).SpeechRecognition,
  });

  Object.defineProperty(window, 'speechSynthesis', {
    writable: true,
    value: {
      speak: vi.fn(),
      cancel: vi.fn(),
      pause: vi.fn(),
      resume: vi.fn(),
      getVoices: vi.fn().mockReturnValue([]),
    },
  });

  // Mock matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(), // deprecated
      removeListener: vi.fn(), // deprecated
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
}
