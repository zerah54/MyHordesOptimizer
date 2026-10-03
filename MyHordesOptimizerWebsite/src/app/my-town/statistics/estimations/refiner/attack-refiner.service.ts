import { Injectable } from '@angular/core';

import { feasibleConfigs, lastConstrainedRound, OffsetPair, RefinerParams, scanSeedRangeCpu, ScanTileRequest, ScanTileResponse } from './attack-model';

/**
 * Orchestrateur d'affinage d'attaque HYBRIDE : GPU (WebGPU) et workers CPU scannent en parallèle
 * une file de tuiles de seeds partagée (work-stealing). Le plus rapide consomme naturellement plus
 * de tuiles — aucune calibration : petite carte graphique + gros CPU additionnent leurs débits, et
 * un GPU sain fait l'essentiel du travail.
 *
 * Fiabilité (aucun faux négatif possible) :
 *  - GPU indisponible (WebGPU absent, pilote KO) → scan 100 % CPU.
 *  - Échec GPU en cours de scan (device lost, TDR) → sa tuile en cours est REMISE EN JEU et les
 *    workers CPU la reprennent ; les hits GPU sont relus après CHAQUE tuile, donc rien n'est perdu.
 *  - Échec d'un worker CPU → même principe.
 *  - Filet final : toute tuile restante est scannée sur le thread principal.
 *  - Le scan CPU (attack-model) est exact en f64 ; les hits GPU sont un superset re-vérifié par
 *    deriveValueRange. Les deux alimentent la même dérivation.
 *
 * Côté GPU, le shader énumère les seeds mt_rand (2³² : mt_srand tronque le seed 64 bits stocké à
 * uint32). Pour chaque seed, il rejoue la réduction d'offsets du jeu (calculate_offsets) pour
 * chaque configuration (somme, base) possible, et DÉDUIT les cibles targetMin/targetMax par
 * propagation d'intervalles sur les buckets observés.
 *
 * `observed` contient 100 entiers : TDG min 0..24 / max 25..49 (bloc 1), planificateur
 * min 50..74 / max 75..99 (bloc ceil(jour/5)·5) — voir attack-model.ts.
 *
 * Fidélité du shader au code MyHordes :
 *  - RandomGenerator::chance COURT-CIRCUITE pour c<=0 (false) et c>=1 (true) SANS consommer de
 *    tirage ; mt_rand(a,a) en revanche CONSOMME un tirage (rand_range32 appelle generate() avant
 *    tout test). Les deux sont reproduits.
 *  - « Poussière » f64 : quand un offset atteint 0 par égalité exacte (alter == offset), le f64 du
 *    jeu peut garder ~1e-15 (>0) ou tomber à 0.0 exact — la consommation de chance() en dépend.
 *    Le modèle entier du shader ne peut pas trancher → fork à la CRÉATION du zéro (2 bits d'état
 *    dustMin/dustMax par branche), comportement ensuite déterministe.
 *  - Forks aux frontières d'arrondi f64 (bornes de calc_next, seuil de chance) : on explore les
 *    deux issues → superset, jamais de faux négatif. Pile pleine → seed gardé (conservatif).
 *  - Configs (somme, base) : calculées côté TS (offsetConfigs : sommes S−1/S/S+1 du rebound, gate
 *    `rebound_possible`) puis élaguées par le filtre par paires (feasibleConfigs, superset prouvé) ;
 *    le shader ne rejoue que la liste transmise dans `params`.
 *  - Facteur d'âmes (soulFactor) et arrondi au bloc du planificateur intégrés à la propagation.
 * La propagation f32 porte une marge ±MARGIN → jamais de faux élagage.
 *
 * Optimisation MT19937 du shader : une trajectoire consomme au plus ~100-150 sorties → seuls les
 * BUDGET=160 premiers éléments de l'état sont twistés ET TEMPÉRÉS (une seule fois, à la génération,
 * pas à chaque lecture — un même index peut être relu par plusieurs branches du DFS après un fork).
 * Seules ces 160 sorties tempérées (`out`) sont stockées : la chaîne d'init est parcourue en deux
 * fronts (indices p et 397+p) au lieu de garder l'état brut, ce qui réduit la mémoire privée du
 * thread (donc augmente le nombre de threads résidents) sans changer un seul bit de résultat. Une
 * génération PARESSEUSE (out calculé à la demande via un curseur) a été essayée et rejetée : le
 * surcoût de contrôle de flux par lecture annule le gain sur un scénario réaliste. Si une branche
 * demande un index ≥ BUDGET (rejets mt_rand en cascade, quasi impossible), le seed est gardé de
 * façon conservative et tranché par le rejeu f64 CPU.
 *
 * DFS du shader : le premier enfant d'un nœud est traité sur place (en registres), seuls les
 * enfants supplémentaires issus d'un fork passent par la pile — la mémoire privée est le goulot
 * sur GPU dédié (×1,9 mesuré). Même ensemble de branches explorées, seul l'ordre change.
 */

