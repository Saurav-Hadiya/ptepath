/**
 * Minimal type declaration for `nspell` (ships no types of its own).
 * Only the surface the writing/listening modules use is declared.
 */
declare module 'nspell' {
  interface NSpell {
    /** Returns true if `word` is spelled correctly. */
    correct(word: string): boolean;
    /** Suggested corrections for a misspelled word. */
    suggest(word: string): string[];
    spell(word: string): { correct: boolean; forbidden: boolean; warn: boolean };
    add(word: string, model?: string): NSpell;
    remove(word: string): NSpell;
    wordCharacters(): string[] | undefined;
    dictionary(dic: Buffer | string): NSpell;
    personal(dic: Buffer | string): NSpell;
  }

  type Dictionary = { aff: Buffer | string; dic: Buffer | string };

  function nspell(
    aff: Buffer | string | Dictionary | Dictionary[],
    dic?: Buffer | string
  ): NSpell;

  export = nspell;
}
