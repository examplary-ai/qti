import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type ExtendedTextInteractionOptions = QtiPromptInteractionOptions & {
  base?: number;
  stringIdentifier?: string;
  expectedLength?: number;
  patternMask?: string;
  placeholderText?: string;
  maxStrings?: number;
  minStrings?: number;
  expectedLines?: number;
  format?: "plain" | "pre-formatted" | "xhtml";
};

/**
 * Allows candidates to enter extended text responses, such as essays or paragraphs.
 * Supports configurable length constraints, formatting options, and input validation.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.omuxci3o5dmg
 *
 * @example
 * const interaction = new ExtendedTextInteraction({
 *   responseIdentifier: "RESPONSE",
 *   expectedLines: 10,
 *   format: "plain",
 * });
 */
export class ExtendedTextInteraction extends QtiPromptInteraction {
  public static tagName = "qti-extended-text-interaction";

  public base?: number;
  public stringIdentifier?: string;
  public expectedLength?: number;
  public patternMask?: string;
  public placeholderText?: string;
  public maxStrings?: number;
  public minStrings?: number;
  public expectedLines?: number;
  public format?: "plain" | "pre-formatted" | "xhtml";

  constructor(options: ExtendedTextInteractionOptions) {
    super(options);

    this.base = options.base;
    this.stringIdentifier = options.stringIdentifier;
    this.expectedLength = options.expectedLength;
    this.patternMask = options.patternMask;
    this.placeholderText = options.placeholderText;
    this.maxStrings = options.maxStrings;
    this.minStrings = options.minStrings;
    this.expectedLines = options.expectedLines;
    this.format = options.format;
  }

  public static fromXmlString(xml: string): ExtendedTextInteraction {
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-extended-text-interaction");

    return new ExtendedTextInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      base: $root.attr("base") ? Number($root.attr("base")) : undefined,
      stringIdentifier: $root.attr("string-identifier"),
      expectedLength: $root.attr("expected-length")
        ? Number($root.attr("expected-length"))
        : undefined,
      patternMask: $root.attr("pattern-mask"),
      placeholderText: $root.attr("placeholder-text"),
      maxStrings: $root.attr("max-strings")
        ? Number($root.attr("max-strings"))
        : undefined,
      minStrings: $root.attr("min-strings")
        ? Number($root.attr("min-strings"))
        : undefined,
      expectedLines: $root.attr("expected-lines")
        ? Number($root.attr("expected-lines"))
        : undefined,
      format: $root.attr("format") as "plain" | "pre-formatted" | "xhtml",
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-extended-text-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      base: this.base?.toString(),
      [attr("string-identifier")]: this.stringIdentifier,
      [attr("expected-length")]: this.expectedLength?.toString(),
      [attr("pattern-mask")]: this.patternMask,
      [attr("placeholder-text")]: this.placeholderText,
      [attr("max-strings")]: this.maxStrings?.toString(),
      [attr("min-strings")]: this.minStrings?.toString(),
      [attr("expected-lines")]: this.expectedLines?.toString(),
      format: this.format,
    });

    return item;
  }
}