export interface RefineResult {
    /** Seeds candidats trouvés (re-vérifiés en f64 exact par deriveValueRange). */
    hits: number[];
    /** Nombre de seeds réellement scannés. */
    scanned: number;
    /** true si l'utilisateur a annulé. */
    cancelled: boolean;
    /**
     * true si trop de seeds compatibles pour garantir un affinage fiable : le scan est arrêté
     * immédiatement et `hits` est VIDE (aucun résultat partiel — mieux vaut aucune plage que
     * l'échantillon biaisé des seeds les plus bas, seuls survivants d'un plafond dépassé).
     */
    overflow: boolean;
}

const WORKGROUP_SIZE: number = 64;
/**
 * Paires (somme, base) max transmises au shader : 3 sommes (S−1..S+1) × au plus S+2 bases, S ≤ 28 au
 * facteur 1 → 3 × 30 = 90 (70 en pratique). Dépassement ⇒ RangeError à la construction du buffer ⇒
 * tuile remise au CPU (jamais de config tronquée en silence).
 */
const GPU_MAX_PAIRS: number = 96;
/** Taille du buffer `params` du shader : 9 entiers de base + 25 facteurs tour + 25 planif + nb paires + paires. */
export const GPU_PARAM_COUNT: number = 9 + 25 + 25 + 1 + GPU_MAX_PAIRS;
/**
 * Capacité du buffer de hits GPU, PAR TUILE (remis à zéro à chaque dispatch, voir
 * `dispatchGpuChunk`). Un buffer GPU a une taille fixe posée à l'allocation — impossible de le
 * faire grandir pendant le scan — mais rien n'impose 1024 : le coût mémoire est négligeable
 * (`MAX_HITS·4` octets, quelques dizaines de Ko même large).
 */
const MAX_HITS: number = 8192;
/**
 * Cap combiné GPU + CPU, dédupliqué, égal au plafond de l'API, sur tout le scan 2³². Au-delà : on considère les données
 * saisies insuffisamment contraignantes pour un affinage fiable — le scan s'arrête et AUCUN
 * résultat n'est retourné (voir `overflow` sur {@link RefineResult}), plutôt que de dériver une
 * plage depuis un sous-échantillon de hits potentiellement non représentatif.
 */
const MAX_TOTAL_HITS: number = 65536;
const SEEDS_TOTAL: number = 0x1_0000_0000; // 2³²
// WebGPU limite dispatchWorkgroups à 65535 par dimension → une tuile GPU couvre au plus
// 65535·64 seeds (≈4,19 M). Les hits GPU sont relus après chaque tuile pour survivre à un
// device lost. (Bug historique : TILES=512 → 131072 workgroups > 65535, dispatch invalide
// silencieux → aucun seed scanné → 0 configuration.)
const MAX_WORKGROUPS: number = 65535;
const GPU_CHUNK: number = MAX_WORKGROUPS * WORKGROUP_SIZE;
/**
 * Durée visée par tuile GPU. Un dispatch trop long fait perdre le device (watchdog du pilote : mesuré
 * sur GPU intégré, 2,8 s passe et 4,1 s perd le device) et bascule tout le reste du scan sur le CPU.
 */
const GPU_TARGET_MS: number = 500;
/** Première tuile : ~0,1 s même sur un GPU intégré lent, avant toute mesure de débit. */
export const GPU_FIRST_CHUNK: number = 65536;
const GPU_MIN_CHUNK: number = 4096;

/**
 * Taille de la tuile GPU suivante, calée sur la durée mesurée de la précédente pour viser
 * GPU_TARGET_MS. Croissance bornée à ×4 par tuile pour qu'une mesure trop optimiste ne fasse pas
 * exploser la suivante.
 * @param previous_count Nombre de seeds de la tuile précédente.
 * @param elapsed_ms Durée mesurée de la tuile précédente (dispatch + relecture des hits).
 */
export function nextGpuChunkSize(previous_count: number, elapsed_ms: number): number {
    const scaled: number = elapsed_ms > 0 ? Math.floor(previous_count * GPU_TARGET_MS / elapsed_ms) : GPU_CHUNK;
    return Math.max(GPU_MIN_CHUNK, Math.min(GPU_CHUNK, 4 * previous_count, scaled));
}
/** Tuile CPU : ~0,5-2 s par worker → granularité de progression, d'annulation et de reprise. */
const CPU_CHUNK: number = 32768;

