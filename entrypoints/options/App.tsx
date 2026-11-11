import { useEffect, useRef, useState } from "react";
import { FeatureControls } from "../../components/FeatureControls";
import { send } from "../../lib/client";
import { translations } from "../../lib/i18n";
import type { Language, Settings, Snapshot } from "../../lib/types";
import { Eyes, Icon } from "../../components/Icon";
import { SiteIcon } from "../../components/SiteIcon";

export default function App() {
  const [data, setData] = useState<Snapshot | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [confirmClear, setConfirmClear] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const t = translations(settings?.language || "en");

  useEffect(() => {
    void send<Snapshot>({ type: "SNAPSHOT" })
      .then((snapshot) => {
        setData(snapshot);
        setSettings(snapshot.settings);
      })
      .catch((cause) => setError(String(cause)));
    const changed = (changes: Record<string, chrome.storage.StorageChange>) => {
      if (changes.peerSettings?.newValue)
        setSettings(changes.peerSettings.newValue as Settings);
    };
    chrome.storage.onChanged.addListener(changed);
    return () => {
      clearTimeout(timer.current);
      chrome.storage.onChanged.removeListener(changed);
    };
  }, []);

  useEffect(() => {
    document.documentElement.lang = settings?.language || "en";
  }, [settings?.language]);

  async function save(patch: Partial<Settings>) {
    setBusy(true);
    setError("");
    try {
      const next = await send<Settings>({ type: "SETTINGS", patch });
      setSettings(next);
      setToast(translations(next.language).changed);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(""), 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function clearHistory() {
    setBusy(true);
    try {
      await send({ type: "CLEAR_HISTORY" });
      setConfirmClear(false);
      setToast(t.deleted);
      clearTimeout(timer.current);
      timer.current = setTimeout(() => setToast(""), 2200);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  async function removeEndpoint(site: string, host: string) {
    setBusy(true);
    try {
      setSettings(
        await send<Settings>({
          type: "SET_ENDPOINT",
          site,
          host,
          allowed: false,
        }),
      );
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : t.error);
    } finally {
      setBusy(false);
    }
  }

  let updated = data?.coverage.updated || "";
  const date = new Date(updated);
  if (Number.isFinite(date.getTime()))
    updated = date.toLocaleDateString(
      settings?.language === "ru" ? "ru-RU" : "en-GB",
      { day: "numeric", month: "short", year: "numeric" },
    );

  return (
    <div className="options-shell">
      <header className="options-header">
        <a className="options-wordmark" href="#" aria-label="peer">
          <Eyes />
          peer
        </a>
        <a
          className="source-button"
          href="https://github.com/crocs/peer"
          target="_blank"
          rel="noreferrer"
        >
          {t.sourceCode}
          <Icon name="external" size={13} />
        </a>
      </header>
      {error && (
        <div className="error-banner" role="alert">
          {error}
        </div>
      )}
      {!settings ? (
        <div className="options-loading">{t.loading}</div>
      ) : (
        <>
          <div className="options-heading">
            <h1>{t.settings}</h1>
            <p>{t.prefsBody}</p>
          </div>
          <div className="options-grid">
            <div className="options-main">
              <section className="settings-section">
                <div className="section-heading">
                  <h2>{t.protection}</h2>
                  <Icon name="shield" size={17} />
                </div>
                <FeatureControls
                  settings={settings}
                  disabled={busy}
                  onChange={(patch) => void save(patch)}
                />
                <div className="preference-row">
                  <div>
                    <label id="eyes-label">{t.showEyes}</label>
                    <p>{t.showEyesBody}</p>
                  </div>
                  <button
                    className="switch"
                    role="switch"
                    aria-checked={settings.eyes}
                    aria-labelledby="eyes-label"
                    disabled={busy}
                    onClick={() => void save({ eyes: !settings.eyes })}
                  />
                </div>
              </section>
              <section className="settings-section">
                <div className="section-heading">
                  <h2>{t.general}</h2>
                  <Icon name="settings" size={17} />
                </div>
                <div className="preference-row first-row">
                  <div>
                    <label htmlFor="language">{t.language}</label>
                    <p>{t.languageBody}</p>
                  </div>
                  <select
                    id="language"
                    value={settings.language}
                    disabled={busy}
                    onChange={(event) =>
                      void save({ language: event.target.value as Language })
                    }
                  >
                    <option value="en">English</option>
                    <option value="ru">Русский</option>
                  </select>
                </div>
                <div className="preference-row">
                  <div>
                    <label id="history-label">{t.historySetting}</label>
                    <p>{t.historySettingBody}</p>
                  </div>
                  <button
                    className="switch"
                    role="switch"
                    aria-checked={settings.history}
                    aria-labelledby="history-label"
                    disabled={busy}
                    onClick={() => void save({ history: !settings.history })}
                  />
                </div>
                <div className="delete-row">
                  {confirmClear ? (
                    <div className="delete-confirm">
                      <p>{t.clearConfirm}</p>
                      <div>
                        <button
                          className="secondary-button"
                          disabled={busy}
                          onClick={() => setConfirmClear(false)}
                        >
                          {t.cancel}
                        </button>
                        <button
                          className="secondary-button danger-button"
                          disabled={busy}
                          onClick={() => void clearHistory()}
                        >
                          <Icon name="trash" size={13} />
                          {t.clear}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="text-button delete-button"
                      onClick={() => setConfirmClear(true)}
                    >
                      <Icon name="trash" size={13} />
                      {t.clear}
                    </button>
                  )}
                </div>
              </section>
              <section className="settings-section">
                <div className="section-heading">
                  <h2>{t.exceptions}</h2>
                  <Icon name="pause" size={17} />
                </div>
                {settings.pausedSites.length ? (
                  <div className="exceptions-list">
                    {settings.pausedSites.map((host) => (
                      <div key={host}>
                        <SiteIcon url={`https://${host}`} size={24} />
                        <span>{host}</span>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`${t.remove}: ${host}`}
                          onClick={() =>
                            void save({
                              pausedSites: settings.pausedSites.filter(
                                (site) => site !== host,
                              ),
                            })
                          }
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="section-description no-exceptions">
                    {t.noExceptions}
                  </p>
                )}
              </section>
              {settings.allowedEndpoints.length > 0 && (
                <section className="settings-section">
                  <div className="section-heading">
                    <h2>{t.allowedEndpoints}</h2>
                  </div>
                  <div className="exceptions-list">
                    {settings.allowedEndpoints.map(({ site, host }) => (
                      <div key={site + "/" + host}>
                        <SiteIcon url={`https://${site}`} size={24} />
                        <span className="endpoint-exception">
                          {site}
                          <small>{host}</small>
                        </span>
                        <button
                          className="icon-button"
                          disabled={busy}
                          aria-label={`${t.remove} · ${site} · ${host}`}
                          onClick={() => void removeEndpoint(site, host)}
                        >
                          <Icon name="close" size={14} />
                        </button>
                      </div>
                    ))}
                  </div>
                </section>
              )}
            </div>
            <aside className="options-aside">
              <section className="coverage-card" id="coverage">
                <span className="coverage-icon">
                  <Icon name="shield" size={20} />
                </span>
                <h2>{t.coverageLabel}</h2>
                <strong>
                  {(data?.coverage.domains || 0).toLocaleString(
                    settings.language,
                  )}
                </strong>
                <span className="coverage-unit">
                  {t.domainsLabel.toLowerCase()}
                </span>
                <p>{t.coverageDetail}</p>
                <div className="coverage-source">
                  <b>{data?.coverage.source}</b>
                  <span>
                    {t.updated} {updated}
                  </span>
                </div>
              </section>
              <section className="privacy-card">
                <Icon name="lock" size={20} />
                <h2>{t.privacy}</h2>
                <p>{t.privacyBody}</p>
                <a
                  href={chrome.runtime.getURL("/privacy.html")}
                  target="_blank"
                  rel="noreferrer"
                >
                  {t.privacyPolicy}
                  <Icon name="external" size={12} />
                </a>
              </section>
              <div className="aside-note">
                <Icon name="info" size={14} />
                <p>{t.peerbackNote}</p>
              </div>
            </aside>
          </div>
          <footer className="options-footer">
            <span>peer {chrome.runtime.getManifest().version}</span>
            <span>{t.local}</span>
          </footer>
        </>
      )}
      {toast && (
        <div className="toast" role="status">
          <Icon name="check" size={14} />
          {toast}
        </div>
      )}
    </div>
  );
}
