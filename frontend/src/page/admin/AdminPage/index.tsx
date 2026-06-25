import { AdminProposalReviewContent } from "./components/AdminProposalReviewContent.js";
import { API_USERS } from "../../../lib/config.js";
import type { AdminPageProps } from "./objects/admin-page-types.js";

export const AdminPage = ({ userId = API_USERS.admin.id }: AdminPageProps) => (
  <section className="panel admin-review-page">
    <h2>提案处理</h2>
    <p className="panel-copy">审核设计师提交的关卡与鸟类设计提案。</p>
    <AdminProposalReviewContent userId={userId} />
  </section>
);
