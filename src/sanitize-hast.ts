export type PropertyValue = string | number | boolean | null | undefined | Array<string | number>;

const URL_PROPERTIES = new Set(["href", "src", "cite", "poster", "xlinkHref"]);
const SAFE_URL_PROTOCOLS = new Set(["http:", "https:", "mailto:", "tel:"]);
const ALLOWED_DATA_IMAGE = /^data:image\/(?:png|gif|jpe?g|webp|avif);base64,/i;
const ARIA_PROPERTY_NAMES: Record<string, string> = {
  ariaActiveDescendant: "aria-activedescendant",
  ariaAtomic: "aria-atomic",
  ariaAutoComplete: "aria-autocomplete",
  ariaBusy: "aria-busy",
  ariaChecked: "aria-checked",
  ariaColCount: "aria-colcount",
  ariaColIndex: "aria-colindex",
  ariaColSpan: "aria-colspan",
  ariaControls: "aria-controls",
  ariaCurrent: "aria-current",
  ariaDescribedBy: "aria-describedby",
  ariaDescription: "aria-description",
  ariaDetails: "aria-details",
  ariaDisabled: "aria-disabled",
  ariaErrorMessage: "aria-errormessage",
  ariaExpanded: "aria-expanded",
  ariaFlowTo: "aria-flowto",
  ariaHasPopup: "aria-haspopup",
  ariaHidden: "aria-hidden",
  ariaInvalid: "aria-invalid",
  ariaKeyShortcuts: "aria-keyshortcuts",
  ariaLabel: "aria-label",
  ariaLabelledBy: "aria-labelledby",
  ariaLevel: "aria-level",
  ariaLive: "aria-live",
  ariaModal: "aria-modal",
  ariaMultiLine: "aria-multiline",
  ariaMultiSelectable: "aria-multiselectable",
  ariaOrientation: "aria-orientation",
  ariaOwns: "aria-owns",
  ariaPlaceholder: "aria-placeholder",
  ariaPosInSet: "aria-posinset",
  ariaPressed: "aria-pressed",
  ariaReadOnly: "aria-readonly",
  ariaRelevant: "aria-relevant",
  ariaRequired: "aria-required",
  ariaRoleDescription: "aria-roledescription",
  ariaRowCount: "aria-rowcount",
  ariaRowIndex: "aria-rowindex",
  ariaRowSpan: "aria-rowspan",
  ariaSelected: "aria-selected",
  ariaSetSize: "aria-setsize",
  ariaSort: "aria-sort",
  ariaValueMax: "aria-valuemax",
  ariaValueMin: "aria-valuemin",
  ariaValueNow: "aria-valuenow",
  ariaValueText: "aria-valuetext",
};

export function isSafeUrl(value: unknown): boolean {
  if (typeof value !== "string") {
    return true;
  }

  const trimmed = value.trim();
  if (trimmed === "" || trimmed.startsWith("#") || trimmed.startsWith("/") || trimmed.startsWith("./") || trimmed.startsWith("../")) {
    return true;
  }

  if (ALLOWED_DATA_IMAGE.test(trimmed)) {
    return true;
  }

  try {
    const url = new URL(trimmed, "https://streamdown.local");
    return SAFE_URL_PROTOCOLS.has(url.protocol);
  } catch {
    return false;
  }
}

export function sanitizeProperties(
  tagName: string,
  properties: Record<string, unknown> | undefined,
): Record<string, PropertyValue> {
  const sanitized: Record<string, PropertyValue> = {};

  for (const [key, value] of Object.entries(properties ?? {})) {
    if (key.startsWith("on")) {
      continue;
    }
    if (key === "style") {
      continue;
    }
    if (URL_PROPERTIES.has(key) && !isSafeUrl(value)) {
      continue;
    }
    if (!isRenderableProperty(value)) {
      continue;
    }
    sanitized[normalizePropertyName(key)] = value;
  }

  if (tagName === "a" && typeof sanitized.href === "string") {
    const href = sanitized.href;
    if (/^https?:\/\//i.test(href)) {
      sanitized.target = "_blank";
      sanitized.rel = mergeRel(sanitized.rel, ["noreferrer", "noopener"]);
    }
  }

  return sanitized;
}

function normalizePropertyName(key: string): string {
  if (key === "class") {
    return "className";
  }
  if (ARIA_PROPERTY_NAMES[key]) {
    return ARIA_PROPERTY_NAMES[key];
  }
  if (/^aria[A-Z]/.test(key)) {
    return camelToKebab(key);
  }
  if (/^data[A-Z]/.test(key)) {
    return camelToKebab(key);
  }
  return key;
}

function camelToKebab(value: string): string {
  return value.replace(/[A-Z]/g, (letter) => `-${letter.toLowerCase()}`);
}

function isRenderableProperty(value: unknown): value is PropertyValue {
  if (value == null) {
    return true;
  }
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return true;
  }
  return Array.isArray(value) && value.every((item) => typeof item === "string" || typeof item === "number");
}

function mergeRel(value: PropertyValue, required: string[]): string {
  const current =
    typeof value === "string"
      ? value.split(/\s+/)
      : Array.isArray(value)
        ? value.map(String)
        : [];
  return Array.from(new Set([...current.filter(Boolean), ...required])).join(" ");
}