const WGSL: string = `
const M=397u; const MARGIN=1.5;
// Budget de sorties MT19937 par trajectoire : seuls les BUDGET premiers elements sont twistes
// (premiere boucle du reload : valeurs identiques au reload complet), l'init s'arrete a BUDGET+M.
const BUDGET=160u;
// out[p] = tempered(twist(init[397+p], init[p], init[p+1])) precalcule une seule fois (un index peut
// etre relu par plusieurs branches du DFS apres un fork). La chaine d'init est parcourue en deux
// fronts (a = init[p], b = init[397+p]) au lieu d'etre stockee : moins de memoire privee par thread.
struct MT { out: array<u32,160>, over: u32 };
fn twist(m:u32,u:u32,v:u32)->u32{ let mix=(u&0x80000000u)|(v&0x7fffffffu); return m^(mix>>1u)^select(0u,0x9908b0dfu,(v&1u)!=0u); }
fn temperRaw(v:u32)->u32{ var s1=v; s1^=s1>>11u; s1^=(s1<<7u)&0x9d2c5680u; s1^=(s1<<15u)&0xefc60000u; s1^=s1>>18u; return s1; }
fn mt_init(mt:ptr<function,MT>, seed:u32){
  var b=seed;
  for(var i=1u;i<M;i++){ b=1812433253u*(b^(b>>30u))+i; }
  var a=seed;
  for(var p=0u;p<BUDGET;p++){
    let an=1812433253u*(a^(a>>30u))+(p+1u);
    b=1812433253u*(b^(b>>30u))+(M+p);
    (*mt).out[p]=temperRaw(twist(b,a,an));
    a=an;
  }
  (*mt).over=0u;
}
fn tempered(mt:ptr<function,MT>, idx:u32)->u32{ if(idx>=BUDGET){ (*mt).over=1u; return 0u; } return (*mt).out[idx]; }
// r <= 0xffffffff-um implique r <= limit (0xffffffff%um < um) : la limite exacte (un modulo) n'est calculee que dans le cas rare.
fn range32At(mt:ptr<function,MT>, idx:ptr<function,u32>, umax:u32)->u32{ var r=tempered(mt,*idx); *idx=*idx+1u; if(umax==0xffffffffu){return r;} let um=umax+1u; if((um&(um-1u))==0u){return r&(um-1u);} if(r>0xffffffffu-um){ let limit=0xffffffffu-(0xffffffffu%um)-1u; loop{ if(r<=limit){break;} r=tempered(mt,*idx); *idx=*idx+1u; } } return r%um; }
// mt_rand(0,99) a diviseur constant : limite = 0xffffffff-(0xffffffff%100)-1 = 4294967199.
fn rand100(mt:ptr<function,MT>, idx:ptr<function,u32>)->u32{ var r=tempered(mt,*idx); *idx=*idx+1u; loop{ if(r<=4294967199u){break;} r=tempered(mt,*idx); *idx=*idx+1u; } return r%100u; }
// PHP consomme un tirage meme quand lo==hi (rand_range32 appelle generate() avant tout test : umax=0 -> um=1, puissance de 2 -> r&0=0).
fn randRange(mt:ptr<function,MT>, idx:ptr<function,u32>, lo:i32, hi:i32)->i32{ return lo+i32(range32At(mt,idx,u32(hi-lo))); }

@group(0) @binding(0) var<storage,read> observed: array<i32>;
@group(0) @binding(1) var<storage,read> params: array<i32>; // baseSeed,total,f5r,f26r,offSum,protect,blocks,qLast,reboundPossible, pf tour x1e6 [9..33], pf planif x1e6 [34..58], nb paires [59], paires [60..]
@group(0) @binding(2) var<storage,read_write> counter: atomic<u32>;
@group(0) @binding(3) var<storage,read_write> hits: array<u32>;

// Etat par branche DFS : fa = (idx | dustMin<<20 | dustMax<<21, oMin, oMax, round) ; fb = fenetres cibles.
// dustMin/dustMax = 1 : l'entier scaled vaut 0 mais le f64 du jeu garde ~1e-15 (>0) -> chance() consomme.
fn dfsBase(mt:ptr<function,MT>, offMinBase:i32, offMaxBase:i32, blocks:i32, qLast:i32) -> bool {
  // Branche courante (curA/curB) en registres ; la pile ne recoit que les enfants supplementaires d'un
  // fork. PILE=24 : aucun debordement mesure sur 64 M seeds (16 en produit). Overflow = candidat
  // conservateur (return true) : jamais de faux negatif, quelle que soit la taille de pile.
  var sA: array<vec4<i32>,24>; var sB: array<vec4<f32>,24>; var sp=0;
  var curA=vec4<i32>(0,offMinBase,offMaxBase,0); var curB=vec4<f32>(1.0,1e9,1.0,1e9); var has=true;
  (*mt).over=0u;
  let bF=f32(blocks);
  loop{
    if(!has){ if(sp==0){break;} sp--; curA=sA[sp]; curB=sB[sp]; }
    has=false; let fa=curA; let fb=curB;
    let dMin=(fa.x>>20)&1; let dMax=(fa.x>>21)&1; let idx=u32(fa.x&0xfffff);
    let oMin=fa.y; let oMax=fa.z; let round=fa.w;
    var tMinLo=fb.x; var tMinHi=fb.y; var tMaxLo=fb.z; var tMaxHi=fb.w;
    let q=u32(round);
    let pfT=f32(params[9u+q])/1000000.0; let pfP=f32(params[34u+q])/1000000.0;
    let obMinT=observed[q]; let obMaxT=observed[25u+q];
    let obMinP=observed[50u+q]; let obMaxP=observed[75u+q];
    // TDG (bloc 1) : round(t*f*pf) = ob ; planif : round(t*f*pf) dans [ob, ob+B-1] (min, floor) / [ob-B+1, ob] (max, ceil).
    if(obMinT!=2147483647 || obMinP!=2147483647){
      let fMinT=(1.0 - f32(oMin)/100000.0)*pfT; let fMinP=(1.0 - f32(oMin)/100000.0)*pfP;
      if(obMinT!=2147483647){ tMinLo=max(tMinLo,(f32(obMinT)-0.5)/fMinT-MARGIN); tMinHi=min(tMinHi,(f32(obMinT)+0.5)/fMinT+MARGIN); }
      if(obMinP!=2147483647){ tMinLo=max(tMinLo,(f32(obMinP)-0.5)/fMinP-MARGIN); tMinHi=min(tMinHi,(f32(obMinP)+bF-0.5)/fMinP+MARGIN); }
      if(tMinLo>tMinHi){continue;}
    }
    if(obMaxT!=2147483647 || obMaxP!=2147483647){
      let fMaxT=(1.0 + f32(oMax)/100000.0)*pfT; let fMaxP=(1.0 + f32(oMax)/100000.0)*pfP;
      if(obMaxT!=2147483647){ tMaxLo=max(tMaxLo,(f32(obMaxT)-0.5)/fMaxT-MARGIN); tMaxHi=min(tMaxHi,(f32(obMaxT)+0.5)/fMaxT+MARGIN); }
      if(obMaxP!=2147483647){ tMaxLo=max(tMaxLo,(f32(obMaxP)-bF+0.5)/fMaxP-MARGIN); tMaxHi=min(tMaxHi,(f32(obMaxP)+0.5)/fMaxP+MARGIN); }
      if(tMaxLo>tMaxHi){continue;}
    }
    if(round==qLast){return true;}
    let sum=oMin+oMax;
    if(sum<=0 && dMin==0 && dMax==0){
      // PHP : somme exactement 0.0 -> la boucle ne consomme rien.
      curA=vec4<i32>(fa.x,oMin,oMax,round+1); curB=vec4<f32>(tMinLo,tMinHi,tMaxLo,tMaxHi); has=true;
      continue;
    }
    let denom=24-round;
    // floor(floor(s/d)/4) = floor(s/4d) ; s%4d==0 <=> s%d==0 et 4 | floor(s/d).
    let chiBase=sum/denom; let cloBase=chiBase>>2u; let rem=sum-chiBase*denom;
    var cloArr=array<i32,2>(cloBase,cloBase-1); var nClo=1; if(sum>0 && rem==0 && (chiBase&3)==0){nClo=2;}
    var chiArr=array<i32,2>(chiBase,chiBase-1); var nChi=1; if(sum>0 && rem==0){nChi=2;}
    // chance(oMin/sum) : RandomGenerator::chance court-circuite pour c<=0 (false) et c>=1 (true)
    // SANS tirage. Poussieres : c legerement >0 ou <1 -> tirage consomme, issue determinee
    // (c=1-eps -> true ; c=eps -> false ; double-poussiere -> alter=0, l'issue est sans effet).
    var nOpt=1;
    var optI=array<u32,2>(idx,idx); var optInc=array<i32,2>(0,0);
    if(oMin>0){
      if(oMax==0 && dMax==0){ optInc[0]=1; }
      else {
        var ii=idx; let m99=i32(rand100(mt,&ii));
        if(oMax==0 && dMax==1){ optI[0]=ii; optInc[0]=1; }
        else if(m99*sum==100*oMin){ optI[0]=ii; optInc[0]=1; optI[1]=ii; optInc[1]=0; nOpt=2; }
        else { optI[0]=ii; optInc[0]=select(0,1,m99*sum<100*oMin); }
      }
    } else {
      if(dMin==1){ var ii=idx; _=rand100(mt,&ii); optI[0]=ii; }
    }
    for(var oi=0;oi<nOpt;oi++){ let iA=optI[oi]; let incMin=optInc[oi]==1;
      for(var ci=0;ci<nClo;ci++){ for(var hj=0;hj<nChi;hj++){
        let clo=cloArr[ci]; let chi=chiArr[hj]; if(chi<clo){continue;}
        var iB=iA;
        let alter=randRange(mt,&iB,clo,chi);
        let m25=i32(rand100(mt,&iB));
        var nMin=oMin; var nMax=oMax; var ndMin=dMin; var ndMax=dMax;
        var forkDMin=false; var forkDMax=false;
        if(m25<25){
          let aM=randRange(mt,&iB,clo,chi);
          if(oMin>0){ nMin=max(0,oMin-alter); ndMin=0; if(alter==oMin){forkDMin=true;} }
          else { ndMin=select(0,dMin,alter==0); }
          if(oMax>0){ nMax=max(0,oMax-aM); ndMax=0; if(aM==oMax){forkDMax=true;} }
          else { ndMax=select(0,dMax,aM==0); }
        } else if(incMin){
          // incMin=true implique oMin>0 (jamais true sur poussiere seule) -> $offsetMin > 0 est vrai en PHP.
          nMin=max(0,oMin-alter); ndMin=0; if(alter==oMin){forkDMin=true;}
        } else {
          if(oMax>0){ nMax=max(0,oMax-alter); ndMax=0; if(alter==oMax){forkDMax=true;} }
          else { ndMax=select(0,dMax,alter==0); }
        }
        if((*mt).over==1u){ return true; } // budget MT19937 depasse : candidat conservatif
        // alter == offset exact : le f64 du jeu tombe a 0.0 ou garde une poussiere -> fork des deux etats.
        let fmN=select(1,2,forkDMin); let fxN=select(1,2,forkDMax);
        for(var fm=0;fm<fmN;fm++){ for(var fx=0;fx<fxN;fx++){
          let pdMin=select(ndMin,fm,forkDMin); let pdMax=select(ndMax,fx,forkDMax);
          let cA=vec4<i32>(i32(iB)|(pdMin<<20)|(pdMax<<21),nMin,nMax,round+1); let cB=vec4<f32>(tMinLo,tMinHi,tMaxLo,tMaxHi);
          if(!has){ curA=cA; curB=cB; has=true; }
          else if(sp<24){ sA[sp]=cA; sB[sp]=cB; sp++; }
          else { return true; } // pile pleine : candidat conservatif, re-verifie en f64 cote CPU
        }}
      }}
    }
  }
  return false;
}

// Configs (somme, base) survivant au filtre par paires (feasibleConfigs, cote TS : sommes S-1/S/S+1
// du rebound et gate rebound_possible deja appliques) : params[59] = nombre, params[60..] = (somme<<8)|base.
fn matches(seed:u32, blocks:i32, qLast:i32)->bool{
  var mt:MT; mt_init(&mt,seed);
  let nPairs=params[59];
  for(var i=0; i<nPairs; i++){
    let pair=params[60+i]; let s=pair>>8; let b=pair&255;
    if(dfsBase(&mt, b*1000, (s-b)*1000, blocks, qLast)){ return true; }
  }
  return false;
}

@compute @workgroup_size(${WORKGROUP_SIZE})
fn main(@builtin(global_invocation_id) gid: vec3<u32>){
  let baseSeed=u32(params[0]); let total=u32(params[1]);
  let blocks=params[6]; let qLast=params[7];
  let n=gid.x; if(n>=total){return;}
  let seed=baseSeed+n;
  if(matches(seed, blocks, qLast)){ let slot=atomicAdd(&counter,1u); if(slot<${MAX_HITS}u){ hits[slot]=seed; } }
}
`;

