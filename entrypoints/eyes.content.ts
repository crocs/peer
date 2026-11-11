import { browser } from "wxt/browser";
import { cleanLink } from "../lib/links";
import type { Language, PageMessage } from "../lib/types";

export default defineContentScript({
  matches: ["http://*/*", "https://*/*"],
  runAt: "document_start",
  main(ctx) {
    let config:
      | {
          blocking: boolean;
          cleanLinks: boolean;
          eyes: boolean;
          paused: boolean;
          language: Language;
        }
      | undefined;
    let host: HTMLElement | undefined;
    let root: ShadowRoot | undefined;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let helpTimer: ReturnType<typeof setTimeout> | undefined;
    let hidden = false;

    const strings = () =>
      config?.language === "ru"
        ? {
            open: "Открыть peer",
            hide: "Скрыть глаза на этой странице",
            protected: "Защита включена",
            see: "Режим наблюдения",
            paused: "Пауза на этом сайте",
            help: "Открой peer на панели расширений",
          }
        : {
            open: "Open peer",
            hide: "Hide eyes on this page",
            protected: "Protection is on",
            see: "Observation mode",
            paused: "Paused on this site",
            help: "Open peer from your browser toolbar",
          };

    function render() {
      if (!config || !config.eyes || hidden || document.fullscreenElement) {
        host?.remove();
        host = undefined;
        root = undefined;
        return;
      }
      if (!document.body) return;
      if (!host) {
        host = document.createElement("peer-companion");
        host.style.cssText =
          "all:initial!important;position:fixed!important;bottom:18px!important;right:18px!important;z-index:2147483646!important;display:block!important;width:68px!important;height:39px!important;color-scheme:dark!important;";
        root = host.attachShadow({ mode: "open" });
        root.innerHTML = `<style>
          :host{all:initial}*{box-sizing:border-box}button{font:11px -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;cursor:pointer}button:focus-visible{outline:2px solid #41424a;outline-offset:3px}.wrap{position:relative;width:68px;height:39px}.main{display:flex;align-items:center;justify-content:center;gap:3px;width:68px;height:39px;padding:6px 10px;border:1px solid #d6d6dc;background:#fffffff5;border-radius:24px;box-shadow:0 3px 18px #00000014;backdrop-filter:blur(12px)}.eye{position:relative;display:block;width:16px;height:23px;background:#41424a;border-radius:50%;overflow:hidden;transition:transform .12s,background .2s}.pupil{position:absolute;display:block;width:7px;height:12px;top:5px;left:7px;background:#ffffff;border-radius:50%}.main.see .eye{background:#8b8c95}.main.paused{opacity:.6}.blink .eye{animation:blink .3s ease-in-out}.closed .eye{transform:scaleY(.12)}.tooltip{position:absolute;right:0;bottom:48px;white-space:nowrap;max-width:250px;padding:8px 11px;border:1px solid #d6d6dc;background:#ffffff;color:#41424a;border-radius:9px;box-shadow:0 3px 18px #00000018;font:11px/1.4 -apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;opacity:0;pointer-events:none;transform:translateY(4px);transition:opacity .15s,transform .15s}.wrap:hover .tooltip,.wrap:focus-within .tooltip,.wrap.help .tooltip{opacity:1;transform:translateY(0)}.dismiss{position:absolute;right:-5px;top:-6px;width:17px;height:17px;display:flex;align-items:center;justify-content:center;padding:0;line-height:1;border:1px solid #d6d6dc;border-radius:50%;background:#ffffff;color:#64656f;opacity:0;transition:opacity .15s}.wrap:hover .dismiss,.wrap:focus-within .dismiss{opacity:1}@keyframes blink{0%,100%{transform:scaleY(1)}50%{transform:scaleY(.12)}}@media(prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
          </style><div class="wrap"><button class="main" type="button"><span class="eye"><i class="pupil"></i></span><span class="eye"><i class="pupil"></i></span></button><span class="tooltip" role="status"></span><button class="dismiss" type="button">×</button></div>`;
        root.querySelector(".main")!.addEventListener("click", () => {
          void browser.runtime
            .sendMessage({ type: "OPEN_POPUP" })
            .then((result) => {
              if (result?.error) throw new Error(result.error);
            })
            .catch(() => {
              if (!root) return;
              root.querySelector(".tooltip")!.textContent = strings().help;
              root.querySelector(".wrap")!.classList.add("help");
              clearTimeout(helpTimer);
              helpTimer = setTimeout(() => {
                root?.querySelector(".wrap")?.classList.remove("help");
                render();
              }, 3500);
            });
        });
        root.querySelector(".dismiss")!.addEventListener("click", () => {
          hidden = true;
          host?.remove();
        });
        document.documentElement.appendChild(host);
      }
      const t = strings();
      const main = root!.querySelector(".main")!;
      main.setAttribute("aria-label", t.open);
      main.classList.toggle("see", !config.blocking);
      main.classList.toggle("paused", config.paused);
      root!.querySelector(".dismiss")!.setAttribute("aria-label", t.hide);
      root!.querySelector(".tooltip")!.textContent = config.paused
        ? t.paused
        : !config.blocking
          ? t.see
          : t.protected;
    }

    function animate(closed = false) {
      const main = root?.querySelector(".main");
      if (!main) return;
      main.classList.remove("blink", "closed");
      void main.getBoundingClientRect();
      main.classList.add(closed ? "closed" : "blink");
      clearTimeout(blinkTimer);
      blinkTimer = setTimeout(
        () => main.classList.remove("blink", "closed"),
        closed ? 650 : 330,
      );
    }

    function onMessage(message: PageMessage) {
      if (message.type === "PEER_STATE") {
        config = message;
        render();
      } else if (message.type === "PEER_ACTIVITY") animate();
      else if (message.type === "PEER_BLOCKED") animate(true);
    }

    function onLink(event: Event) {
      if (!config?.cleanLinks || config.paused || event.defaultPrevented)
        return;
      const target =
        event.target instanceof Element
          ? event.target.closest("a[href]")
          : null;
      if (
        !(target instanceof HTMLAnchorElement) ||
        target.hasAttribute("download")
      )
        return;
      const cleaned = cleanLink(target.href);
      if (cleaned.removed.length) target.href = cleaned.url;
    }

    browser.runtime.onMessage.addListener(onMessage);
    ctx.addEventListener(document, "click", onLink, true);
    ctx.addEventListener(document, "auxclick", onLink, true);
    ctx.addEventListener(document, "DOMContentLoaded", render);
    ctx.addEventListener(document, "fullscreenchange", render);
    void browser.runtime
      .sendMessage({ type: "PAGE_READY" })
      .then((result) => {
        if (result && !result.error) {
          config = result;
          render();
        }
      })
      .catch(() => {});
    ctx.onInvalidated(() => {
      clearTimeout(blinkTimer);
      clearTimeout(helpTimer);
      host?.remove();
      browser.runtime.onMessage.removeListener(onMessage);
    });
  },
});
