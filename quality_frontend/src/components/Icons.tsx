import React from "react";

type IconProps = {
  size?: number;
  className?: string;
  title?: string;
};

/**
 * Small inline SVG icon set (no external dependency).
 * Keep these intentionally minimal so they can be reused across pages.
 */

function baseProps({ size = 18, title }: IconProps) {
  return {
    width: size,
    height: size,
    viewBox: "0 0 24 24",
    role: title ? "img" : "presentation",
    "aria-hidden": title ? undefined : true,
    "aria-label": title ? title : undefined
  } as const;
}

// PUBLIC_INTERFACE
export function IconPlus(props: IconProps) {
  /** Plus icon for primary create actions. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 5v14" />
      <path d="M5 12h14" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconTrash(props: IconProps) {
  /** Trash icon for destructive actions. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M3 6h18" />
      <path d="M8 6V4h8v2" />
      <path d="M19 6l-1 16H6L5 6" />
      <path d="M10 11v6" />
      <path d="M14 11v6" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconDownload(props: IconProps) {
  /** Download icon for export actions. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 3v11" />
      <path d="M8 10l4 4 4-4" />
      <path d="M4 20h16" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconUpload(props: IconProps) {
  /** Upload icon for import actions. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 21V10" />
      <path d="M8 13l4-4 4 4" />
      <path d="M4 4h16" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconArrowLeft(props: IconProps) {
  /** Left arrow icon for back navigation. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M15 18l-6-6 6-6" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconChart(props: IconProps) {
  /** Simple chart icon. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M4 19V5" />
      <path d="M4 19h16" />
      <path d="M8 16v-5" />
      <path d="M12 16V8" />
      <path d="M16 16v-8" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconClipboardList(props: IconProps) {
  /** Clipboard/list icon for dashboard/defects. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M9 5h6" />
      <path d="M9 3h6a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H9a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2z" />
      <path d="M9 9h6" />
      <path d="M9 13h6" />
      <path d="M9 17h6" />
    </svg>
  );
}

// PUBLIC_INTERFACE
export function IconAlertTriangle(props: IconProps) {
  /** Alert triangle icon. */
  return (
    <svg {...baseProps(props)} className={props.className} fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <path d="M12 9v4" />
      <path d="M12 17h.01" />
      <path d="M10.3 4.2a2 2 0 0 1 3.4 0l7.1 12.3A2 2 0 0 1 19.1 20H4.9a2 2 0 0 1-1.7-3.5l7.1-12.3z" />
    </svg>
  );
}