/**
 * Construit le buffer `params` du shader (voir la disposition dans l'en-tête WGSL). Les facteurs d'âmes
 * sont transmis en entiers ×10⁶.
 * @param first Premier seed de la tuile.
 * @param count Nombre de seeds de la tuile.
 * @param params Paramètres du modèle.
 * @param q_last Dernier palier saisi (voir {@link lastConstrainedRound}) : le DFS du shader
 *        s'arrête là plutôt qu'à 24, sans changer le résultat (aucune contrainte au-delà).
 * @param pairs Configs (somme, base) survivant à {@link feasibleConfigs} : seules rejouées par le shader.
 */
export function buildGpuParams(first: number, count: number, params: RefinerParams, q_last: number, pairs: OffsetPair[]): Int32Array {
    const layout: Int32Array = new Int32Array(GPU_PARAM_COUNT);
    layout.set([
        first | 0, count | 0,
        params.base_lo_rand | 0, params.base_hi_rand | 0,
        params.off_sum | 0, params.protect | 0,
        params.blocks | 0, q_last | 0,
        params.rebound_possible ? 1 : 0
    ]);
    params.soul_tdg.forEach((factor: number, q: number): void => {
        layout[9 + q] = Math.round(factor * 1000000);
    });
    params.soul_planif.forEach((factor: number, q: number): void => {
        layout[34 + q] = Math.round(factor * 1000000);
    });
    layout[59] = pairs.length;
    layout.set(pairs.map((pair: OffsetPair): number => (pair.sum << 8) | pair.base), 60);
    return layout;
}

