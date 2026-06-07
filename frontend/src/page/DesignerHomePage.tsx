type DesignerHomePageProps = {
  onOpenDesignWindow: () => void;
  onOpenPortfolio: () => void;
};

export const DesignerHomePage = ({
  onOpenDesignWindow,
  onOpenPortfolio,
}: DesignerHomePageProps) => {
  return (
    <section className="panel">
      <h2>设计师主页</h2>
      <p className="panel-copy">
        管理你的关卡作品集，或进入设计窗口继续创作。复杂编辑状态都放在独立设计页中。
      </p>
      <div className="actions">
        <button type="button" onClick={onOpenPortfolio}>
          作品集
        </button>
        <button type="button" className="secondary" onClick={onOpenDesignWindow}>
          设计窗口
        </button>
      </div>
    </section>
  );
};
