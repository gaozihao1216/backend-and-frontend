import type { ReviewSubmissionInput, Submission } from "../../shared/types.js";
import { submissions } from "../data/store.js";
import { HttpError } from "../lib/http.js";
import { levelService } from "./level-service.js";

const now = () => new Date().toISOString();

export class SubmissionService {
  submitLevel(levelId: string, submitterId: string): Submission {
    const existingPending = submissions.find(
      (submission) =>
        submission.levelId === levelId && submission.status === "pending_review",
    );

    if (existingPending) {
      throw new HttpError(409, "SUBMISSION_EXISTS", "Level already has a pending submission");
    }

    levelService.markPendingReview(levelId);

    const submission: Submission = {
      id: `submission-${submissions.length + 1}`,
      levelId,
      submitterId,
      status: "pending_review",
      submittedAt: now(),
    };

    submissions.push(submission);
    return submission;
  }

  getPendingSubmissions(): Submission[] {
    return submissions.filter((submission) => submission.status === "pending_review");
  }

  reviewSubmission(
    submissionId: string,
    reviewerId: string,
    input: ReviewSubmissionInput,
  ): Submission {
    const submission = submissions.find((candidate) => candidate.id === submissionId);

    if (!submission) {
      throw new HttpError(404, "SUBMISSION_NOT_FOUND", "Submission not found");
    }

    if (submission.status !== "pending_review") {
      throw new HttpError(409, "INVALID_SUBMISSION_STATUS", "Submission has already been reviewed");
    }

    submission.status = input.status;
    submission.reviewerId = reviewerId;
    if (input.reviewNote) {
      submission.reviewNote = input.reviewNote;
    } else {
      delete submission.reviewNote;
    }
    submission.reviewedAt = now();

    if (input.status === "approved") {
      levelService.publishLevel(submission.levelId);
    } else {
      levelService.rejectLevel(submission.levelId, input.reviewNote);
    }

    return submission;
  }
}

export const submissionService = new SubmissionService();