interface SeedChunk {
    first: number;
    count: number;
}

/**
 * File de tuiles partagée GPU/CPU : un curseur sur [0, 2³²) + les tuiles remises en jeu après un
 * échec (prioritaires, découpées à la taille demandée par le preneur).
 */
class SeedChunkQueue {
    private next: number = 0;
    private readonly requeued: SeedChunk[] = [];

    public take(max_count: number): SeedChunk | null {
        const requeued: SeedChunk | undefined = this.requeued.pop();
        if (requeued) {
            if (requeued.count > max_count) {
                this.requeued.push({ first: requeued.first + max_count, count: requeued.count - max_count });
                return { first: requeued.first, count: max_count };
            }
            return requeued;
        }
        if (this.next >= SEEDS_TOTAL) {
            return null;
        }
        const count: number = Math.min(max_count, SEEDS_TOTAL - this.next);
        const chunk: SeedChunk = { first: this.next, count };
        this.next += count;
        return chunk;
    }

    public requeue(chunk: SeedChunk): void {
        this.requeued.push(chunk);
    }
}

interface ScanState {
    hits: Set<number>;
    scanned: number;
    overflow: boolean;
}

interface GpuScanContext {
    device: GPUDevice;
    obsBuf: GPUBuffer;
    parBuf: GPUBuffer;
    cntBuf: GPUBuffer;
    hitBuf: GPUBuffer;
    stg: GPUBuffer;
    pipeline: GPUComputePipeline;
    bind: GPUBindGroup;
}

