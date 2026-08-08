import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", {
      status: 200,
      headers: corsHeaders,
    });
  }

  const jsonResponse = (
    body: Record<string, unknown>,
    status = 200
  ) => {
    return new Response(JSON.stringify(body), {
      status,
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });
  };

  try {
    if (req.method !== "POST") {
      return jsonResponse(
        {
          success: false,
          error: "Method not allowed",
        },
        405
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const serviceRoleKey = Deno.env.get(
      "SUPABASE_SERVICE_ROLE_KEY"
    );

    if (!supabaseUrl || !serviceRoleKey) {
      throw new Error(
        "Supabase environment variables are missing"
      );
    }

    /*
     * ==========================================
     * Admin Client
     * ==========================================
     */

    const supabaseAdmin = createClient(
      supabaseUrl,
      serviceRoleKey,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    /*
     * ==========================================
     * التحقق من المستخدم الذي استدعى Function
     * ==========================================
     */

    const authHeader =
      req.headers.get("Authorization");

    if (!authHeader) {
      return jsonResponse(
        {
          success: false,
          error: "Unauthorized",
        },
        401
      );
    }

    const token = authHeader.replace(
      "Bearer ",
      ""
    );

    const {
      data: {
        user: currentUser,
      },
      error: authError,
    } = await supabaseAdmin.auth.getUser(token);

    if (authError || !currentUser) {
      return jsonResponse(
        {
          success: false,
          error: "جلسة المستخدم غير صالحة",
        },
        401
      );
    }

    /*
     * ==========================================
     * التحقق أن المستخدم الحالي Admin
     * ==========================================
     */

    const {
      data: currentUserRole,
      error: roleCheckError,
    } = await supabaseAdmin
      .from("user_roles")
      .select(`
        role_id,
        roles (
          id,
          name,
          code,
          is_active
        )
      `)
      .eq("user_id", currentUser.id)
      .maybeSingle();

    if (roleCheckError) {
      throw roleCheckError;
    }

    const role = Array.isArray(
      currentUserRole?.roles
    )
      ? currentUserRole.roles[0]
      : currentUserRole?.roles;

    const roleCode =
      role?.code?.toUpperCase();

    if (
      !role ||
      role.is_active !== true ||
      roleCode !== "ADMIN"
    ) {
      return jsonResponse(
        {
          success: false,
          error:
            "ليس لديك صلاحية لإعادة تعيين كلمات المرور",
        },
        403
      );
    }

    /*
     * ==========================================
     * قراءة البيانات
     * ==========================================
     */

    const body = await req.json();

    const userId = body?.user_id;

    if (!userId) {
      return jsonResponse(
        {
          success: false,
          error: "user_id is required",
        },
        400
      );
    }

    /*
     * ==========================================
     * التأكد أن المستخدم موجود
     * ==========================================
     */

    const {
      data: targetProfile,
      error: profileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        username,
        personnel_id,
        is_active
      `)
      .eq("id", userId)
      .maybeSingle();

    if (profileError) {
      throw profileError;
    }

    if (!targetProfile) {
      return jsonResponse(
        {
          success: false,
          error:
            "لم يتم العثور على المستخدم",
        },
        404
      );
    }

    /*
     * ==========================================
     * كلمة المرور الافتراضية
     * ==========================================
     */

    const defaultPassword = "123456789";

    /*
     * ==========================================
     * Reset Password
     * ==========================================
     */

    const {
      data: updatedUser,
      error: updatePasswordError,
    } =
      await supabaseAdmin.auth.admin.updateUserById(
        userId,
        {
          password: defaultPassword,
        }
      );

    if (updatePasswordError) {
      throw updatePasswordError;
    }

    if (!updatedUser?.user) {
      throw new Error(
        "فشل تحديث كلمة المرور"
      );
    }

    /*
     * ==========================================
     * نجاح
     * ==========================================
     */

    return jsonResponse({
      success: true,
      message:
        "تم إعادة تعيين كلمة المرور بنجاح",
      user_id: userId,
      username: targetProfile.username,
      default_password: defaultPassword,
    });
  } catch (error) {
    console.error(
      "RESET USER PASSWORD ERROR:",
      error
    );

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير معروف",
      },
      500
    );
  }
});