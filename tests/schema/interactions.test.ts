import { describe, expect, test } from "vitest";

import { validateQtiXml } from "./validate-xml";
import {
  AssociateInteraction,
  ChoiceInteraction,
  DrawingInteraction,
  EndAttemptInteraction,
  ExtendedTextInteraction,
  GapMatchInteraction,
  GraphicAssociateInteraction,
  GraphicGapMatchInteraction,
  GraphicOrderInteraction,
  HotspotInteraction,
  HottextInteraction,
  InlineChoiceInteraction,
  MatchInteraction,
  MediaInteraction,
  OrderInteraction,
  PortableCustomInteraction,
  PositionObjectInteraction,
  QtiInteraction,
  QtiItem,
  QtiVersion,
  SelectPointInteraction,
  SliderInteraction,
  TextEntryInteraction,
  UploadInteraction,
} from "../../src";

/**
 * Schema validation for every interaction type the library can generate, in
 * both QTI versions. Each fixture is embedded in a minimal assessment item and
 * validated against the official 1EdTech ASI schema.
 */

const TIMEOUT = 60_000;
const RESPONSE = "RESPONSE";
const image = { data: "image.png", type: "image/png", width: 400, height: 300 };

type InteractionFixture = {
  name: string;
  /**
   * The interaction, or a factory when its embedded markup differs by version
   * (e.g. qti-gap vs gap).
   */
  interaction: QtiInteraction | ((version: QtiVersion) => QtiInteraction);
  /**
   * Interaction types that have no QTI 2.1 equivalent in this library's output
   * and are therefore only validated against QTI 3.0.
   */
  v3Only?: boolean;
};

/** Element names embedded in raw markup differ between QTI versions. */
const tag = (version: QtiVersion, qti3Name: string): string =>
  version === QtiVersion.v3p0 ? qti3Name : qti3Name.replace(/^qti-/, "");

const FIXTURES: InteractionFixture[] = [
  {
    name: "choice",
    interaction: new ChoiceInteraction({
      responseIdentifier: RESPONSE,
      maxChoices: 1,
      prompt: "Pick one",
      choices: [
        { identifier: "A", content: "Apple" },
        { identifier: "B", content: "Banana" },
      ],
    }),
  },
  {
    name: "order",
    interaction: new OrderInteraction({
      responseIdentifier: RESPONSE,
      choices: [
        { identifier: "A", content: "First" },
        { identifier: "B", content: "Second" },
        { identifier: "C", content: "Third" },
      ],
    }),
  },
  {
    name: "associate",
    interaction: new AssociateInteraction({
      responseIdentifier: RESPONSE,
      maxAssociations: 1,
      choices: [
        { identifier: "A", content: "Cat", matchMax: 1 },
        { identifier: "B", content: "Dog", matchMax: 1 },
      ],
    }),
  },
  {
    name: "match",
    interaction: new MatchInteraction({
      responseIdentifier: RESPONSE,
      maxAssociations: 2,
      sourceChoices: [
        { identifier: "S1", content: "Paris", matchMax: 1 },
        { identifier: "S2", content: "London", matchMax: 1 },
      ],
      targetChoices: [
        { identifier: "T1", content: "France", matchMax: 1 },
        { identifier: "T2", content: "England", matchMax: 1 },
      ],
    }),
  },
  {
    name: "gap-match",
    interaction: (version) =>
      new GapMatchInteraction({
        responseIdentifier: RESPONSE,
        maxAssociations: 1,
        gapTexts: [
          { identifier: "gt1", matchMax: 1, content: "Paris" },
          { identifier: "gt2", matchMax: 1, content: "London" },
        ],
        content: `<p>The capital of France is <${tag(version, "qti-gap")} identifier="G1"/>.</p>`,
      }),
  },
  {
    name: "inline-choice",
    interaction: new InlineChoiceInteraction({
      responseIdentifier: RESPONSE,
      inlineChoices: [
        { identifier: "A", content: "is" },
        { identifier: "B", content: "are" },
      ],
    }),
  },
  {
    name: "text-entry",
    interaction: new TextEntryInteraction({
      responseIdentifier: RESPONSE,
      expectedLength: 10,
    }),
  },
  {
    name: "extended-text",
    interaction: new ExtendedTextInteraction({
      responseIdentifier: RESPONSE,
      expectedLines: 5,
    }),
  },
  {
    name: "hottext",
    interaction: (version) => {
      const hottext = tag(version, "qti-hottext");
      return new HottextInteraction({
        responseIdentifier: RESPONSE,
        maxChoices: 1,
        content: `<p>Select the <${hottext} identifier="H1">noun</${hottext}> in this sentence.</p>`,
      });
    },
  },
  {
    name: "hotspot",
    interaction: new HotspotInteraction({
      responseIdentifier: RESPONSE,
      maxChoices: 1,
      object: image,
      hotspotChoices: [
        { identifier: "A", shape: "circle", coords: "100,100,20" },
      ],
    }),
  },
  {
    name: "select-point",
    interaction: new SelectPointInteraction({
      responseIdentifier: RESPONSE,
      maxChoices: 1,
      object: image,
    }),
  },
  {
    name: "graphic-order",
    interaction: new GraphicOrderInteraction({
      responseIdentifier: RESPONSE,
      object: image,
      hotspotChoices: [
        { identifier: "A", shape: "circle", coords: "100,100,20" },
        { identifier: "B", shape: "circle", coords: "200,150,20" },
      ],
    }),
  },
  {
    name: "graphic-associate",
    interaction: new GraphicAssociateInteraction({
      responseIdentifier: RESPONSE,
      maxAssociations: 1,
      object: image,
      associableHotspots: [
        { identifier: "A", shape: "circle", coords: "100,100,15", matchMax: 1 },
        { identifier: "B", shape: "circle", coords: "200,100,15", matchMax: 1 },
      ],
    }),
  },
  {
    name: "graphic-gap-match",
    interaction: new GraphicGapMatchInteraction({
      responseIdentifier: RESPONSE,
      maxAssociations: 1,
      object: image,
      gapImgs: [
        {
          identifier: "img1",
          matchMax: 1,
          objectData: "label1.png",
          objectType: "image/png",
        },
      ],
      associableHotspots: [
        {
          identifier: "gap1",
          shape: "rect",
          coords: "50,50,100,80",
          matchMax: 1,
        },
      ],
    }),
  },
  {
    name: "position-object",
    interaction: new PositionObjectInteraction({
      responseIdentifier: RESPONSE,
      maxChoices: 1,
      object: { data: "marker.png", type: "image/png", width: 20, height: 20 },
      positionObjectStage: image,
    }),
  },
  {
    name: "slider",
    interaction: new SliderInteraction({
      responseIdentifier: RESPONSE,
      lowerBound: 0,
      upperBound: 100,
      step: 10,
    }),
  },
  {
    name: "media",
    interaction: new MediaInteraction({
      responseIdentifier: RESPONSE,
      minPlays: 1,
      maxPlays: 3,
      object: { data: "audio.mp3", type: "audio/mpeg" },
    }),
  },
  {
    name: "upload",
    interaction: new UploadInteraction({
      responseIdentifier: RESPONSE,
      fileType: "application/pdf",
    }),
  },
  {
    name: "drawing",
    interaction: new DrawingInteraction({
      responseIdentifier: RESPONSE,
      object: image,
    }),
  },
  {
    name: "end-attempt",
    interaction: new EndAttemptInteraction({
      responseIdentifier: RESPONSE,
      title: "Give up",
    }),
  },
  {
    name: "portable-custom",
    // QTI 2.1 has no qti-portable-custom-interaction equivalent in this library.
    v3Only: true,
    interaction: new PortableCustomInteraction({
      responseIdentifier: RESPONSE,
      module: "my-module",
      customInteractionTypeIdentifier: "urn:example:pci:my-interaction",
      markup: "<div>custom interaction</div>",
    }),
  },
];

