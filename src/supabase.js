import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://agfquuwsabgjlublxouh.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFnZnF1dXdzYWJnamx1Ymx4b3VoIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI1NDQzNDYsImV4cCI6MjA2ODEyMDM0Nn0.Omb02RgtZCyIpWf5Kvy5mg-l3Dgu3HN-u0zOwBayrXk'

export const supabase = createClient(supabaseUrl, supabaseKey)
