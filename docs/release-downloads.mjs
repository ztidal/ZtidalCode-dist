const MINIMUM_RELEASE = [0, 0, 36];
const RELEASES_URL = "https://github.com/ztidal/ZtidalCode-dist/releases/latest";

function parseVersion(tagName) {
  const match = String(tagName || "").match(/^v?(\d+)\.(\d+)\.(\d+)(?:[-+].*)?$/);
  return match ? match.slice(1).map(Number) : null;
}

function isSupportedVersion(version) {
  if (!version) return false;
  for (let index = 0; index < MINIMUM_RELEASE.length; index += 1) {
    if (version[index] > MINIMUM_RELEASE[index]) return true;
    if (version[index] < MINIMUM_RELEASE[index]) return false;
  }
  return true;
}

function firstMatchingAsset(assets, patterns) {
  for (const pattern of patterns) {
    const match = assets.find((entry) => pattern.test(String(entry?.name || "")));
    if (match) return match;
  }
  return null;
}

export function selectReleaseAssets(release) {
  const parsedVersion = parseVersion(release?.tag_name);
  const version = parsedVersion ? parsedVersion.join(".") : "";
  const supported = isSupportedVersion(parsedVersion);
  if (!supported) {
    return { version, supported: false, mac: null, windows: null };
  }

  const assets = Array.isArray(release?.assets) ? release.assets : [];
  return {
    version,
    supported: true,
    mac: firstMatchingAsset(assets, [
      /_aarch64\.dmg$/i,
      /_arm64\.dmg$/i,
      /\.dmg$/i,
    ]),
    windows: firstMatchingAsset(assets, [/_x64-setup\.exe$/i, /-setup\.exe$/i]),
  };
}

export function detectDesktopPlatform(browser = {}) {
  const platform = String(browser.userAgentData?.platform || browser.platform || "");
  const userAgent = String(browser.userAgent || "");
  const combined = `${platform} ${userAgent}`;

  if (/iPhone|iPad|iPod/i.test(combined)) return "other";
  if (/Mac/i.test(platform) && Number(browser.maxTouchPoints || 0) > 1) return "other";
  if (/Mac/i.test(combined)) return "macos";
  if (/Win/i.test(combined)) return "windows";
  return "other";
}

export function buildDownloadModel(release, browser = {}) {
  const selected = selectReleaseAssets(release);
  const platform = detectDesktopPlatform(browser);
  const primary =
    platform === "macos"
      ? selected.mac
      : platform === "windows"
        ? selected.windows
        : null;

  return {
    ...selected,
    platform,
    primary,
    releaseUrl: release?.html_url || RELEASES_URL,
  };
}

export function formatAssetSize(bytes) {
  return Number.isFinite(bytes) && bytes > 0
    ? `${(bytes / (1024 * 1024)).toFixed(1)} MB`
    : "";
}

function getElement(documentLike, id) {
  return documentLike?.getElementById?.(id) || null;
}

function setLink(documentLike, id, asset, fallbackUrl) {
  const element = getElement(documentLike, id);
  if (element) element.href = asset?.browser_download_url || fallbackUrl;
}

function setSize(documentLike, id, asset) {
  const element = getElement(documentLike, id);
  const size = formatAssetSize(asset?.size);
  if (element) element.textContent = size ? ` · ${size}` : "";
}

function setLocalizedLabel(documentLike, id, english, chinese) {
  const element = getElement(documentLike, id);
  if (!element) return;
  element.setAttribute("data-en", english);
  element.setAttribute("data-zh", chinese);
  element.innerHTML = String(documentLike?.documentElement?.lang || "").startsWith("zh")
    ? chinese
    : english;
}

export function renderDownloadModel(documentLike, model) {
  const version = getElement(documentLike, "version");
  if (version && model.version) version.textContent = `v${model.version}`;

  setLink(documentLike, "download-mac", model.mac, model.releaseUrl);
  setLink(documentLike, "download-windows", model.windows, model.releaseUrl);
  setSize(documentLike, "download-mac-size", model.mac);
  setSize(documentLike, "download-windows-size", model.windows);

  const macName = getElement(documentLike, "latest-mac-name");
  if (macName && model.mac) macName.textContent = model.mac.name;
  const windowsName = getElement(documentLike, "latest-windows-name");
  if (windowsName && model.windows) windowsName.textContent = model.windows.name;

  setLink(documentLike, "download", model.primary, model.releaseUrl);
  setSize(documentLike, "dl-size", model.primary);
  if (model.primary && model.platform === "macos") {
    setLocalizedLabel(documentLike, "dl-label", "Download for macOS", "下载 macOS 版");
  } else if (model.primary && model.platform === "windows") {
    setLocalizedLabel(documentLike, "dl-label", "Download for Windows", "下载 Windows 版");
  } else {
    setLocalizedLabel(documentLike, "dl-label", "View latest release", "查看最新版本");
  }
}

if (typeof window !== "undefined" && typeof document !== "undefined") {
  fetch("https://api.github.com/repos/ztidal/ZtidalCode-dist/releases/latest", {
    headers: { Accept: "application/vnd.github+json" },
  })
    .then((response) => (response.ok ? response.json() : Promise.reject(new Error("release lookup failed"))))
    .then((release) => renderDownloadModel(document, buildDownloadModel(release, navigator)))
    .catch(() => {
      // The static release links in the page remain usable when the API is unavailable.
    });
}
