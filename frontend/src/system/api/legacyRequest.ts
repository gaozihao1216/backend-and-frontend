import { z } from "zod";
import { ApiErrorSchema, createSuccessResponseSchema } from "./contracts.js";
import { API_BASE_URL } from "../app/config.js";

const JsonHeadersSchema = z.record(z.string(), z.string());
const REQUEST_TIMEOUT_MS = 10_000;

type RpcRequest = {
  apiName: string;
  payload: Record<string, unknown>;
};

const parseBody = (body: BodyInit | null | undefined): Record<string, unknown> => {
  if (typeof body !== "string" || body.trim().length === 0) {
    return {};
  }
  const parsed = JSON.parse(body) as unknown;
  return z.record(z.string(), z.unknown()).parse(parsed);
};

const queryObject = (searchParams: URLSearchParams): Record<string, string> => {
  const result: Record<string, string> = {};
  for (const [key, value] of searchParams.entries()) {
    result[key] = value;
  }
  return result;
};

const requirePart = (parts: string[], index: number, path: string): string => {
  const value = parts[index];
  if (!value) {
    throw new Error(`Cannot map API path to RPC payload: ${path}`);
  }
  return decodeURIComponent(value);
};

const normalizeStretchKind = (segment: string): "panel" | "pattern" => {
  if (segment === "panel-templates") return "panel";
  if (segment === "pattern-templates") return "pattern";
  throw new Error(`Unknown stretch template segment: ${segment}`);
};