@Injectable({ providedIn: 'root' })
export class AttackRefinerService {
    private device: GPUDevice | null = null;
    private cancelRequested: boolean = false;

    /** L'affinage est disponible dès qu'un des deux moteurs (workers CPU, WebGPU) l'est. */
    public isSupported(): boolean {
        return typeof Worker !== 'undefined' || (typeof navigator !== 'undefined' && 'gpu' in navigator);
    }

    public cancel(): void {
        this.cancelRequested = true;
    }

    /**
     * Scanne les 2³² seeds (GPU + workers CPU en parallèle sur une file de tuiles partagée) pour
     * retrouver ceux compatibles avec les buckets observés.
     *
     * @param observed 100 entiers : TDG min 0..24 / max 25..49, planif min 50..74 / max 75..99
     *                 (NO_CONSTRAINT pour les paliers non saisis).
     * @param params Paramètres du modèle MyHordes pour le jour attaqué (voir RefinerParams).
     * @param onProgress Rappelé (0..1) après chaque tuile terminée.
     */
    public async refine(observed: Int32Array, params: RefinerParams, onProgress: (fraction: number) => void): Promise<RefineResult> {
        this.cancelRequested = false;
        const queue: SeedChunkQueue = new SeedChunkQueue();
        const state: ScanState = { hits: new Set<number>(), scanned: 0, overflow: false };
        const progress: () => void = (): void => onProgress(state.scanned / SEEDS_TOTAL);

        // Dernier palier saisi : au-delà, aucune contrainte ne peut plus élaguer une branche (voir
        // lastConstrainedRound) — le DFS (GPU et CPU) s'arrête là plutôt qu'à 24, même résultat, plus
        // rapide sur une saisie partielle (tour en cours de journée).
        const q_last: number = lastConstrainedRound(observed);
        const pairs: OffsetPair[] = feasibleConfigs(observed, params);
        const tasks: Promise<void>[] = [this.runGpuScan(observed, params, q_last, pairs, queue, state, progress)];
        const cores: number = typeof navigator !== 'undefined' && navigator.hardwareConcurrency ? navigator.hardwareConcurrency : 4;
        const gpu_available: boolean = typeof navigator !== 'undefined' && 'gpu' in navigator && !!navigator.gpu;
        const worker_count: number = this.cpuWorkerCount(cores, gpu_available);
        for (let i: number = 0; i < worker_count; i++) {
            tasks.push(this.runCpuWorkerScan(observed, params, queue, state, progress));
        }
        await Promise.all(tasks);

        // Filet de sécurité : si des tuiles remises en jeu n'ont pas trouvé preneur (tous les
        // scanners déjà terminés au moment d'un échec), elles sont scannées ici sur le thread
        // principal — aucune tuile ne doit être perdue, sous peine de faux négatif.
        let leftover: SeedChunk | null;
        while (!this.cancelRequested && !state.overflow && (leftover = queue.take(CPU_CHUNK)) !== null) {
            for (const hit of scanSeedRangeCpu(observed, params, leftover.first, leftover.count)) {
                this.addHit(state, hit);
            }
            state.scanned += leftover.count;
            progress();
            await new Promise<void>((resolve): void => {
                setTimeout(resolve);
            });
        }

        return { hits: [...state.hits], scanned: state.scanned, cancelled: this.cancelRequested, overflow: state.overflow };
    }

    /**
     * Un worker CPU fait des dizaines de milliers de seeds/s (mesuré ~17k/s en JS) contre des
     * millions pour le GPU : saturer tous les coeurs pendant tout le scan (souvent ~30 min) pour un
     * gain de débit total négligeable rend la machine inutilisable sans accélérer le scan de façon
     * perceptible. Quand le GPU est disponible, les workers CPU ne servent plus qu'à reprendre une
     * tuile si le GPU tombe en cours de route (voir `runGpuScan`/`SeedChunkQueue.requeue`) — une
     * petite assurance suffit. Sans GPU, ils sont le seul moteur : pleine parallélisation.
     */
    private cpuWorkerCount(cores: number, gpu_available: boolean): number {
        if (gpu_available) {
            return Math.min(2, Math.max(1, cores - 1));
        }
        return Math.max(1, cores - 1);
    }

    private addHit(state: ScanState, seed: number): void {
        if (state.overflow) {
            return;
        }
        if (state.hits.has(seed)) {
            return;
        }
        if (state.hits.size >= MAX_TOTAL_HITS) {
            this.triggerOverflow(state);
            return;
        }
        state.hits.add(seed);
    }

