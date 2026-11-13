import Phaser from 'phaser';
import { PHYS } from '../config';
import { F, has } from '../gfx/art';
import { texRes } from '../gfx/textures';
import type { Controls } from '../systems/Controls';

type Body = Phaser.Physics.Arcade.Body;

const approach = (v: number, target: number, step: number) =>
  v < target ? Math.min(v + step, target) : Math.max(v - step, target);

// Íris. O corpo físico (hit) é invisível e tem tamanho fixo; o visual (view) segue o corpo
// e pode esticar e amassar à vontade sem afetar a colisão.
export class Player {
  readonly hit: Phaser.Physics.Arcade.Sprite;
  readonly view: Phaser.GameObjects.Sprite;

  hp = 3;
  maxHp = 3;
  facing = 1;
  invuln = 0;
  attackTime = 0;
  dead = false;
  frozen = false;

  // habilidades (liberadas pelos guardiões)
  canDoubleJump = false;
  canDash = false;
  canWallJump = false;
  canGlide = false;
  canShoot = false;
  canPound = false;
  /** A cena marca quando Íris está debaixo d'água. */
  inWater = false;
  /** Multiplicador de gravidade da fase (Ilhas do Céu: 0.6). */
  gravityScale = 1;
  /**
   * Sentido da gravidade: 1 normal, -1 invertida (campos invertidos das Ilhas do Céu).
   * Invertida, Íris cai para cima, anda no teto e o pulo empurra para baixo.
   */
  gdir = 1;
  pounding = false;
  private poundHang = 0;
  private poundLand = 0;
  private shotCd = 0;
  private shootTime = 0;
  wallSlide = false;
  gliding = false;
  private wallDir = 0;
  private wallCoyote = 0;
  private wallLock = 0;
  private wallKickTime = 0;
  private usedDouble = false;
  /** Tempo restante do dash em curso (Íris fica invulnerável). */
  dashTime = 0;
  private dashCd = 0;
  private airDashUsed = false;
  /** Empurrão horizontal externo (vento), em px/s; a cena define a cada quadro. */
  wind = 0;

  private coyote = 0;
  private jumpBuffer = 0;
  private jumping = false;
  private attackCd = 0;
  private hurtTimer = 0;
  private wasOnGround = true;
  private t = 0;
  private squash = { x: 1, y: 1 };
  /** momento (ms) do último toque numa plataforma fina e tempo em que ela fica "mole" ao descer */
  onOneWayAt = -1e9;
  private jumpHeldNow = false;
  dropTime = 0;
  /** "Rotulada": o Rótulo gruda e deixa Íris mais lenta por alguns segundos */
  slowTime = 0;
  private baseScale: number;

  constructor(private scene: Phaser.Scene, x: number, y: number) {
    this.hit = scene.physics.add.sprite(x, y, 'pixel').setVisible(false);
    const body = this.body;
    body.setSize(40, 92);
    body.setCollideWorldBounds(true);

    this.drawn = has(scene, 'iris_idle');
    const tex = this.drawn ? 'iris_idle' : 'iris';
    this.baseScale = 1 / texRes(scene, tex);
    this.view = scene.add.sprite(x, y, tex, 0).setOrigin(0.5, 1).setScale(this.baseScale).setDepth(10);
    if (this.drawn) this.view.play('iris-idle');
  }

  /** true quando as animações desenhadas (Lote 2) estão disponíveis. */
  private drawn: boolean;
  private landTimer = 0;
  private viewUp = false;
  /** Tempo restante da pirueta desenhada do pulo duplo. */
  flipTime = 0;
  private takeoffTimer = 0;
  victory = false;

  get body() {
    return this.hit.body as Body;
  }

  get onGround() {
    return this.gdir > 0 ? this.body.blocked.down || this.body.touching.down : this.body.blocked.up || this.body.touching.up;
  }

  /** Velocidade vertical no sentido da gravidade (positiva = caindo), valha ela para baixo ou para cima. */
  private get fall() {
    return this.body.velocity.y * this.gdir;
  }

  /** Troca o sentido da gravidade (ao entrar ou sair de um campo invertido). */
  setGravityDir(dir: number) {
    if (dir === this.gdir) return;
    this.gdir = dir;
    this.coyote = 0;
    this.usedDouble = false; // a virada devolve o pulo duplo
    this.pounding = false;
    this.body.setAllowGravity(true);
    this.squash = { x: 0.8, y: 1.22 };
    this.scene.events.emit('player-flip', this);
  }

