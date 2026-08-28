import "./style.css";
import { renderDashboard } from "./components/dashboard.js";
import { getPlayer, createPlayer } from "./services/playerService.js";

const root = document.querySelector("#app");

async function start() {
  const demoPlayerId = "demo-player";
  let player = await getPlayer(demoPlayerId);

  if (!player) {
    player = await createPlayer(demoPlayerId, "Garden Player");
  }

  renderDashboard(root, player);
}

start().catch((error) => {
  console.error(error);
  root.innerHTML = `<div class="error">Firebase kon niet worden geladen. Controleer je Firebase-configuratie en database rules.</div>`;
});
