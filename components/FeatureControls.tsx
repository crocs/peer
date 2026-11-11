import { Icon } from "./Icon";
import type { Language, Settings } from "../lib/types";
import { translations } from "../lib/i18n";
import "./features.css";

export function FeatureControls({
  settings,
  onChange,
  disabled,
  compact = false,
}: {
  settings: Settings;
  onChange: (patch: Partial<Settings>) => void;
  disabled: boolean;
  compact?: boolean;
}) {
  const t = translations(settings.language as Language);
  const count = 1 + Number(settings.blocking) + Number(settings.cleanLinks);
  return (
    <section
      className={`features ${compact ? "features-compact" : "features-full"}`}
      aria-label={t.protection}
    >
      <div className="features-heading">
        <span>{t.layers}</span>
        {count === 3 ? (
          <span className="layers-active">
            <Icon name="check" size={11} />
            {t.allEnabled}
          </span>
        ) : (
          <button
            className="enable-all"
            disabled={disabled}
            onClick={() => onChange({ blocking: true, cleanLinks: true })}
          >
            {t.enableAll}
          </button>
        )}
      </div>
      <div className="feature-items">
        <div
          className="feature-tile is-on fixed-feature"
          title={t.detectionBody}
        >
          <span className="feature-label">
            <Icon name="eye" size={15} />
            <b>See</b>
          </span>
          <span className="feature-caption">
            {compact ? t.detectionShort : t.detectionBody}
          </span>
          <span className="feature-check fixed-check" aria-label={t.alwaysOn}>
            <Icon name="lock" size={10} />
          </span>
        </div>
        {(
          [
            {
              key: "blocking",
              name: "Block",
              icon: "shield",
              short: t.blockingShort,
              body: t.blockingBody,
            },
            {
              key: "cleanLinks",
              name: "Peer back",
              icon: "spark",
              short: t.cleaningShort,
              body: t.cleaningBody,
            },
          ] as const
        ).map((feature) => (
          <button
            key={feature.key}
            type="button"
            role="switch"
            aria-checked={settings[feature.key]}
            aria-label={
              feature.key === "blocking" ? t.blockingLabel : t.cleaningLabel
            }
            className={`feature-tile ${settings[feature.key] ? "is-on" : ""}`}
            title={feature.body}
            disabled={disabled}
            onClick={() => onChange({ [feature.key]: !settings[feature.key] })}
          >
            <span className="feature-label">
              <Icon name={feature.icon} size={15} />
              <b>{feature.name}</b>
            </span>
            <span className="feature-caption">
              {compact ? feature.short : feature.body}
            </span>
            <span className="feature-check">
              {settings[feature.key] && <Icon name="check" size={10} />}
            </span>
          </button>
        ))}
      </div>
    </section>
  );
}
