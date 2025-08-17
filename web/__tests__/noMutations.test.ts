import { describe, it, expect } from "vitest";
import fs from "fs";
import path from "path";

const root = path.join(process.cwd(), "web");
const targets = [
  path.join(root, "app/baskets/[id]"),
  path.join(root, "components/basket"),
];

function getFiles(dir: string): string[] {
  const entries = fs.readdirSync(dir, { withFileTypes: true });
  const files: string[] = [];
  for (const entry of entries) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...getFiles(full));
    else if (entry.isFile() && full.endsWith(".tsx")) files.push(full);
  }
  return files;
}

describe("no non-GET fetch", () => {
  for (const file of targets.flatMap(getFiles)) {
    it(path.relative(root, file), () => {
      const content = fs.readFileSync(file, "utf8");
      expect(/fetch\([^)]*{[^}]*method\s*:\s*['"](POST|PATCH|PUT|DELETE)/.test(content)).toBe(
        false
      );
    });
  }
});
