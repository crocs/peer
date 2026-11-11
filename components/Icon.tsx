import type { CSSProperties } from "react";

const paths = {
  settings: (
    <>
      <path d="M12 8a4 4 0 1 0 0 8 4 4 0 0 0 0-8Z" />
      <path d="m9 3 1-1h4l1 3 3 1 2-1 2 4-2 2v3l2 2-2 4-3-1-2 1-1 3h-4l-1-3-3-1-2 1-2-4 2-2v-3L2 9l2-4 3 1Z" />
    </>
  ),
  eye: (
    <>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7S2 12 2 12Z" />
      <circle cx="12" cy="12" r="3" />
    </>
  ),
  shield: (
    <>
      <path d="m12 3 8 3v6c0 4-4 7-8 9-4-2-8-5-8-9V6Z" />
      <path d="m8.5 12 2.5 2.5 4.5-5" />
    </>
  ),
  spark: (
    <>
      <path d="m12 2 2.8 7.2L22 12l-7.2 2.8L12 22l-2.8-7.2L2 12l7.2-2.8Z" />
    </>
  ),
  chevron: <path d="m9 5 7 7-7 7" />,
  arrow: (
    <>
      <path d="M5 12h14m-5-5 5 5-5 5" />
    </>
  ),
  external: (
    <>
      <path d="M14 3h7v7M21 3 10 14" />
      <path d="M10 3H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5" />
    </>
  ),
  close: <path d="m6 6 12 12M6 18 18 6" />,
  check: <path d="m5 12 4 4L19 6" />,
  pause: (
    <>
      <path d="M8 5v14M16 5v14" />
    </>
  ),
  refresh: (
    <>
      <path d="M20 7v5h-5" />
      <path d="M19.5 12a8 8 0 1 0-1.8 5.2" />
    </>
  ),
  history: (
    <>
      <path d="M3 3v6h6" />
      <path d="M3.5 9a9 9 0 1 1 .5 8" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  trash: (
    <>
      <path d="M3 6h18M9 6V3h6v3M5 6l1 15h12l1-15M10 10v7M14 10v7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7h.01" />
    </>
  ),
  lock: (
    <>
      <rect x="5" y="10" width="14" height="11" rx="3" />
      <path d="M8 10V7a4 4 0 0 1 8 0v3M12 14v3" />
    </>
  ),
  globe: (
    <>
      <circle cx="12" cy="12" r="9" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
      <path d="M3 12h18" />
    </>
  ),
};

export function Icon({
  name,
  size = 18,
  className = "",
}: {
  name: keyof typeof paths;
  size?: number;
  className?: string;
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

export function Eyes({
  className = "",
  closed = false,
}: {
  className?: string;
  closed?: boolean;
}) {
  return (
    <span
      className={`eyes-logo ${closed ? "eyes-closed" : ""} ${className}`}
      aria-hidden="true"
    >
      <i>
        <b />
      </i>
      <i>
        <b />
      </i>
    </span>
  );
}

export function BrandMark({
  id,
  size = 36,
  name,
}: {
  id: string;
  mark?: string;
  color?: string;
  size?: number;
  name?: string;
}) {
  return (
    <span
      className="brand-mark"
      aria-label={name}
      style={
        {
          width: size,
          height: size,
        } as CSSProperties
      }
    >
      {id === "other" ? (
        <Icon name="globe" size={Math.round(size * 0.5)} />
      ) : (
        <img
          src={chrome.runtime.getURL(`/brands/${id}.svg`)}
          width={Math.round(size * 0.62)}
          height={Math.round(size * 0.62)}
          alt=""
        />
      )}
    </span>
  );
}
