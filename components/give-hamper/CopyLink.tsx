"use client";
import { useRef, useState } from "react";
import { Check, Copy } from "lucide-react";

// Teams and Outlook in-app browsers often block the Clipboard API, so fall back to a hidden textarea.
async function copyText(text: string) {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    const area = document.createElement("textarea");
    area.value = text;
    area.setAttribute("readonly", "");
    area.style.position = "fixed";
    area.style.opacity = "0";
    document.body.appendChild(area);
    area.select();
    const copied = document.execCommand("copy");
    area.remove();
    return copied;
  }
}

export function CopyLink({ url }: { url: string }) {
  const [status, setStatus] = useState<"idle" | "copied" | "failed">("idle");
  const linkRef = useRef<HTMLInputElement>(null);

  async function onCopy() {
    const copied = await copyText(url);
    setStatus(copied ? "copied" : "failed");
    if (!copied) linkRef.current?.select();
    window.setTimeout(() => setStatus("idle"), 2500);
  }

  return (
    <div>
      <div className="flex items-stretch gap-2 rounded-xl border border-gray-200 bg-gray-50 p-2">
        <input
          ref={linkRef}
          readOnly
          value={url}
          aria-label="Benevity link"
          onFocus={(event) => event.currentTarget.select()}
          className="min-w-0 flex-1 bg-transparent px-2 font-mono text-xs text-gray-700 outline-none"
        />
        <button
          type="button"
          onClick={onCopy}
          className="inline-flex shrink-0 items-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-semibold text-blue-700 shadow-sm ring-1 ring-gray-200 hover:bg-blue-50"
        >
          {status === "copied" ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
          {status === "copied" ? "Copied" : "Copy"}
        </button>
      </div>
      <p role="status" className="mt-1.5 min-h-4 text-xs text-gray-500">
        {status === "failed" ? "Copy was blocked. The link is selected, so long-press or press Ctrl+C to copy it." : ""}
      </p>
    </div>
  );
}
