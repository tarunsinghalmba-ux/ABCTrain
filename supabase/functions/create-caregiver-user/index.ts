import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateCaregiverRequest {
  email: string;
  firstName: string;
  lastName: string;
  organization?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    // Use service role client for all operations
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the JWT token and get the user
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      console.error("Auth error:", authError);
      throw new Error("Unauthorized");
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (!profile || !["admin", "manager"].includes(profile.role)) {
      throw new Error("Forbidden: Only admins and managers can create caregivers");
    }

    const { email, firstName, lastName, organization }: CreateCaregiverRequest = await req.json();

    if (!email || !firstName || !lastName) {
      throw new Error("Missing required fields: email, firstName, lastName");
    }

    const defaultPassword = "Welcome123!";

    const { data: authUser, error: createError } = await supabase.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createError) {
      console.error("Error creating auth user:", createError);
      throw createError;
    }

    const { data: newProfile, error: profileError } = await supabase
      .from("profiles")
      .insert({
        id: authUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role: "caregiver",
        organization: organization || null,
        is_active: true,
      })
      .select()
      .single();

    if (profileError) {
      console.error("Error creating profile:", profileError);
      await supabase.auth.admin.deleteUser(authUser.user.id);
      throw profileError;
    }

    return new Response(
      JSON.stringify({
        success: true,
        ...newProfile,
        defaultPassword,
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error in create-caregiver-user function:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
      }),
      {
        status: error.message.includes("Forbidden") ? 403 : error.message.includes("Unauthorized") ? 401 : 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
