import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";
import vm from "node:vm";

import {
  buildDownloadModel,
  detectDesktopPlatform,
  formatAssetSize,
  renderDownloadModel,
  selectReleaseAssets,
} from "./release-downloads.mjs";

const asset = (name, size = 10 * 1024 * 1024) => ({
  name,
  size,
  browser_download_url: `https://example.test/${name}`,
});

test("releases before 0.0.36 cannot populate the dual-platform download page", () => {
  const selected = selectReleaseAssets({
    tag_name: "v0.0.35",
    assets: [asset("ZtidalCode_0.0.35_x64-setup.exe")],
  });

  assert.deepEqual(selected, {
    version: "0.0.35",
    supported: false,
    mac: null,
    windows: null,
  });
});

test("0.0.36 chooses Apple Silicon DMG and x64 setup over generic installers", () => {
  const selected = selectReleaseAssets({
    tag_name: "v0.0.36",
    assets: [
      asset("ZtidalCode_0.0.36_universal.dmg"),
      asset("ZtidalCode_0.0.36_aarch64.dmg.sig"),
      asset("ZtidalCode_0.0.36_aarch64.dmg", 12 * 1024 * 1024),
      asset("ZtidalCode_0.0.36_arm64.dmg"),
      asset("ZtidalCode_0.0.36-setup.exe"),
      asset("ZtidalCode_0.0.36_x64-setup.exe.sig"),
      asset("ZtidalCode_0.0.36_x64-setup.exe", 8 * 1024 * 1024),
    ],
  });

  assert.equal(selected.supported, true);
  assert.equal(selected.mac.name, "ZtidalCode_0.0.36_aarch64.dmg");
  assert.equal(selected.windows.name, "ZtidalCode_0.0.36_x64-setup.exe");
});

test("newer releases accept explicit universal and x86_64 assets", () => {
  const selected = selectReleaseAssets({
    tag_name: "0.1.0",
    assets: [
      asset("ZtidalCode_0.1.0_universal.dmg"),
      asset("ZtidalCode_0.1.0_x86_64-setup.exe"),
    ],
  });

  assert.equal(selected.supported, true);
  assert.equal(selected.mac.name, "ZtidalCode_0.1.0_universal.dmg");
  assert.equal(selected.windows.name, "ZtidalCode_0.1.0_x86_64-setup.exe");
});

test("wrong-architecture and stale-version assets fall back instead of guessing", () => {
  const selected = selectReleaseAssets({
    tag_name: "v0.0.37",
    assets: [
      asset("ZtidalCode_0.0.37_x86_64.dmg"),
      asset("ZtidalCode_0.0.36_aarch64.dmg"),
      asset("ZtidalCode_0.0.37_arm64-setup.exe"),
      asset("ZtidalCode_0.0.36_x64-setup.exe"),
    ],
  });

  assert.equal(selected.supported, true);
  assert.equal(selected.mac, null);
  assert.equal(selected.windows, null);
});

test("desktop platform detection supports modern and legacy browser signals", () => {
  assert.equal(
    detectDesktopPlatform({ userAgentData: { platform: "macOS" } }),
    "macos",
  );
  assert.equal(
    detectDesktopPlatform({
      platform: "Win32",
      userAgent: "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
    }),
    "windows",
  );
  assert.equal(
    detectDesktopPlatform({ platform: "Linux x86_64", userAgent: "Mozilla/5.0 (X11)" }),
    "other",
  );
});

test("iPhone and iPad do not receive an Apple Silicon desktop installer", () => {
  assert.equal(
    detectDesktopPlatform({ platform: "iPhone", userAgent: "Mozilla/5.0 (iPhone)" }),
    "other",
  );
  assert.equal(
    detectDesktopPlatform({
      platform: "MacIntel",
      maxTouchPoints: 5,
      userAgent: "Mozilla/5.0 (Macintosh)",
    }),
    "other",
  );
});

test("download model selects the detected platform while preserving both explicit choices", () => {
  const release = {
    tag_name: "v0.0.36",
    html_url: "https://example.test/releases/v0.0.36",
    assets: [
      asset("ZtidalCode_0.0.36_aarch64.dmg", 12 * 1024 * 1024),
      asset("ZtidalCode_0.0.36_x64-setup.exe", 8 * 1024 * 1024),
    ],
  };

  const macModel = buildDownloadModel(release, { platform: "MacIntel" });
  assert.equal(macModel.platform, "macos");
  assert.equal(macModel.primary.name, "ZtidalCode_0.0.36_aarch64.dmg");
  assert.equal(macModel.mac.name, "ZtidalCode_0.0.36_aarch64.dmg");
  assert.equal(macModel.windows.name, "ZtidalCode_0.0.36_x64-setup.exe");

  const windowsModel = buildDownloadModel(release, { platform: "Win32" });
  assert.equal(windowsModel.primary.name, "ZtidalCode_0.0.36_x64-setup.exe");

  const otherModel = buildDownloadModel(release, { platform: "Linux x86_64" });
  assert.equal(otherModel.primary, null);
  assert.equal(otherModel.releaseUrl, "https://example.test/releases/v0.0.36");
});

test("asset sizes are rendered in binary megabytes with one decimal place", () => {
  assert.equal(formatAssetSize(12 * 1024 * 1024), "12.0 MB");
  assert.equal(formatAssetSize(0), "");
  assert.equal(formatAssetSize(undefined), "");
});

