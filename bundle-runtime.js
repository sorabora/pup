/**
 * Standalone Pup runtime sources for bundled transpile output.
 */
(function (global) {
  function canvasHostExpr(target) {
    if (target === "html") {
      return 'document.getElementById("pup-canvas-host")';
    }
    return 'document.getElementById("output-log")';
  }

  function consoleHostExpr(target) {
    if (target === "html") {
      return 'document.getElementById("pup-console")';
    }
    return 'document.getElementById("output-log")';
  }

  function memberKey(memberMap, name) {
    const obf =
      memberMap && typeof memberMap.get === "function"
        ? memberMap.get(name)
        : null;
    return JSON.stringify(obf || name);
  }

  const chunks = {
    core() {
      return `
function pupAdd(a, b) {
  if (typeof a === "string" || typeof b === "string") return String(a) + String(b);
  return a + b;
}
async function pupWait(seconds) {
  const ms = Number(seconds) * 1000;
  if (!Number.isFinite(ms) || ms < 0) {
    throw new Error("wait() expects a non-negative number of seconds");
  }
  await new Promise((resolve) => setTimeout(resolve, ms));
}
async function pupEval(fn) {
  if (typeof fn !== "function") throw new Error("eval() expects a function");
  return await fn();
}
function pupToString(value) {
  if (value === null || value === undefined) return String(value);
  if (typeof value === "object") {
    if (value.pupEnumInstance && "value" in value) return String(value.value);
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
function pupToNumber(value) {
  if (typeof value === "number") return value;
  if (typeof value === "boolean") return value ? 1 : 0;
  if (value === null || value === undefined) return NaN;
  if (typeof value === "object" && value.pupEnumInstance && "value" in value) {
    return Number(value.value);
  }
  return Number(value);
}
function pupToBool(value) {
  if (typeof value === "boolean") return value;
  if (value === null || value === undefined) return false;
  if (typeof value === "number") return value !== 0 && !Number.isNaN(value);
  if (typeof value === "string") {
    const s = value.trim().toLowerCase();
    if (s === "" || s === "false" || s === "0") return false;
    return true;
  }
  return true;
}
function pupResetRuntimeUi() {
  const log =
    document.getElementById("pup-console") ||
    document.getElementById("output-log");
  if (log) log.textContent = "";
  const htmlHost = document.getElementById("pup-htmlapp-host");
  if (htmlHost) htmlHost.innerHTML = "";
  const canvasHost = document.getElementById("pup-canvas-host");
  if (canvasHost) canvasHost.innerHTML = "";
  if (typeof ioKeysDown !== "undefined") {
    ioKeysDown.clear();
    ioKeysPressed.clear();
  }
}
async function pupRestart() {
  if (typeof location !== "undefined" && typeof location.reload === "function") {
    location.reload();
    return;
  }
  throw new Error("restart() is not available in this environment");
}`;
    },

    vectors() {
      return `
function pupDefineType(fields, defaults) {
  function C(...args) {
    for (let i = 0; i < fields.length; i++) {
      this[fields[i]] = args[i] ?? defaults?.[fields[i]] ?? 0;
    }
  }
  C.pupType = true;
  C.prototype.toString = function () {
    return fields.map((f) => f + ":" + this[f]).join(", ");
  };
  return C;
}
const Vector2 = pupDefineType(["x", "y"]);
const Vector3 = pupDefineType(["x", "y", "z"]);`;
    },

    io() {
      return `
const ioKeysDown = new Set();
const ioKeysPressed = new Set();
const ioKeyAliases = {
  left: "ArrowLeft", right: "ArrowRight", up: "ArrowUp", down: "ArrowDown",
  space: " ", enter: "Enter", escape: "Escape", esc: "Escape",
};
function normalizeIoKey(key) {
  const raw = String(key);
  const alias = ioKeyAliases[raw.toLowerCase()];
  return alias ?? raw;
}
function markIoKeyPressed(key, code) {
  const norm = normalizeIoKey(key);
  ioKeysPressed.add(key);
  ioKeysPressed.add(norm);
  ioKeysPressed.add(String(key).toLowerCase());
  if (code) ioKeysPressed.add(code);
}
function consumeIoKeyPressed(key) {
  const k = normalizeIoKey(key);
  const raw = String(key);
  const names = [k, raw, normalizeIoKey(raw), raw.toLowerCase()];
  for (const name of names) {
    if (ioKeysPressed.has(name)) {
      for (const n of names) ioKeysPressed.delete(n);
      return true;
    }
  }
  return false;
}
let ioInputReady = false;
function initIoInput() {
  if (ioInputReady) return;
  ioInputReady = true;
  window.addEventListener("keydown", (e) => {
    const key = e.key;
    const code = e.code;
    const norm = normalizeIoKey(key);
    const wasDown =
      ioKeysDown.has(key) ||
      (code && ioKeysDown.has(code)) ||
      ioKeysDown.has(norm);
    ioKeysDown.add(key);
    if (code) ioKeysDown.add(code);
    if (!wasDown) markIoKeyPressed(key, code);
  });
  window.addEventListener("keyup", (e) => {
    const key = e.key;
    const code = e.code;
    const norm = normalizeIoKey(key);
    ioKeysDown.delete(key);
    if (code) ioKeysDown.delete(code);
    ioKeysPressed.delete(key);
    if (code) ioKeysPressed.delete(code);
    ioKeysPressed.delete(norm);
    ioKeysPressed.delete(String(key).toLowerCase());
  });
  window.addEventListener("blur", () => {
    ioKeysDown.clear();
    ioKeysPressed.clear();
  });
}
function isKeyDown(key) {
  initIoInput();
  const k = normalizeIoKey(key);
  return ioKeysDown.has(k) || ioKeysDown.has(String(key));
}
function isKeyPressed(key) {
  initIoInput();
  return consumeIoKeyPressed(key);
}`;
    },

    math(memberMap) {
      const k = (name) => memberKey(memberMap, name);
      return `
const math = {
  [${k("random")}](min, max) { return Math.random() * (max - min) + min; },
  [${k("round")}](value) { return Math.round(value); },
  [${k("floor")}](value) { return Math.floor(value); },
  [${k("ceil")}](value) { return Math.ceil(value); },
};`;
    },

    enums() {
      return `
function pupEnumType(enumType, value) {
  if (!enumType?.pupEnum) {
    throw new Error("Enum() first argument must be an enum from createEnum");
  }
  return new enumType(value);
}
pupEnumType.pupType = true;
function createEnum(options) {
  if (!Array.isArray(options)) {
    throw new Error("createEnum() expects an array of allowed values");
  }
  if (options.length === 0) throw new Error("createEnum() needs at least one option");
  const allowed = options.map((o) => String(o));
  const allowedSet = new Set(allowed);
  function enumConstructor(value) {
    const normalized = String(value);
    if (!allowedSet.has(normalized)) {
      throw new Error("invalid enum value: " + normalized + " (allowed: " + allowed.join(", ") + ")");
    }
    this.value = normalized;
    this.pupEnumInstance = true;
  }
  enumConstructor.pupEnum = true;
  enumConstructor.allowedValues = allowed;
  enumConstructor.prototype.toString = function () { return this.value; };
  return enumConstructor;
}
const enums = { Enum: pupEnumType, createEnum };`;
    },

    game(target, memberMap) {
      const host = canvasHostExpr(target);
      const k = (name) => memberKey(memberMap, name);
      return `
const gameState = { canvas: null, ctx: null, fillColor: "#000000" };
function gameApplyFillColor(color) {
  gameState.fillColor = color;
  if (gameState.ctx) gameState.ctx.fillStyle = color;
}
const center = "center";
const left = "left";
const right = "right";
const game = {
  [${k("createWindow")}](width, height) {
    const host = ${host};
    if (!host) throw new Error("Canvas host element not found");
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    canvas.tabIndex = 0;
    canvas.style.outline = "none";
    canvas.style.display = "block";
    canvas.style.maxWidth = "100%";
    canvas.addEventListener("click", () => canvas.focus());
    gameState.ctx = canvas.getContext("2d");
    gameState.canvas = canvas;
    gameState.ctx.fillStyle = gameState.fillColor;
    host.appendChild(canvas);
    if (typeof initIoInput === "function") initIoInput();
    canvas.focus();
  },
  [${k("background")}](color) {
    if (!gameState.ctx) throw new Error("No window created");
    gameApplyFillColor(color);
    gameState.ctx.fillRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  },
  [${k("text")}](text, x, y, fontSize, posmode) {
    if (!gameState.ctx) throw new Error("No window created");
    fontSize = fontSize ?? 16;
    posmode = posmode ?? "left";
    gameState.ctx.save();
    gameState.ctx.fillStyle = gameState.fillColor;
    gameState.ctx.font = fontSize + "px Arial";
    const mode = String(posmode).toLowerCase();
    gameState.ctx.textAlign = mode === "center" ? "center" : mode === "right" ? "right" : "left";
    gameState.ctx.textBaseline = "alphabetic";
    gameState.ctx.fillText(String(text), x, y);
    gameState.ctx.restore();
  },
  [${k("checkCollision")}](x1, y1, w1, h1, x2, y2, w2, h2) {
    return x1 < x2 + w2 && x1 + w1 > x2 && y1 < y2 + h2 && y1 + h1 > y2;
  },
  [${k("rect")}](x, y, width, height) {
    if (!gameState.ctx) throw new Error("No window created");
    gameState.ctx.fillStyle = gameState.fillColor;
    gameState.ctx.fillRect(x, y, width, height);
  },
  [${k("circle")}](x, y, radius) {
    if (!gameState.ctx) throw new Error("No window created");
    gameState.ctx.fillStyle = gameState.fillColor;
    gameState.ctx.beginPath();
    gameState.ctx.arc(x, y, radius, 0, Math.PI * 2);
    gameState.ctx.fill();
  },
  [${k("clear")}]() {
    if (!gameState.ctx) throw new Error("No window created");
    gameState.ctx.clearRect(0, 0, gameState.canvas.width, gameState.canvas.height);
  },
  [${k("fillColor")}](color) { gameApplyFillColor(color); },
  [${k("mainLoop")}](fn) {
    async function frame() {
      await fn();
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  },
};`;
    },

    console(target) {
      const logHost = consoleHostExpr(target);
      return `
function formatPrintValue(value) {
  if (typeof value === "function") return "<function>";
  if (value !== null && typeof value === "object") {
    try {
      return JSON.stringify(value, null, 2);
    } catch {
      return String(value);
    }
  }
  return String(value);
}
function print(...args) {
  const log = ${logHost};
  if (!log) return console.log(...args);
  log.textContent += args.map((a) => formatPrintValue(a)).join(" ") + "\\n";
}
function ask(...args) {
  throw new Error("ask() is not available in bundled standalone output");
}
function dialog(...args) {
  throw new Error("dialog() is not available in bundled standalone output");
}`;
    },

    http(memberMap) {
      const k = (name) => memberKey(memberMap, name);
      return `
const HTTP_METHODS = new Set(["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"]);
function isHttpMethod(value) {
  return HTTP_METHODS.has(String(value).toUpperCase());
}
function isHttpUrl(value) {
  const s = String(value);
  return /^https?:\\/\\//i.test(s) || s.startsWith("/");
}
function parseHttpHeaders(headers) {
  if (headers == null) return {};
  if (typeof headers === "object" && !Array.isArray(headers)) return headers;
  throw new Error("http headers must be an object, not " + typeof headers);
}
function parseResponseArgs(a, b, c) {
  if (b == null && c == null) return { method: "GET", url: a, headers: {} };
  if (b != null && c == null) {
    if (isHttpMethod(a) && isHttpUrl(b)) {
      return { method: String(a).toUpperCase(), url: b, headers: {} };
    }
    return { method: "GET", url: a, headers: parseHttpHeaders(b) };
  }
  if (isHttpMethod(a) && isHttpUrl(b)) {
    return { method: String(a).toUpperCase(), url: b, headers: parseHttpHeaders(c) };
  }
  throw new Error(
    "http.response: use response(url), response(method, url), or response(method, url, headers)",
  );
}
function parseHttpResponseBody(text, contentType) {
  const trimmed = String(text).trim();
  const type = String(contentType || "").toLowerCase();
  const looksJson =
    type.includes("json") ||
    (trimmed.startsWith("{") && trimmed.endsWith("}")) ||
    (trimmed.startsWith("[") && trimmed.endsWith("]"));
  if (!looksJson) return text;
  try {
    return JSON.parse(trimmed);
  } catch {
    return text;
  }
}
const http = {
  async [${k("request")}](method, url, body, headers) {
    body = body ?? null;
    const init = {
      method: String(method || "GET").toUpperCase(),
      headers: parseHttpHeaders(headers),
    };
    if (
      body != null &&
      body !== "" &&
      init.method !== "GET" &&
      init.method !== "HEAD"
    ) {
      init.body = typeof body === "string" ? body : JSON.stringify(body);
      if (typeof body !== "string" && !init.headers["Content-Type"] && !init.headers["content-type"]) {
        init.headers["Content-Type"] = "application/json";
      }
    }
    const res = await fetch(url, init);
    if (!res.ok) {
      throw new Error("HTTP " + res.status + " for " + url);
    }
    const text = await res.text();
    const contentType = res.headers.get("content-type") || "";
    return parseHttpResponseBody(text, contentType);
  },
  async [${k("response")}](a, b, c) {
    const parsed = parseResponseArgs(a, b, c);
    return this[${k("request")}](parsed.method, parsed.url, null, parsed.headers);
  },
};`;
    },

    utils() {
      return `
const time = {
  currentYear() { return new Date().getFullYear(); },
  currentMonth() { return new Date().getMonth() + 1; },
  currentDay() { return new Date().getDate(); },
  currentHour() { return new Date().getHours(); },
  currentMinute() { return new Date().getMinutes(); },
  currentSecond() { return new Date().getSeconds(); },
  currentMillisecond() { return new Date().getMilliseconds(); },
};
const utils = { time };`;
    },

    ssr_node() {
      return `
const ssr = {
  render(html, filePath) {
    const out = String(html);
    if (filePath) {
      require("fs").writeFileSync(filePath, out, "utf8");
      console.log("Wrote " + filePath);
    } else {
      process.stdout.write(out);
    }
  },
};`;
    },

    ssr_browser(target) {
      const logHost = consoleHostExpr(target);
      return `
const ssr = {
  render(html) {
    const out = String(html);
    const log = ${logHost};
    if (log) {
      log.textContent += out;
      if (!out.endsWith("\\n")) log.textContent += "\\n";
    } else {
      console.log(out);
    }
  },
};`;
    },

    htmlapp(target, memberMap) {
      const defaultHost =
        target === "html"
          ? '"#pup-htmlapp-host"'
          : '"#pup-htmlapp-host"';
      const k = (name) => memberKey(memberMap, name);
      return `
const HTMLAPP_HOST = ${defaultHost};
function htmlappBuildExportDocument(html, title) {
  const safeTitle = String(title ?? "Pup App")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
  return (
    "<!DOCTYPE html>\\n<html lang=\\"en\\">\\n<head>\\n" +
    "  <meta charset=\\"UTF-8\\" />\\n" +
    "  <meta name=\\"viewport\\" content=\\"width=device-width, initial-scale=1.0\\" />\\n" +
    "  <title>" + safeTitle + "</title>\\n" +
    "  <style>body{font-family:system-ui,sans-serif;margin:0;padding:1.5rem;}</style>\\n" +
    "</head>\\n<body>\\n" +
    String(html) +
    "\\n</body>\\n</html>"
  );
}
function htmlappResolveHost(selector) {
  if (selector == null || selector === "") {
    return document.querySelector(HTMLAPP_HOST);
  }
  if (typeof selector === "string") return document.querySelector(selector);
  return selector;
}
function htmlappSetAttribute(el, property, value) {
  const name = String(property);
  if (value == null || value === false) {
    el.removeAttribute(name);
    if (name === "class") el.className = "";
    if (name === "value" && "value" in el) el.value = "";
    if (name === "checked" && "checked" in el) el.checked = false;
    if (name === "disabled" && "disabled" in el) el.disabled = false;
    return;
  }
  const val = String(value);
  if (name === "class") {
    el.className = val;
    return;
  }
  if (name === "value" && "value" in el) {
    el.value = val;
    return;
  }
  if (name === "checked" && "checked" in el) {
    el.checked = val !== "" && val !== "false" && val !== "0";
    return;
  }
  if (name === "disabled" && "disabled" in el) {
    el.disabled = val !== "" && val !== "false" && val !== "0";
    return;
  }
  el.setAttribute(name, val);
}
function htmlappGetAttribute(el, property) {
  const name = String(property);
  if (name === "class") return el.className;
  if (name === "value" && "value" in el) return el.value;
  if (name === "checked" && "checked" in el) return el.checked;
  if (name === "disabled" && "disabled" in el) return el.disabled;
  return el.getAttribute(name);
}
const htmlapp = {
  [${k("render")}](html) {
    const host = htmlappResolveHost(null);
    if (!host) throw new Error("htmlapp.render: host not found");
    host.innerHTML = String(html);
    return host;
  },
  [${k("setHtmlAttribute")}](selector, property, value) {
    const el = htmlappResolveHost(selector);
    if (!el) throw new Error("htmlapp.setHtmlAttribute: element not found");
    htmlappSetAttribute(el, property, value);
    return el;
  },
  [${k("setProperty")}](selector, property, value) {
    return htmlapp[${k("setHtmlAttribute")}](selector, property, value);
  },
  [${k("getHtmlAttribute")}](selector, property) {
    const el = htmlappResolveHost(selector);
    if (!el) throw new Error("htmlapp.getHtmlAttribute: element not found");
    return htmlappGetAttribute(el, property);
  },
  [${k("getProperty")}](selector, property) {
    return htmlapp[${k("getHtmlAttribute")}](selector, property);
  },
  [${k("mount")}](html, selector) {
    const host = htmlappResolveHost(selector);
    if (!host) throw new Error("htmlapp.mount: host not found");
    host.innerHTML = String(html);
    return host;
  },
  [${k("clear")}](selector) {
    const host = htmlappResolveHost(selector);
    if (host) host.innerHTML = "";
  },
  [${k("setTitle")}](title) {
    document.title = String(title);
  },
  [${k("export")}](html, title) {
    return htmlappBuildExportDocument(html, title);
  },
  [${k("download")}](html, filename, title) {
    const name = String(filename ?? "app.html");
    const doc = htmlappBuildExportDocument(html, title);
    const blob = new Blob([doc], { type: "text/html;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    link.click();
    URL.revokeObjectURL(url);
  },
};`;
    },

    htmlapp_node() {
      const msg =
        "htmlapp is only available in Browser or HTML output (not Node.js)";
      return `
const htmlapp = {
  render() { throw new Error("${msg}"); },
  setHtmlAttribute() { throw new Error("${msg}"); },
  setProperty() { throw new Error("${msg}"); },
  getHtmlAttribute() { throw new Error("${msg}"); },
  getProperty() { throw new Error("${msg}"); },
  mount() { throw new Error("${msg}"); },
  clear() { throw new Error("${msg}"); },
  setTitle() { throw new Error("${msg}"); },
  export() { throw new Error("${msg}"); },
  download() { throw new Error("${msg}"); },
};`;
    },
  };

  function buildApiObjectLines(modules, target, apiKeyMap, apiMemberMaps) {
    const k = (name) => (apiKeyMap && apiKeyMap.get(name)) || name;
    const gm = (name) =>
      ((apiMemberMaps && apiMemberMaps.get("math")) || null) &&
      apiMemberMaps.get("math").get(name)
        ? apiMemberMaps.get("math").get(name)
        : name;
    const lines = ["const pupApi = {"];
    lines.push("  " + k("wait") + ": pupWait,");
    lines.push("  " + k("eval") + ": pupEval,");
    lines.push("  " + k("toString") + ": pupToString,");
    lines.push("  " + k("toNumber") + ": pupToNumber,");
    lines.push("  " + k("toBool") + ": pupToBool,");
    lines.push("  " + k("restart") + ": pupRestart,");
    if (modules.includes("vectors")) {
      lines.push("  " + k("Vector2") + ": Vector2,");
      lines.push("  " + k("Vector3") + ": Vector3,");
    }
    if (modules.includes("io")) {
      lines.push("  " + k("isKeyDown") + ": isKeyDown,");
      lines.push("  " + k("isKeyPressed") + ": isKeyPressed,");
    }
    if (modules.includes("math")) {
      lines.push("  " + k("math") + ": math,");
      lines.push("  " + k("random") + ": math." + gm("random") + ",");
      lines.push("  " + k("round") + ": math." + gm("round") + ",");
      lines.push("  " + k("floor") + ": math." + gm("floor") + ",");
      lines.push("  " + k("ceil") + ": math." + gm("ceil") + ",");
    }
    if (modules.includes("enums")) {
      lines.push("  " + k("Enum") + ": pupEnumType,");
      lines.push("  " + k("createEnum") + ": createEnum,");
      lines.push("  " + k("enums") + ": enums,");
    }
    if (modules.includes("game")) {
      lines.push("  " + k("game") + ": game,");
      lines.push("  " + k("center") + ": center,");
      lines.push("  " + k("left") + ": left,");
      lines.push("  " + k("right") + ": right,");
    }
    if (modules.includes("console")) {
      lines.push("  " + k("print") + ": print,");
      lines.push("  " + k("ask") + ": ask,");
      lines.push("  " + k("dialog") + ": dialog,");
    }
    if (modules.includes("http")) lines.push("  " + k("http") + ": http,");
    if (modules.includes("utils")) lines.push("  " + k("utils") + ": utils,");
    if (modules.includes("ssr")) lines.push("  " + k("ssr") + ": ssr,");
    if (modules.includes("htmlapp"))
      lines.push("  " + k("htmlapp") + ": htmlapp,");
    lines.push("};");
    return lines.join("\n");
  }

  function emitRuntime(modules, target, apiKeyMap, apiMemberMaps) {
    const memberMapFor = (name) =>
      apiMemberMaps && apiMemberMaps.get ? apiMemberMaps.get(name) : null;
    const parts = ['"use strict";', ""];
    parts.push(chunks.core());
    if (modules.includes("vectors")) parts.push(chunks.vectors());
    if (modules.includes("io")) parts.push(chunks.io());
    if (modules.includes("math")) parts.push(chunks.math(memberMapFor("math")));
    if (modules.includes("enums")) parts.push(chunks.enums());
    if (modules.includes("game"))
      parts.push(chunks.game(target, memberMapFor("game")));
    if (modules.includes("console")) parts.push(chunks.console(target));
    if (modules.includes("http")) parts.push(chunks.http(memberMapFor("http")));
    if (modules.includes("utils")) parts.push(chunks.utils());
    if (modules.includes("ssr")) {
      parts.push(
        target === "nodejs" ? chunks.ssr_node() : chunks.ssr_browser(target),
      );
    }
    if (modules.includes("htmlapp")) {
      parts.push(
        target === "nodejs"
          ? chunks.htmlapp_node()
          : chunks.htmlapp(target, memberMapFor("htmlapp")),
      );
    }
    parts.push("");
    parts.push(buildApiObjectLines(modules, target, apiKeyMap, apiMemberMaps));
    return parts.join("\n");
  }

  function emitProgram(modules, transpiledBody, target, apiKeyMap, apiMemberMaps) {
    const runtime = emitRuntime(modules, target, apiKeyMap, apiMemberMaps);
    const footer =
      target === "nodejs"
        ? `
(async () => {
${transpiledBody}
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
  process.exit(1);
});`
        : `
(async () => {
  pupResetRuntimeUi();
${transpiledBody}
})().catch((err) => {
  console.error(err && err.stack ? err.stack : err);
});`;
    return runtime + footer;
  }

  function emitHtmlDocument(modules, scriptBody, apiKeyMap, apiMemberMaps) {
    const bundled = emitProgram(modules, scriptBody, "html", apiKeyMap, apiMemberMaps);
    const antdHead = `
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/antd@5.26.2/dist/reset.css" />
  <script src="https://cdn.jsdelivr.net/npm/react@18.3.1/umd/react.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/react-dom@18.3.1/umd/react-dom.production.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/dayjs@1/dayjs.min.js"></script>
  <script src="https://cdn.jsdelivr.net/npm/antd@5.26.2/dist/antd.min.js"></script>`;
    const htmlappHost = modules.includes("htmlapp")
      ? `
    <div id="pup-htmlapp-host" class="pup-htmlapp-root"></div>`
      : "";
    const consoleBlock =
      modules.includes("console") || modules.includes("ssr")
        ? `
    <pre id="pup-console" style="margin-top:1rem;padding:0.75rem;background:#1e1e1e;color:#d4d4d4;border-radius:6px;min-height:2rem;white-space:pre-wrap;"></pre>`
        : "";
    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Pup Program</title>${antdHead}
  <style>
    body { font-family: system-ui, sans-serif; margin: 0; padding: 1rem; background: #141414; color: #eee; }
    #pup-canvas-host { margin-top: 1rem; }
    #pup-htmlapp-host { margin-top: 1rem; padding: 1rem; background: #fff; color: #111; border-radius: 8px; min-height: 2rem; }
    #pup-app { max-width: 960px; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="pup-app">
    <div id="pup-root"></div>${htmlappHost}
    <div id="pup-canvas-host"></div>${consoleBlock}
  </div>
  <script>
${bundled}
  </script>
</body>
</html>`;
  }

  global.PupBundle = {
    emitRuntime,
    emitProgram,
    emitHtmlDocument,
    order: [
      "core",
      "vectors",
      "io",
      "math",
      "enums",
      "game",
      "console",
      "utils",
      "ssr",
      "htmlapp",
    ],
  };
})(typeof window !== "undefined" ? window : globalThis);
