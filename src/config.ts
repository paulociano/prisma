export const GAME_W = 1280;
export const GAME_H = 720;
export const TILE = 64;

// Física de Íris. Valores em px e px/s; ajuste aqui para mudar a "sensação" do controle.
export const PHYS = {
  gravity: 2200,
  runSpeed: 340,
  accelGround: 2600,
  accelAir: 1700,
  decelGround: 3200,
  decelAir: 900,
  jumpVel: 940, // ~3 blocos de altura
  jumpCut: 0.45, // soltar o botão cedo corta o pulo
  fallExtraGravity: 800, // queda mais rápida que a subida
  maxFall: 1150,
  coyoteTime: 0.1, // ainda dá para pular logo depois de sair da borda
  jumpBuffer: 0.12, // apertar pouco antes de tocar o chão ainda conta
  stompBounce: 620,
  stompBounceHeld: 860,
  springVel: 1350,
  hurtKnockX: 320,
  hurtKnockY: 460,
  invulnTime: 1.2,
  dashSpeed: 820,
  dashTime: 0.17, // ~140 px
  dashCooldown: 0.45,
  ventVel: 1350,
  wallSlideSpeed: 150,
  wallJumpX: 380,
  glideFall: 110,
  swimSpeed: 250,
  swimStroke: 430,
  swimMaxFall: 200,
  poundVel: 1300,
  shotSpeed: 760,
};

export const RAINBOW = [0xff4d5e, 0xff9a3c, 0xffd93d, 0x5fd068, 0x3ccfd8, 0x5b6cff, 0xb15bff];

// Pontos de cor: cada ação devolve uma parte da cor da fase.
export const COLOR_POINTS = { enemy: 2, checkpoint: 3, coin: 0.25, shard: 2, crate: 0.5 };
