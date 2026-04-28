declare module 'tiny-pinyin' {
  interface TinyPinyin {
    isSupported(): boolean;
    convertToPinyin(text: string, separator?: string, lowerCase?: boolean): string;
    parse(text: string): Array<{ type: number; source: string; target: string }>;
    PINYIN_STYLE: { NORMAL: number; TONE: number; TONE2: number; INITIALS: number; FIRST_LETTER: number };
  }
  const pinyin: TinyPinyin;
  export default pinyin;
}