const routeToRpcRequest = (path: string, init: RequestInit): RpcRequest | null => {
  if (path === "/health") {
    return null;
  }

  const url = new URL(path, "http://frontend.local");
  if (url.pathname.startsWith("/api/")) {
    const apiName = url.pathname.split("/").filter(Boolean)[1] ?? "";
    const body = parseBody(init.body);
    return {
      apiName,
      payload: apiName === "bindbackenduserapi" ? { request: body } : body,
    };
  }

  const method = (init.method ?? "GET").toUpperCase();
  const body = parseBody(init.body);
  const parts = url.pathname.split("/").filter(Boolean);
  const query = queryObject(url.searchParams);

  const rpc = (apiName: string, payload: Record<string, unknown> = {}): RpcRequest => ({ apiName, payload });

  if (url.pathname === "/auth/backend-users" && method === "GET") return rpc("getbackendusersapi");
  if (url.pathname === "/auth/bind" && method === "POST") return rpc("bindbackenduserapi", { request: body });
  if (parts[0] === "users" && parts[2] === "profile" && method === "GET") {
    return rpc("getuserprofileapi", { profileUserId: requirePart(parts, 1, path) });
  }

  if (url.pathname === "/designer/levels" && method === "POST") return rpc("createlevelapi", { body });
  if (url.pathname === "/designer/submissions" && method === "POST") return rpc("submitlevelapi", { body });

  if (parts[0] === "designer" && parts[1] === "bird-designs") {
    if (parts.length === 2 && method === "GET") return rpc("listbirddesignsapi", query);
    if (parts.length === 2 && method === "POST") return rpc("createbirddesignapi", { body });
    const designId = requirePart(parts, 2, path);
    if (parts.length === 3 && method === "PUT") return rpc("updatebirddesignapi", { designId, body });
    if (parts.length === 3 && method === "DELETE") return rpc("deletebirddesignapi", { designId });
    if (parts[3] === "submit" && method === "POST") return rpc("submitbirddesignapi", { designId });
  }

  if (parts[0] === "player" && parts[1] === "levels") {
    if (parts.length === 2 && method === "GET") return rpc("getpublishedlevelsapi", query);
    const levelId = requirePart(parts, 2, path);
    if (parts.length === 3 && method === "GET") return rpc("getpublishedlevelapi", { levelId });
    if (parts[3] === "comments" && method === "GET") return rpc("getlevelcommentsapi", { levelId });
    if (parts[3] === "comments" && method === "POST") return rpc("createcommentapi", { levelId, body });
    if (parts[3] === "ratings" && method === "POST") return rpc("ratelevelapi", { levelId, body });
    if (parts[3] === "favorite" && method === "POST") return rpc("favoritelevelapi", { levelId });
    if (parts[3] === "favorite" && method === "DELETE") return rpc("unfavoritelevelapi", { levelId });
  }
  if (url.pathname === "/player/favorites" && method === "GET") return rpc("getfavoritelevelsapi");

  if (url.pathname === "/admin/comments" && method === "GET") return rpc("getadmincommentsapi");
  if (parts[0] === "admin" && parts[1] === "comments" && method === "DELETE") {
    return rpc("deletecommentapi", { commentId: requirePart(parts, 2, path) });
  }
  if (url.pathname === "/admin/submissions/pending" && method === "GET") return rpc("getpendingsubmissionsapi");
  if (parts[0] === "admin" && parts[1] === "submissions" && parts[3] === "review" && method === "POST") {
    return rpc("reviewsubmissionapi", { submissionId: requirePart(parts, 2, path), body });
  }
  if (url.pathname === "/admin/bird-submissions/pending" && method === "GET") return rpc("getpendingbirdsubmissionsapi");
  if (parts[0] === "admin" && parts[1] === "bird-submissions" && parts[3] === "review" && method === "POST") {
    return rpc("reviewbirdsubmissionapi", { submissionId: requirePart(parts, 2, path), body });
  }
  if (url.pathname === "/admin/audit-logs" && method === "GET") return rpc("listadminauditlogsapi", query);

  if (parts[0] === "admin" && parts[1] === "shop" && parts[2] === "items") {
    if (parts.length === 3 && method === "GET") return rpc("listadminshopitemsapi");
    if (parts.length === 3 && method === "POST") return rpc("createshopitemapi", { body });
    const itemId = requirePart(parts, 3, path);
    if (method === "PUT") return rpc("updateshopitemapi", { itemId, body });
    if (method === "DELETE") return rpc("deactivateshopitemapi", { itemId });
  }

  if (url.pathname === "/admin/director/permissions" && method === "GET") return rpc("getdirectorpermissionsapi");
  if (url.pathname === "/admin/director/transfer" && method === "POST") {
    return rpc("transferdirectorpermissionapi", { body });
  }
  if (url.pathname === "/admin/director/level-assignments/board" && method === "GET") {
    return rpc("getdirectorlevelassignmentboardapi");
  }
  if (parts[0] === "admin" && parts[1] === "director" && parts[2] === "level-assignments") {
    const levelSuffix = requirePart(parts, 3, path);
    if (parts.length === 4 && method === "POST") return rpc("assignlevelslotapi", { levelSuffix, body });
    if (parts.length === 4 && method === "DELETE") return rpc("unassignlevelslotapi", { levelSuffix });
    if (parts[4] === "bird-pool" && method === "PUT") return rpc("updatelevelslotbirdpoolapi", { levelSuffix, body });
  }
  if (parts[0] === "admin" && parts[1] === "director" && parts[2] === "submissions" && parts[4] === "abolish") {
    return rpc("abolishdirectorsubmissionapi", { submissionId: requirePart(parts, 3, path), body });
  }
  if (url.pathname === "/admin/director/bird-skills/board" && method === "GET") {
    return rpc("getdirectorbirdskillboardapi");
  }
  if (parts[0] === "admin" && parts[1] === "director" && parts[2] === "bird-skills") {
    const birdType = requirePart(parts, 3, path);
    if (method === "GET") return rpc("getdirectorbirdskillapi", { birdType });
    if (method === "PUT") return rpc("savedirectorbirdskillapi", { birdType, ...body });
  }

  if (url.pathname === "/player/preparation" && method === "GET") return rpc("getpreparationstateapi");
  if (parts[0] === "player" && parts[1] === "preparation" && parts[2] === "birds") {
    const birdType = requirePart(parts, 3, path);
    if (parts[4] === "upgrade" && method === "POST") return rpc("upgradepreparationbirdapi", { birdType });
    if (parts[4] === "ascend" && method === "POST") return rpc("ascendpreparationbirdapi", { birdType });
  }
  if (url.pathname === "/player/preparation/slingshot/upgrade" && method === "POST") {
    return rpc("upgradepreparationslingshotapi");
  }

  if (url.pathname === "/player/social/friends" && method === "GET") return rpc("listfriendsapi");
  if (url.pathname === "/player/social/friends" && method === "POST") {
    return rpc("addfriendapi", { friendUserId: body.friendUserId });
  }
  if (url.pathname === "/player/social/messages" && method === "GET") {
    return rpc("listmessagesapi", { withUserId: query.withUserId ?? "" });
  }
  if (url.pathname === "/player/social/messages" && method === "POST") {
    return rpc("sendmessageapi", { receiverId: body.receiverId, content: body.content });
  }

  if (parts[0] === "player" && parts[1] === "ui" && parts[2] === "data" && method === "GET") {
    return rpc("getplayeruidataapi", { apiKey: requirePart(parts, 3, path), params: query });
  }
  if (parts[0] === "player" && parts[1] === "ui" && parts[2] === "actions" && method === "POST") {
    return rpc("invokeplayeruiactionapi", { apiKey: requirePart(parts, 3, path), params: body.params ?? {} });
  }

  if (url.pathname === "/player/ui/level-map" && method === "GET") return rpc("getsharedlevelmappageapi");
  if (parts[0] === "player" && parts[1] === "ui" && parts[2] === "pages" && method === "GET") {
    return rpc("getplayeruipageapi", { pageId: requirePart(parts, 3, path) });
  }

  if (parts[0] === "admin" && parts[1] === "director" && parts[2] === "ui") {
    if (parts[3] === "pages") {
      if (parts.length === 4 && method === "GET") return rpc("listuipagesapi", query);
      if (parts.length === 4 && method === "POST") return rpc("createuipageapi", { body });
      const pageId = requirePart(parts, 4, path);
      if (parts.length === 5 && method === "GET") return rpc("getuipageapi", { pageId });
      if (parts.length === 5 && method === "PUT") return rpc("updateuipageapi", { pageId, body });
      if (parts.length === 5 && method === "DELETE") return rpc("deleteuipageapi", { pageId });
      if (parts[5] === "publish" && method === "POST") return rpc("publishuipageapi", { pageId, body });
      if (parts[5] === "rollback" && method === "POST") return rpc("rollbackuipageapi", { pageId });
      if (parts[5] === "components") {
        if (parts.length === 6 && method === "POST") return rpc("createpagecomponentapi", { pageId, body });
        const componentId = requirePart(parts, 6, path);
        if (method === "PUT") return rpc("updatepagecomponentapi", { pageId, componentId, body });
        if (method === "DELETE") return rpc("deletepagecomponentapi", { pageId, componentId });
      }
    }

    if (parts[3] === "button-templates") {
      if (parts.length === 4 && method === "GET") return rpc("listbuttontemplatesapi");
      if (parts.length === 4 && method === "POST") return rpc("createbuttontemplateapi", { body });
      const templateId = requirePart(parts, 4, path);
      if (method === "GET") return rpc("getbuttontemplateapi", { templateId });
      if (method === "PUT") return rpc("updatebuttontemplateapi", { templateId, body });
      if (method === "DELETE") return rpc("deletebuttontemplateapi", { templateId });
    }

    if (parts[3] === "panel-templates" || parts[3] === "pattern-templates") {
      const kind = normalizeStretchKind(parts[3]);
      if (parts.length === 4 && method === "GET") return rpc("liststretchvisualtemplatesapi", { kind });
      if (parts.length === 4 && method === "POST") return rpc("createstretchvisualtemplateapi", { expectedKind: kind, body });
      const templateId = requirePart(parts, 4, path);
      if (method === "PUT") return rpc("updatestretchvisualtemplateapi", { expectedKind: kind, templateId, body });
      if (method === "DELETE") return rpc("deletestretchvisualtemplateapi", { expectedKind: kind, templateId });
    }

    if (parts[3] === "panel-workflows" && parts[5] === "check-in-rewards" && method === "PUT") {
      return rpc("registercheckinpanelrewardsapi", { panelId: requirePart(parts, 4, path), slots: body.slots ?? [] });
    }
  }

  throw new Error(`No RPC mapping for ${method} ${path}`);
};

