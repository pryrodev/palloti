import { NextRequest, NextResponse } from "next/server";
import { contactMessageSchema } from "@/lib/contactSchema";

function jsonError(message: string, status: number) {
  return NextResponse.json({ error: message }, { status, headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  const host = request.headers.get("host");
  if (origin && host) {
    try {
      if (new URL(origin).host !== host) return jsonError("Invalid request origin", 403);
    } catch {
      return jsonError("Invalid request origin", 403);
    }
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return jsonError("Invalid request body", 400);
  }

  const parsed = contactMessageSchema.safeParse(body);
  if (!parsed.success) return jsonError("Please check the form fields and try again", 400);
  if (parsed.data.website) return NextResponse.json({ ok: true }, { status: 200, headers: { "Cache-Control": "no-store" } });

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.CONTACT_FROM_EMAIL;
  const recipients = process.env.CONTACT_TO_EMAIL?.split(",").map((email) => email.trim()).filter(Boolean);
  if (!apiKey || !from || !recipients?.length) return jsonError("The contact form is not configured yet", 503);

  const { name, email, subject, message } = parsed.data;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: recipients,
        reply_to: email,
        subject: `Website contact: ${subject}`,
        text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject}\n\n${message}`,
      }),
      cache: "no-store",
    });

    if (!response.ok) {
      console.error("Resend contact delivery failed with status", response.status);
      return jsonError("Could not deliver the message", 502);
    }

    return NextResponse.json({ ok: true }, { status: 201, headers: { "Cache-Control": "no-store" } });
  } catch {
    console.error("Resend contact delivery request failed");
    return jsonError("Could not deliver the message", 502);
  }
}