test("rendering keeps automatic and explicit platform downloads in sync", () => {
  const makeElement = () => ({
    href: "https://example.test/fallback",
    innerHTML: "",
    textContent: "",
    attributes: new Map(),
    setAttribute(name, value) {
      this.attributes.set(name, String(value));
    },
  });
  const elements = Object.fromEntries(
    [
      "version",
      "download",
      "dl-label",
      "dl-size",
      "download-mac",
      "download-mac-size",
      "download-windows",
      "download-windows-size",
      "latest-mac-name",
      "latest-windows-name",
    ].map((id) => [id, makeElement()]),
  );
  const documentLike = {
    documentElement: { lang: "zh-CN" },
    getElementById(id) {
      return elements[id] || null;
    },
  };
  const release = {
    tag_name: "v0.0.36",
    html_url: "https://example.test/releases/v0.0.36",
    assets: [
      asset("ZtidalCode_0.0.36_aarch64.dmg", 12 * 1024 * 1024),
      asset("ZtidalCode_0.0.36_x64-setup.exe", 8 * 1024 * 1024),
    ],
  };

  renderDownloadModel(documentLike, buildDownloadModel(release, { platform: "MacIntel" }));

  assert.equal(elements.version.textContent, "v0.0.36");
  assert.equal(elements.version.attributes.get("data-en"), "v0.0.36");
  assert.equal(elements.version.attributes.get("data-zh"), "v0.0.36");
  assert.equal(elements.download.href, "https://example.test/ZtidalCode_0.0.36_aarch64.dmg");
  assert.equal(elements["dl-label"].innerHTML, "下载 macOS 版");
  assert.equal(elements["dl-label"].attributes.get("data-en"), "Download for macOS");
  assert.equal(elements["dl-size"].textContent, " · 12.0 MB");
  assert.equal(elements["download-mac"].href, elements.download.href);
  assert.equal(
    elements["download-windows"].href,
    "https://example.test/ZtidalCode_0.0.36_x64-setup.exe",
  );
  assert.equal(elements["download-mac-size"].textContent, " · 12.0 MB");
  assert.equal(elements["download-windows-size"].textContent, " · 8.0 MB");
  assert.equal(elements["latest-mac-name"].textContent, "ZtidalCode_0.0.36_aarch64.dmg");
  assert.equal(
    elements["latest-windows-name"].textContent,
    "ZtidalCode_0.0.36_x64-setup.exe",
  );
});

test("the landing page defaults a Chinese browser to Chinese", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const classicScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter((match) => !match[0].includes('type="module"'))
    .at(-1)?.[1];
  assert.ok(classicScript, "classic language script is present");

  const button = {
    addEventListener() {},
    setAttribute() {},
    textContent: "",
  };
  const documentLike = {
    documentElement: { lang: "en" },
    getElementById(id) {
      return id === "lang" ? button : null;
    },
    querySelectorAll() {
      return [];
    },
  };
  vm.runInNewContext(classicScript, {
    document: documentLike,
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { language: "zh-CN" },
  });

  assert.equal(documentLike.documentElement.lang, "zh-CN");
});

test("dynamic version and accessible group label survive language round trips", () => {
  const html = readFileSync(new URL("./index.html", import.meta.url), "utf8");
  const classicScript = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
    .filter((match) => !match[0].includes('type="module"'))
    .at(-1)?.[1];
  assert.ok(classicScript, "classic language script is present");

  const makeElement = ({ content = "", attributes = {} } = {}) => {
    let value = content;
    const attrs = new Map(Object.entries(attributes));
    return {
      tagName: "SPAN",
      get innerHTML() {
        return value;
      },
      set innerHTML(next) {
        value = String(next);
      },
      get textContent() {
        return value;
      },
      set textContent(next) {
        value = String(next);
      },
      hasAttribute(name) {
        return attrs.has(name);
      },
      getAttribute(name) {
        return attrs.get(name) ?? null;
      },
      setAttribute(name, next) {
        attrs.set(name, String(next));
      },
    };
  };
  let toggle;
  const version = makeElement({
    content: "latest release",
    attributes: { "data-zh": "最新版本" },
  });
  const group = makeElement({
    attributes: {
      "aria-label": "Direct platform downloads",
      "data-aria-zh": "直接平台下载",
    },
  });
  const button = {
    textContent: "",
    addEventListener(_name, callback) {
      toggle = callback;
    },
    setAttribute() {},
  };
  const elements = { lang: button, version };
  const documentLike = {
    documentElement: { lang: "en" },
    getElementById(id) {
      return elements[id] || null;
    },
    querySelectorAll(selector) {
      if (selector === "[data-zh]") return [version];
      if (selector === "[data-aria-zh]") return [group];
      return [];
    },
  };

  vm.runInNewContext(classicScript, {
    document: documentLike,
    localStorage: { getItem: () => null, setItem() {} },
    navigator: { language: "en-US" },
  });
  renderDownloadModel(documentLike, {
    version: "0.0.36",
    platform: "other",
    primary: null,
    mac: null,
    windows: null,
    releaseUrl: "https://example.test/releases/v0.0.36",
  });

  toggle();
  assert.equal(version.textContent, "v0.0.36");
  assert.equal(group.getAttribute("aria-label"), "直接平台下载");
  toggle();
  assert.equal(version.textContent, "v0.0.36");
  assert.equal(group.getAttribute("aria-label"), "Direct platform downloads");
});
