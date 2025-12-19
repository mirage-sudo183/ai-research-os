import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const url = request.nextUrl.searchParams.get("url");

  if (!url) {
    return NextResponse.json({ error: "URL parameter required" }, { status: 400 });
  }

  // Validate URL is from arXiv
  if (!url.includes("arxiv.org")) {
    return NextResponse.json({ error: "Only arXiv URLs allowed" }, { status: 400 });
  }

  try {
    console.log(`[PDF Proxy] Fetching: ${url}`);

    const response = await fetch(url, {
      headers: {
        "User-Agent": "AI-Research-OS/1.0 (research tool)",
      },
    });

    if (!response.ok) {
      return NextResponse.json(
        { error: `Failed to fetch PDF: ${response.status}` },
        { status: response.status }
      );
    }

    const contentType = response.headers.get("content-type");
    const contentLength = response.headers.get("content-length");
    const pdfBuffer = await response.arrayBuffer();

    return new NextResponse(pdfBuffer, {
      headers: {
        "Content-Type": contentType || "application/pdf",
        "Content-Length": contentLength || String(pdfBuffer.byteLength),
        "Cache-Control": "public, max-age=86400", // Cache for 1 day
      },
    });
  } catch (error) {
    console.error("[PDF Proxy] Error:", error);
    return NextResponse.json(
      { error: "Failed to fetch PDF" },
      { status: 500 }
    );
  }
}

