import { nativeImage, type Session } from "electron";
import { isWebUrl } from "../shared/navigation";
/** Fetch through the page's own session, never through the privileged renderer's session. */
export async function loadFavicon(
  ses: Session,
  url: string,
  signal: AbortSignal,
): Promise<string | undefined> {
  if (!isWebUrl(url)) return;
  const response = await ses.fetch(url, {
    signal,
    credentials: "omit",
    redirect: "error",
  });
  if (
    !response.ok ||
    !/^image\/(png|jpeg|gif|webp|x-icon|vnd.microsoft.icon)(;|$)/i.test(
      response.headers.get("content-type") || "",
    )
  )
    return;
  const reader = response.body?.getReader();
  if (!reader) return;
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (!signal.aborted) {
      const chunk = await reader.read();
      if (chunk.done) break;
      size += chunk.value.byteLength;
      if (size > 128 * 1024) return;
      chunks.push(chunk.value);
    }
    const icon = nativeImage.createFromBuffer(Buffer.concat(chunks));
    if (!icon.isEmpty())
      return icon.resize({ width: 16, height: 16 }).toDataURL();
  } finally {
    await reader.cancel().catch(() => {});
  }
}
