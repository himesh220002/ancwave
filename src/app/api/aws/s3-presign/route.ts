import { NextRequest, NextResponse } from "next/server";
import { generateS3PresignedUrl } from "@/lib/aws-services";

export async function POST(req: NextRequest) {
  try {
    const { fileName, contentType = "image/jpeg" } = await req.json();

    if (!fileName) {
      return NextResponse.json(
        { success: false, error: "fileName is required" },
        { status: 400 }
      );
    }

    const presigned = await generateS3PresignedUrl(fileName, contentType);

    return NextResponse.json({
      success: true,
      data: presigned,
      instructions: "Perform an HTTP PUT request to uploadUrl with file binary and Content-Type header matching contentType.",
    });
  } catch (error) {
    console.error("Error in /api/aws/s3-presign:", error);
    return NextResponse.json(
      { success: false, error: "Failed to generate presigned URL" },
      { status: 500 }
    );
  }
}