  update(dt: number, c: Controls) {
    const b = this.body;
    this.t += dt;
    this.invuln = Math.max(0, this.invuln - dt);
    this.attackCd = Math.max(0, this.attackCd - dt);
    this.attackTime = Math.max(0, this.attackTime - dt);
    this.hurtTimer = Math.max(0, this.hurtTimer - dt);
    this.shotCd = Math.max(0, this.shotCd - dt);

    if (this.frozen || this.dead) {
      b.setVelocityX(approach(b.velocity.x, 0, PHYS.decelGround * dt));
      this.syncView(dt);
      return;
    }

    const ground = this.onGround;
    if (ground) {
      this.coyote = PHYS.coyoteTime;
      this.usedDouble = false;
      this.airDashUsed = false;
      if (!this.wasOnGround) this.land();
    } else this.coyote -= dt;
    this.wasOnGround = ground;

    this.jumpBuffer = c.jumpPressed ? PHYS.jumpBuffer : this.jumpBuffer - dt;
    // descer de uma plataforma fina: BAIXO + PULAR (não gasta o pulo)
    this.dropTime = Math.max(0, this.dropTime - dt);
    this.slowTime = Math.max(0, this.slowTime - dt);
    if (ground && c.down && c.jumpPressed && this.scene.time.now - this.onOneWayAt < 120) {
      this.dropTime = 0.22;
      this.jumpBuffer = 0;
      this.coyote = 0;
      b.setVelocityY(60);
    }

    // dash: impulso reto e invulnerável; um por vez no ar
    this.dashCd = Math.max(0, this.dashCd - dt);
    if (c.dashPressed && this.canDash && this.dashCd <= 0 && !(this.airDashUsed && !ground) && this.hurtTimer <= 0) {
      const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
      if (dir !== 0) this.facing = dir;
      this.dashTime = PHYS.dashTime;
      this.dashCd = PHYS.dashCooldown;
      if (!ground) this.airDashUsed = true;
      b.setAllowGravity(false);
      this.scene.events.emit('player-dash', this);
    }
    if (this.dashTime > 0) {
      this.dashTime -= dt;
      b.setVelocity(this.facing * PHYS.dashSpeed, 0);
      if (this.dashTime <= 0) {
        b.setAllowGravity(true);
        b.setVelocityX(this.facing * PHYS.runSpeed);
      }
      this.syncView(dt);
      return;
    }

    // debaixo d'água: nado livre (cada pulo é uma braçada), gravidade e velocidade reduzidas
    if (this.inWater) {
      this.pounding = false;
      const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
      if (this.hurtTimer <= 0) {
        b.setVelocityX(approach(b.velocity.x, dir * PHYS.swimSpeed + this.wind, PHYS.accelAir * dt));
        if (dir !== 0 && this.attackTime <= 0) this.facing = dir;
      }
      if (c.jumpPressed) {
        b.setVelocityY(-PHYS.swimStroke);
        this.scene.events.emit('player-swim', this);
      }
      b.setGravityY(-PHYS.gravity * 0.75);
      b.setVelocityY(Phaser.Math.Clamp(b.velocity.y, -PHYS.swimStroke, PHYS.swimMaxFall));
      this.wallSlide = this.gliding = false;
      this.actions(c);
      this.syncView(dt);
      return;
    }

    // mergulho estelar: no ar, ↓ faz Íris parar um instante e despencar
    if (this.canPound && !ground && !this.pounding && c.downPressed) {
      this.pounding = true;
      this.poundHang = 0.14;
      b.setVelocity(0, 0).setAllowGravity(false);
    }
    if (this.pounding) {
      if (this.poundHang > 0) {
        this.poundHang -= dt;
        b.setVelocity(0, 0);
        if (this.poundHang <= 0) b.setAllowGravity(true).setVelocityY(PHYS.poundVel * this.gdir);
      } else if (ground) {
        this.pounding = false;
        this.poundLand = 0.25;
        this.scene.events.emit('player-pound', this);
      } else b.setVelocity(0, PHYS.poundVel * this.gdir);
      this.syncView(dt);
      return;
    }

    // movimento horizontal com aceleração (dá peso sem perder resposta); o vento soma ao alvo.
    // Logo depois de um pulo na parede o controle fica travado um instante, para o impulso valer.
    const dir = (c.right ? 1 : 0) - (c.left ? 1 : 0);
    this.wallLock = Math.max(0, this.wallLock - dt);
    if (this.hurtTimer <= 0 && this.wallLock <= 0) {
      const accel = dir !== 0 || this.wind ? (ground ? PHYS.accelGround : PHYS.accelAir) : ground ? PHYS.decelGround : PHYS.decelAir;
      b.setVelocityX(approach(b.velocity.x, dir * PHYS.runSpeed * (this.slowTime > 0 ? 0.65 : 1) + this.wind, accel * dt));
      if (dir !== 0 && this.attackTime <= 0) this.facing = dir;
    }

    // parede: caindo e empurrando contra ela, Íris desliza devagar e pode pular para longe
    const wallSide = b.blocked.right ? 1 : b.blocked.left ? -1 : 0;
    this.wallSlide = this.canWallJump && !ground && wallSide !== 0 && dir === wallSide && this.fall > -60;
    if (this.wallSlide) {
      this.wallDir = wallSide;
      this.wallCoyote = PHYS.coyoteTime;
      this.usedDouble = false;
      this.airDashUsed = false;
      if (this.fall > PHYS.wallSlideSpeed) b.setVelocityY(PHYS.wallSlideSpeed * this.gdir);
    } else this.wallCoyote -= dt;

    // pulo
    if (this.jumpBuffer > 0 && this.coyote > 0) {
      this.jump(PHYS.jumpVel);
    } else if (this.jumpBuffer > 0 && !ground && this.wallCoyote > 0) {
      this.jump(PHYS.jumpVel * 0.95);
      b.setVelocityX(-this.wallDir * PHYS.wallJumpX);
      this.facing = -this.wallDir;
      this.wallLock = 0.16;
      this.wallCoyote = 0;
      this.wallKickTime = 0.25;
      this.scene.events.emit('player-walljump', this);
    } else if (this.jumpBuffer > 0 && !ground && this.canDoubleJump && !this.usedDouble) {
      this.usedDouble = true;
      this.jump(PHYS.jumpVel * 0.9);
      this.flipTime = has(this.scene, 'iris_doublejump') ? 0.3 : 0;
      this.scene.events.emit('player-doublejump', this);
    }
    this.jumpHeldNow = c.jumpHeld;
    if (!c.jumpHeld && this.jumping && this.fall < 0) {
      b.setVelocityY(b.velocity.y * PHYS.jumpCut);
      this.jumping = false;
    }
    if (this.fall >= 0) this.jumping = false;
    // gravityScale < 1 (Ilhas do Céu): pulos mais altos e quedas mais lentas
    const g = this.gravityScale;
    // pairada no ápice: segurando pular, a gravidade cai pela metade perto do topo (mais controle para acertar a borda)
    const hang = !ground && this.jumpHeldNow && Math.abs(b.velocity.y) < 90 && !this.gliding;
    const gs = hang ? g * 0.55 : g;
    // a gravidade do mundo é sempre para baixo; a do corpo compensa até dar o sentido e a força desejados
    b.setGravityY(this.gdir * (PHYS.gravity * gs + (this.fall > 0 ? PHYS.fallExtraGravity * gs : 0)) - PHYS.gravity);
    if (this.fall > PHYS.maxFall) b.setVelocityY(PHYS.maxFall * this.gdir);

    // planar: segurando pular durante a queda, a echarpe vira um paraquedas
    this.gliding = this.canGlide && !ground && !this.wallSlide && c.jumpHeld && this.fall > 0;
    if (this.gliding && this.fall > PHYS.glideFall) b.setVelocityY(PHYS.glideFall * this.gdir);

    this.actions(c);
    this.syncView(dt);
  }

