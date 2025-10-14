import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

const handler = toNextJsHandler(auth);

// CORS configuration - allow all origins during development
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:3001",
  "http://127.0.0.1:3000",
];

function setCorsHeaders(response: Response, origin?: string) {
  const headers = new Headers(response.headers);

  // If origin is in allowed list, use it; otherwise use wildcard
  const allowOrigin = origin && allowedOrigins.includes(origin) ? origin : "*";

  headers.set("Access-Control-Allow-Origin", allowOrigin);
  headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Requested-With");

  if (allowOrigin !== "*") {
    headers.set("Access-Control-Allow-Credentials", "true");
  }

  return headers;
}

// Handle OPTIONS preflight requests
export async function OPTIONS(request: NextRequest) {
  const origin = request.headers.get("origin");
  const headers = setCorsHeaders(new Response(), origin || undefined);

  return new NextResponse(null, {
    status: 204,
    headers,
  });
}

// Wrap GET handler with CORS headers
export async function GET(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const response = await handler.GET(request);
    const headers = setCorsHeaders(response, origin || undefined);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Auth GET error:", error);
    const origin = request.headers.get("origin");
    const headers = setCorsHeaders(new Response(), origin || undefined);

    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers,
      }
    );
  }
}

// Wrap POST handler with CORS headers
export async function POST(request: NextRequest) {
  try {
    const origin = request.headers.get("origin");
    const response = await handler.POST(request);
    const headers = setCorsHeaders(response, origin || undefined);

    return new NextResponse(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  } catch (error) {
    console.error("Auth POST error:", error);
    const origin = request.headers.get("origin");
    const headers = setCorsHeaders(new Response(), origin || undefined);

    return new NextResponse(
      JSON.stringify({ error: "Internal server error" }),
      {
        status: 500,
        headers,
      }
    );
  }
}
