type BirdLabHeaderProps = {
  onBack: () => void;
};

export const BirdLabHeader = ({ onBack }: BirdLabHeaderProps) => (
  <div className="feature-header designer-bird-lab-header">
    <div>
      <p className="eyebrow">Bird Lab</p>
      <h2>鸟类开发实验室</h2>
      <p className="panel-copy">设计新鸟种的基础数值与三阶技能，提交后由管理员审核发布。</p>
    </div>
    <div className="designer-bird-lab-header-actions">
      <div className="feature-pill">设计实验室</div>
      <button type="button" className="secondary" onClick={onBack}>
        返回主页
      </button>
    </div>
  </div>
);
