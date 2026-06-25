import { useEffect, useMemo, useState } from "react";
import { getDesignerPortfolioItemById } from "../../shared/objects/designer-portfolio-mock.js";
import type { DesignerResubmitViewModel } from "../objects/designer-resubmit-page-types.js";

export const useDesignerResubmit = (levelId: string): DesignerResubmitViewModel => {
  const portfolioItem = useMemo(() => getDesignerPortfolioItemById(levelId), [levelId]);

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [tagsInput, setTagsInput] = useState("");
  const [revisionNotes, setRevisionNotes] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    setTitle(portfolioItem?.title ?? "");
    setDescription(portfolioItem?.description ?? "");
    setTagsInput(portfolioItem?.tags.join(", ") ?? "");
    setRevisionNotes("");
    setSubmitted(false);
  }, [portfolioItem]);

  return {
    portfolioItem,
    title,
    description,
    tagsInput,
    revisionNotes,
    submitted,
    setTitle,
    setDescription,
    setTagsInput,
    setRevisionNotes,
    handleSubmit: () => setSubmitted(true),
  };
};
