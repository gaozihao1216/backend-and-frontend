type DesignerHomePageProps = {
  onOpenDesignWindow: () => void;
};

export const DesignerHomePage = ({ onOpenDesignWindow }: DesignerHomePageProps) => {
  return (
    <section className="panel">
      <h2>Designer Home</h2>
      {/* 主页只做入口分发，真正复杂的编辑状态都放在独立设计页。 */}
      <p className="panel-copy">这是设计师主页。设计窗口已拆分为独立页面，点击下方入口进入。</p>
      <div className="actions">
        <button type="button" onClick={onOpenDesignWindow}>
          设计窗口
        </button>
      </div>
    </section>
  );
};
