import Phaser from 'phaser';

import { readAxis } from './GamepadAxis';

type Key = Phaser.Input.Keyboard.Key;

// Junta teclado e gamepad numa entrada única, com detecção de "acabou de apertar".
export class Controls {
  left = false;
  right = false;
  down = false;
  downPressed = false;
  jumpHeld = false;
  jumpPressed = false;
  attackPressed = false;
  shootPressed = false;
  dashPressed = false;
  pausePressed = false;
  restartPressed = false;
  mutePressed = false;

  private keys: Record<string, Key>;
  private prevJump = false;
  private prevAttack = false;
  private prevShoot = false;
  private prevDash = false;
  private prevPause = false;
  private prevDown = false;

  constructor(private scene: Phaser.Scene) {
    this.keys = scene.input.keyboard!.addKeys('LEFT,RIGHT,UP,DOWN,A,D,W,S,SPACE,Z,X,J,K,C,I,R,SHIFT,L,V,ESC,P,M') as Record<string, Key>;
  }

  update() {
    const k = this.keys;
    const pad = this.scene.input.gamepad?.pad1;
    const axis = readAxis(pad?.leftStick.x ?? 0);
    const axisY = readAxis(pad?.leftStick.y ?? 0);
    const dpadLeft = !!pad?.buttons[14]?.pressed;
    const dpadRight = !!pad?.buttons[15]?.pressed;
    const dpadDown = !!pad?.buttons[13]?.pressed;

    this.left = k.LEFT.isDown || k.A.isDown || axis < 0 || dpadLeft;
    this.right = k.RIGHT.isDown || k.D.isDown || axis > 0 || dpadRight;
    this.down = k.DOWN.isDown || k.S.isDown || axisY > 0 || dpadDown;
    this.downPressed = this.down && !this.prevDown;
    this.prevDown = this.down;

    const jump = k.SPACE.isDown || k.Z.isDown || k.UP.isDown || k.W.isDown || k.K.isDown || !!pad?.A;
    this.jumpPressed = jump && !this.prevJump;
    this.jumpHeld = jump;
    this.prevJump = jump;

    const attack = k.X.isDown || k.J.isDown || !!pad?.X;
    this.attackPressed = attack && !this.prevAttack;
    this.prevAttack = attack;

    const shoot = k.C.isDown || k.I.isDown || !!pad?.B;
    this.shootPressed = shoot && !this.prevShoot;
    this.prevShoot = shoot;

    const dash = k.SHIFT.isDown || k.L.isDown || k.V.isDown || !!pad?.R1 || !!pad?.Y;
    this.dashPressed = dash && !this.prevDash;
    this.prevDash = dash;

    const pause = k.ESC.isDown || k.P.isDown || !!pad?.buttons[9]?.pressed;
    this.pausePressed = pause && !this.prevPause;
    this.prevPause = pause;

    this.restartPressed = Phaser.Input.Keyboard.JustDown(k.R);
    this.mutePressed = Phaser.Input.Keyboard.JustDown(k.M);
  }
}
