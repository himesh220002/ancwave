import { NextRequest, NextResponse } from "next/server";
import { invalidateCloudFrontCache } from "@/lib/aws-services";
import { revalidatePath } from "next/cache";

export async function POST(req: NextRequest) {
  try {
    const { paths = ["/*"] } = await req.json().catch(() => ({ paths: ["/*"] }));
    const result = await invalidateCloudFrontCache(paths);

    try {
      revalidatePath("/");
    } catch {
      // ignore
    }

    return NextResponse.json({
      success: true,
      invalidationId: result.invalidationId,
      status: result.status,
      paths,
      message: `CloudFront edge cache invalidation requested for paths [${paths.join(", ")}]. Next.js ISR cache also purged.`,
    });
  } catch (error) {
    console.error("Error in /api/aws/cloudfront-invalidate:", error);
    return NextResponse.json(
      { success: false, error: "Failed to create CloudFront invalidation" },
      { status: 500 }
    );
  }
}