  /** Golpe de echarpe e disparo de prisma (valem em terra e na água). */
  private actions(c: Controls) {
    if (c.attackPressed && this.attackCd <= 0) {
      this.attackTime = 0.18;
      this.attackCd = 0.32;
      this.scene.events.emit('player-attack', this);
    }
    if (c.shootPressed && this.canShoot && this.shotCd <= 0) {
      this.shotCd = 0.4;
      this.shootTime = 0.22;
      this.scene.events.emit('player-shoot', this);
    }
  }

  jump(vel: number) {
    this.body.setVelocityY(-vel * this.gdir);
    this.coyote = 0;
    this.jumpBuffer = 0;
    this.jumping = true;
    this.squash = { x: 0.82, y: 1.2 };
    this.takeoffTimer = 0.07;
    this.scene.events.emit('player-jump', this);
  }

  /** Impulso de pisão ou mola; segurar o pulo vai mais alto. */
  bounce(vel: number) {
    this.body.setVelocityY(-vel * this.gdir);
    this.jumping = false; // impulso externo não é cortado ao soltar o botão
    this.usedDouble = false;
    this.squash = { x: 0.85, y: 1.18 };
  }

  private land() {
    this.squash = { x: 1.22, y: 0.8 };
    this.landTimer = 0.08;
    this.scene.events.emit('player-land', this);
  }

