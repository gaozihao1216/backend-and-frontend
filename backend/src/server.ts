import { createApp } from "./app.js";

const port = 3000;
const host = "127.0.0.1";
const app = createApp();

// server.ts 只负责启动监听，真正的中间件和路由装配都放在 app.ts。
app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
