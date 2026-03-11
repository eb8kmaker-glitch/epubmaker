declare module "pandoc-wasm" {
  export function convert(
    options: Record<string, unknown>,
    stdin: string | null,
    files: Record<string, Blob | string>
  ): Promise<{
    stdout?: string;
    stderr?: string;
    files?: Record<string, Blob | string>;
    mediaFiles?: Record<string, Blob>;
  }>;
  export function query(options: { query: string; format?: string }): Promise<unknown>;
}
