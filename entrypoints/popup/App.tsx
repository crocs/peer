import { browser } from "wxt/browser";
import { useCallback, useEffect, useRef, useState } from "react";
import { BrandMark, Eyes, Icon } from "../../components/Icon";
import { SiteIcon } from "../../components/SiteIcon";
import { FeatureControls } from "../../components/FeatureControls";
import { HistoryView } from "../../components/HistoryView";
import { companyById } from "../../lib/catalog";
import { send } from "../../lib/client";
import { translations } from "../../lib/i18n";
import { endpointException } from "../../lib/settings";
import type { Settings, Snapshot } from "../../lib/types";

export default function App() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [view, setView] = useState<"site" | "history">("site");
  const [expanded, setExpanded] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [reload, setReload] = useState(false);
  const loading = useRef(false);
  const queued = useRef(false);
  const refreshOnOpen = useRef(true);
  const tabId = useRef<number | undefined>(undefined);
  const t = translations(data?.settings.language || "en");

  const load = useCallback(async function refresh() {
    if (loading.current) {
      queued.current = true;
      return;
    }
    loading.current = true;
    try {
      const snapshot = await send<Snapshot>({
        type: "SNAPSHOT",
        tabId: tabId.current,
        refresh: refreshOnOpen.current,
      });
      if (snapshot.tab) tabId.current = snapshot.tab.id;
      refreshOnOpen.current = false;
      setData(snapshot);
      document.documentElement.lang = snapshot.settings.language;
      setError("");
    } catch (cause) {
      setError(
        cause instanceof Error ? cause.message : "Could not connect to peer.",
      );
    } finally {
      loading.current = false;
      if (queued.current) {
        queued.current = false;
        void refresh();
      }
    }
  }, []);

  useEffect(() => {
    void load();
    let timer: ReturnType<typeof setTimeout> | undefined;
    const update = () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        void load();
      }, 180);
    };
    browser.storage.onChanged.addListener(update);
    return () => {
      clearTimeout(timer);
      browser.storage.onChanged.removeListener(update);
    };
  }, [load]);

  async function update(patch: Partial<Settings>) {
    setBusy(true);
    try {
      const next = await send<Settings>({ type: "SETTINGS", patch });
      setData((current) =>
        current ? { ...current, settings: next } : current,
      );
      if (patch.blocking !== undefined && patch.blocking !== data?.settings.blocking)
        setReload(true);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function togglePause() {
    if (!data?.tab?.supported) return;
    setBusy(true);
    try {
      await send({
        type: "PAUSE_SITE",
        host: data.tab.host,
        paused: !data.paused,
      });
      setReload(true);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function reloadPage() {
    if (!data?.tab) return;
    try {
      await browser.tabs.reload(data.tab.id);
      setReload(false);
      setExpanded(null);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    }
  }

  async function toggleEndpoint(host: string) {
    if (!data?.tab) return;
    const site = data.tab.host;
    const existing = endpointException(
      data.settings.allowedEndpoints,
      site,
      host,
    );
    setBusy(true);
    try {
      await send({
        type: "SET_ENDPOINT",
        site: existing?.site ?? site,
        host: existing?.host ?? host,
        allowed: !existing,
      });
      setReload(true);
      await load();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  const version = browser.runtime.getManifest().version;
  const supported = !!data?.tab?.supported;
  const active =
    data?.activity
      .filter((item) => companyById.has(item.companyId))
      .sort(
        (a, b) =>
          Number(a.companyId === "other") - Number(b.companyId === "other"),
      ) || [];
  const namedCount = active.filter((item) => item.companyId !== "other").length;
  const domains = new Set(active.flatMap((item) => item.domains)).size;
  const showBlocked = !!data?.settings.blocking && data.blockedAvailable;
  const requests = active.reduce(
    (sum, item) => sum + (showBlocked ? item.blocked : item.observed),
    0,
  );
  const label = data?.paused
    ? t.paused
    : data?.settings.blocking && data.settings.cleanLinks
      ? t.allActive
      : data?.settings.blocking
        ? t.protectionOn
        : data?.settings.cleanLinks
          ? t.onlyClean
          : t.observation;

  return (
    <div className="popup">
      <header className="popup-header">
        <button
          className="wordmark"
          onClick={() => setView("site")}
          aria-label="peer"
        >
          <Eyes />
          peer
        </button>
        <div className="header-actions">
          <button
            className={`icon-button ${view === "history" ? "is-current" : ""}`}
            aria-label={t.week}
            title={t.week}
            onClick={() => setView(view === "history" ? "site" : "history")}
          >
            <Icon name="history" size={18} />
          </button>
          <button
            className="icon-button"
            title={t.settings}
            aria-label={t.settings}
            onClick={() => void browser.runtime.openOptionsPage()}
          >
            <Icon name="settings" size={18} />
          </button>
        </div>
      </header>
      {error && (
        <div className="popup-error error-banner" role="alert">
          <span>{error}</span>
          <button
            className="text-button"
            aria-label={t.close}
            onClick={() => setError("")}
          >
            <Icon name="close" size={14} />
          </button>
        </div>
      )}
      {!data ? (
        <div className="loading-state">
          {error ? (
            <button className="secondary-button" onClick={() => void load()}>
              {t.retry}
            </button>
          ) : (
            t.loading
          )}
        </div>
      ) : view === "history" ? (
        <main className="week-view">
          <div className="history-view-title">
            <button
              className="icon-button"
              aria-label={t.site}
              onClick={() => setView("site")}
            >
              <Icon name="chevron" size={15} />
            </button>
            <h1>{t.historyTitle}</h1>
          </div>
          <HistoryView
            history={data.history}
            enabled={data.settings.history}
            language={data.settings.language}
            onEnable={() => void update({ history: true })}
            busy={busy}
          />
        </main>
      ) : (
        <main className="site-view">
          <section className="site-head">
            <SiteIcon url={data.tab?.url || ""} size={36} />
            <div className="site-identity">
              <h1 title={data.tab?.host}>
                {supported
                  ? data.tab!.host.replace(/^www\./, "")
                  : t.unavailable}
              </h1>
              <span
                className={`site-caption ${data.paused ? "is-paused" : ""}`}
              >
                <i />
                {supported ? label : t.restricted}
              </span>
            </div>
            {supported && (
              <button
                className="site-switch switch"
                role="switch"
                aria-label={t.sitePauseLabel}
                aria-checked={!data.paused}
                title={data.paused ? t.resume : t.pause}
                disabled={busy}
                onClick={() => void togglePause()}
              />
            )}
          </section>
          {!supported ? (
            <div className="restricted-state">
              <div className="empty-eyes">
                <Icon name="lock" size={27} />
              </div>
              <h2>{t.restricted}</h2>
              <p>{t.restrictedBody}</p>
            </div>
          ) : (
            <>
              <section className="page-summary" aria-label={t.summary}>
                <div className="request-summary" aria-live="polite">
                  <strong>
                    {requests.toLocaleString(data.settings.language)}
                  </strong>
                  <span>{showBlocked ? t.blocked : t.requests}</span>
                </div>
                <div className="summary-side">
                  <span>
                    {t.companiesLabel}
                    <b>{namedCount}</b>
                  </span>
                  <span>
                    {t.domainCount}
                    <b>{domains}</b>
                  </span>
                </div>
              </section>
              <FeatureControls
                settings={data.settings}
                compact
                disabled={busy}
                onChange={(patch) => void update(patch)}
              />
              {reload && (
                <div className="reload-bar">
                  <span>{t.reloadHint}</span>
                  <button onClick={() => void reloadPage()}>
                    <Icon name="refresh" size={12} />
                    {t.reload}
                  </button>
                </div>
              )}
              <div className="activity-section-title">
                <h2>{t.seeActivity}</h2>
                <span title={showBlocked ? t.verified : t.observed}>
                  {showBlocked ? t.stopped : t.attempts}
                  <Icon name="info" size={12} />
                </span>
              </div>
              <div className="company-list">
                {active.length ? (
                  active.map((item) => {
                    const company = companyById.get(item.companyId)!;
                    const open = expanded === company.id;
                    const countBlocked = showBlocked && item.blocked > 0;
                    const count = countBlocked
                      ? item.blocked
                      : item.observed || item.blocked;
                    return (
                      <article
                        key={company.id}
                        className={`company-entry ${open ? "expanded" : ""}`}
                      >
                        <button
                          className="company-row"
                          aria-expanded={open}
                          onClick={() => setExpanded(open ? null : company.id)}
                        >
                          <BrandMark {...company} size={34} />
                          <span className="company-name">
                            {company.id === "other"
                              ? t.otherTrackers
                              : company.name}
                            <small>
                              {company.id === "other"
                                ? t.otherServices
                                : t[
                                    company.category === "advertising"
                                      ? "ad"
                                      : company.category
                                  ]}
                            </small>
                          </span>
                          <span className="company-request-count">
                            <b>{count}</b>
                            <small>
                              {countBlocked
                                ? t.stopped
                                : item.observed
                                  ? t.attempts
                                  : t.stopped}
                            </small>
                          </span>
                          <Icon name="chevron" size={13} />
                        </button>
                        {open && (
                          <div className="company-detail">
                            <h3>
                              {company.id === "other"
                                ? t.requestDetails
                                : t.couldCollect}
                            </h3>
                            {company.id !== "other" && (
                              <div className="signal-tags">
                                {company.signals[data.settings.language].map(
                                  (signal) => (
                                    <span key={signal}>{signal}</span>
                                  ),
                                )}
                              </div>
                            )}
                            {item.example && (
                              <div className="match-evidence">
                                <strong>{t.lastMatch}</strong>
                                <code>{item.example.host}</code>
                                <span>
                                  {item.example.source === "cname"
                                    ? t.matchedCname
                                    : item.example.source === "easyPrivacy"
                                      ? t.matchedEasyPrivacy
                                      : t.matchedCatalog}
                                </span>
                                {item.example.pattern && (
                                  <code>{item.example.pattern}</code>
                                )}
                              </div>
                            )}
                            <p>{company.purpose[data.settings.language]}</p>
                            {company.id !== "other" && (
                              <p className="explanation-note">
                                {t.explanation}
                              </p>
                            )}
                            {item.domains.length > 0 && (
                              <div className="endpoint-list">
                                <span>{t.domain}</span>
                                {item.domains.map((host) => {
                                  const exception = endpointException(
                                    data.settings.allowedEndpoints,
                                    data.tab!.host,
                                    host,
                                  );
                                  const label = exception
                                    ? t.undoAllow
                                    : t.allowHere;
                                  return (
                                    <div className="endpoint-row" key={host}>
                                      <code>{host}</code>
                                      <button
                                        className="text-button"
                                        disabled={busy}
                                        aria-label={`${label} · ${host}`}
                                        title={t.endpointScope}
                                        onClick={() =>
                                          void toggleEndpoint(host)
                                        }
                                      >
                                        {label}
                                      </button>
                                    </div>
                                  );
                                })}
                              </div>
                            )}
                            <a
                              className="source-link"
                              href={company.source}
                              target="_blank"
                              rel="noreferrer"
                            >
                              {t.learn}
                              <Icon name="external" size={11} />
                            </a>
                          </div>
                        )}
                      </article>
                    );
                  })
                ) : (
                  <div className="no-trackers">
                    <span className="quiet-check">
                      <Icon name="check" size={21} />
                    </span>
                    <h3>{t.noActivity}</h3>
                    <p>{t.emptyDescription}</p>
                  </div>
                )}
              </div>
              {!data.blockedAvailable &&
                data.settings.blocking &&
                active.length > 0 && (
                  <div className="limited-note" title={t.limited}>
                    <Icon name="info" size={11} />
                    {t.observedOnly}
                  </div>
                )}
            </>
          )}
        </main>
      )}
      <footer className="popup-footer">
        <span>
          <Icon name="lock" size={10} />
          {t.local}
        </span>
        <span>{version}</span>
      </footer>
    </div>
  );
}
