import { NextResponse } from "next/server";
import fs from "fs";
import { execSync } from "child_process";

export async function GET() {
  const originalPath = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\ed6d257c-8ed6-41c6-b5e3-6177fa78ee8a\\media__1781761978046.png";
  const transparentPath = "C:\\Users\\Admin\\.gemini\\antigravity-ide\\brain\\ed6d257c-8ed6-41c6-b5e3-6177fa78ee8a\\pots-transparent-v2.png";
  const scriptPath = "b:\\FPT\\JOB\\Web\\Bình Gốm Thanh Hà\\apps\\web\\src\\app\\api\\pots-image\\remove_bg.py";

  try {
    // Check if transparent image already exists
    if (!fs.existsSync(transparentPath)) {
      console.log("Generating transparent image v2 via Python PIL...");
      try {
        // Run Python background removal script
        execSync(`python "${scriptPath}"`, { stdio: "inherit" });
      } catch (execError) {
        console.error("Failed to run python background removal, falling back to original image", execError);
        // If Python fail (e.g. PIL not installed), serve original image
        const buffer = fs.readFileSync(originalPath);
        return new NextResponse(buffer, {
          headers: {
            "Content-Type": "image/png",
            "Cache-Control": "public, max-age=31536000, immutable",
          },
        });
      }
    }

    // Serve transparent image
    const buffer = fs.readFileSync(transparentPath);
    return new NextResponse(buffer, {
      headers: {
        "Content-Type": "image/png",
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    });
  } catch (error) {
    console.error("Failed to serve image", error);
    return NextResponse.json({ error: "Failed to load image" }, { status: 500 });
  }
}
