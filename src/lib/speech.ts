import { LanguageCode } from '../domain/types';

export class VoiceSpeechManager {
  public static isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'SpeechRecognition' in window || 'webkitSpeechRecognition' in window;
  }

  public static isSpeechSynthesisSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
  }

  public static startListening(
    language: LanguageCode,
    onResult: (text: string) => void,
    onError: (err: string) => void,
  ): { stop: () => void } | null {
    if (!this.isSpeechRecognitionSupported()) {
      onError('Speech recognition is not supported in this browser.');
      return null;
    }

    try {
      const SpeechRecognitionClass =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      const recognition = new SpeechRecognitionClass();

      const langMap: Record<LanguageCode, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
      };
      recognition.lang = langMap[language] || 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onresult = (event: any) => {
        const transcript = event.results?.[0]?.[0]?.transcript;
        if (transcript) {
          onResult(transcript);
        }
      };

      recognition.onerror = (event: any) => {
        onError(event.error || 'Voice input error');
      };

      recognition.start();

      return {
        stop: () => {
          try {
            recognition.stop();
          } catch {
            // Already stopped
          }
        },
      };
    } catch (e: unknown) {
      onError(e instanceof Error ? e.message : 'Failed to start speech recognition');
      return null;
    }
  }

  public static speak(text: string, language: LanguageCode = 'en'): void {
    if (!this.isSpeechSynthesisSupported()) return;

    try {
      window.speechSynthesis.cancel(); // Stop any active speech

      const utterance = new SpeechSynthesisUtterance(text);
      const langMap: Record<LanguageCode, string> = {
        en: 'en-IN',
        hi: 'hi-IN',
        te: 'te-IN',
      };
      utterance.lang = langMap[language] || 'en-IN';
      utterance.rate = 1.0;
      utterance.pitch = 1.0;

      window.speechSynthesis.speak(utterance);
    } catch {
      // Speech synthesis failed silently
    }
  }

  public static stopSpeaking(): void {
    if (this.isSpeechSynthesisSupported()) {
      window.speechSynthesis.cancel();
    }
  }
}
