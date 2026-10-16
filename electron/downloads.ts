import {
  dialog,
  shell,
  type BrowserWindow,
  type DownloadItem,
  type Session,
} from "electron";
import { basename, extname, isAbsolute, join } from "node:path";
import { existsSync, mkdirSync } from "node:fs";
import { randomUUID } from "node:crypto";
import type { Download, Settings } from "../shared/browser";
import { isWebUrl } from "../shared/navigation";

export class Downloads {
  private registrations = new Map<
    Session,
    (event: Electron.Event, item: DownloadItem) => void
  >();
  private records = new Map<
    string,
    { data: Download; item?: DownloadItem; path: string }
  >();
  constructor(
    private window: BrowserWindow,
    private settings: () => Settings,
    private changed: () => void,
  ) {}
  snapshot() {
    return [...this.records.values()].map((r) => ({ ...r.data }));
  }
  configure(ses: Session, isPrivate: boolean) {
    if (this.registrations.has(ses)) return;
    const onDownload = (_event: Electron.Event, item: DownloadItem) => {
      const id = randomUUID();
      // Control bytes and reserved Windows filename characters are never valid in a save name.
      let filename =
        basename(item.getFilename())
          // eslint-disable-next-line no-control-regex
          .replace(/[<>:"/\\|?*\x00-\x1f]/g, "_")
          .replace(/[. ]+$/g, "") || "download";
      if (/^(con|prn|aux|nul|com[1-9]|lpt[1-9])(\.|$)/i.test(filename))
        filename = "_" + filename;
      const record = {
        data: {
          id,
          filename,
          sourceUrl: isWebUrl(item.getURL()) ? item.getURL() : undefined,
          active: true,
          received: 0,
          total: item.getTotalBytes(),
          state: "progressing" as Download["state"],
          private: isPrivate,
        },
        item: item as DownloadItem | undefined,
        path: "",
      };
      const settings = this.settings();
      if (
        !settings.askDownloadLocation &&
        isAbsolute(settings.downloadDirectory)
      ) {
        try {
          mkdirSync(settings.downloadDirectory, { recursive: true });
          let path = join(settings.downloadDirectory, filename);
          let i = 1;
          while (
            i < 1000 &&
            (existsSync(path) ||
              [...this.records.values()].some((r) => r.path === path))
          ) {
            path = join(
              settings.downloadDirectory,
              `${basename(filename, extname(filename))} (${i})${extname(filename)}`,
            );
            i++;
          }
          if (
            existsSync(path) ||
            [...this.records.values()].some((r) => r.path === path)
          )
            path = join(
              settings.downloadDirectory,
              `${basename(filename, extname(filename))}-${id.slice(0, 8)}${extname(filename)}`,
            );
          record.path = path;
          item.setSavePath(path);
        } catch {
          // Keep Electron's save dialog when the chosen folder cannot be created.
        }
      }
      this.records.set(id, record);
      let lastUpdate = 0;
      item.on("updated", (_event, state) => {
        record.data.received = item.getReceivedBytes();
        record.data.total = item.getTotalBytes();
        record.data.state = item.isPaused()
          ? "paused"
          : state === "interrupted"
            ? "failed"
            : "progressing";
        if (Date.now() - lastUpdate > 200) {
          lastUpdate = Date.now();
          this.changed();
        }
      });
      item.once("done", (_event, state) => {
        record.path = item.getSavePath();
        record.data.received = item.getReceivedBytes();
        record.data.state = state === "interrupted" ? "failed" : state;
        record.data.active = false;
        record.item = undefined;
        this.changed();
      });
      // Bound completed metadata, retaining all active downloads.
      for (const [key, value] of this.records)
        if (this.records.size > 200 && !value.item) this.records.delete(key);
      this.changed();
    };
    this.registrations.set(ses, onDownload);
    ses.on("will-download", onDownload);
  }
  async action(
    id: string,
    action: "cancel" | "open" | "show" | "remove" | "pause" | "resume",
  ) {
    const record = this.records.get(id);
    if (!record) return;
    if (action === "remove") {
      if (record.item)
        throw new Error("Cancel this download before removing its entry.");
      this.records.delete(id);
      this.changed();
      return;
    }
    if (action === "pause") {
      if (!record.item || record.item.isPaused()) return;
      try {
        record.item.pause();
      } catch {
        throw new Error("This download cannot be paused.");
      }
      record.data.state = "paused";
      this.changed();
      return;
    }
    if (action === "resume") {
      if (!record.item) return;
      try {
        record.item.resume();
      } catch {
        throw new Error("This download cannot be resumed.");
      }
      record.data.state = "progressing";
      record.data.active = true;
      this.changed();
      return;
    }
    if (action === "cancel") {
      record.item?.cancel();
      return;
    }
    if (
      record.data.state !== "completed" ||
      !record.path ||
      !existsSync(record.path)
    )
      return;
    if (action === "show") {
      shell.showItemInFolder(record.path);
      return;
    }
    // Only document/media formats can be opened; executable/script formats remain folder-only.
    if (
      !/\.(pdf|txt|png|jpg|jpeg|gif|webp|mp3|mp4|wav|ogg)$/i.test(record.path)
    )
      throw new Error(
        "Use Show in folder to inspect this file before opening it.",
      );
    const result = await dialog.showMessageBox(this.window, {
      type: "question",
      message: `Open ${record.data.filename}?`,
      detail: "This will open the downloaded file in its default application.",
      buttons: ["Cancel", "Open"],
      defaultId: 0,
      cancelId: 0,
    });
    if (result.response === 1) {
      const error = await shell.openPath(record.path);
      if (error) throw new Error(error);
    }
  }
  clearPrivate() {
    for (const [id, record] of this.records)
      if (record.data.private) {
        record.item?.cancel();
        this.records.delete(id);
      }
    this.changed();
  }
  cancelAll() {
    for (const record of this.records.values()) record.item?.cancel();
  }
  dispose() {
    this.cancelAll();
    for (const [ses, listener] of this.registrations)
      ses.removeListener("will-download", listener);
    this.registrations.clear();
  }
}
