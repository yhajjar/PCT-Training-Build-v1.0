import PocketBase from 'pocketbase';

// Import the PocketBase client like this:
// import { pb } from "@/integrations/pocketbase/client";

const POCKETBASE_URL = import.meta.env.VITE_POCKETBASE_URL || 'http://localhost:8090';

export const pb = new PocketBase(POCKETBASE_URL);

// Auto-refresh auth on page load
pb.autoCancellation(false);
