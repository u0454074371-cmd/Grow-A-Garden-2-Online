export function mountApp(root,state){
 root.innerHTML=`
 <div class="app">
  <header><h1>🌱 Grow Garden 2</h1><div id="stats"></div></header>
  <section class="panel"><div class="badge">ONLINE</div><h2>Garden Control</h2>
  <p>Online profiel, crops, pets en economie.</p>
  <div class="actions">
   <button data-action="seeds">Seed Shop</button>
   <button data-action="pets">Pet Shop</button>
   <button data-action="inventory">Inventory</button>
  </div></section>
  <section id="content" class="panel"></section>
 </div>`;
 updateStats(state);return root;
}
export function updateStats(s){
 const e=document.querySelector("#stats");if(e)e.innerHTML=`🪙 ${s?.coins||0} &nbsp; 💎 ${s?.gems||0} &nbsp; ⭐ Lv.${s?.level||1}`;
}
