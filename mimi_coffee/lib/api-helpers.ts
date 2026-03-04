import { NextResponse } from "next/server";
import { ApiResponse } from "@/types";
import { apiRateLimit, aiRateLimit } from "./redis";
import { headers } from "next/headers";

export function apiResponse<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ success: true, data }, { status });
}

export function apiError(error: string, status = 500): NextResponse<ApiResponse<never>> {
  return NextResponse.json({ success: false, error }, { status });
}

export async function checkRateLimit(
  identifier: string,
  type: "api" | "ai" = "api"
) {
  const ratelimit = type === "ai" ? aiRateLimit : apiRateLimit;
  const ip = await getClientIp();

  const { success, limit, reset, remaining } = await ratelimit.limit(
    `${identifier}:${ip}`
  );

  if (!success) {
    return {
      allowed: false,
      response: NextResponse.json(
        { success: false, error: "Too many requests" },
        {
          status: 429,
          headers: {
            "X-RateLimit-Limit": limit.toString(),
            "X-RateLimit-Remaining": remaining.toString(),
            "X-RateLimit-Reset": new Date(reset).toISOString(),
            "Retry-After": Math.ceil((reset - Date.now()) / 1000).toString(),
          },
        }
      ),
    };
  }

  return { allowed: true };
}

export async function getClientIp(): Promise<string> {
  const headersList = await headers();
  return (
    headersList.get("x-forwarded-for")?.split(",")[0].trim() ||
    headersList.get("x-real-ip") ||
    "unknown"
  );
}

export function handleDbError(error: unknown): string {
  console.error("Database error:", error);

  if (error instanceof Error) {
    if (error.message.includes("duplicate key")) {
      return "Resource already exists";
    }
    if (error.message.includes("foreign key")) {
      return "Referenced resource does not exist";
    }
    if (error.message.includes("not null")) {
      return "Required field missing";
    }
  }

  return "Database operation failed";
}
