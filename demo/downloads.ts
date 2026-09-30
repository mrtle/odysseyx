/**
 * Inside a claude.ai Artifact the page can't start downloads itself; the
 * viewer's `downloads` capability saves files after the viewer confirms.
 * The app's exports (progress backup, shot-list CSV) create a Blob URL and
 * click a download link, so this routes exactly those clicks through the
 * capability, and falls back to a normal download anywhere else.
 */

interface DownloadsCapability {
  save(request: { filename: string; data: Blob }): Promise<{ status: "saved" | "delivered" }>;
}

interface ClaudeHost {
  use(name: "downloads"): Promise<DownloadsCapability | null>;
}

let downloads: Promise<DownloadsCapability | null> | null = null;

function hostDownloads(): Promise<DownloadsCapability | null> {
  const host = (window as unknown as { claude?: ClaudeHost }).claude;
  if (!host?.use) return Promise.resolve(null);
  downloads ??= host.use("downloads").catch(() => null);
  return downloads;
}

export function installDownloads() {
  const blobs = new Map<string, Blob>();
  const createObjectURL = URL.createObjectURL.bind(URL);
  URL.createObjectURL = (obj: Blob | MediaSource) => {
    const url = createObjectURL(obj);
    if (obj instanceof Blob) {
      blobs.set(url, obj);
      if (blobs.size > 20) blobs.delete(blobs.keys().next().value as string);
    }
    return url;
  };

  const click = HTMLAnchorElement.prototype.click;
  HTMLAnchorElement.prototype.click = function (this: HTMLAnchorElement) {
    const blob = this.hasAttribute("download") ? blobs.get(this.href) : undefined;
    if (!blob) return click.call(this);
    const filename = this.download || "odysseusx-download";
    void hostDownloads().then(async (capability) => {
      if (!capability) {
        // Not in an Artifact viewer: a normal download works.
        const link = document.createElement("a");
        link.href = createObjectURL(blob);
        link.download = filename;
        click.call(link);
        setTimeout(() => URL.revokeObjectURL(link.href), 10_000);
        return;
      }
      try {
        await capability.save({ filename, data: blob });
      } catch (err) {
        // "declined" is the viewer's choice; anything else is logged for debugging.
        if ((err as { code?: string })?.code !== "declined") console.warn("[odysseusx demo] save failed", err);
      }
    });
  };
}
