import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { participantId, email, fullName, consentToContact, phoneNumber } = await req.json();

    // Validate required fields
    if (!participantId || typeof participantId !== "string") {
      return new Response(
        JSON.stringify({ error: "participantId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!fullName || typeof fullName !== "string" || fullName.trim().length === 0) {
      return new Response(
        JSON.stringify({ error: "fullName is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Validate email format if provided
    if (email && typeof email === "string") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        return new Response(
          JSON.stringify({ error: "Invalid email format" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Validate phone number format if provided (must start with +)
    if (phoneNumber && typeof phoneNumber === "string") {
      if (!phoneNumber.startsWith("+") || phoneNumber.length < 8) {
        return new Response(
          JSON.stringify({ error: "Phone number must start with + and country code" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    // Use service role to bypass RLS
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    // First verify the participant exists and was created recently (within 30 minutes)
    const { data: participant, error: fetchError } = await supabaseAdmin
      .from("participants")
      .select("id, created_at")
      .eq("id", participantId)
      .single();

    if (fetchError || !participant) {
      return new Response(
        JSON.stringify({ error: "Participant not found" }),
        { status: 404, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check if participant was created within the last 30 minutes
    const createdAt = new Date(participant.created_at);
    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);
    
    if (createdAt < thirtyMinutesAgo) {
      return new Response(
        JSON.stringify({ error: "Update window has expired" }),
        { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Build update object with only allowed fields
    const updateData: Record<string, unknown> = {
      email: email || null,
      full_name: fullName.trim(),
      consent_to_contact: Boolean(consentToContact),
    };

    if (phoneNumber !== undefined) {
      updateData.phone_number = phoneNumber || null;
    }

    // Perform the update
    const { data, error: updateError } = await supabaseAdmin
      .from("participants")
      .update(updateData)
      .eq("id", participantId)
      .select();

    if (updateError) {
      console.error("Error updating participant:", updateError);
      return new Response(
        JSON.stringify({ error: "Failed to update participant" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ success: true, data }),
      { status: 200, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    console.error("Unexpected error:", err);
    return new Response(
      JSON.stringify({ error: "Internal server error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
