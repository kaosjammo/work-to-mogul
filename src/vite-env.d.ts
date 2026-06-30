/// <reference types="vite/client" />

// Optional Supabase cloud-save config (see .env.example / supabase-notes.md).
// Both are optional — when unset, the app runs anonymously with local saves.
interface ImportMetaEnv {
  readonly VITE_SUPABASE_URL?: string
  readonly VITE_SUPABASE_ANON_KEY?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
