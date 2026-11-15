import "../styling/header.css";

export default function Header() {
  // (Sunday, November 15, 2026)
  const today = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <header className="app-header">
      <div className="header-container">
        <div className="brand-section">
          <h1 className="brand-title">MyPocket</h1>
          <p className="brand-tagline">YOUR MONEY, YOUR CONTROL</p>
        </div>

        {/* الجزء اليمين: التاريخ */}
        <div className="date-badge">
          <span>{today}</span>
        </div>
      </div>
    </header>
  );
}
