import type Phaser from 'phaser';
import { GAME_H } from '../config';
import { foregroundVisibility } from '../levels/ArtGeometry';

/** Recompose the existing painted foreground inside shallow screen-edge bands.
 * TileSprite dimensions and source sampling stay unchanged. Moving it outward
 * limits occlusion without rescaling or stretching the illustrated material.
 */
export function configureOrganicForeground(top:Phaser.GameObjects.TileSprite,bottom:Phaser.GameObjects.TileSprite){
  top.setY(-120);
  bottom.setY(GAME_H-72);
  top.setAlpha(.86);bottom.setAlpha(.78);
}
/** Fade when the player approaches the occupied strip, preserving the central
 * silhouette. Pure alpha changes, no allocations of textures or new colliders.
 */
export function updateOrganicForeground(top:Phaser.GameObjects.TileSprite,bottom:Phaser.GameObjects.TileSprite,
  cam:Phaser.Cameras.Scene2D.Camera,playerY:number,quality:'medium'|'high'){
  const screenY=(playerY-cam.scrollY-GAME_H/2)*cam.zoom+GAME_H/2;
  const a=foregroundVisibility(screenY,GAME_H,quality);
  top.setAlpha(a.top);bottom.setAlpha(a.bottom);
}