const parseApiResponse = async <T>(
  response: Response,
  dataSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> => {
  const rawBody = await response.text();
  const contentType = response.headers.get("content-type") ?? "unknown";

  if (rawBody.trim().length === 0) {
    throw new Error(
      `Backend returned an empty response (${response.status} ${response.statusText}) for ${response.url || "the request"}.`,
    );
  }

  let payload: unknown;
  try {
    payload = JSON.parse(rawBody) as unknown;
  } catch {
    if (!response.ok) {
      const responseUrl = response.url || "the request";
      const bodyHint = rawBody.trim() ? ` Response body: ${rawBody.trim()}` : "";
      throw new Error(
        `Backend returned ${response.status} ${response.statusText} for ${responseUrl}. The route may be missing from the running backend; restart the backend and try again.${bodyHint}`,
      );
    }

    throw new Error(
      `Backend returned a non-JSON response (${response.status} ${response.statusText}, content-type: ${contentType}).`,
    );
  }

  if (!response.ok) {
    const error = z.object({
      success: z.literal(false),
      error: ApiErrorSchema,
    }).safeParse(payload);
    if (error.success) {
      throw new Error(error.data.error.message);
    }
    throw new Error("Request failed");
  }

  const successSchema = createSuccessResponseSchema(dataSchema);
  const parsed = successSchema.parse(payload);
  return parsed.data as T;
};

export const request = async <T>(
  path: string,
  init: RequestInit,
  responseSchema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Promise<T> => {
  const rpcRequest = routeToRpcRequest(path, init);
  const effectivePath = rpcRequest ? `/api/${rpcRequest.apiName}` : path;
  const effectiveInit: RequestInit = rpcRequest
    ? { ...init, method: "POST", body: JSON.stringify(rpcRequest.payload) }
    : init;

  const headers = JsonHeadersSchema.parse({
    "content-type": "application/json",
    ...effectiveInit.headers,
  });

  const requestUrl = `${API_BASE_URL}${effectivePath}`;
  let response: Response;
  const abortController = new AbortController();
  const timeoutId = window.setTimeout(() => {
    abortController.abort();
  }, REQUEST_TIMEOUT_MS);

  try {
    response = await fetch(requestUrl, {
      ...effectiveInit,
      headers,
      signal: abortController.signal,
    });
  } catch (error) {
    window.clearTimeout(timeoutId);
    if (error instanceof DOMException && error.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s for ${effectivePath}. Check that the frontend can reach the backend and that the backend is responding.`,
      );
    }
    const target = API_BASE_URL || "the current frontend origin";
    const message = error instanceof Error ? error.message : "Unknown network error";
    throw new Error(
      `Cannot reach backend via ${target}. Start the backend on http://localhost:3000 and use the Vite dev server proxy, or set VITE_API_BASE_URL. Original error: ${message}`,
    );
  } finally {
    window.clearTimeout(timeoutId);
  }

  return parseApiResponse(response, responseSchema);
};
