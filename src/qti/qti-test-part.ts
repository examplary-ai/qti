import { QtiAssessmentSection } from "./qti-assessment-section";

export type QtiTestPartOptions = {
  identifier: string;
  title?: string;
  class?: string;
  navigationMode?: "linear" | "nonlinear";
  submissionMode?: "individual" | "simultaneous";
};

export class QtiTestPart {
  public identifier: string;
  public title?: string;
  public class?: string;

  public navigationMode: "linear" | "nonlinear";
  public submissionMode: "individual" | "simultaneous";

  protected sections: QtiAssessmentSection[] = [];

  constructor(options: QtiTestPartOptions) {
    this.identifier = options.identifier;
    this.title = options.title;
    this.class = options.class;
    this.navigationMode = options.navigationMode ?? "linear";
    this.submissionMode = options.submissionMode ?? "simultaneous";
  }

  public addSection(section: QtiAssessmentSection) {
    this.sections.push(section);
  }

  public getSections(): QtiAssessmentSection[] {
    return this.sections;
  }
}
