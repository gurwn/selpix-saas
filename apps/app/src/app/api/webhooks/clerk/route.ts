import { Webhook } from "svix";
import { WebhookEvent } from "@clerk/nextjs/server";
import { headers } from "next/headers";
import { prisma } from "@myapp/prisma";
import { assert, cuid2, isEmptyStringOrNil } from "@myapp/utils";

export async function POST(req: Request) {
  try {
    const secret = process.env.CLERK_WEBHOOK_SIGNING_SECRET;
    if (isEmptyStringOrNil(secret)) {
      return new Response("Missing secret", { status: 500 });
    }

    const wh = new Webhook(secret);
    const body = await req.text();
    const headerPayload = await headers();

    const event = wh.verify(body, {
      "svix-id": headerPayload.get("svix-id")!,
      "svix-timestamp": headerPayload.get("svix-timestamp")!,
      "svix-signature": headerPayload.get("svix-signature")!,
    }) as WebhookEvent;

    if (event.type === "user.created") {
      const { id: clerkId, username, email_addresses } = event.data;
      const firstEmailAddress = email_addresses[0]?.email_address;

      // username is optional in our DB/Schema
      // assert(!isEmptyStringOrNil(username), "username is required");
      assert(!isEmptyStringOrNil(firstEmailAddress), "email is required");

      const existingUser = await prisma.user.findUnique({ where: { clerkId } });
      if (existingUser) {
        return new Response("User already exists", { status: 200 });
      }

      await prisma.user.create({
        data: {
          id: `usr_${cuid2()}`,
          clerkId,
          username,
          email: firstEmailAddress,
        },
      });
    } else if (event.type === "user.deleted") {
      const { id } = event.data;
      // TODO: soft delete
      await prisma.user.delete({ where: { clerkId: id } });
    }

    return new Response("OK");
  } catch (err) {
    console.error("Webhook Error:", err);
    return new Response(`Error: ${err instanceof Error ? err.message : "Unknown error"}`, { status: 500 });
  }
}
