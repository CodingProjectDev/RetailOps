import { NextRequest, NextResponse } from "next/server";

const API_URL =
  process.env.GRAPHQL_API_URL ??
  "http://localhost:4000/graphql";

async function proxy(request: NextRequest) {
  const body =
    request.method === "GET"
      ? undefined
      : await request.text();

  const headers = new Headers();

  const contentType =
    request.headers.get("content-type");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  const cookie =
    request.headers.get("cookie");

  if (cookie) {
    headers.set("cookie", cookie);
  }

  const upstream = await fetch(API_URL, {
    method: request.method,
    headers,
    body,
    cache: "no-store"
  });

  const responseBody =
    await upstream.text();

  const response = new NextResponse(
    responseBody,
    {
      status: upstream.status,
      headers: {
        "content-type":
          upstream.headers.get("content-type") ??
          "application/json"
      }
    }
  );

  const setCookies =
    typeof upstream.headers.getSetCookie === "function"
      ? upstream.headers.getSetCookie()
      : [];

  if (setCookies.length > 0) {
    for (const cookieValue of setCookies) {
      response.headers.append(
        "set-cookie",
        cookieValue
      );
    }
  } else {
    const setCookie =
      upstream.headers.get("set-cookie");

    if (setCookie) {
      response.headers.append(
        "set-cookie",
        setCookie
      );
    }
  }

  return response;
}

export async function POST(
  request: NextRequest
) {
  return proxy(request);
}

export async function GET(
  request: NextRequest
) {
  return proxy(request);
}