import type { ExtensionAPI } from "@earendil-works/pi-coding-agent";
import { registerReadThread } from "../extensions/read-thread.ts";

export default function (pi: ExtensionAPI) {
  registerReadThread(pi, { directRead: true });
}
