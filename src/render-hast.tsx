import React, { type ElementType, type ReactNode } from "react";
import katex from "katex";
import { parseDocument } from "htmlparser2";
import type { AnyNode, Element as HtmlElement, Text as HtmlText } from "domhandler";
import type { HastNode } from "satteri";
import { sanitizeProperties } from "./sanitize-hast.js";

export type RawHtmlMode = "sanitize" | "escape" | "drop";
export type ComponentsMap = Record<string, ElementType>;

export interface RenderHastOptions {
  components?: ComponentsMap;
  rawHtml?: RawHtmlMode;
}

type HastElement = Extract<HastNode, { type: "element" }>;
type HastRoot = Extract<HastNode, { type: "root" }>;
type HastText = Extract<HastNode, { type: "text" }>;
type HastRaw = Extract<HastNode, { type: "raw" }>;
type HastLiteral = Extract<HastNode, { value: string }>;

export function renderHastToReact(root: HastNode, options: RenderHastOptions = {}): ReactNode {
  return renderNode(root, options, "root");
}

function renderNode(
  node: HastNode,
  options: RenderHastOptions,
  key: React.Key,
  parent?: HastElement,
): ReactNode {
  switch (node.type) {
    case "root":
      return renderChildren((node as HastRoot).children ?? [], options);
    case "text":
      return (node as HastText).value;
    case "raw":
      return renderRaw((node as HastRaw).value, options.rawHtml ?? "sanitize", key);
    case "element":
      return renderElement(node as HastElement, options, key, parent);
    case "comment":
    case "doctype":
      return null;
    default:
      return renderUnknownLiteral(node as HastNode);
  }
}

function renderChildren(children: HastNode[], options: RenderHastOptions): ReactNode[] {
  return children.map((child, index) => renderNode(child, options, index));
}

function renderElement(
  node: HastElement,
  options: RenderHastOptions,
  key: React.Key,
  parent?: HastElement,
): ReactNode {
  if (node.tagName === "script" || node.tagName === "style") {
    return null;
  }

  if (node.tagName === "span" && typeof node.properties?.className === "object") {
    // no-op; keeps TypeScript from narrowing className incorrectly below
  }

  const math = renderMathElement(node, key);
  if (math) {
    return math;
  }

  const componentName = node.tagName === "code" && parent?.tagName !== "pre" ? "inlineCode" : node.tagName;
  const Component = options.components?.[componentName] ?? options.components?.[node.tagName] ?? node.tagName;
  const isCustomComponent = typeof Component !== "string";
  const props = sanitizeProperties(node.tagName, node.properties as Record<string, unknown> | undefined);
  const children = (node.children ?? []) as HastNode[];
  const renderedChildren =
    (options.rawHtml ?? "sanitize") === "sanitize" && children.some((child) => child.type === "raw")
      ? renderSanitizedHtmlFragment(serializeRawAwareChildren(children), options)
      : children.map((child, index) => renderNode(child, options, index, node));

  return React.createElement(
    Component,
    { ...props, ...(isCustomComponent ? { node } : {}), key },
    ...renderedChildren,
  );
}

function renderRaw(value: string, mode: RawHtmlMode, key: React.Key): ReactNode {
  if (mode === "drop") {
    return null;
  }
  if (mode === "escape") {
    return value;
  }
  return <React.Fragment key={key}>{renderSanitizedHtmlFragment(value, {})}</React.Fragment>;
}

function renderUnknownLiteral(node: HastNode): ReactNode {
  const literal = node as Partial<HastLiteral>;
  return typeof literal.value === "string" ? literal.value : null;
}

function renderMathElement(node: HastElement, key: React.Key): ReactNode | null {
  const className = propertyToClassName(node.properties?.className);
  const code = textContent((node.children ?? []) as HastNode[]);

  if (className.includes("language-math") || className.includes("math-display")) {
    return (
      <span
        key={key}
        className="katex-display"
        dangerouslySetInnerHTML={{ __html: renderKatex(code, true) }}
      />
    );
  }

  if (className.includes("math-inline")) {
    return (
      <span key={key} className="katex" dangerouslySetInnerHTML={{ __html: renderKatex(code, false) }} />
    );
  }

  return null;
}

function renderKatex(value: string, displayMode: boolean): string {
  try {
    return katex.renderToString(value, {
      displayMode,
      throwOnError: false,
      strict: "ignore",
    });
  } catch {
    return escapeHtml(value);
  }
}

function textContent(children: HastNode[]): string {
  return children
    .map((child) => {
      if ("value" in child && typeof child.value === "string") {
        return child.value;
      }
      if ("children" in child && Array.isArray(child.children)) {
        return textContent(child.children as HastNode[]);
      }
      return "";
    })
    .join("");
}

function propertyToClassName(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(String).join(" ");
  }
  return "";
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function serializeRawAwareChildren(children: HastNode[]): string {
  return children.map(serializeRawAwareNode).join("");
}

function serializeRawAwareNode(node: HastNode): string {
  if (node.type === "raw") {
    return (node as HastRaw).value;
  }
  if (node.type === "text") {
    return escapeHtml((node as HastText).value);
  }
  if (node.type === "element") {
    const element = node as HastElement;
    const attrs = Object.entries(
      sanitizeProperties(element.tagName, element.properties as Record<string, unknown> | undefined),
    )
      .map(([key, value]) => {
        if (value === true) return ` ${key}`;
        if (value === false || value == null) return "";
        const serialized = Array.isArray(value) ? value.join(" ") : String(value);
        return ` ${key}="${escapeHtml(serialized)}"`;
      })
      .join("");
    return `<${element.tagName}${attrs}>${serializeRawAwareChildren(
      (element.children ?? []) as HastNode[],
    )}</${element.tagName}>`;
  }
  return "";
}

function renderSanitizedHtmlFragment(html: string, options: RenderHastOptions): ReactNode[] {
  const document = parseDocument(html, {
    lowerCaseAttributeNames: false,
    lowerCaseTags: false,
  });
  return document.childNodes.map((node, index) => renderHtmlNode(node, options, index));
}

function renderHtmlNode(node: AnyNode, options: RenderHastOptions, key: React.Key): ReactNode {
  if (node.type === "text") {
    return (node as HtmlText).data;
  }
  if (node.type !== "tag") {
    return null;
  }

  const element = node as HtmlElement;
  if (element.name === "script" || element.name === "style") {
    return null;
  }

  const Component = options.components?.[element.name] ?? element.name;
  const props = sanitizeProperties(element.name, element.attribs);
  return React.createElement(
    Component,
    { ...props, key },
    ...element.childNodes.map((child, index) => renderHtmlNode(child, options, index)),
  );
}
