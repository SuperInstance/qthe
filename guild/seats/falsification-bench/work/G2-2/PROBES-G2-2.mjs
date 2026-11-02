// G2-2 design-time probes against the reference kernel (qthe.mjs @ main, 265 lines).
// Re-verification of cited findings + validation of edge constructions.
// Run: node PROBES-G2-2.mjs   (node v24.22.2; zero deps)
import * as q from './qthe_probe.mjs';
const log = (...a) => console.log(...a);

// P1 seed aliasing (CRITIQUE C2/V3, confirmed by Orchestrator)
log('P1', q.mulberry32(2**32+5)() === q.mulberry32(5)(), q.mulberry32(5)());

// P2 sigma leak (CRITIQUE F1/V5)
{
  let s = q.makeSubstrate(4,4,()=>0); s[5]=0xC8; s[10]=0xC8;
  q.tick(s,{sigma:5});  const t1 = s.lastEvents.map(e=>e.term);
  q.tick(s,{});         const t2 = s.lastEvents.map(e=>e.term);
  q.tick(s,{});         const t3 = s.lastEvents.map(e=>e.term);
  log('P2', JSON.stringify(t1), JSON.stringify(t2), JSON.stringify(t3));
}

// P3 desert twin pair, sigma=0.5: float plane vs truncation plane
function desert(sigma, ticks){
  let s = q.makeSubstrate(4,4,()=>0); s[5]=0xC8; s[10]=0xC8;
  const evts=[];
  for(let i=0;i<ticks;i++){ q.tick(s,{sigma}); evts.push(s.lastEvents.length); }
  return {cells: Array.from(s).map(c=>c.toString(16).padStart(2,'0')).join(''), evts};
}
log('P3-float', JSON.stringify(desert(0.5,8)));
function desertTrunc(sigma, ticks){
  let s = q.makeSubstrate(4,4,()=>0); s[5]=0xC8; s[10]=0xC8;
  const tbl = new q.WormholeTable(sigma); const w=4,h=4; const evts=[];
  for(let t=0;t<ticks;t++){
    const snap = Uint8Array.from(s); const events=[];
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const i=y*w+x, c=snap[i], tau=c>>6, d=c&63;
      let acc=0;
      const yU=(y+h-1)%h,yD=(y+1)%h,xL=(x+w-1)%w,xR=(x+1)%w;
      for(const [yy,xx] of [[yU,xL],[yU,x],[yU,xR],[y,xL],[y,xR],[yD,xL],[yD,x],[yD,xR]]){
        const nb=snap[yy*w+xx];
        if((nb>>6)===1)acc+=nb&63; else if((nb>>6)===2)acc-=nb&63;
      }
      let pressure=acc;
      if(tau===3){
        const hit=tbl.read(d);
        if(hit && hit.resonance!==0 && (hit.x!==x||hit.y!==y)){
          const term=Math.trunc(hit.resonance*sigma);
          pressure=acc+term; events.push(term);
        }
        tbl.write(d,x,y,Math.abs(acc)+1);
      }
      s[i]=(tau<<6)|q.nextD(d,pressure);
    }
    evts.push(events.length);
  }
  return {cells: Array.from(s).map(c=>c.toString(16).padStart(2,'0')).join(''), evts};
}
log('P3-trunc', JSON.stringify(desertTrunc(0.5,8)));

// P8 biased witness: twin pair + Repel d=1 neighbor => cells-visible sigma discriminator
function biased(sig){
  let s = q.makeSubstrate(4,4,()=>0);
  s[5]=0xC8; s[10]=0xC8; s[9]=q.pack(2,1);
  const evts=[]; let t1=[];
  for(let i=0;i<4;i++){ q.tick(s,{sigma:sig}); if(i===0) t1=s.lastEvents.map(e=>e.term); evts.push(s.lastEvents.length); }
  return {cells: Array.from(s).map(c=>c.toString(16).padStart(2,'0')).join(''), evts, t1};
}
log('P8-sigma-half', JSON.stringify(biased(0.5)));
log('P8-sigma-two',  JSON.stringify(biased(2)));
log('P8-default',    JSON.stringify(biased(Math.log2(3))));

// P9 2x2 neighbor multiplicity (dedup discriminator)
{
  let s = q.makeSubstrate(2,2,()=>0);
  s[0]=q.pack(0,30); s[3]=q.pack(2,5); s[1]=q.pack(1,7);
  q.tick(s,{wormholes:false});
  log('P9', q.unpack(s[0]).d, '(kernel: acc=-20+14=-6 -> 29; dedup build: +2 -> 31)');
}

// P5 degenerate tori self-neighbor receipts
{
  let s3 = q.makeSubstrate(4,1,()=>0); s3[0]=q.pack(2,10); q.tick(s3,{wormholes:false});
  log('P5-1x4', q.unpack(s3[0]).d, '(self x2, acc=-20, one step down)');
  let s4 = q.makeSubstrate(1,1,()=>0); s4[0]=q.pack(2,10); q.tick(s4,{wormholes:false});
  log('P5-1x1', q.unpack(s4[0]).d, '(self x8, acc=-80, one step down)');
  let s2 = q.makeSubstrate(2,2,()=>0); s2[0]=q.pack(2,1); q.tick(s2,{wormholes:false});
  log('P5-2x2', q.unpack(s2[0]).d, '(no self-sample; acc=0; unchanged)');
  let s6 = q.makeSubstrate(1,1,()=>0); s6[0]=q.pack(3,5); q.tick(s6,{sigma:0.5});
  log('P6-1x1-Abstain', JSON.stringify(s6.lastEvents), 'occupied=', s6.__wormholes.snapshot().filter(Boolean).length);
}
