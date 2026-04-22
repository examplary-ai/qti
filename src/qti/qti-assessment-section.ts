export type QtiAssessmentSectionOptions = {
  identifier: string;
  title: string;
  visible: boolean;
  class?: string;
  fixed?: boolean;
  required?: boolean;
  keepTogether?: boolean;
};

export type QtiItemReference = {
  itemIdentifier: string;
  href: string;
};

export class QtiAssessmentSection {
  public identifier: string;
  public title: string;
  public visible: boolean;
  public class?: string;
  public fixed?: boolean;
  public required?: boolean;
  public keepTogether?: boolean;

  protected itemReferences: QtiItemReference[] = [];

  constructor(options: QtiAssessmentSectionOptions) {
    this.identifier = options.identifier;
    this.title = options.title;
    this.visible = options.visible;
    this.class = options.class;
    this.fixed = options.fixed ?? false;
    this.required = options.required ?? false;
    this.keepTogether = options.keepTogether ?? true;
  }

  public addItemReference(itemIdentifier: string, href: string) {
    this.itemReferences.push({ itemIdentifier, href });
  }

  public getItemReferences(): QtiItemReference[] {
    return this.itemReferences;
  }
}
