
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
          subject: '셀픽스 사전예약 명단에 등록되었습니다.',
          html: `
            <p>안녕하세요.</p>
            <br/>
            <p>셀픽스 사전예약 명단에 등록되었습니다.<br/>
            아직 공개되지 않은 상태지만, 현재 내부에서 실제 운영 기준으로 테스트 중입니다.</p>
            <br/>
            <p>셀픽스는<br/>
            “더 많이 파는 도구”보다<br/>
            <strong>“괜히 등록했다가 손해 보지 않게 하는 도구”</strong>에 가깝습니다.</p>
            <br/>
            <p>그래서</p>
            <ul style="list-style-type: none; padding-left: 0;">
              <li>- 과장된 기능 설명 대신</li>
              <li>- 실제 셀러가 쓰는 계산 방식과</li>
              <li>- 현실적인 자동화부터 만들고 있습니다.</li>
            </ul>
            <br/>
            <p>사전예약자는<br/>
            👉 가장 먼저 써보고<br/>
            👉 가장 먼저 바꿀 수 있는 사람입니다.</p>
            <br/>
            <p>베타 오픈 전,<br/>
            한 번 더 메일을 드리겠습니다.</p>
          `,
          text: `안녕하세요.\n\n셀픽스 사전예약 명단에 등록되었습니다.\n아직 공개되지 않은 상태지만, 현재 내부에서 실제 운영 기준으로 테스트 중입니다.\n\n셀픽스는\n“더 많이 파는 도구”보다\n“괜히 등록했다가 손해 보지 않게 하는 도구”에 가깝습니다.\n\n그래서\n- 과장된 기능 설명 대신\n- 실제 셀러가 쓰는 계산 방식과\n- 현실적인 자동화부터 만들고 있습니다.\n\n사전예약자는\n👉 가장 먼저 써보고\n👉 가장 먼저 바꿀 수 있는 사람입니다.\n\n베타 오픈 전,\n한 번 더 메일을 드리겠습니다.`
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
