type PageFeedbackProps = {
  error?: string;
  notice?: string;
};

export const PageFeedback = ({ error, notice }: PageFeedbackProps) => (
  <>
    {error ? <p className="feedback error">{error}</p> : null}
    {notice ? <p className="feedback success">{notice}</p> : null}
  </>
);
