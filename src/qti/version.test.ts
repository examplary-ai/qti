import { describe, expect, test } from "vitest";

import { ChoiceInteraction } from "./interactions";
import { QtiAssessmentSection } from "./qti-assessment-section";
import { QtiItem, ResponseProcessingTemplate } from "./qti-item";
import { QtiTest } from "./qti-test";
import { QtiTestPart } from "./qti-test-part";
import { QtiVersion, QTI_VERSION_CONFIG } from "./types";
import { toElementName, toAttributeName } from "../utils/version";

describe("Version utilities", () => {
  test("toElementName returns QTI 3.0 names unchanged", () => {
    expect(toElementName("qti-assessment-item", QtiVersion.v3p0)).toBe(
      "qti-assessment-item",
    );
    expect(toElementName("qti-choice-interaction", QtiVersion.v3p0)).toBe(
      "qti-choice-interaction",
    );
  });

  test("toElementName converts to QTI 2.1 camelCase names", () => {
    expect(toElementName("qti-assessment-item", QtiVersion.v2p1)).toBe(
      "assessmentItem",
    );
    expect(toElementName("qti-choice-interaction", QtiVersion.v2p1)).toBe(
      "choiceInteraction",
    );
    expect(toElementName("qti-response-declaration", QtiVersion.v2p1)).toBe(
      "responseDeclaration",
    );
    expect(toElementName("qti-item-body", QtiVersion.v2p1)).toBe("itemBody");
  });

  test("toAttributeName returns QTI 3.0 names unchanged", () => {
    expect(toAttributeName("response-identifier", QtiVersion.v3p0)).toBe(
      "response-identifier",
    );
    expect(toAttributeName("base-type", QtiVersion.v3p0)).toBe("base-type");
  });

  test("toAttributeName converts to QTI 2.1 camelCase names", () => {
    expect(toAttributeName("response-identifier", QtiVersion.v2p1)).toBe(
      "responseIdentifier",
    );
    expect(toAttributeName("base-type", QtiVersion.v2p1)).toBe("baseType");
    expect(toAttributeName("max-choices", QtiVersion.v2p1)).toBe("maxChoices");
  });
});

describe("QTI 3.0 output (default)", () => {
  test("QtiItem builds QTI 3.0 XML by default", () => {
    const item = new QtiItem({
      identifier: "item-1",
      title: "Test Item",
    });
    item.addItemBodyFromHtml("<p>Question</p>");

    const xml = item.buildXml();

    expect(xml).toContain("qti-assessment-item");
    expect(xml).toContain("qti-item-body");
    expect(xml).toContain(QTI_VERSION_CONFIG[QtiVersion.v3p0].namespace);
  });

  test("QtiTest builds QTI 3.0 XML by default", () => {
    const test = new QtiTest({
      identifier: "test-1",
      title: "Test",
    });

    const xml = test.buildXml();

    expect(xml).toContain("qti-assessment-test");
    expect(xml).toContain("qti-outcome-declaration");
    expect(xml).toContain(QTI_VERSION_CONFIG[QtiVersion.v3p0].namespace);
  });

  test("ChoiceInteraction builds QTI 3.0 XML by default", () => {
    const interaction = new ChoiceInteraction({
      responseIdentifier: "RESPONSE",
      maxChoices: 1,
      choices: [{ identifier: "A", content: "Choice A" }],
    });

    const xml = interaction.buildXml();

    expect(xml).toContain("qti-choice-interaction");
    expect(xml).toContain("response-identifier");
    expect(xml).toContain("qti-simple-choice");
  });
});

describe("QTI 2.1 output", () => {
  test("QtiItem builds QTI 2.1 XML with version option", () => {
    const item = new QtiItem({
      identifier: "item-1",
      title: "Test Item",
    });
    item.addResponseDeclaration({
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
    });
    item.addItemBodyFromHtml("<p>Question</p>");

    const xml = item.buildXml({ version: QtiVersion.v2p1 });

    expect(xml).toContain("<assessmentItem");
    expect(xml).toContain("<itemBody>");
    expect(xml).toContain("<responseDeclaration");
    expect(xml).toContain('baseType="identifier"');
    expect(xml).toContain(QTI_VERSION_CONFIG[QtiVersion.v2p1].namespace);
    expect(xml).not.toContain("qti-");
    expect(xml).not.toContain("base-type");
  });

  test("QtiItem with response processing uses QTI 2.1 template URLs", () => {
    const item = new QtiItem({ identifier: "item-1" });
    item.addResponseProcessing(ResponseProcessingTemplate.MatchCorrect);
    item.addItemBodyFromHtml("<p>Question</p>");

    const xml = item.buildXml({ version: QtiVersion.v2p1 });

    expect(xml).toContain(
      QTI_VERSION_CONFIG[QtiVersion.v2p1].responseProcessingTemplates
        .matchCorrect,
    );
    expect(xml).not.toContain("purl.imsglobal.org");
  });

  test("QtiTest builds QTI 2.1 XML with version option", () => {
    const test = new QtiTest({
      identifier: "test-1",
      title: "Test",
    });
    const part = new QtiTestPart({ identifier: "part-1" });
    const section = new QtiAssessmentSection({
      identifier: "section-1",
      title: "Section 1",
      visible: true,
    });
    section.addItemReference("item-1", "item-1.xml");
    part.addSection(section);
    test.addTestPart(part);

    const xml = test.buildXml({ version: QtiVersion.v2p1 });

    expect(xml).toContain("<assessmentTest");
    expect(xml).toContain("<outcomeDeclaration");
    expect(xml).toContain("<testPart");
    expect(xml).toContain("<assessmentSection");
    expect(xml).toContain("<assessmentItemRef");
    expect(xml).toContain('baseType="float"');
    expect(xml).toContain('navigationMode="linear"');
    expect(xml).toContain(QTI_VERSION_CONFIG[QtiVersion.v2p1].namespace);
    expect(xml).not.toContain("qti-");
  });

  test("ChoiceInteraction builds QTI 2.1 XML", () => {
    const interaction = new ChoiceInteraction({
      responseIdentifier: "RESPONSE",
      maxChoices: 1,
      choices: [
        { identifier: "A", content: "Choice A" },
        { identifier: "B", content: "Choice B" },
      ],
    });

    const xml = interaction.buildXml(QtiVersion.v2p1);

    expect(xml).toContain("<choiceInteraction");
    expect(xml).toContain('responseIdentifier="RESPONSE"');
    expect(xml).toContain('maxChoices="1"');
    expect(xml).toContain("<simpleChoice");
    expect(xml).not.toContain("qti-");
    expect(xml).not.toContain("response-identifier");
  });
});

