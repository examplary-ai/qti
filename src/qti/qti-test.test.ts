import { describe, expect, test } from "vitest";

import { QtiAssessmentSection } from "./qti-assessment-section";
import { QtiTest } from "./qti-test";
import { QtiTestPart } from "./qti-test-part";

describe("QtiTest", () => {
  test("it creates a QTI test", () => {
    const qtiTest = new QtiTest();
    expect(qtiTest).toBeDefined();
  });

  test("it builds XML with correct root element", () => {
    const qtiTest = new QtiTest({ identifier: "my-test", title: "My Test" });

    const xml = qtiTest.buildXml();

    expect(xml).toContain("qti-assessment-test");
    expect(xml).toContain("my-test");
    expect(xml).toContain("My Test");
  });

  test("it includes test part and section", () => {
    const qtiTest = new QtiTest({ identifier: "my-test" });
    qtiTest.addItemReference("item-1", "item-item-1.xml");

    const xml = qtiTest.buildXml();

    expect(xml).toContain("qti-test-part");
    expect(xml).toContain("qti-assessment-section");
  });

  test("it adds item references", () => {
    const qtiTest = new QtiTest({ identifier: "my-test" });
    qtiTest.addItemReference("item-1", "item-item-1.xml");

    const xml = qtiTest.buildXml();

    expect(xml).toContain('identifier="item-1"');
    expect(xml).toContain('href="item-item-1.xml"');
  });

  test("it includes outcome declarations", () => {
    const qtiTest = new QtiTest({ identifier: "my-test" });

    const xml = qtiTest.buildXml();

    expect(xml).toContain('identifier="SCORE"');
    expect(xml).toContain('identifier="MAX_SCORE"');
  });
});

describe("QtiTest.fromXmlString", () => {
  test("it parses a basic QTI test", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-test identifier="test-123" title="Sample Test" toolName="My Tool" toolVersion="2.0">
      </qti-assessment-test>`;

    const test = QtiTest.fromXmlString(xml);

    expect(test.identifier).toBe("test-123");
    expect(test.title).toBe("Sample Test");
    expect(test.toolName).toBe("My Tool");
    expect(test.toolVersion).toBe("2.0");
  });

  test("it parses outcome declarations", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-test identifier="test-123">
        <qti-outcome-declaration identifier="SCORE" cardinality="single" base-type="float">
          <qti-default-value><qti-value>0</qti-value></qti-default-value>
        </qti-outcome-declaration>
      </qti-assessment-test>`;

    const test = QtiTest.fromXmlString(xml);
    const generatedXml = test.buildXml();

    expect(generatedXml).toContain('identifier="SCORE"');
    expect(generatedXml).toContain('base-type="float"');
  });

  test("it parses test parts with sections and item references", () => {
    const xml = `<?xml version="1.0" encoding="UTF-8"?>
      <qti-assessment-test identifier="test-123">
        <qti-test-part identifier="PART-1" navigation-mode="nonlinear" submission-mode="individual">
          <qti-assessment-section identifier="SEC-1" title="Section One" visible="true">
            <qti-assessment-item-ref identifier="item-1" href="item-1.xml"/>
            <qti-assessment-item-ref identifier="item-2" href="item-2.xml"/>
          </qti-assessment-section>
        </qti-test-part>
      </qti-assessment-test>`;

    const test = QtiTest.fromXmlString(xml);
    const generatedXml = test.buildXml();

    expect(generatedXml).toContain('identifier="PART-1"');
    expect(generatedXml).toContain('navigation-mode="nonlinear"');
    expect(generatedXml).toContain('submission-mode="individual"');
    expect(generatedXml).toContain('identifier="SEC-1"');
    expect(generatedXml).toContain('title="Section One"');
    expect(generatedXml).toContain('identifier="item-1"');
    expect(generatedXml).toContain('href="item-2.xml"');
  });

  test("it throws on missing root element", () => {
    const xml = `<?xml version="1.0"?><invalid-element/>`;

    expect(() => QtiTest.fromXmlString(xml)).toThrow();
  });

  test("it throws on invalid XML", () => {
    expect(() => QtiTest.fromXmlString("not xml at all")).toThrow();
  });

  test("roundtrip: buildXml -> fromXmlString produces equivalent test", () => {
    const original = new QtiTest({
      identifier: "roundtrip-test",
      title: "Roundtrip Test",
      language: "en",
    });

    const part = new QtiTestPart({
      identifier: "PART-1",
      navigationMode: "nonlinear",
    });
    const section = new QtiAssessmentSection({
      identifier: "SEC-1",
      title: "Section 1",
      visible: true,
    });
    section.addItemReference("q1", "q1.xml");
    part.addSection(section);
    original.addTestPart(part);

    const xml = original.buildXml();
    const parsed = QtiTest.fromXmlString(xml);

    expect(parsed.identifier).toBe(original.identifier);
    expect(parsed.title).toBe(original.title);
    expect(parsed.language).toBe(original.language);
  });
});
