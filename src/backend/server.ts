import { createApp } from "./app.js";

const port = 3000;
const host = "127.0.0.1";
const app = createApp();

app.listen(port, host, () => {
  console.log(`Server listening on http://${host}:${port}`);
});