    /**
     * Trop de seeds compatibles pour garantir un affinage fiable : vide le pool (un résultat
     * partiel, biaisé vers les seeds les plus bas, serait pire qu'aucun résultat) et fait
     * s'arrêter toutes les boucles de scan à leur prochaine vérification (`!state.overflow`).
     */
    private triggerOverflow(state: ScanState): void {
        if (state.overflow) {
            return;
        }
        state.overflow = true;
        state.hits.clear();
    }

    // --- Boucle GPU ---

    private async runGpuScan(observed: Int32Array, params: RefinerParams, q_last: number, pairs: OffsetPair[], queue: SeedChunkQueue, state: ScanState, progress: () => void): Promise<void> {
        let ctx: GpuScanContext | null = null;
        try {
            ctx = await this.createGpuContext(observed);
        } catch (error) {
            console.warn('Affinage : GPU indisponible, scan CPU uniquement.', error);
            return;
        }
        let chunk: SeedChunk | null = null;
        let chunk_size: number = GPU_FIRST_CHUNK;
        try {
            while (!this.cancelRequested && !state.overflow && (chunk = queue.take(chunk_size)) !== null) {
                const started_at: number = performance.now();
                await this.dispatchGpuChunk(ctx, params, q_last, pairs, chunk);
                const gpu_hits: Uint32Array = await this.readGpuHits(ctx, state);
                chunk_size = nextGpuChunkSize(chunk.count, performance.now() - started_at);
                for (const hit of gpu_hits) {
                    this.addHit(state, hit);
                }
                state.scanned += chunk.count;
                chunk = null;
                progress();
            }
        } catch (error) {
            console.warn('Affinage : échec GPU en cours de scan, les tuiles restantes passent au CPU.', error);
            if (chunk !== null) {
                queue.requeue(chunk);
            }
        } finally {
            if (ctx !== null) {
                this.destroyGpuContext(ctx);
            }
        }
    }

    private async ensureDevice(): Promise<GPUDevice> {
        if (this.device) {
            return this.device;
        }
        if (typeof navigator === 'undefined' || !('gpu' in navigator) || !navigator.gpu) {
            throw new Error('WebGPU non disponible');
        }
        // Machine à deux GPU : sans préférence, le navigateur peut choisir l'intégré (2 à 2,7× plus lent).
        const adapter: GPUAdapter | null = await navigator.gpu.requestAdapter({ powerPreference: 'high-performance' });
        if (!adapter) {
            throw new Error('Aucun adaptateur WebGPU');
        }
        this.device = await adapter.requestDevice();
        // Diagnostic : remonte en console les erreurs WebGPU non capturées et la perte du device
        // (ex. watchdog TDR si un dispatch dépasse le budget temps du pilote).
        this.device.addEventListener('uncapturederror', (event: Event): void => {
            console.error('WebGPU (uncapturederror) :', (event as GPUUncapturedErrorEvent).error.message);
        });
        this.device.lost.then((info: GPUDeviceLostInfo): void => {
            console.error(`WebGPU : device perdu (${info.reason}) : ${info.message}`);
            this.device = null;
        });
        return this.device;
    }

