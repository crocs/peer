import { useState } from "react";
import { Icon } from "./Icon";

export function SiteIcon({ url, size = 28 }: { url: string; size?: number }) {
  const [failedSrc, setFailedSrc] = useState("");
  let src = "";
  if (!import.meta.env.FIREFOX)
    try {
      const favicon = new URL(chrome.runtime.getURL("/_favicon/"));
      favicon.searchParams.set("pageUrl", new URL(url).origin);
      favicon.searchParams.set("size", "32");
      src = favicon.href;
    } catch {
      /* Internal browser pages do not have a website icon. */
    }
  return (
    <span className="site-icon" style={{ width: size, height: size }}>
      {src && failedSrc !== src ? (
        <img
          key={src}
          src={src}
          width={Math.round(size * 0.68)}
          height={Math.round(size * 0.68)}
          alt=""
          onError={() => setFailedSrc(src)}
        />
      ) : (
        <Icon name="globe" size={Math.round(size * 0.56)} />
      )}
    </span>
  );
}