  /** Área do golpe de echarpe à frente de Íris. */
  attackRect() {
    const w = 110, h = 84;
    const x = this.facing > 0 ? this.hit.x + 8 : this.hit.x - 8 - w;
    return new Phaser.Geom.Rectangle(x, this.hit.y - h / 2 - 6, w, h);
  }

  hurt(fromX: number, knock = true): boolean {
    if (this.invuln > 0 || this.dead || this.dashTime > 0) return false;
    this.hp--;
    this.invuln = PHYS.invulnTime;
    if (knock) {
      this.hurtTimer = 0.25;
      const dir = Math.sign(this.hit.x - fromX) || -this.facing;
      this.body.setVelocity(dir * PHYS.hurtKnockX, -PHYS.hurtKnockY * this.gdir);
    }
    this.scene.events.emit('player-hurt', this);
    return true;
  }

  respawn(x: number, y: number) {
    this.hit.setPosition(x, y);
    this.gdir = 1;
    this.body.setVelocity(0, 0).setAllowGravity(true);
    this.dashTime = 0;
    this.dead = false;
    this.invuln = 1;
    this.hurtTimer = 0;
  }

  private syncView(dt: number) {
    const b = this.body;
    const k = Math.min(1, dt * 12);
    this.squash.x += (1 - this.squash.x) * k;
    this.squash.y += (1 - this.squash.y) * k;
    this.landTimer = Math.max(0, this.landTimer - dt);
    this.takeoffTimer = Math.max(0, this.takeoffTimer - dt);
    this.flipTime = Math.max(0, this.flipTime - dt);
    this.wallKickTime = Math.max(0, this.wallKickTime - dt);
    this.poundLand = Math.max(0, this.poundLand - dt);
    this.shootTime = Math.max(0, this.shootTime - dt);

    if (this.drawn) {
      this.pickFrame();
      // o desenho já tem pose; o esticar/amassar fica bem mais sutil
      const sx = 1 + (this.squash.x - 1) * 0.4, sy = 1 + (this.squash.y - 1) * 0.4;
      // a pirueta gira em torno do centro do corpo; as demais poses apoiam nos pés
      // poses centradas no corpo (giram ou ficam na horizontal); as demais apoiam nos pés
      const spinning = ['iris_doublejump', 'iris_swim', 'iris_pound_air'].includes(this.view.texture.key);
      const up = this.gdir < 0; // de cabeça para baixo: os pés apoiam no teto
      this.view.setPosition(this.hit.x, spinning ? this.hit.y : up ? b.top - 2 : b.bottom + 2);
      this.view.setScale(this.baseScale * sx, this.baseScale * sy);
      this.view.setFlipX(this.facing < 0);
      this.view.setFlipY(up);
      // ao espelhar, o pivô do frame também precisa espelhar
      const f = this.view.frame;
      // com pivô próprio o Phaser espelha em torno da origem: os pés já ficam
      // no ponto de apoio, então a origem vertical não inverte (invertida, o
      // desenho subia atravessando o teto)
      if (f.customPivot) this.view.setOrigin(this.facing < 0 ? 1 - f.pivotX : f.pivotX, f.pivotY);
      else if (up !== this.viewUp) this.view.setOrigin(this.view.originX, 1 - this.view.originY);
      this.viewUp = up;
      this.view.setAlpha(this.invuln > 0 && !this.dead && Math.floor(this.t * 20) % 2 === 0 ? 0.35 : 1);
      return;
    }
    this.syncProcedural();
  }

