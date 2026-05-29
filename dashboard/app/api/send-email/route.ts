import { NextRequest, NextResponse } from "next/server";

interface SendEmailRequest {
  to: string;
  subject: string;
  body: string;
  accessToken: string;
  refreshToken: string;
}

async function refreshAccessToken(refreshToken: string): Promise<string | null> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id: process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type: "refresh_token",
    }),
  });

  if (!res.ok) return null;
  const data = await res.json();
  return data.access_token || null;
}

function buildRawEmail(to: string, from: string, subject: string, body: string): string {
  const email = [
    `To: ${to}`,
    `From: ${from}`,
    `Subject: ${subject}`,
    "MIME-Version: 1.0",
    "Content-Type: text/html; charset=utf-8",
    "",
    body,
  ].join("\r\n");

  // Base64url encode
  return Buffer.from(email).toString("base64").replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export async function POST(req: NextRequest) {
  try {
    const { to, subject, body, accessToken, refreshToken }: SendEmailRequest = await req.json();

    if (!to || !subject || !body) {
      return NextResponse.json({ error: "Missing required fields: to, subject, body" }, { status: 400 });
    }

    if (!accessToken && !refreshToken) {
      return NextResponse.json({ error: "No Gmail credentials found. Please connect Gmail first." }, { status: 401 });
    }

    // Try with existing access token first, then refresh if it fails
    let token = accessToken;

    const trySend = async (authToken: string) => {
      // First get the sender's email
      const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const userInfo = userRes.ok ? await userRes.json() : {};
      const fromEmail = userInfo.email || "me";

      const rawEmail = buildRawEmail(to, fromEmail, subject, body);

      return fetch("https://gmail.googleapis.com/gmail/v1/users/me/messages/send", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${authToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ raw: rawEmail }),
      });
    };

    let sendRes = await trySend(token);

    // If 401 (expired), try refreshing the token
    if (sendRes.status === 401 && refreshToken) {
      const newToken = await refreshAccessToken(refreshToken);
      if (!newToken) {
        return NextResponse.json(
          { error: "Access token expired and refresh failed. Please reconnect Gmail." },
          { status: 401 }
        );
      }
      token = newToken;
      sendRes = await trySend(token);
    }

    if (!sendRes.ok) {
      const errData = await sendRes.json();
      return NextResponse.json(
        { error: errData?.error?.message || "Failed to send email" },
        { status: sendRes.status }
      );
    }

    const result = await sendRes.json();
    return NextResponse.json({
      success: true,
      messageId: result.id,
      newAccessToken: token !== accessToken ? token : undefined, // return new token if refreshed
    });
  } catch (err: any) {
    console.error("[Send Email]", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
