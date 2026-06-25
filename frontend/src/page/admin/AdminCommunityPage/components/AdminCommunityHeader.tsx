type AdminCommunityHeaderProps = {
  commentCount: number;
};

export const AdminCommunityHeader = ({ commentCount }: AdminCommunityHeaderProps) => (
  <div className="feature-header">
    <div>
      <h2>社区管理</h2>
      <p className="panel-copy">集中查看玩家评论，识别不当内容并执行删除治理。</p>
    </div>
    <div className="feature-pill">评论 {commentCount}</div>
  </div>
);
