import "./ui/style.css";
import { anonymousLogin,watchAuth } from "./auth/auth.js";
import { ensurePlayer } from "./services/playerService.js";
import { mountApp,updateStats } from "./ui/app.js";
import { renderSeedShop,renderPetShop } from "./ui/shop.js";

const root=document.querySelector("#app");
root.innerHTML="<div class='panel'><h2>Grow Garden 2</h2><p>Verbinden met Firebase...</p></div>";

watchAuth(async user=>{
 if(!user)return;
 const player=await ensurePlayer(user.uid,user.displayName||"Garden Player");
 mountApp(root,player);
 const content=document.querySelector("#content");
 document.querySelectorAll("[data-action]").forEach(b=>b.onclick=()=>{
   if(b.dataset.action==="seeds")renderSeedShop(content,()=>{});
   if(b.dataset.action==="pets")renderPetShop(content,()=>{});
   if(b.dataset.action==="inventory")content.innerHTML="<h2>Inventory</h2><pre>"+JSON.stringify(player.seeds,null,2)+"</pre>";
 });
 updateStats(player);
}).catch(e=>root.innerHTML=`<div class="panel"><h2>Firebase fout</h2><p>${e.message}</p></div>`);

anonymousLogin().catch(e=>console.error(e));
