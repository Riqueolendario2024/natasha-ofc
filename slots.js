import crypto from "crypto";

export function createSlotMachineMessage(jid, initialCredits = 500) {
  const payloadHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
*{box-sizing:border-box}
html,body{margin:0;width:100%;overflow:hidden;background:transparent;font-family:-apple-system,BlinkMacSystemFont,Segoe UI,Roboto,sans-serif;overscroll-behavior:none}
body{padding:6px;background:radial-gradient(circle at 50% 10%,#1f0a2e,#0a0414 60%,#020105)}
.machine{position:relative;overflow:hidden;padding:12px 14px 16px;border:3px solid #6b1fb3;border-radius:22px;background:linear-gradient(135deg,#0d031a,#2a084e 25%,#110426 60%,#3d0c6e 85%,#0d031a);box-shadow:inset 0 0 0 2px #d580ff,inset 0 0 20px #a824fd44,0 8px 25px #000c}
.lights{height:8px;margin:0 10px 8px;border:2px solid #a824fd;border-radius:6px;background:repeating-radial-gradient(circle at 6px 50%,#fff 0 2px,#d580ff 3px 5px,#41066d 6px 12px);box-shadow:0 0 10px #d580ff;animation:lights .6s steps(2) infinite}
.title{padding:8px 4px;border:2px solid #ff007f;border-radius:12px;color:#fff;background:linear-gradient(90deg,#ff007f,#7928ca,#ff007f);text-align:center;font:900 18px Impact,Arial Black,sans-serif;letter-spacing:2px;text-shadow:0 2px 4px #000;box-shadow:0 0 15px #ff007f66}
.jackpot{margin:6px auto;padding:4px;border:1px solid #ffd700;border-radius:8px;color:#ffd700;background:#180d00;text-align:center;font:bold 11px monospace;letter-spacing:1px;box-shadow:0 0 8px #ffd70044}
.stats{display:flex;gap:6px;margin-bottom:8px}
.stat{flex:1;padding:4px;border:1px solid #5a189a;border-radius:8px;background:#0d021f;color:#c77dff;text-align:center;font:bold 10px monospace}
.stat b{display:block;margin-top:2px;color:#fff;font-size:14px;text-shadow:0 0 8px #d580ff}
.frame{position:relative;padding:6px;border:3px solid #7b2cbf;border-radius:14px;background:#050010;box-shadow:inset 0 0 15px #000}
.reelbox{display:block;height:175px;border-radius:8px;background:#070114}
#reelCanvas{width:100%;height:100%;display:block}
.message{height:30px;margin:8px 0;display:grid;place-items:center;border:1px solid #ff007f;border-radius:8px;color:#ff80bf;background:#15001a;font:bold 12px monospace;text-shadow:0 0 6px #ff007f}
.console{display:grid;grid-template-columns:1fr 1.8fr;gap:8px}
button{height:46px;border:none;border-radius:12px;color:#fff;font:900 14px sans-serif;cursor:pointer;touch-action:none}
.bet{background:linear-gradient(135deg,#7b2cbf,#3c096c);border:2px solid #c77dff;box-shadow:0 3px 10px #7b2cbf66}
.spin{background:linear-gradient(135deg,#00f5d4,#00bbf9);border:2px solid #fff;color:#001f3f;font-size:16px;box-shadow:0 0 15px #00f5d488}
.over{position:absolute;inset:0;display:grid;place-items:center;background:#080112f2;color:#fff;text-align:center;z-index:10}
.over.off{display:none}
.over button{padding:0 20px;background:#ff007f;border:2px solid #fff;margin-top:8px}
@keyframes lights{50%{filter:brightness(2)}}
</style>
</head>
<body>
<div class="machine" id="machine">
  <div class="lights"></div>
  <div class="title">NATASHA SLOTS 🎰</div>
  <div class="jackpot">JACKPOT: 15.000 MOEDAS</div>
  <div class="stats">
    <div class="stat">SALDO<b id="credits">${initialCredits}</b></div>
    <div class="stat">APOSTA<b id="betValue">10</b></div>
    <div class="stat">MAIOR GANHO<b id="best">0</b></div>
  </div>
  <div class="frame">
    <div class="reelbox"><canvas id="reelCanvas"></canvas></div>
  </div>
  <div id="message" class="message">CLIQUE EM GIRAR</div>
  <div class="console">
    <button id="bet" class="bet">APOSTA +</button>
    <button id="spin" class="spin">GIRAR 🚀</button>
  </div>
  <div id="over" class="over off">
    <div>
      <h2 style="color:#ff007f;margin:0">FIM DE JOGO</h2>
      <p>Suas moedas acabaram!<br>Maior Ganho: <b id="finalBest">0</b></p>
      <button id="restart">NOVO JOGO</button>
    </div>
  </div>
</div>

<script>
(function(){
var labels=['🪙','💻','🚀','🔥','💎','👑'],weights=[32,24,18,12,8,6],pays=[2,3,5,8,15,30],credits=${initialCredits},bet=10,best=0,busy=false,winCells=[],reels=[],canvas=document.getElementById('reelCanvas'),ctx=canvas.getContext('2d'),C=document.getElementById('credits'),BV=document.getElementById('betValue'),BS=document.getElementById('best'),MSG=document.getElementById('message'),SP=document.getElementById('spin'),BT=document.getElementById('bet'),OV=document.getElementById('over'),FB=document.getElementById('finalBest'),D=Math.min(devicePixelRatio||1,2),W,H,last=0,startTime=0;

function pick(){var n=Math.random()*100,s=0;for(var i=0;i<weights.length;i++){s+=weights[i];if(n<s)return i}return 0}
function buildStrip(){var a=[];for(var i=0;i<80;i++)a.push(pick());return a}
function resize(){var r=canvas.getBoundingClientRect();W=r.width;H=r.height;canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);ctx.setTransform(D,0,0,D,0,0);draw()}
function ui(){C.textContent=credits;BV.textContent=bet;BS.textContent=best}
for(var c=0;c<5;c++)reels.push({strip:buildStrip(),pos:Math.floor(Math.random()*60),speed:0,stop:0,stopped:true,decelStart:null,from:0,target:0});
function mod(n,m){return((n%m)+m)%m}

function symbol(col,row,index,x,y,w,h){
  var val=reels[col].strip[mod(index,reels[col].strip.length)];
  ctx.save();
  ctx.font=(h*0.52)+'px Arial, Apple Color Emoji, Segoe UI Emoji';
  ctx.textAlign='center';
  ctx.textBaseline='middle';
  ctx.fillText(labels[val],x+w/2,y+h/2);
  ctx.restore();
}

function draw(){
  if(!W||!H)return;
  ctx.clearRect(0,0,W,H);
  var rw=W/5,rh=H/3;
  for(var c=0;c<5;c++){
    var x=c*rw,reel=reels[c],base=Math.floor(reel.pos),frac=reel.pos-base;
    ctx.fillStyle='#0f0421';
    ctx.fillRect(x,0,rw,H);
    for(var k=-1;k<5;k++){
      symbol(c,k,base+k,x,(k-frac)*rh,rw,rh);
    }
    if(c){ctx.fillStyle='#2a084e';ctx.fillRect(x-1,0,2,H)}
  }
}

function frame(now){
  if(!busy)return;
  var dt=Math.min((now-last)/1000,.035);
  last=now;
  var stopped=0;
  for(var c=0;c<5;c++){
    var r=reels[c],elapsed=now-startTime;
    if(elapsed<180){r.speed=24*(elapsed/180);r.pos+=r.speed*dt}
    else if(elapsed<r.stop){r.speed=24;r.pos+=r.speed*dt}
    else{
      if(r.decelStart===null){r.decelStart=now;r.from=r.pos;r.target=Math.ceil(r.pos)+6}
      var p=Math.min(1,(now-r.decelStart)/700),ease=1-Math.pow(1-p,4);
      r.pos=r.from+(r.target-r.from)*ease;
      r.speed=(r.target-r.from)*4*Math.pow(1-p,3)/.7;
      if(p>=1){r.pos=r.target;r.speed=0;r.stopped=true}
    }
    if(r.stopped)stopped++;
  }
  draw();
  if(stopped===5){busy=false;setTimeout(evaluate,120)}else requestAnimationFrame(frame);
}

function boardValue(col,row){return reels[col].strip[mod(Math.round(reels[col].pos)+row,reels[col].strip.length)]}

function evaluate(){
  var patterns=[[0,0,0,0,0],[1,1,1,1,1],[2,2,2,2,2],[0,1,2,1,0],[2,1,0,1,2]],total=0;
  patterns.forEach(function(p){
    var a=boardValue(0,p[0]),count=1;
    for(var x=1;x<5&&boardValue(x,p[x])===a;x++)count++;
    if(count>=3)total+=Math.floor(bet*pays[a]*(count===3?1:count===4?2:5));
  });
  if(total){
    credits+=total;best=Math.max(best,total);
    MSG.textContent=total>=bet*15?'🔥 JACKPOT! +'+total:'🎉 GANHOU +'+total;
  }else{
    MSG.textContent='TENTE NOVAMENTE!';
  }
  SP.disabled=false;BT.disabled=false;ui();draw();
  if(credits<10)setTimeout(function(){FB.textContent=best;OV.className='over'},700);
}

function spin(){
  if(busy||credits<bet)return;
  busy=true;credits-=bet;ui();SP.disabled=true;BT.disabled=true;
  MSG.textContent='GIRANDO...';startTime=performance.now();last=startTime;
  for(var c=0;c<5;c++){reels[c].speed=0;reels[c].stop=1000+c*200;reels[c].stopped=false;reels[c].decelStart=null}
  requestAnimationFrame(frame);
}

BT.onclick=function(){if(busy)return;bet=bet===10?20:bet===20?50:10;if(bet>credits)bet=10;ui()};
SP.onclick=spin;
document.getElementById('restart').onclick=function(){credits=500;bet=10;best=0;busy=false;OV.className='over off';MSG.textContent='CLIQUE EM GIRAR';SP.disabled=false;BT.disabled=false;ui();draw()};
addEventListener('resize',resize);ui();resize();
})();
</script>
</body>
</html>`;

  return {
    botForwardedMessage: {
      message: {
        richResponseMessage: {
          messageType: 1,
          unifiedResponse: {
            data: Buffer.from(
              JSON.stringify({
                __typename: "GenAIUnifiedResponse",
                response_id: crypto.randomUUID(),
                sections: [
                  {
                    __typename: "GenAIUnifiedResponseSection",
                    view_model: {
                      __typename: "GenAISingleLayoutViewModel",
                      primitive: {
                        __typename: "FOAHtmlPrimitiveDemoDONOTUSE",
                        trusted_sources: [],
                        payload: payloadHtml,
                      },
                    },
                  },
                ],
              })
            ).toString("base64"),
          },
          contextInfo: {
            isForwarded: true,
            forwardOrigin: 4,
          },
        },
      },
    },
  };
}
