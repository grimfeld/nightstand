/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Base URL of the PocketBase instance, e.g. https://nightstand.fly.dev */
  readonly VITE_PB_URL: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
