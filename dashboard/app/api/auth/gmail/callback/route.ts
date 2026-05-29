import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error || !code) {
    // User denied or something went wrong — redirect to integrations with error
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integrations?gmail_error=${error || "no_code"}`
    );
  }

  const clientId = process.env.GOOGLE_CLIENT_ID!;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL}/api/auth/gmail/callback`;

  // Exchange the authorization code for tokens
  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: "authorization_code",
    }),
  });

  if (!tokenRes.ok) {
    const errText = await tokenRes.text();
    console.error("[Gmail OAuth] Token exchange failed:", errText);
    return NextResponse.redirect(
      `${process.env.NEXT_PUBLIC_BASE_URL}/integrations?gmail_error=token_exchange_failed`
    );
  }

  const tokens = await tokenRes.json();
  const { access_token, refresh_token } = tokens;

  // Fetch the user's Gmail address using the access token
  const userRes = await fetch("https://www.googleapis.com/oauth2/v2/userinfo", {
    headers: { Authorization: `Bearer ${access_token}` },
  });

  const userInfo = userRes.ok ? await userRes.json() : {};
  const email = userInfo.email || "unknown@gmail.com";
  const name = userInfo.name || email;
  const picture = userInfo.picture || "";

  // Encode the token data to pass back to the client via query params
  // The client will store this in localStorage
  const tokenData = encodeURIComponent(
    JSON.stringify({
      email,
      name,
      picture,
      access_token,
      refresh_token,
      connected_at: new Date().toISOString(),
    })
  );

  // Redirect back to integrations page with token data
  return NextResponse.redirect(
    `${process.env.NEXT_PUBLIC_BASE_URL}/integrations?gmail_success=1&gmail_data=${tokenData}`
  );
}
