import { useEffect, useState } from "react";
import { Snowflake, TreePine, Gift, Star } from "lucide-react";
import "./holiday.css";

// Seasonal decoration never participates in booking or admin data.
export function HolidaySeason() {
  const [snow, setSnow] = useState(true);
  const [visible, setVisible] = useState(true);
  useEffect(() => {
    const change = () => setVisible(!document.hidden);
    change();
    document.addEventListener("visibilitychange", change);
    return () => document.removeEventListener("visibilitychange", change);
  }, []);
  const month = new Date().getMonth();
  if (month !== 10 && month !== 11) return null;
  return (
    <>
      <aside className="holiday-banner" aria-label="Festas de fim de ano">
        <TreePine size={20} aria-hidden="true" />
        <p>
          Seu bronze para celebrar.<span> Boas festas, com carinho da La Melanina.</span>
        </p>
        <button type="button" onClick={() => setSnow((value) => !value)} aria-pressed={snow}>
          <Snowflake size={16} aria-hidden="true" />
          {snow ? "Pausar neve" : "Ativar neve"}
        </button>
      </aside>
      <div className="holiday-garland" aria-hidden="true">
        <div className="holiday-lights">
          {Array.from({ length: 18 }, (_, i) => <i key={i} />)}
        </div>
        <div className="holiday-ornaments">
          <span className="holiday-bauble" />
          <Star className="holiday-star" size={28} />
          <span className="holiday-bauble gold" />
          <Gift className="holiday-gift" size={28} />
          <span className="holiday-bauble" />
        </div>
      </div>
      <div className={"holiday-snow" + (!snow || !visible ? " paused" : "")} aria-hidden="true">
        {Array.from({ length: 24 }, (_, i) => (
          <i
            key={i}
            style={{
              left: `${(i * 37) % 100}%`,
              animationDelay: `${-(i % 12)}s`,
              animationDuration: `${12 + (i % 7)}s`,
              width: i % 3 === 0 ? 6 : 4,
              height: i % 3 === 0 ? 6 : 4,
            }}
          />
        ))}
      </div>
    </>
  );
}
