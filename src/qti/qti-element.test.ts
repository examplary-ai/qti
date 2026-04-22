import { describe, expect, test } from "vitest";

import { QtiItem } from "./qti-item";

/**
 * Tests for QtiElement base class functionality.
 * We use QtiItem as the concrete implementation to test the abstract class.
 */
describe("QtiElement", () => {
  describe("buildXml", () => {
    test("it builds XML with pretty print", () => {
      const item = new QtiItem({ identifier: "test-item" });
      const xml = item.buildXml();

      expect(xml).toContain("<?xml");
      expect(xml).toContain("qti-assessment-item");
      expect(xml).toContain("test-item");
    });
  });

  describe("registerNamespace", () => {
    test("it registers a custom namespace", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );

      const xml = item.buildXml();

      expect(xml).toContain(
        'xmlns:examplary="http://examplary.ai/xsd/examplary_v1p0"',
      );
    });

    test("it supports multiple namespaces", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.registerNamespace("custom", "http://example.com/custom");

      const xml = item.buildXml();

      expect(xml).toContain(
        'xmlns:examplary="http://examplary.ai/xsd/examplary_v1p0"',
      );
      expect(xml).toContain('xmlns:custom="http://example.com/custom"');
    });
  });

  describe("addNamespacedElement", () => {
    test("it adds element with string content", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.addNamespacedElement(
        "examplary",
        "scoring-criteria",
        "rubric-based",
      );

      const xml = item.buildXml();

      expect(xml).toContain(
        "<examplary:scoring-criteria>rubric-based</examplary:scoring-criteria>",
      );
    });

    test("it adds element with attributes", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.addNamespacedElement(
        "examplary",
        "scoring-criteria",
        "rubric-based",
        {
          version: "1.0",
          type: "holistic",
        },
      );

      const xml = item.buildXml();

      expect(xml).toContain("examplary:scoring-criteria");
      expect(xml).toContain('version="1.0"');
      expect(xml).toContain('type="holistic"');
      expect(xml).toContain("rubric-based");
    });

    test("it adds element with object content", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.addNamespacedElement("examplary", "scoring-criteria", {
        type: "holistic",
        rubric: {
          level: "A",
          description: "Excellent work",
        },
      });

      const xml = item.buildXml();

      expect(xml).toContain("<examplary:scoring-criteria>");
      expect(xml).toContain("<examplary:type>holistic</examplary:type>");
      expect(xml).toContain("<examplary:rubric>");
      expect(xml).toContain("<examplary:level>A</examplary:level>");
      expect(xml).toContain(
        "<examplary:description>Excellent work</examplary:description>",
      );
    });

    test("it adds multiple elements", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.addNamespacedElement(
        "examplary",
        "scoring-criteria",
        "rubric-based",
      );
      item.addNamespacedElement("examplary", "difficulty", "medium");
      item.addNamespacedElement("examplary", "topic", "mathematics");

      const xml = item.buildXml();

      expect(xml).toContain(
        "<examplary:scoring-criteria>rubric-based</examplary:scoring-criteria>",
      );
      expect(xml).toContain(
        "<examplary:difficulty>medium</examplary:difficulty>",
      );
      expect(xml).toContain("<examplary:topic>mathematics</examplary:topic>");
    });

    test("it adds elements with different namespaces", () => {
      const item = new QtiItem({ identifier: "test-item" });
      item.registerNamespace(
        "examplary",
        "http://examplary.ai/xsd/examplary_v1p0",
      );
      item.registerNamespace("custom", "http://example.com/custom");
      item.addNamespacedElement("examplary", "metadata", "value1");
      item.addNamespacedElement("custom", "data", "value2");

      const xml = item.buildXml();

      expect(xml).toContain("<examplary:metadata>value1</examplary:metadata>");
      expect(xml).toContain("<custom:data>value2</custom:data>");
    });
  });
});
