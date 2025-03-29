declare module 'react-native-tesseract-ocr' {
  export function recognize(
    path: string,
    language: string
  ): Promise<string>;

  export function getSupportedLanguages(): Promise<string[]>;

  export const LANG_ENGLISH: string;
  export const LANG_SPANISH: string;
  // Add other languages or methods you need here as needed
}
