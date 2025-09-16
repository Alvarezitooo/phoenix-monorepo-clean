/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly MODE: string;
  readonly VITE_API_URL?: string;
  readonly VITE_LUNA_HUB_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}