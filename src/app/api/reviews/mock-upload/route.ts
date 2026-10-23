import { NextRequest, NextResponse } from "next/server";

// In-memory media store for local testing when AWS S3 credentials are not yet configured
const mockMediaStorage = new Map<string, { buffer: Buffer; contentType: string }>();

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || `upload-${Date.now()}`;
    const contentType = req.headers.get("content-type") || "image/jpeg";

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    mockMediaStorage.set(key, { buffer, contentType });

    // Respond with 200 OK just like AWS S3 PutObject
    return new NextResponse(null, {
      status: 200,
      headers: {
        "ETag": `"${Math.random().toString(36).substring(2)}"`,
        "Access-Control-Allow-Origin": "*",
      },
    });
  } catch (error) {
    console.error("Mock S3 PUT error:", error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key");

    if (!key || !mockMediaStorage.has(key)) {
      // Fallback to sample image if not stored
      return NextResponse.redirect(new URL("/images/lifestyle-cafe.jpg", req.url));
    }

    const item = mockMediaStorage.get(key)!;
    return new NextResponse(new Uint8Array(item.buffer), {
      status: 200,
      headers: {
        "Content-Type": item.contentType,
        "Cache-Control": "public, max-age=86400",
      },
    });
  } catch {
    return NextResponse.redirect(new URL("/images/hero-silver.jpg", req.url));
  }
}
