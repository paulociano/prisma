/** Nominal standing art height from process-assets.mjs, not the hitbox.
 * Fixed framing prevents zoom pumping when the animation changes pose. */
export const IRIS_STANDING_HEIGHT=110;
export const IRIS_SCREEN_SHARE=.4;
export function closeCameraZoom(viewportHeight:number):number{
  if(!Number.isFinite(viewportHeight)||viewportHeight<=0)throw Error('Invalid viewport height');
  return viewportHeight*IRIS_SCREEN_SHARE/IRIS_STANDING_HEIGHT;
}

/** Boss arenas retain the original wide, static camera regardless of URL flags. */
export function usesCloseCamera(isArena:boolean,zoomMode:string|null):boolean{
  return !isArena&&zoomMode!=='legacy';
}