    private async createGpuContext(observed: Int32Array): Promise<GpuScanContext> {
        const device: GPUDevice = await this.ensureDevice();

        const obsBuf: GPUBuffer = device.createBuffer({ size: observed.byteLength, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        /** `observed` n'est jamais adossé à un SharedArrayBuffer (toujours `new Int32Array(...)`) */
        device.queue.writeBuffer(obsBuf, 0, observed as Int32Array<ArrayBuffer>);
        const parBuf: GPUBuffer = device.createBuffer({ size: GPU_PARAM_COUNT * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST });
        const cntBuf: GPUBuffer = device.createBuffer({ size: 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC | GPUBufferUsage.COPY_DST });
        const hitBuf: GPUBuffer = device.createBuffer({ size: MAX_HITS * 4, usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC });
        const stg: GPUBuffer = device.createBuffer({ size: (1 + MAX_HITS) * 4, usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ });

        const module: GPUShaderModule = device.createShaderModule({ code: WGSL });
        const compilation: GPUCompilationInfo = await module.getCompilationInfo();
        const shader_errors: string[] = compilation.messages
            .filter((message: GPUCompilationMessage): boolean => message.type === 'error')
            .map((message: GPUCompilationMessage): string => `L${message.lineNum}:${message.linePos} ${message.message}`);
        if (shader_errors.length > 0) {
            throw new Error(`Shader WGSL invalide : ${shader_errors.join(' | ')}`);
        }
        device.pushErrorScope('validation');
        const pipeline: GPUComputePipeline = device.createComputePipeline({ layout: 'auto', compute: { module, entryPoint: 'main' } });
        const pipeline_error: GPUError | null = await device.popErrorScope();
        if (pipeline_error) {
            throw new Error(`Pipeline GPU invalide : ${pipeline_error.message}`);
        }
        const bind: GPUBindGroup = device.createBindGroup({
            layout: pipeline.getBindGroupLayout(0),
            entries: [
                { binding: 0, resource: { buffer: obsBuf } },
                { binding: 1, resource: { buffer: parBuf } },
                { binding: 2, resource: { buffer: cntBuf } },
                { binding: 3, resource: { buffer: hitBuf } },
            ],
        });

        return { device, obsBuf, parBuf, cntBuf, hitBuf, stg, pipeline, bind };
    }

    private async dispatchGpuChunk(ctx: GpuScanContext, params: RefinerParams, q_last: number, pairs: OffsetPair[], chunk: SeedChunk): Promise<void> {
        // Compteur remis à zéro à CHAQUE tuile : sinon `slot=atomicAdd(&counter,1u)` du shader
        // s'accumule sur tout le scan 2³² (le buffer n'est créé qu'une fois par refine()). Dès que le
        // total de hits dépasse MAX_HITS, toute tuile suivante échoue le test `slot<MAX_HITS` même si
        // elle contient de VRAIS candidats — ils sont comptés (overflow correctement signalé) mais
        // jamais écrits. `hitBuf` n'a pas besoin d'être nettoyé : on ne relit que les MAX_HITS premiers
        // slots pour CE compteur remis à zéro, les restes d'une tuile précédente ne sont jamais lus.
        ctx.device.queue.writeBuffer(ctx.cntBuf, 0, new Uint32Array([0]));
        ctx.device.queue.writeBuffer(ctx.parBuf, 0, buildGpuParams(chunk.first, chunk.count, params, q_last, pairs));

        const workgroups: number = Math.ceil(chunk.count / WORKGROUP_SIZE); // ≤ 65535 par construction
        const enc: GPUCommandEncoder = ctx.device.createCommandEncoder();
        const pass: GPUComputePassEncoder = enc.beginComputePass();
        pass.setPipeline(ctx.pipeline);
        pass.setBindGroup(0, ctx.bind);
        pass.dispatchWorkgroups(workgroups);
        pass.end();
        ctx.device.queue.submit([enc.finish()]);
        await ctx.device.queue.onSubmittedWorkDone();
    }

    /** Relit compteur + hits GPU (cumulés) — appelé après chaque tuile pour survivre à un device lost. */
    private async readGpuHits(ctx: GpuScanContext, state: ScanState): Promise<Uint32Array> {
        const enc: GPUCommandEncoder = ctx.device.createCommandEncoder();
        enc.copyBufferToBuffer(ctx.cntBuf, 0, ctx.stg, 0, 4);
        enc.copyBufferToBuffer(ctx.hitBuf, 0, ctx.stg, 4, MAX_HITS * 4);
        ctx.device.queue.submit([enc.finish()]);
        await ctx.stg.mapAsync(GPUMapMode.READ);
        const out: Uint32Array = new Uint32Array(ctx.stg.getMappedRange().slice(0));
        ctx.stg.unmap();
        if (out[0] > MAX_HITS) {
            this.triggerOverflow(state);
        }
        return out.slice(1, 1 + Math.min(out[0], MAX_HITS));
    }

    private destroyGpuContext(ctx: GpuScanContext): void {
        try {
            ctx.obsBuf.destroy();
            ctx.parBuf.destroy();
            ctx.cntBuf.destroy();
            ctx.hitBuf.destroy();
            ctx.stg.destroy();
        } catch {
            // Device perdu : les ressources sont déjà libérées.
        }
    }

    // --- Boucle worker CPU ---

    private async runCpuWorkerScan(observed: Int32Array, params: RefinerParams, queue: SeedChunkQueue, state: ScanState, progress: () => void): Promise<void> {
        let worker: Worker;
        try {
            worker = new Worker(new URL('./attack-scan.worker', import.meta.url), { type: 'module' });
        } catch (error) {
            console.warn('Affinage : Web Worker indisponible.', error);
            return;
        }
        let chunk: SeedChunk | null = null;
        try {
            while (!this.cancelRequested && !state.overflow && (chunk = queue.take(CPU_CHUNK)) !== null) {
                const response: ScanTileResponse = await this.scanTileOnWorker(worker, observed, params, chunk);
                for (const hit of response.hits) {
                    this.addHit(state, hit);
                }
                state.scanned += chunk.count;
                chunk = null;
                progress();
            }
        } catch (error) {
            console.warn('Affinage : worker CPU en échec, sa tuile est remise en jeu.', error);
            if (chunk !== null) {
                queue.requeue(chunk);
            }
        } finally {
            worker.terminate();
        }
    }

    private scanTileOnWorker(worker: Worker, observed: Int32Array, params: RefinerParams, chunk: SeedChunk): Promise<ScanTileResponse> {
        return new Promise<ScanTileResponse>((resolve, reject): void => {
            worker.onmessage = (event: MessageEvent<ScanTileResponse>): void => resolve(event.data);
            worker.onerror = (event: ErrorEvent): void => reject(new Error(event.message || 'Erreur du worker de scan'));
            const request: ScanTileRequest = { observed, params, first_seed: chunk.first, count: chunk.count };
            worker.postMessage(request);
        });
    }
}
