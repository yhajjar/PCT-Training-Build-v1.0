import PocketBase from 'pocketbase';

// Import the PocketBase client like this:
// import { pb } from "@/integrations/pocketbase/client";

const configuredBase =
  import.meta.env.VITE_API_BASE_URL ||
  import.meta.env.VITE_PB_API_URL ||
  import.meta.env.VITE_POCKETBASE_URL ||
  '';

const POCKETBASE_URL =
  configuredBase ||
  (typeof window !== 'undefined' ? window.location.origin : '');

export const pb = new PocketBase(POCKETBASE_URL);

// Auto-refresh auth on page load
pb.autoCancellation(false);
