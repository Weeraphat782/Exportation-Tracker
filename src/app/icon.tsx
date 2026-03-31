import { ImageResponse } from "next/og";
import { readFile } from "node:fs/promises";
import { join } from "node:path";

export const runtime = "nodejs";

export const size = { width: 48, height: 48 };
export const contentType = "image/png";

export default async function Icon() {
  const file = await readFile(
    join(process.cwd(), "public", "logo", "OMG-LOGO-Color.png"),
  );
  const src = `data:image/png;base64,${file.toString("base64")}`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#ffffff",
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element -- ImageResponse runtime */}
        <img src={src} alt="" width={40} height={18} />
      </div>
    ),
    { ...size },
  );
}
