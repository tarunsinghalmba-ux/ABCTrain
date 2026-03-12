import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface CreateUserRequest {
  email: string;
  firstName: string;
  lastName: string;
  role: "admin" | "manager" | "caregiver";
  organization?: string | null;
  phone?: string | null;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      console.error("Missing authorization header");
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user: requestingUser }, error: authError } = await supabaseAdmin.auth.getUser(token);

    if (authError) {
      console.error("Auth error:", authError);
      throw new Error(`Authentication failed: ${authError.message}`);
    }

    if (!requestingUser) {
      console.error("No user found from token");
      throw new Error("Unauthorized: No user found");
    }

    console.log("Requesting user ID:", requestingUser.id);

    const { data: requestingProfile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("role")
      .eq("id", requestingUser.id)
      .maybeSingle();

    console.log("Requesting profile:", requestingProfile, "Error:", profileError);

    if (profileError) {
      console.error("Profile fetch error:", profileError);
      throw new Error(`Failed to fetch profile: ${profileError.message}`);
    }

    if (!requestingProfile) {
      console.error("No profile found for user:", requestingUser.id);
      throw new Error("User profile not found");
    }

    if (requestingProfile.role !== "admin") {
      console.error("User is not admin, role:", requestingProfile.role);
      throw new Error("Only admins can create users");
    }

    const requestData: CreateUserRequest = await req.json();
    const { email, firstName, lastName, role, organization, phone } = requestData;

    if (!email || !firstName || !lastName || !role) {
      throw new Error("Missing required fields");
    }

    const defaultPassword = "Welcome123!";

    const { data: newUser, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password: defaultPassword,
      email_confirm: true,
      user_metadata: {
        first_name: firstName,
        last_name: lastName,
      },
    });

    if (createError) {
      throw new Error(`Failed to create user: ${createError.message}`);
    }

    const { error: profileInsertError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: newUser.user.id,
        email,
        first_name: firstName,
        last_name: lastName,
        role,
        organization: organization || null,
        phone: phone || null,
        is_active: true,
      });

    if (profileInsertError) {
      await supabaseAdmin.auth.admin.deleteUser(newUser.user.id);
      throw new Error(`Failed to create profile: ${profileInsertError.message}`);
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: "User created successfully",
        userId: newUser.user.id,
        defaultPassword,
      }),
      {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    console.error("Error creating user:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error occurred",
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
