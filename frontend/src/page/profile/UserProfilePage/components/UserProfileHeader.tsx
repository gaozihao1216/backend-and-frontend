type UserProfileHeaderProps = {
  loading: boolean;
  onRefresh: () => void;
};

export const UserProfileHeader = ({ loading, onRefresh }: UserProfileHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>User Profile</h2>
      <p className="panel-copy">View published levels, recent comments, and lightweight activity stats.</p>
    </div>
    <button type="button" className="secondary" onClick={onRefresh} disabled={loading}>
      {loading ? "Refreshing..." : "Refresh Profile"}
    </button>
  </div>
);
