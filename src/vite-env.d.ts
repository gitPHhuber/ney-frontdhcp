/// <reference types="vite/client" />

declare global {
  interface ImportMetaEnv {
    readonly VITE_BYPASS_AUTH?: string;
    readonly VITE_MOCK_API?: string;
    readonly 'VITE_FEATURE_mes-flash-console'?: string;
    readonly VITE_VEGMAN_PASSPORT_TEMPLATE_URL?: string;
    readonly VITE_API_URL?: string;
    readonly VITE_WS_URL?: string;
  }

  interface ImportMeta {
    readonly env: ImportMetaEnv;
  }

  const __APP_BUILD_INFO__: {
    readonly commit: string;
    readonly time: string;
  };
}

export {};
