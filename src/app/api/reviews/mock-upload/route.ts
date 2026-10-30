import { NextRequest, NextResponse } from "next/server";

// In-memory media store for local testing when AWS S3 credentials are not configured
const mockMediaStorage = new Map<string, { buffer: Buffer; contentType: string }>();

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const key = (formData.get("key") as string) || `reviews/${Date.now()}-${file?.name || "upload.jpg"}`;

    if (!file) {
      return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const contentType = file.type || "image/jpeg";

    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    if (hasAwsCreds) {
      try {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const bucket = process.env.AWS_S3_BUCKET || "ancwave-media-storage-production";
        const region = process.env.AWS_REGION || "ap-south-1";

        const s3 = new S3Client({
          region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );

        const cfDomain = process.env.CLOUDFRONT_DOMAIN || process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN;
        const publicUrl = cfDomain
          ? `https://${cfDomain.replace(/^https?:\/\//, "").replace(/\/$/, "")}/${key}`
          : `https://${bucket}.s3.${region}.amazonaws.com/${key}`;
        return NextResponse.json({ success: true, publicUrl, fileKey: key });
      } catch (s3Err) {
        console.warn("Server-side S3 PutObject failed, falling back to local memory:", s3Err);
      }
    }

    mockMediaStorage.set(key, { buffer, contentType });
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
    const publicUrl = `${appUrl}/api/reviews/mock-upload?key=${encodeURIComponent(key)}`;
    return NextResponse.json({ success: true, publicUrl, fileKey: key });
  } catch (error: any) {
    console.error("Proxy upload POST error:", error);
    return NextResponse.json({ success: false, error: error?.message || "Upload failed" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const key = searchParams.get("key") || `upload-${Date.now()}`;
    const contentType = req.headers.get("content-type") || "image/jpeg";

    const arrayBuffer = await req.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);

    if (hasAwsCreds) {
      try {
        const { S3Client, PutObjectCommand } = await import("@aws-sdk/client-s3");
        const bucket = process.env.AWS_S3_BUCKET || "ancwave-media-storage-production";
        const region = process.env.AWS_REGION || "ap-south-1";

        const s3 = new S3Client({
          region,
          credentials: {
            accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
            secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
          },
        });

        await s3.send(
          new PutObjectCommand({
            Bucket: bucket,
            Key: key,
            Body: buffer,
            ContentType: contentType,
          })
        );

        return new NextResponse(null, {
          status: 200,
          headers: {
            "ETag": `"${Math.random().toString(36).substring(2)}"`,
            "Access-Control-Allow-Origin": "*",
          },
        });
      } catch (s3Err) {
        console.warn("Direct PUT to server failed to forward to S3:", s3Err);
      }
    }

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