  private play(key: string, ignoreIfPlaying = true) {
    if (this.view.anims.currentAnim?.key !== key || !this.view.anims.isPlaying) this.view.play(key, ignoreIfPlaying);
  }

  private still(tex: string, frame: number) {
    this.view.anims.stop();
    this.view.setTexture(tex, String(frame));
  }

  private pickFrame() {
    const b = this.body;
    const J = F.irisJump;
    if (this.victory) return this.play('iris-win');
    if (this.dead || this.hurtTimer > 0) return this.still('iris_hurt_win', F.irisHurtWin.hurt);
    if (this.pounding && has(this.scene, 'iris_pound_air')) {
      if (this.poundHang > 0) return this.still('iris_pound_air', this.poundHang > 0.07 ? 0 : 1);
      return this.still('iris_pound_air', Math.floor(this.t * 12) % 2 ? 2 : 3);
    }
    if (this.poundLand > 0 && has(this.scene, 'iris_pound_land')) return this.still('iris_pound_land', this.poundLand > 0.12 ? 0 : 1);
    if (this.shootTime > 0 && has(this.scene, 'iris_shoot')) {
      if (this.view.anims.currentAnim?.key !== 'iris-shoot') this.view.play('iris-shoot');
      return;
    }
    if (this.inWater && !this.onGround && has(this.scene, 'iris_swim')) return this.play('iris-swim');
    if (this.dashTime > 0) {
      if (!has(this.scene, 'iris_dash')) return this.still('iris_run', 0); // pose de passada longa
      if (this.view.anims.currentAnim?.key !== 'iris-dash') this.view.play('iris-dash');
      return;
    }
    if (this.wallSlide && has(this.scene, 'iris_wall')) {
      this.play('iris-wallslide');
      // a arte tem a mão apoiando à direita: com a parede à esquerda, espelha
      this.facing = this.wallDir;
      return;
    }
    if (this.wallKickTime > 0 && !this.onGround && has(this.scene, 'iris_wall')) {
      if (this.view.anims.currentAnim?.key !== 'iris-wallkick') this.view.play('iris-wallkick');
      return;
    }
    if (this.gliding && has(this.scene, 'iris_glide')) return this.play('iris-glide');
    if (this.flipTime > 0 && !this.onGround) {
      if (this.view.anims.currentAnim?.key !== 'iris-doublejump') this.view.play('iris-doublejump');
      return;
    }
    if (this.attackTime > 0) {
      if (this.view.anims.currentAnim?.key !== 'iris-attack') this.view.play('iris-attack');
      return;
    }
    if (!this.onGround) {
      if (this.takeoffTimer > 0) return this.still('iris_jump', J.takeoff);
      const vy = this.fall;
      return this.still('iris_jump', vy < -220 ? J.rise : vy < 220 ? J.peak : J.fall);
    }
    if (this.landTimer > 0) return this.still('iris_jump', J.land);
    const speed = Math.abs(b.velocity.x);
    if (speed > 30) {
      this.play('iris-run');
      this.view.anims.timeScale = Phaser.Math.Clamp(speed / PHYS.runSpeed, 0.5, 1.2);
    } else {
      this.view.anims.timeScale = 1;
      this.play('iris-idle');
    }
  }

  // Animação procedural, usada enquanto não há animações desenhadas.
  private syncProcedural() {
    const b = this.body;
    let sx = this.squash.x, sy = this.squash.y, bob = 0, angle = 0;
    const speed = Math.abs(b.velocity.x);
    if (this.onGround) {
      if (speed > 30) {
        bob = -Math.abs(Math.sin(this.t * 16)) * 7;
        angle = this.facing * 5;
      } else sy *= 1 + Math.sin(this.t * 3) * 0.015;
    } else {
      const v = Phaser.Math.Clamp(b.velocity.y / 900, -1, 1);
      sx *= 1 + v * 0.05;
      sy *= 1 - v * 0.05;
      angle = this.facing * (v * -6 + 4);
    }
    if (this.attackTime > 0) angle = this.facing * 10;

    this.view.setPosition(this.hit.x, b.bottom + bob);
    this.view.setScale(this.baseScale * sx, this.baseScale * sy);
    this.view.setAngle(angle);
    this.view.setFlipX(this.facing < 0);
    this.view.setAlpha(this.invuln > 0 && Math.floor(this.t * 20) % 2 === 0 ? 0.35 : 1);
  }
}
