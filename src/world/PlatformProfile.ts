/** Presentation dimensions, in world pixels. Contact stays at y=0. */
export type PlatformKind='solid'|'ledge'|'mover';
export interface PlatformProfile {
  readonly kind:PlatformKind;readonly width:number;readonly margin:number;
  readonly above:number;readonly below:number;readonly seed:number;
  readonly flip:boolean;
}
export function platformProfile(kind:PlatformKind,width:number,seed:number,clearance=Infinity):PlatformProfile{
  if(!Number.isInteger(width)||width<64||width>512||!Number.isFinite(seed)||!(clearance>=0))throw Error('Invalid platform presentation');
  const margin=Math.min(10,Math.round(width/12));
  const variation=Math.abs(Math.floor(seed))%3;
  const below=Math.min(clearance,kind==='solid'?88+variation*6+Math.min(26,Math.max(0,width-256)*.12):kind==='ledge'?40+variation*5:30+variation*4);
  return {kind,width,margin,above:kind==='solid'?24:kind==='ledge'?16:12,below,seed,flip:Math.abs(Math.floor(seed))%2===1};
}
/** Continuous asymmetry, without moving the top contact. */
export function platformDepth(p:PlatformProfile,u:number):number{
  const x=Math.max(0,Math.min(1,u));
  const wave=Math.sin(Math.PI*x);
  const bias=Math.sin(2*Math.PI*x+p.seed*.73);
  const wide=p.kind==='solid'&&p.width>256;
  const depth=wide?.59+.30*wave+.11*bias:p.kind==='solid'?.76+.19*wave+.05*bias:.55+.35*wave+.10*bias;
  return p.below*Math.max(.42,Math.min(1,depth));
}
