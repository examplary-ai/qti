import { readFile } from "node:fs/promises";

import { describe, expect, test } from "vitest";

import { ChoiceInteraction } from "./interactions";
import { QtiItem, ResponseProcessingTemplate } from "./qti-item";

describe("QtiItem", () => {
  test("it creates a QTI item", () => {
    const item = new QtiItem();
    expect(item).toBeDefined();
  });

  test("it builds XML with correct root element", () => {
    const item = new QtiItem({ identifier: "test-item" });
    item.addItemBodyFromHtml("<p>This is a test item.</p>");

    const xml = item.buildXml();

    expect(xml).toContain("qti-assessment-item");
    expect(xml).toContain("test-item");
  });

  test("it includes item body content", () => {
    const item = new QtiItem({ identifier: "test-item" });
    item.addItemBodyFromHtml("<p>Question text here</p>");

    const xml = item.buildXml();

    expect(xml).toContain("qti-item-body");
    expect(xml).toContain("Question text here");
  });
});

describe("QtiItem.fromXmlString", () => {
  test("it parses a basic QTI item", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item identifier="item-123" title="Sample Item" label="Q1" toolName="My Tool">
        <qti-item-body></qti-item-body>
      </qti-assessment-item>`;

    const item = QtiItem.fromXmlString(xml);

    expect(item.identifier).toBe("item-123");
    expect(item.title).toBe("Sample Item");
    expect(item.label).toBe("Q1");
    expect(item.toolName).toBe("My Tool");
  });

  test("it parses response declarations with correct responses", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item identifier="item-123">
        <qti-response-declaration identifier="RESPONSE" cardinality="single" base-type="identifier">
          <qti-correct-response>
            <qti-value>choice-A</qti-value>
          </qti-correct-response>
        </qti-response-declaration>
        <qti-item-body></qti-item-body>
      </qti-assessment-item>`;

    const item = QtiItem.fromXmlString(xml);
    const generatedXml = item.buildXml();

    expect(generatedXml).toContain('identifier="RESPONSE"');
    expect(generatedXml).toContain('base-type="identifier"');
    expect(generatedXml).toContain("choice-A");
  });

  test("it parses outcome declarations", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item identifier="item-123">
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
          <qti-default-value><qti-value>0</qti-value></qti-default-value>
        </qti-outcome-declaration>
        <qti-item-body></qti-item-body>
      </qti-assessment-item>`;

    const item = QtiItem.fromXmlString(xml);
    const generatedXml = item.buildXml();

    expect(generatedXml).toContain('identifier="SCORE"');
    expect(generatedXml).toContain('base-type="float"');
  });

  test("it parses item body HTML content", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item identifier="item-123">
        <qti-item-body>
          <p>What is the capital of France?</p>
        </qti-item-body>
      </qti-assessment-item>`;

    const item = QtiItem.fromXmlString(xml);
    const generatedXml = item.buildXml();

    expect(generatedXml).toContain("What is the capital of France?");
  });

  test("it parses response processing template", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-item identifier="item-123">
        <qti-item-body></qti-item-body>
        <qti-response-processing template="${ResponseProcessingTemplate.MatchCorrect}"/>
      </qti-assessment-item>`;

    const item = QtiItem.fromXmlString(xml);
    const generatedXml = item.buildXml();

    expect(generatedXml).toContain(ResponseProcessingTemplate.MatchCorrect);
  });

  test("it throws on missing root element", () => {
    const xml = `<?xml version="1.0"?><invalid-element/>`;

    expect(() => QtiItem.fromXmlString(xml)).toThrow();
  });

  test("it throws on invalid XML", () => {
    expect(() => QtiItem.fromXmlString("not xml at all")).toThrow();
  });

  test("roundtrip: buildXml -> fromXmlString produces equivalent item", () => {
    const original = new QtiItem({
      identifier: "roundtrip-item",
      title: "Roundtrip Item",
      label: "RT1",
      language: "en",
    });
    original.addResponseDeclaration({
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: ["A"],
    });
    original.addItemBodyFromHtml("<p>Test question</p>");
    original.addResponseProcessing(ResponseProcessingTemplate.MatchCorrect);

    const xml = original.buildXml();
    const parsed = QtiItem.fromXmlString(xml);

    expect(parsed.identifier).toBe(original.identifier);
    expect(parsed.title).toBe(original.title);
    expect(parsed.label).toBe(original.label);
    expect(parsed.language).toBe(original.language);
  });

  test("parse single item", async () => {
    const xml = await readFile(
      new URL(
        "../../tests/stubs/cito-qti-assessment-item.xml",
        import.meta.url,
      ),
      "utf-8",
    );
    const item = QtiItem.fromXmlString(xml);

    expect(item.getInteractions().length).toBe(1);
    expect(item.getItemBodyHtml()).toContain(
      "Zevenblad is een plant die in Nederland veel voorkomt.",
    );

    const choice = item.getInteractions()[0] as ChoiceInteraction;
    expect(choice.choices?.length).toBe(3);
    expect(choice.choices?.[1].content).toBe("alleen ongeslachtelijk");
  });
});
