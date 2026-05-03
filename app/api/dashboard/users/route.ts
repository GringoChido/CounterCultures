/**
 * /api/dashboard/users — admin CRUD for the Users sheet tab.
 * Gated by `manage_users` (owner role default).
 *
 *   GET    → list all users
 *   POST   → create a new user
 *   PATCH  → update an existing user (by email)
 *   DELETE → soft-delete (active=false) by email
 */

import { NextResponse, type NextRequest } from "next/server";
import { z } from "zod";
import {
  getAllUsers,
  createUser,
  updateUser,
  deactivateUser,
  type UserRole,
} from "@/app/lib/users-sheet";
import { requireFeature, FeatureDeniedError } from "@/app/lib/auth";
import {
  ALL_FEATURE_KEYS,
  buildOverridesString,
  type Feature,
} from "@/app/lib/features";
import { appendRowByHeader } from "@/app/lib/dashboard-sheets";

type UserAdminAction = "user_added" | "user_updated" | "user_deactivated";

const logUserAdminEvent = (
  actorEmail: string,
  action: UserAdminAction,
  targetEmail: string,
  details: Record<string, unknown>
): void => {
  const id = `EA-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
  appendRowByHeader("Activity_Log", {
    id,
    timestamp: new Date().toISOString(),
    actor_email: actorEmail,
    action,
    entity_type: "user",
    entity_id: targetEmail,
    details: JSON.stringify(details),
  }).catch((err) =>
    console.error(`[/api/dashboard/users] Activity_Log append failed (${action}):`, err)
  );
};

const RoleSchema = z.enum(["owner", "finance", "sales"]);
const FeatureSchema = z.enum(ALL_FEATURE_KEYS as [Feature, ...Feature[]]);

const UpsertSchema = z.object({
  email: z.string().email(),
  name: z.string().min(1).max(120),
  role: RoleSchema,
  active: z.boolean(),
  /** Full set of features the user should have. We diff against the role
   *  default to compute the minimal `feature_overrides` string. */
  enabledFeatures: z.array(FeatureSchema),
});

const handle =
  <T>(fn: () => Promise<T>) =>
  async (): Promise<Response> => {
    try {
      const result = await fn();
      return NextResponse.json(result);
    } catch (err) {
      if (err instanceof FeatureDeniedError) {
        return NextResponse.json(
          { error: "Forbidden", feature: err.feature },
          { status: 403 }
        );
      }
      const msg = err instanceof Error ? err.message : "unknown_error";
      console.error("[/api/dashboard/users]", msg);
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };

export const GET = handle(async () => {
  await requireFeature("manage_users");
  const users = await getAllUsers();
  return { users };
});

export const POST = async (req: NextRequest): Promise<Response> => {
  try {
    const actor = await requireFeature("manage_users");
    const body = UpsertSchema.parse(await req.json());
    const featureOverrides = buildOverridesString(
      body.role as UserRole,
      body.enabledFeatures
    );
    const user = await createUser({
      email: body.email,
      name: body.name,
      role: body.role,
      active: body.active,
      featureOverrides,
    });
    logUserAdminEvent(actor.email, "user_added", user.email, {
      name: user.name,
      role: user.role,
      active: user.active,
      featureOverrides: user.featureOverrides,
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "create_failed";
    console.error("[/api/dashboard/users POST]", msg);
    const status = msg.includes("already exists") ? 409 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};

export const PATCH = async (req: NextRequest): Promise<Response> => {
  try {
    const actor = await requireFeature("manage_users");
    const body = UpsertSchema.parse(await req.json());
    const featureOverrides = buildOverridesString(
      body.role as UserRole,
      body.enabledFeatures
    );
    const user = await updateUser({
      email: body.email,
      name: body.name,
      role: body.role,
      active: body.active,
      featureOverrides,
    });
    logUserAdminEvent(actor.email, "user_updated", user.email, {
      name: user.name,
      role: user.role,
      active: user.active,
      featureOverrides: user.featureOverrides,
    });
    return NextResponse.json({ user });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Invalid body", issues: err.issues },
        { status: 400 }
      );
    }
    const msg = err instanceof Error ? err.message : "update_failed";
    console.error("[/api/dashboard/users PATCH]", msg);
    const status = msg.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};

export const DELETE = async (req: NextRequest): Promise<Response> => {
  try {
    const actor = await requireFeature("manage_users");
    const email = req.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email required" }, { status: 400 });
    }
    await deactivateUser(email);
    logUserAdminEvent(actor.email, "user_deactivated", email.trim().toLowerCase(), {});
    return NextResponse.json({ ok: true });
  } catch (err) {
    if (err instanceof FeatureDeniedError) {
      return NextResponse.json(
        { error: "Forbidden", feature: err.feature },
        { status: 403 }
      );
    }
    const msg = err instanceof Error ? err.message : "delete_failed";
    console.error("[/api/dashboard/users DELETE]", msg);
    const status = msg.includes("not found") ? 404 : 500;
    return NextResponse.json({ error: msg }, { status });
  }
};
