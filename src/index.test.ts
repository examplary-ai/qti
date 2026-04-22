import { describe, expect, test } from "vitest";

import {
  ImsPackage,
  QtiTest,
  QtiItem,
  ResponseProcessingTemplate,
  TextEntryInteraction,
} from ".";
import { ChoiceInteraction } from "./qti/interactions/choice-interaction";

describe("Qti package", () => {
  test("putting it all together", async () => {
    const pkg = new ImsPackage({
      identifier: "my-test",
      title: "My Test",
      language: "en",
      toolName: "Examplary AI",
      toolVersion: "1.0.0",
    });

    const test = new QtiTest({
      identifier: "my-test",
      title: "My Test",
      language: "en",
      toolName: "Examplary AI",
      toolVersion: "1.0.0",
    });

    const item = new QtiItem({
      identifier: "item-1",
      title: "Sample Question",
    });
    item.addOutcomeDeclaration({
      identifier: "SCORE",
      cardinality: "single",
      baseType: "float",
      defaultValue: 0,
    });
    item.addResponseDeclaration({
      identifier: "RESPONSE",
      correctResponse: ["4"],
    });

    item.addItemBodyFromHtml("<p>What is 2 + 2?</p>");
    item.addInteraction(
      new TextEntryInteraction({
        responseIdentifier: "RESPONSE",
      }),
    );

    item.addInteraction(
      new ChoiceInteraction({
        responseIdentifier: "RESPONSE",
        prompt: "Choose the correct answer:",
        choices: [
          { identifier: "A", content: "<p>3</p>" },
          { identifier: "B", content: "<p>4</p>" },
          { identifier: "C", content: "<p>5</p>" },
        ],
      }),
    );

    item.addResponseProcessing(ResponseProcessingTemplate.MatchCorrect);

    item.addToTest(test);

    await item.addToPackage(pkg);
    await test.addToPackage(pkg);

    const zip = await pkg.generateZip();

    // const writeFile = await import("fs/promises").then(mod => mod.writeFile);
    // await writeFile("/tmp/qti-test-output.zip", Buffer.from(zip));
    // console.log("/tmp/qti-test-output.zip");

    expect(pkg.manifest.getResources().length).toBe(2);
    expect(Object.keys(pkg.zip.files).length).toBe(3);

    expect(zip).toBeInstanceOf(ArrayBuffer);
  });
});
