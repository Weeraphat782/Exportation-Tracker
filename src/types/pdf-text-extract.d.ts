declare module 'pdf-text-extract' {
  function extract(
    filePath: string,
    callback: (err: Error | null, pages: string[]) => void
  ): void;
 
  export = extract;
} 