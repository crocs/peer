import { companyById } from "../lib/catalog";
import type { History, Language } from "../lib/types";
import { translations } from "../lib/i18n";
import { BrandMark, Eyes, Icon } from "./Icon";
import { SiteIcon } from "./SiteIcon";

export function HistoryView({
  history,
  enabled,
  language,
  onEnable,
  busy,
}: {
  history: History;
  enabled: boolean;
  language: Language;
  onEnable: () => void;
  busy: boolean;
}) {
  const t = translations(language);
  const sites = new Map<string, Set<string>>();
  const companySites = new Map<string, Set<string>>();
  for (const day of Object.values(history)) {
    for (const [host, site] of Object.entries(day)) {
      if (!sites.has(host)) sites.set(host, new Set());
      for (const [id, counts] of Object.entries(site.companies)) {
        if (!companyById.has(id) || (!counts.blocked && !counts.observed))
          continue;
        if (id !== "other") sites.get(host)!.add(id);
        if (!companySites.has(id)) companySites.set(id, new Set());
        companySites.get(id)!.add(host);
      }
    }
  }
  const ranked = [...companySites]
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 6);
  const rankedSites = [...sites]
    .filter(([, ids]) => ids.size)
    .sort((a, b) => b[1].size - a[1].size)
    .slice(0, 4);

  if (!enabled)
    return (
      <div className="history-intro">
        <div className="empty-eyes">
          <Eyes />
        </div>
        <span className="eyebrow">{t.historyOff}</span>
        <h2>{t.historyTitle}</h2>
        <p>{t.historyBody}</p>
        <button className="primary-button" onClick={onEnable} disabled={busy}>
          {t.enableHistory}
          <Icon name="arrow" size={16} />
        </button>
        <span className="history-local">
          <Icon name="lock" size={12} />
          {t.localOnly}
        </span>
      </div>
    );

  if (!sites.size)
    return (
      <div className="history-intro">
        <div className="empty-eyes">
          <Icon name="history" size={32} />
        </div>
        <h2>{t.noHistory}</h2>
        <p>{t.noHistoryBody}</p>
      </div>
    );

  return (
    <div className="history-content">
      <div className="week-stats">
        <div>
          <strong>{sites.size}</strong>
          <span>{t.sitesVisited}</span>
        </div>
        <div>
          <strong>
            {[...companySites.keys()].filter((id) => id !== "other").length}
          </strong>
          <span>{t.companiesSeen}</span>
        </div>
      </div>
      {ranked.length > 0 && (
        <>
          <h3 className="eyebrow">{t.frequent}</h3>
          <div className="history-ranking">
            {ranked.map(([id, hosts]) => {
              const company = companyById.get(id)!;
              return (
                <div className="history-rank" key={id}>
                  <BrandMark {...company} size={32} />
                  <div className="history-rank-body">
                    <div>
                      <span>
                        {id === "other" ? t.otherTrackers : company.name}
                      </span>
                      <small>
                        {hosts.size} / {sites.size} {t.onSites}
                      </small>
                    </div>
                    <div className="bar-track">
                      <i
                        style={{ width: `${(hosts.size / sites.size) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
      {rankedSites.length > 0 && (
        <>
          <h3 className="eyebrow top-sites-title">{t.topSites}</h3>
          <div className="top-sites">
            {rankedSites.map(([host, ids]) => (
              <div key={host}>
                <SiteIcon url={`https://${host}`} size={22} />
                <span>{host}</span>
                <b>{ids.size}</b>
              </div>
            ))}
          </div>
        </>
      )}
      <p className="history-note">{t.historyNote}</p>
    </div>
  );
}
