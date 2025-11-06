import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

export function useUserActivity() {
  const location = useLocation();

  useEffect(() => {
    const trackActivity = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      try {
        await supabase.from("user_activity").insert({
          user_id: user.id,
          action: "page_view",
          details: `Viewed ${location.pathname}`
        });
      } catch (error) {
        console.error("Error tracking activity:", error);
      }
    };

    trackActivity();
  }, [location.pathname]);
}
