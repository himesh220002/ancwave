import { NextRequest, NextResponse } from "next/server";
import { verifyJWT } from "@/lib/auth";
import { generateS3PresignedUrl } from "@/lib/aws-services";

export async function POST(req: NextRequest) {
  try {
    // 1. Verify user session via JWT
    const cookieToken = req.cookies.get("ancwave_token")?.value;
    const authHeader = req.headers.get("authorization");
    const token = authHeader?.replace("Bearer ", "") || cookieToken;

    if (!token) {
      return NextResponse.json(
        { success: false, error: "Authentication required to upload media" },
        { status: 401 }
      );
    }

    const payload = verifyJWT(token);
    if (!payload) {
      return NextResponse.json(
        { success: false, error: "Invalid or expired session" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { fileName, contentType, folder = "reviews" } = body;

    if (!fileName || !contentType) {
      return NextResponse.json(
        { success: false, error: "fileName and contentType are required" },
        { status: 400 }
      );
    }

    // Strict image content-type check
    const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/avif", "image/gif"];
    if (!allowedTypes.includes(contentType.toLowerCase())) {
      return NextResponse.json(
        { success: false, error: "Only image files (JPEG, PNG, WebP, AVIF) are accepted" },
        { status: 400 }
      );
    }

    // Generate AWS S3 Presigned URL
    const presigned = await generateS3PresignedUrl(fileName, contentType, folder);

    return NextResponse.json({
      success: true,
      ...presigned,
      expiresInSeconds: 900,
    });
  } catch (error) {
    console.error("Presigned URL generation error:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
