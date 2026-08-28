export function renderDashboard(root, player) {
  const safe = player ?? { displayName: "Player", coins: 0, gems: 0, level: 1, xp: 0 };

  root.innerHTML = `
    <main class="dashboard">
      <header class="topbar">
        <h1>🌱 Grow Garden 2</h1>
        <div class="stats">
          <span>🪙 ${safe.coins ?? 0}</span>
          <span>💎 ${safe.gems ?? 0}</span>
          <span>⭐ Level ${safe.level ?? 1}</span>
        </div>
      </header>

      <section class="hero">
        <div>
          <p class="eyebrow">ONLINE GARDEN</p>
          <h2>Welkom, ${safe.displayName}</h2>
          <p>Beheer je tuin, crops, pets en progressie vanuit één online profiel.</p>
        </div>
      </section>

      <section class="cards">
        <article><strong>Garden</strong><span>Je tuinstatus wordt hier gekoppeld.</span></article>
        <article><strong>Pets</strong><span>Pets en multipliers.</span></article>
        <article><strong>Shop</strong><span>Seeds en limited items.</span></article>
      </section>
    </main>
  `;
}
