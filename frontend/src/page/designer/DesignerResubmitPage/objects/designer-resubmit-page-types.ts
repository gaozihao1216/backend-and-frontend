import type { DesignerPortfolioItem } from "../../shared/objects/designer-portfolio-mock.js";

export type DesignerResubmitPageProps = {
  levelId: string;
  onBack: () => void;
};

export type DesignerResubmitViewModel = {
  portfolioItem: DesignerPortfolioItem | undefined;
  title: string;
  description: string;
  tagsInput: string;
  revisionNotes: string;
  submitted: boolean;
  setTitle: (value: string) => void;
  setDescription: (value: string) => void;
  setTagsInput: (value: string) => void;
  setRevisionNotes: (value: string) => void;
  handleSubmit: () => void;
};