function buildItem(fixture: InteractionFixture, version: QtiVersion): string {
  const item = new QtiItem({
    identifier: `item-${fixture.name}`,
    title: `${fixture.name} item`,
    timeDependent: false,
  });
  item.addItemBodyFromHtml("<p>Answer the question below.</p>");
  const interaction =
    typeof fixture.interaction === "function"
      ? fixture.interaction(version)
      : fixture.interaction;
  item.addInteraction(interaction);
  return item.buildXml({ version });
}

describe.each([QtiVersion.v3p0, QtiVersion.v2p1])(
  "QTI %s interaction items",
  (version) => {
    const fixtures = FIXTURES.filter(
      (fixture) => !(fixture.v3Only && version === QtiVersion.v2p1),
    );

    test.each(fixtures)(
      "$name interaction is schema-valid",
      async (fixture) => {
        const result = await validateQtiXml(buildItem(fixture, version));
        expect(
          result.valid,
          `Invalid ${version} ${fixture.name} item:\n${result.errors.join("\n")}`,
        ).toBe(true);
      },
      TIMEOUT,
    );
  },
);

test("position-object interaction wraps the interaction in its stage", () => {
  const item = new QtiItem({ identifier: "po-item", timeDependent: false });
  item.addInteraction(
    new PositionObjectInteraction({
      responseIdentifier: RESPONSE,
      maxChoices: 1,
      object: { data: "marker.png", type: "image/png", width: 20, height: 20 },
      positionObjectStage: image,
    }),
  );

  const xml = item.buildXml();
  // The stage (background) must contain the interaction, not the other way round.
  expect(xml).toMatch(
    /<qti-position-object-stage>[\s\S]*<qti-position-object-interaction/,
  );

  const parsed = QtiItem.fromXmlString(xml);
  const interaction = parsed.getInteractions()[0] as PositionObjectInteraction;
  expect(interaction.object.data).toBe("marker.png");
  expect(interaction.positionObjectStage?.data).toBe("image.png");
});
