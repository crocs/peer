import { browser } from "wxt/browser";
import type { Message } from "./types";

export async function send<T>(message: Message): Promise<T> {
  const response = await browser.runtime.sendMessage(message);
  if (response?.error) throw new Error(response.error);
  return response as T;
}
