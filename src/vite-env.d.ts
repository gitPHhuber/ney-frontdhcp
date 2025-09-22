/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_BYPASS_AUTH?: string;
    readonly VITE_VEGMAN_PASSPORT_TEMPLATE_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }
}

export {};
