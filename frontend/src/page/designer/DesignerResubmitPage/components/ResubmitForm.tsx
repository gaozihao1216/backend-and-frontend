import type { DesignerResubmitViewModel } from "../objects/designer-resubmit-page-types.js";

type ResubmitFormProps = {
  vm: DesignerResubmitViewModel;
  onBack: () => void;
};

export const ResubmitForm = ({ vm, onBack }: ResubmitFormProps) => (
  <form
    className="designer-resubmit-form"
    onSubmit={(event) => {
      event.preventDefault();
      vm.handleSubmit();
    }}
  >
    <label>
      <span>关卡标题</span>
      <input
        value={vm.title}
        onChange={(event) => vm.setTitle(event.target.value)}
        placeholder="请输入关卡标题"
      />
    </label>

    <label>
      <span>关卡描述</span>
      <textarea
        rows={4}
        value={vm.description}
        onChange={(event) => vm.setDescription(event.target.value)}
        placeholder="简要说明玩法目标与改动点"
      />
    </label>

    <label>
      <span>标签</span>
      <input
        value={vm.tagsInput}
        onChange={(event) => vm.setTagsInput(event.target.value)}
        placeholder="用逗号分隔，例如：岩石, 高难度"
      />
    </label>

    <label>
      <span>本次修改说明</span>
      <textarea
        rows={4}
        value={vm.revisionNotes}
        onChange={(event) => vm.setRevisionNotes(event.target.value)}
        placeholder="说明针对驳回意见做了哪些调整，便于审核员快速复核"
      />
    </label>

    <div className="actions">
      <button type="submit" disabled={vm.submitted || !vm.title.trim() || !vm.description.trim()}>
        {vm.submitted ? "已记录（演示）" : "重新提交审核"}
      </button>
      <button type="button" className="secondary" onClick={onBack}>
        取消
      </button>
    </div>

    {vm.submitted ? (
      <p className="feedback success">
        表单已填写完成（静态演示）。接入 API 后，此处会真正发起重新提交流程。
      </p>
    ) : null}
  </form>
);