describe("QTI 2.1 parsing", () => {
  test("QtiItem.fromXmlString parses QTI 2.1 XML", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
        identifier="item-123" title="Sample Item" label="Q1">
        <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier">
          <correctResponse>
            <value>A</value>
          </correctResponse>
        </responseDeclaration>
        <outcomeDeclaration identifier="SCORE" cardinality="single" baseType="float">
          <defaultValue><value>0</value></defaultValue>
        </outcomeDeclaration>
        <itemBody>
          <p>What is the answer?</p>
        </itemBody>
        <responseProcessing template="http://www.imsglobal.org/question/qti_v2p1/rptemplates/match_correct"/>
      </assessmentItem>`;

    const item = QtiItem.fromXmlString(xml);

    expect(item.identifier).toBe("item-123");
    expect(item.title).toBe("Sample Item");
    expect(item.label).toBe("Q1");
  });

  test("QtiItem parsed from QTI 2.1 can be rebuilt as QTI 3.0", () => {
    const xml21 = `<?xml version="1.0" encoding="UTF-8"?>
      <assessmentItem xmlns="http://www.imsglobal.org/xsd/imsqti_v2p1"
        identifier="item-123" title="Sample Item">
        <responseDeclaration identifier="RESPONSE" cardinality="single" baseType="identifier"/>
        <itemBody>
          <p>Question text</p>
        </itemBody>
      </assessmentItem>`;

    const item = QtiItem.fromXmlString(xml21);
    const xml30 = item.buildXml({ version: QtiVersion.v3p0 });

    expect(xml30).toContain("qti-assessment-item");
    expect(xml30).toContain("qti-response-declaration");
    expect(xml30).toContain("qti-item-body");
  });
});

describe("QTI version roundtrip", () => {
  test("QTI 3.0 -> parse -> QTI 3.0 maintains structure", () => {
    const original = new QtiItem({
      identifier: "roundtrip-30",
      title: "Roundtrip Item",
    });
    original.addResponseDeclaration({
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: ["A"],
    });
    original.addItemBodyFromHtml("<p>Test question</p>");

    const xml1 = original.buildXml({ version: QtiVersion.v3p0 });
    const parsed = QtiItem.fromXmlString(xml1);
    const xml2 = parsed.buildXml({ version: QtiVersion.v3p0 });

    expect(parsed.identifier).toBe(original.identifier);
    expect(parsed.title).toBe(original.title);
    expect(xml2).toContain("qti-assessment-item");
  });

  test("QTI 2.1 -> parse -> QTI 2.1 maintains structure", () => {
    const original = new QtiItem({
      identifier: "roundtrip-21",
      title: "Roundtrip Item",
    });
    original.addResponseDeclaration({
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
      correctResponse: ["A"],
    });
    original.addItemBodyFromHtml("<p>Test question</p>");

    const xml1 = original.buildXml({ version: QtiVersion.v2p1 });
    const parsed = QtiItem.fromXmlString(xml1);
    const xml2 = parsed.buildXml({ version: QtiVersion.v2p1 });

    expect(parsed.identifier).toBe(original.identifier);
    expect(parsed.title).toBe(original.title);
    expect(xml2).toContain("<assessmentItem");
    expect(xml2).not.toContain("qti-");
  });

  test("QTI 3.0 -> parse -> QTI 2.1 converts correctly", () => {
    const item = new QtiItem({
      identifier: "convert-item",
      title: "Convert Item",
    });
    item.addResponseDeclaration({
      identifier: "RESPONSE",
      cardinality: "single",
      baseType: "identifier",
    });
    item.addItemBodyFromHtml("<p>Question</p>");

    const xml30 = item.buildXml({ version: QtiVersion.v3p0 });
    const parsed = QtiItem.fromXmlString(xml30);
    const xml21 = parsed.buildXml({ version: QtiVersion.v2p1 });

    expect(xml30).toContain("qti-assessment-item");
    expect(xml21).toContain("<assessmentItem");
    expect(xml21).toContain("<responseDeclaration");
    expect(xml21).toContain('baseType="identifier"');
    expect(xml21).not.toContain("qti-");
  });
});
