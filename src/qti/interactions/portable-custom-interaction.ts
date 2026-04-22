import { load } from "cheerio";
import { fragment } from "xmlbuilder2";
import { XMLBuilder } from "xmlbuilder2/lib/interfaces";

import {
  QtiPromptInteraction,
  QtiPromptInteractionOptions,
} from "./interaction";
import { appendHtmlFragment } from "../../utils/html";
import { toElementName, toAttributeName } from "../../utils/version";
import { QtiVersion } from "../types";

export type PortableCustomInteractionModule = {
  id: string;
  primaryPath: string;
  fallbackPath?: string;
};

export type PortableCustomInteractionTemplateVariable = {
  templateIdentifier: string;
};

export type PortableCustomInteractionContextVariable = {
  identifier: string;
};

export type PortableCustomInteractionOptions = QtiPromptInteractionOptions & {
  module: string;
  customInteractionTypeIdentifier: string;
  dataExamplarySettings?: string;
  class?: string;
  modules?: PortableCustomInteractionModule[];
  markup?: string;
  templateVariables?: PortableCustomInteractionTemplateVariable[];
  contextVariables?: PortableCustomInteractionContextVariable[];
};

/**
 * A custom QTI portable custom interaction (PCI), allowing you to load arbitrary
 * HTML and JavaScript for rendering the interaction.
 *
 * @see https://www.imsglobal.org/spec/qti/v3p0/impl#h.98xaka8g51za
 *
 * @example
 * const interaction = new PortableCustomInteraction({
 *   responseIdentifier: "RESPONSE",
 *   module: "single-line-text",
 *   customInteractionTypeIdentifier: "urn:fdc:examplary.ai:pci:single-line-text",
 * });
 */
export class PortableCustomInteraction extends QtiPromptInteraction {
  public static tagName = "qti-portable-custom-interaction";

  public module: string;
  public customInteractionTypeIdentifier: string;
  public dataExamplarySettings?: string;
  public class?: string;
  public modules?: PortableCustomInteractionModule[];
  public markup?: string;
  public templateVariables?: PortableCustomInteractionTemplateVariable[];
  public contextVariables?: PortableCustomInteractionContextVariable[];

  constructor(options: PortableCustomInteractionOptions) {
    super(options);

    this.module = options.module;
    this.customInteractionTypeIdentifier =
      options.customInteractionTypeIdentifier;
    this.dataExamplarySettings = options.dataExamplarySettings;
    this.class = options.class;
    this.modules = options.modules;
    this.markup = options.markup;
    this.templateVariables = options.templateVariables;
    this.contextVariables = options.contextVariables;
  }

  public static fromXmlString(xml: string): PortableCustomInteraction {
    const modules: PortableCustomInteractionModule[] = [];
    const templateVariables: PortableCustomInteractionTemplateVariable[] = [];
    const contextVariables: PortableCustomInteractionContextVariable[] = [];
    const $ = load(xml, { xmlMode: true });
    const $root = $("qti-portable-custom-interaction");

    $("qti-interaction-module").each((_, node) => {
      const mod = $(node);
      modules.push({
        id: mod.attr("id")!,
        primaryPath: mod.attr("primary-path")!,
        fallbackPath: mod.attr("fallback-path"),
      });
    });

    $("qti-template-variable").each((_, node) => {
      const variable = $(node);
      templateVariables.push({
        templateIdentifier: variable.attr("template-identifier")!,
      });
    });

    $("qti-context-variable").each((_, node) => {
      const variable = $(node);
      contextVariables.push({
        identifier: variable.attr("identifier")!,
      });
    });

    const $markup = $root.find("qti-interaction-markup");
    const markup = ($markup.html() || "").trim();

    return new PortableCustomInteraction({
      responseIdentifier: $root.attr("response-identifier")!,
      label: $root.attr("label"),
      module: $root.attr("module")!,
      customInteractionTypeIdentifier: $root.attr(
        "custom-interaction-type-identifier",
      )!,
      dataExamplarySettings: $root.attr("data-examplary-settings"),
      class: $root.attr("class"),
      modules: modules.length ? modules : undefined,
      markup: markup || undefined,
      templateVariables: templateVariables.length
        ? templateVariables
        : undefined,
      contextVariables: contextVariables.length ? contextVariables : undefined,
    });
  }

  protected buildXmlPayload(version: QtiVersion): XMLBuilder {
    const el = (name: string) => toElementName(name, version);
    const attr = (name: string) => toAttributeName(name, version);

    const item = fragment().ele(el("qti-portable-custom-interaction"), {
      [attr("response-identifier")]: this.responseIdentifier,
      label: this.label,
      module: this.module,
      [attr("custom-interaction-type-identifier")]:
        this.customInteractionTypeIdentifier,
      "data-examplary-settings": this.dataExamplarySettings,
      class: this.class,
    });

    if (this.modules?.length) {
      const modulesEl = item.ele(el("qti-interaction-modules"));
      for (const mod of this.modules) {
        modulesEl.ele(el("qti-interaction-module"), {
          id: mod.id,
          [attr("primary-path")]: mod.primaryPath,
          [attr("fallback-path")]: mod.fallbackPath,
        });
      }
    }

    appendHtmlFragment(
      this.markup || "",
      item.ele(el("qti-interaction-markup")),
    );

    if (this.templateVariables?.length) {
      for (const variable of this.templateVariables) {
        item.ele(el("qti-template-variable"), {
          [attr("template-identifier")]: variable.templateIdentifier,
        });
      }
    }

    if (this.contextVariables?.length) {
      for (const variable of this.contextVariables) {
        item.ele(el("qti-context-variable"), {
          identifier: variable.identifier,
        });
      }
    }

    return item;
  }
}
