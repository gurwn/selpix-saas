
import { db } from "@myapp/prisma";
import { NextResponse } from "next/server";
import { z } from "zod";
import { resend } from "@/lib/resend";

const PreOrderSchema = z.object({
  email: z.string().email(),
  source: z.string().optional(),
  referralSource: z.string().optional(),
  referralSourceDetail: z.string().optional(),
  reason: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { email, source, referralSource, referralSourceDetail, reason } = PreOrderSchema.parse(body);

    const existing = await db.preOrder.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "이미 신청된 이메일입니다." },
        { status: 409 }
      );
    }

    const preOrder = await db.preOrder.create({
      data: {
        email,
        source: source || "landing_page",
        referralSource,
        referralSourceDetail,
        reason,
      },
    });

    // Send confirmation email
    try {
      if (process.env.RESEND_API_KEY) {
        console.log(`Using API Key: ${process.env.RESEND_API_KEY.slice(0, 5)}... (Length: ${process.env.RESEND_API_KEY.length})`);
        const emailResponse = await resend.emails.send({
          from: 'Selpix <noreply@notify.selpix.io>',
          to: [email],
          subject: '설픽스(Selpix) 사전예약이 완료되었습니다!',
          html: `
            <h1>사전예약이 완료되었습니다!</h1>
            <p>안녕하세요,</p>
            <p>설픽스(Selpix) 사전예약에 참여해주셔서 진심으로 감사드립니다.</p>
            <p>서비스가 준비되는 대로 가장 먼저 소식을 전해드리겠습니다.</p>
            <br/>
            <p>감사합니다.</p>
            <p>설픽스 팀 드림</p>
          `,
          text: `설픽스(Selpix) 사전예약이 완료되었습니다! 안녕하세요, 설픽스(Selpix) 사전예약에 참여해주셔서 진심으로 감사드립니다. 서비스가 준비되는 대로 가장 먼저 소식을 전해드리겠습니다. 감사합니다. 설픽스 팀 드림`
        });
        console.log("Email sent successfully:", emailResponse);
      } else {
        console.warn("RESEND_API_KEY is missing. Email skipped.");
      }
    } catch (emailError) {
      console.error("Failed to send email Detailed Error:", emailError);
      // We don't fail the request if email fails, but log it.
    }

    return NextResponse.json(preOrder, { status: 201 });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: "유효하지 않은 데이터입니다." },
        { status: 400 }
      );
    }
    console.error(error);
    return NextResponse.json(
      { error: "서버 오류가 발생했습니다." },
      { status: 500 }
    );
  }
}
