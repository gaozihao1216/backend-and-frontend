package microservice.model

sealed trait UserRole {
  def value: String
}

object UserRole {
  case object Player extends UserRole {
    override val value: String = "player"
  }

  case object Designer extends UserRole {
    override val value: String = "designer"
  }

  case object Admin extends UserRole {
    override val value: String = "admin"
  }
}

sealed trait LevelStatus {
  def value: String
}

object LevelStatus {
  case object Draft extends LevelStatus {
    override val value: String = "draft"
  }

  case object PendingReview extends LevelStatus {
    override val value: String = "pending_review"
  }

  case object Published extends LevelStatus {
    override val value: String = "published"
  }

  case object Rejected extends LevelStatus {
    override val value: String = "rejected"
  }
}

sealed trait SubmissionStatus {
  def value: String
}

object SubmissionStatus {
  case object PendingReview extends SubmissionStatus {
    override val value: String = "pending_review"
  }

  case object Approved extends SubmissionStatus {
    override val value: String = "approved"
  }

  case object Rejected extends SubmissionStatus {
    override val value: String = "rejected"
  }
}

sealed trait LevelTag {
  def value: String
}

object LevelTag {
  case object Puzzle extends LevelTag {
    override val value: String = "puzzle"
  }

  case object Hard extends LevelTag {
    override val value: String = "hard"
  }

  case object Beginner extends LevelTag {
    override val value: String = "beginner"
  }

  case object Funny extends LevelTag {
    override val value: String = "funny"
  }

  case object Strategy extends LevelTag {
    override val value: String = "strategy"
  }
}

sealed trait PublishedLevelsSort {
  def value: String
}

object PublishedLevelsSort {
  case object Newest extends PublishedLevelsSort {
    override val value: String = "newest"
  }

  case object HighestRated extends PublishedLevelsSort {
    override val value: String = "highestRated"
  }

  case object MostRated extends PublishedLevelsSort {
    override val value: String = "mostRated"
  }
}
