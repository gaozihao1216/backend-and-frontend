import { useEffect, useState } from "react";
import { getPendingSubmissions, reviewSubmission } from "../lib/api.js";
import { API_USERS } from "../lib/config.js";
import type { Submission } from "../../shared/types.js";

type AdminPageProps = {
  userId?: string;
};

export const AdminPage = ({ userId = API_USERS.admin.id }: AdminPageProps) => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [reviewNotes, setReviewNotes] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadPending = async () => {
    setLoading(true);
    setError("");

    try {
      const pending = await getPendingSubmissions(userId);
      setSubmissions(pending);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to load submissions");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void loadPending();
  }, []);

  const handleReview = async (
    submissionId: string,
    status: "approved" | "rejected",
  ) => {
    setError("");

    try {
      const reviewNote = reviewNotes[submissionId]?.trim();
      const input = {
        status,
        ...(reviewNote ? { reviewNote } : {}),
      };
      await reviewSubmission(userId, submissionId, input);
      await loadPending();
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Failed to review submission");
    }
  };

  return (
    <section className="panel">
      <h2>Admin</h2>
      <p className="panel-copy">Review pending submissions and approve or reject them.</p>

      <button type="button" onClick={() => void loadPending()} disabled={loading}>
        {loading ? "Refreshing..." : "Refresh Pending"}
      </button>

      {error ? <p className="feedback error">{error}</p> : null}

      <div className="list">
        {submissions.length === 0 && !loading ? <p>No pending submissions.</p> : null}
        {submissions.map((submission) => (
          <article key={submission.id} className="card">
            <div className="card-header">
              <strong>{submission.id}</strong>
              <span>{submission.status}</span>
            </div>
            <p className="meta">Level ID: {submission.levelId}</p>
            <p className="meta">Submitter ID: {submission.submitterId}</p>
            <label>
              <span>Review Note</span>
              <textarea
                rows={3}
                value={reviewNotes[submission.id] ?? ""}
                onChange={(event) =>
                  setReviewNotes((current) => ({
                    ...current,
                    [submission.id]: event.target.value,
                  }))
                }
              />
            </label>
            <div className="actions">
              <button type="button" onClick={() => void handleReview(submission.id, "approved")}>
                Approve
              </button>
              <button
                type="button"
                className="secondary"
                onClick={() => void handleReview(submission.id, "rejected")}
              >
                Reject
              </button>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};
