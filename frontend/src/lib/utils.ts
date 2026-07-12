import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats an ISO timestamp as "2 min ago" / "3 hrs ago" / "Never" (null/undefined input). */
export function formatRelativeTime(isoDate: string | null | undefined): string {
  if (!isoDate) return "Never"

  const diffMs = Date.now() - new Date(isoDate).getTime()
  if (diffMs < 0) return "Just now"

  const minutes = Math.floor(diffMs / 60000)
  if (minutes < 1) return "Just now"
  if (minutes < 60) return `${minutes} min ago`

  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours} hr${hours === 1 ? "" : "s"} ago`

  const days = Math.floor(hours / 24)
  return `${days} day${days === 1 ? "" : "s"} ago`
}

/** Two-letter initials from a full name, e.g. "Jane Doe" -> "JD". */
export function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return "?"
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase()
}

/**
 * Cloudinary "raw" resource URLs (PDF/DOCX) are stored without a file extension,
 * so a plain <a href> download saves an extensionless file the OS can't open
 * (Cloudinary's `fl_attachment:<filename>` transformation can't help either —
 * it rejects any dot in the filename value). Fetching the file as a blob and
 * triggering a client-side save lets us force the correct filename/extension
 * regardless of what Cloudinary reports. Cloudinary serves `Access-Control-
 * Allow-Origin: *`, so the cross-origin fetch is not blocked by CORS.
 */
export async function downloadResourceFile(fileUrl: string, fileName: string): Promise<void> {
  const response = await fetch(fileUrl)
  if (!response.ok) throw new Error("Failed to download file.")
  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const link = document.createElement("a")
  link.href = objectUrl
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(objectUrl)
}
