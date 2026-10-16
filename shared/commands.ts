import type { Command } from "./browser";
/** Validate at the main-process boundary, regardless of the TypeScript caller. */
export function isCommand(value: unknown): value is Command {
  if (!value || typeof value !== "object") return false;
  const c = value as Record<string, unknown>;
  const string = (v: unknown, max = 8192): v is string =>
    typeof v === "string" && v.length <= max;
  switch (c.type) {
    case "new-tab":
      return (
        (c.url === undefined || string(c.url)) &&
        (c.private === undefined || typeof c.private === "boolean")
      );
    case "activate-tab":
    case "close-tab":
    case "remove-bookmark":
    case "remove-quick-link":
      return string(c.id, 100);
    case "navigate":
      return string(c.input);
    case "remove-history":
      return string(c.url);
    case "add-quick-link":
      return string(c.title, 100) && string(c.url);
    case "settings":
      return (
        !!c.settings &&
        typeof c.settings === "object" &&
        !Array.isArray(c.settings)
      );
    case "download":
      return (
        string(c.id, 100) &&
        ["cancel", "open", "show", "remove", "pause", "resume"].includes(
          String(c.action),
        )
      );
    case "window":
      return ["minimize", "maximize", "close"].includes(String(c.action));
    case "viewport": {
      if (
        !c.bounds ||
        typeof c.bounds !== "object" ||
        typeof c.visible !== "boolean"
      )
        return false;
      const b = c.bounds as Record<string, unknown>;
      return ["x", "y", "width", "height"].every(
        (k) =>
          typeof b[k] === "number" &&
          Number.isFinite(b[k]) &&
          (b[k] as number) >= 0 &&
          (b[k] as number) < 100000,
      );
    }
    case "back":
    case "forward":
    case "reload":
    case "stop":
    case "bookmark":
    case "clear-history":
    case "clear-data":
    case "clear-cookies":
    case "open-licenses":
    case "toggle-site-protection":
    case "revoke-permissions":
    case "choose-download-directory":
      return true;
    default:
      return false;
  }
}
