import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods":
    "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // CORS
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

  let createdAuthUserId: string | null = null;
  let createdProfileByFunction = false;

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

    // =========================
    // 1. قراءة البيانات
    // =========================

    const body = await req.json();

    const personnelId = body?.personnel_id;
    const roleId = body?.role_id;

    if (!personnelId) {
      throw new Error(
        "personnel_id is required"
      );
    }

    if (!roleId) {
      throw new Error(
        "role_id is required"
      );
    }

    // =========================
    // 2. بيانات الفرد
    // =========================

    const {
      data: personnel,
      error: personnelError,
    } = await supabaseAdmin
      .from("personnel")
      .select(
        "id, military_number, full_name"
      )
      .eq("id", personnelId)
      .maybeSingle();

    if (personnelError) {
      throw personnelError;
    }

    if (!personnel) {
      throw new Error(
        "لم يتم العثور على الفرد"
      );
    }

    const militaryNumber = String(
      personnel.military_number ?? ""
    ).trim();

    if (!militaryNumber) {
      throw new Error(
        "الفرد لا يحتوي على رقم عسكري"
      );
    }

    const email =
      `${militaryNumber}@auth.local`;

    // =========================
    // 3. التأكد من عدم وجود Profile
    // =========================

    const {
      data: existingProfile,
      error: existingProfileError,
    } = await supabaseAdmin
      .from("profiles")
      .select(
        "id, personnel_id, username, is_active"
      )
      .eq("personnel_id", personnelId)
      .maybeSingle();

    if (existingProfileError) {
      throw existingProfileError;
    }

    if (existingProfile) {
      throw new Error(
        "هذا الفرد لديه حساب مستخدم بالفعل"
      );
    }

    // =========================
    // 4. التأكد من الصلاحية
    // =========================

    const {
      data: role,
      error: roleError,
    } = await supabaseAdmin
      .from("roles")
      .select("id, name, code")
      .eq("id", roleId)
      .eq("is_active", true)
      .maybeSingle();

    if (roleError) {
      throw roleError;
    }

    if (!role) {
      throw new Error(
        "الصلاحية المحددة غير موجودة أو غير مفعلة"
      );
    }

    // =========================
    // 5. البحث عن Auth User
    // =========================

    let existingAuthUser = null;

    // نبحث في صفحات المستخدمين
    for (let page = 1; page <= 10; page++) {
      const {
        data: usersData,
        error: usersError,
      } =
        await supabaseAdmin.auth.admin.listUsers({
          page,
          perPage: 1000,
        });

      if (usersError) {
        throw usersError;
      }

      existingAuthUser =
        usersData.users.find(
          (user) =>
            user.email?.toLowerCase() ===
            email.toLowerCase()
        );

      if (
        existingAuthUser ||
        usersData.users.length < 1000
      ) {
        break;
      }
    }

    if (existingAuthUser) {
      throw new Error(
        "يوجد حساب Auth بهذا الرقم العسكري بالفعل"
      );
    }

    // =========================
    // 6. إنشاء Auth User
    // =========================

    const {
      data: authData,
      error: authError,
    } =
      await supabaseAdmin.auth.admin.createUser({
        email,
        password: "12345678",
        email_confirm: true,
        user_metadata: {
          personnel_id: personnelId,
          full_name: personnel.full_name,
          military_number: militaryNumber,
        },
      });

    if (authError) {
      throw authError;
    }

    if (!authData.user) {
      throw new Error(
        "فشل إنشاء مستخدم Auth"
      );
    }

    createdAuthUserId =
      authData.user.id;

    // =========================
    // 7. انتظار الـ Trigger
    // =========================

    // لو عندك Trigger ينشئ Profile تلقائيًا
    // ننتظر قليلًا ثم نتحقق.
    let profile = null;

    for (let attempt = 0; attempt < 10; attempt++) {
      const {
        data: currentProfile,
        error: currentProfileError,
      } = await supabaseAdmin
        .from("profiles")
        .select(
          "id, personnel_id, username, is_active"
        )
        .eq("id", createdAuthUserId)
        .maybeSingle();

      if (currentProfileError) {
        throw currentProfileError;
      }

      if (currentProfile) {
        profile = currentProfile;
        break;
      }

      await new Promise((resolve) =>
        setTimeout(resolve, 200)
      );
    }

    // =========================
    // 8. لو الـTrigger لم ينشئ Profile
    // ننشئه نحن
    // =========================

    if (!profile) {
      const {
        data: insertedProfile,
        error: profileInsertError,
      } = await supabaseAdmin
        .from("profiles")
        .insert({
          id: createdAuthUserId,
          personnel_id: personnelId,
          username: email,
          is_active: true,
        })
        .select()
        .single();

      if (profileInsertError) {
        // ممكن يكون الـTrigger أنشأه
        // في نفس اللحظة
        if (
          profileInsertError.code ===
          "23505"
        ) {
          const {
            data: profileAfterConflict,
            error:
              profileAfterConflictError,
          } = await supabaseAdmin
            .from("profiles")
            .select(
              "id, personnel_id, username, is_active"
            )
            .eq(
              "id",
              createdAuthUserId
            )
            .maybeSingle();

          if (
            profileAfterConflictError
          ) {
            throw profileAfterConflictError;
          }

          if (!profileAfterConflict) {
            throw profileInsertError;
          }

          profile =
            profileAfterConflict;
        } else {
          throw profileInsertError;
        }
      } else {
        profile = insertedProfile;
        createdProfileByFunction = true;
      }
    }

    if (!profile) {
      throw new Error(
        "فشل إنشاء Profile للمستخدم"
      );
    }

    // =========================
    // 9. تحديث بيانات Profile
    // =========================

    const {
      error: profileUpdateError,
    } = await supabaseAdmin
      .from("profiles")
      .update({
        personnel_id: personnelId,
        username: email,
        is_active: true,
        updated_at:
          new Date().toISOString(),
      })
      .eq(
        "id",
        createdAuthUserId
      );

    if (profileUpdateError) {
      throw profileUpdateError;
    }

    // =========================
    // 10. التأكد من عدم وجود Role
    // =========================

    const {
      data: existingUserRole,
      error: existingUserRoleError,
    } = await supabaseAdmin
      .from("user_roles")
      .select(
        "user_id, role_id"
      )
      .eq(
        "user_id",
        createdAuthUserId
      )
      .eq(
        "role_id",
        roleId
      )
      .maybeSingle();

    if (existingUserRoleError) {
      throw existingUserRoleError;
    }

    // =========================
    // 11. إضافة Role
    // =========================

    if (!existingUserRole) {
      const {
        error: userRoleError,
      } = await supabaseAdmin
        .from("user_roles")
        .insert({
          user_id: createdAuthUserId,
          role_id: roleId,
        });

      if (userRoleError) {
        throw userRoleError;
      }
    }

    // =========================
    // 12. نجاح
    // =========================

    return jsonResponse({
      success: true,
      message:
        "تم إنشاء المستخدم بنجاح",
      user_id: createdAuthUserId,
      profile_id: profile.id,
      username: email,
      email,
      personnel_id: personnelId,
      role_id: roleId,
      role_name: role.name,
    });
  } catch (error) {
    console.error(
      "CREATE SYSTEM USER ERROR:",
      error
    );

    // =========================
    // Rollback
    // =========================

    if (createdAuthUserId) {
      try {
        await supabaseAdmin
          .from("user_roles")
          .delete()
          .eq(
            "user_id",
            createdAuthUserId
          );
      } catch (rollbackError) {
        console.error(
          "ROLLBACK USER ROLE ERROR:",
          rollbackError
        );
      }

      // نحذف الـProfile فقط لو أنشأناه
      // أو نتركه لو أنشأه Trigger
      if (createdProfileByFunction) {
        try {
          await supabaseAdmin
            .from("profiles")
            .delete()
            .eq(
              "id",
              createdAuthUserId
            );
        } catch (rollbackError) {
          console.error(
            "ROLLBACK PROFILE ERROR:",
            rollbackError
          );
        }
      }

      try {
        await supabaseAdmin.auth.admin.deleteUser(
          createdAuthUserId
        );
      } catch (rollbackError) {
        console.error(
          "ROLLBACK AUTH USER ERROR:",
          rollbackError
        );
      }
    }

    return jsonResponse(
      {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "حدث خطأ غير معروف",
      },
      400
    );
  }
});