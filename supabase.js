<script type="module">
  import { createClient } from "https://esm.sh/@supabase/supabase-js";

  const SUPABASE_URL = "https://rhujpinlutjiztyonmas.supabase.co";
  const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJodWpwaW5sdXRqaXp0eW9ubWFzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTczMDQyOTIsImV4cCI6MjA3Mjg4MDI5Mn0.zcfDUOHTeBYydFFscwmy3U9yryHiItTVJPLRurUlBvY";

  export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
</script>
