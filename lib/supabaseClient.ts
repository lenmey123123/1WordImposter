// lib/supabaseClient.ts
import 'react-native-url-polyfill/auto'; // Muss als einer der ersten Imports stehen
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://crqxarujhialmhtuyydh.supabase.co'; // <-- Hier deine URL einfügen
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNycXhhcnVqaGlhbG1odHV5eWRoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDc4MzkxMzYsImV4cCI6MjA2MzQxNTEzNn0.RrbPQtMpDTurJdg48jrMeS2Ws4vlEUnKc9CAWa_n_pY'; // <-- Hier deinen Anon Key einfügen

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
  },
  global: {
    // Hier weisen wir Supabase an, den global verfügbaren WebSocket zu nutzen.
    // @ts-ignore // Kann notwendig sein, wenn TypeScript hier Typ-Probleme meldet.
    WebSocket: global.WebSocket,
  },
});
// Die überflüssige Klammer am Ende wurde entfernt