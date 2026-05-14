import Phaser from "phaser";
import { getHOTW, HOTW_MULTIPLIER } from "@/lib/hotw";
import type { Hero } from "@/lib/types";

const ENEMY_SPEED = 80;
const SPAWN_INTERVAL = 1500;

export class GameScene extends Phaser.Scene {
  private hero: Hero;
  private onGameOver: (score: number) => void;
  private player!: Phaser.GameObjects.Image;
  private enemies!: Phaser.Physics.Arcade.Group;
  private projectiles!: Phaser.Physics.Arcade.Group;
  private yoyoLine!: Phaser.GameObjects.Graphics;
  private score = 0;
  private hp = 100;
  private scoreText!: Phaser.GameObjects.Text;
  private hpText!: Phaser.GameObjects.Text;
  private joystickActive = false;
  private joystickOrigin = { x: 0, y: 0 };
  private joystickDelta = { x: 0, y: 0 };
  private joystickBase!: Phaser.GameObjects.Arc;
  private joystickThumb!: Phaser.GameObjects.Arc;
  private joystickPointerID = -1;
  private attackPressed = false;
  private stars: { x: number; y: number; obj: Phaser.GameObjects.Arc }[] = [];
  private enemyGlows: Map<Phaser.GameObjects.Arc, Phaser.GameObjects.Arc> = new Map();
  private gameWidth = 0;
  private gameHeight = 0;
  private skillCooldown = 0;

  constructor(hero: Hero, onGameOver: (score: number) => void) {
    super("GameScene");
    this.hero = hero;
    this.onGameOver = onGameOver;
  }

  preload() {
    this.load.image("player_" + this.hero.name, this.hero.image);
  }

  create() {
    this.gameWidth = this.scale.width;
    this.gameHeight = this.scale.height;

    this.drawStarfield();
    this.drawArenaBackground();

    this.player = this.add.image(
      this.gameWidth / 2,
      this.gameHeight / 2,
      "player_" + this.hero.name,
    );
    this.player.setDisplaySize(48, 48);
    this.physics.add.existing(this.player);
    (this.player.body as Phaser.Physics.Arcade.Body).setCollideWorldBounds(true);

    this.playerGlow();

    this.enemies = this.physics.add.group();
    this.projectiles = this.physics.add.group();

    this.time.addEvent({
      delay: SPAWN_INTERVAL,
      loop: true,
      callback: this.spawnEnemy,
      callbackScope: this,
    });

    if (this.hero.name === "Cici") {
      this.yoyoLine = this.add.graphics();
    }

    this.physics.add.overlap(
      this.projectiles,
      this.enemies,
      (proj, enemy) => {
        const e = enemy as Phaser.GameObjects.Arc;
        const p = proj as Phaser.GameObjects.Arc;
        this.addScore(10);
        this.hitEffect(e.x, e.y, 0x00ffff);
        p.destroy();
        e.destroy();
      },
    );

    this.physics.add.overlap(
      this.player,
      this.enemies,
      (_p, enemy) => {
        const e = enemy as Phaser.GameObjects.Arc;
        this.hitEffect(e.x, e.y, 0xff4444);
        e.destroy();
        this.hp -= 10;
        this.hpText.setText(`HP: ${this.hp}`);
        if (this.hp <= 0) this.endGame();
      },
    );

    this.scoreText = this.add
      .text(16, 16, "Score: 0", {
        fontSize: "18px",
        color: "#00ffff",
        fontStyle: "bold",
      })
      .setDepth(10);
    this.hpText = this.add
      .text(16, 40, `HP: ${this.hp}`, {
        fontSize: "14px",
        color: "#ff4444",
      })
      .setDepth(10);

    this.joystickBase = this.add
      .circle(100, this.gameHeight - 120, 60, 0xffffff, 0.1)
      .setDepth(20);
    this.joystickThumb = this.add
      .circle(100, this.gameHeight - 120, 28, 0x00ffff, 0.5)
      .setDepth(21);
    this.add
      .text(100, this.gameHeight - 120, "MOVE", {
        fontSize: "12px",
        color: "#fff",
      })
      .setOrigin(0.5)
      .setDepth(22);

    this.createActionButtons();
    this.input.on("pointerdown", this.onPointerDown, this);
    this.input.on("pointermove", this.onPointerMove, this);
    this.input.on("pointerup", this.onPointerUp, this);

    this.time.addEvent({
      delay: 600,
      loop: true,
      callback: () => {
        if (this.attackPressed || this.hero.name === "Sora") this.doAttack();
      },
    });
  }

  update(_time: number, delta: number) {
    const speed = this.hero.speed * 50;
    const body = this.player.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(
      this.joystickDelta.x * speed,
      this.joystickDelta.y * speed,
    );

    if (this.hero.name === "Cici" && this.attackPressed) {
      const nearest = this.getNearestEnemy();
      if (nearest) this.yoyoAttack(nearest);
    }

    this.skillCooldown = Math.max(0, this.skillCooldown - delta);

    for (const star of this.stars) {
      star.obj.y += 0.5;
      if (star.obj.y > this.gameHeight) {
        star.obj.y = 0;
        star.obj.x = Phaser.Math.Between(0, this.gameWidth);
      }
    }

    for (const [enemy, glow] of this.enemyGlows) {
      if (enemy.active) {
        glow.setPosition(enemy.x, enemy.y);
      } else {
        glow.destroy();
        this.enemyGlows.delete(enemy);
      }
    }
  }

  private drawStarfield() {
    for (let i = 0; i < 60; i++) {
      const star = this.add.circle(
        Phaser.Math.Between(0, this.gameWidth),
        Phaser.Math.Between(0, this.gameHeight),
        Phaser.Math.Between(1, 2),
        0xffffff,
        Phaser.Math.FloatBetween(0.2, 0.8),
      );
      star.setDepth(-1);
      this.stars.push({ x: star.x, y: star.y, obj: star });
    }
  }

  private drawArenaBackground() {
    const gfx = this.add.graphics();
    gfx.setDepth(-1);
    gfx.lineStyle(1, 0x00ffff, 0.08);
    for (let x = 0; x < this.gameWidth; x += 40) {
      gfx.moveTo(x, 0);
      gfx.lineTo(x, this.gameHeight);
    }
    for (let y = 0; y < this.gameHeight; y += 40) {
      gfx.moveTo(0, y);
      gfx.lineTo(this.gameWidth, y);
    }
    gfx.strokePath();
  }

  private playerGlow() {
    const glow = this.add.circle(
      this.player.x,
      this.player.y,
      30,
      0x00ffff,
      0.15,
    );
    glow.setDepth(-0.5);
    this.tweens.add({
      targets: glow,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 800,
      repeat: -1,
      onRepeat: () => {
        glow.setPosition(this.player.x, this.player.y);
        glow.setAlpha(0.15);
        glow.setScale(1);
      },
    });
  }

  private onPointerDown(pointer: Phaser.Input.Pointer) {
    if (
      pointer.x < this.gameWidth / 2 &&
      pointer.y > this.gameHeight / 2
    ) {
      this.joystickActive = true;
      this.joystickPointerID = pointer.id;
      this.joystickOrigin = { x: pointer.x, y: pointer.y };
      this.joystickBase.setPosition(pointer.x, pointer.y);
      this.joystickThumb.setPosition(pointer.x, pointer.y);
    }
  }

  private onPointerMove(pointer: Phaser.Input.Pointer) {
    if (!this.joystickActive || pointer.id !== this.joystickPointerID) return;

    const dx = pointer.x - this.joystickOrigin.x;
    const dy = pointer.y - this.joystickOrigin.y;
    const dist = Math.min(Math.hypot(dx, dy), 55);
    const angle = Math.atan2(dy, dx);

    this.joystickDelta = {
      x: (Math.cos(angle) * dist) / 55,
      y: (Math.sin(angle) * dist) / 55,
    };
    this.joystickThumb.setPosition(
      this.joystickOrigin.x + Math.cos(angle) * dist,
      this.joystickOrigin.y + Math.sin(angle) * dist,
    );
  }

  private onPointerUp(pointer: Phaser.Input.Pointer) {
    if (pointer.id !== this.joystickPointerID) return;

    this.joystickActive = false;
    this.joystickDelta = { x: 0, y: 0 };
    this.joystickThumb.setPosition(
      this.joystickOrigin.x,
      this.joystickOrigin.y,
    );
  }

  private createActionButtons() {
    const ax = this.gameWidth - 80;
    const ay = this.gameHeight - 100;

    const attack = this.add
      .circle(ax, ay, 38, 0xff4444, 0.8)
      .setInteractive()
      .setDepth(20);
    this.add
      .text(ax, ay, "ATK", {
        fontSize: "13px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(21);

    attack.on("pointerdown", () => {
      this.attackPressed = true;
      this.doAttack();
    });
    attack.on("pointerup", () => {
      this.attackPressed = false;
    });

    const sx = this.gameWidth - 160;
    const sy = this.gameHeight - 80;

    const skill = this.add
      .circle(sx, sy, 38, 0x9b59b6, 0.8)
      .setInteractive()
      .setDepth(20);
    this.add
      .text(sx, sy, "SKL", {
        fontSize: "13px",
        color: "#fff",
        fontStyle: "bold",
      })
      .setOrigin(0.5)
      .setDepth(21);
    skill.on("pointerdown", () => this.doSkill());
  }

  private doAttack() {
    const nearest = this.getNearestEnemy();
    if (!nearest) return;

    switch (this.hero.name) {
      case "Sora":
        this.dashTo(nearest);
        break;
      case "Zhuxin":
        this.fireProjectile(nearest);
        break;
      case "Cici":
        this.yoyoAttack(nearest);
        break;
      case "Nolan":
        this.blinkAttack(nearest);
        break;
    }
  }

  private doSkill() {
    if (this.skillCooldown > 0) return;
    if (this.hero.name !== "Zhuxin") return;

    this.skillCooldown = 3000;

    const skillEffect = this.add.circle(
      this.player.x,
      this.player.y,
      150,
      0x9b59b6,
      0.25,
    );
    skillEffect.setDepth(5);
    this.tweens.add({
      targets: skillEffect,
      scaleX: 1.5,
      scaleY: 1.5,
      alpha: 0,
      duration: 500,
      onComplete: () => skillEffect.destroy(),
    });

    for (let i = 0; i < 12; i++) {
      const angle = (Math.PI * 2 * i) / 12;
      const particle = this.add.circle(
        this.player.x,
        this.player.y,
        4,
        0x9b59b6,
        1,
      );
      particle.setDepth(5);
      this.tweens.add({
        targets: particle,
        x: this.player.x + Math.cos(angle) * 180,
        y: this.player.y + Math.sin(angle) * 180,
        alpha: 0,
        duration: 400,
        onComplete: () => particle.destroy(),
      });
    }

    const toDestroy: Phaser.GameObjects.Arc[] = [];
    this.enemies.getChildren().forEach((item) => {
      const enemy = item as Phaser.GameObjects.Arc;
      const dist = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y,
      );

      if (dist < 150) {
        this.skillHitEffect(enemy.x, enemy.y);
        toDestroy.push(enemy);
        this.addScore(15);
      }
    });

    toDestroy.forEach((e) => e.destroy());
  }

  private getNearestEnemy(): Phaser.GameObjects.Arc | null {
    let nearest: Phaser.GameObjects.Arc | null = null;
    let minDist = Infinity;

    this.enemies.getChildren().forEach((item) => {
      const enemy = item as Phaser.GameObjects.Arc;
      const distance = Phaser.Math.Distance.Between(
        this.player.x,
        this.player.y,
        enemy.x,
        enemy.y,
      );

      if (distance < minDist) {
        minDist = distance;
        nearest = enemy;
      }
    });

    return nearest;
  }

  private dashTo(enemy: Phaser.GameObjects.Arc) {
    for (let i = 0; i < 3; i++) {
      const afterimage = this.add.image(
        this.player.x - (i + 1) * 8,
        this.player.y,
        "player_" + this.hero.name,
      );
      afterimage.setDisplaySize(48, 48);
      afterimage.setAlpha(0.3 - i * 0.1);
      afterimage.setDepth(-0.5);
      this.tweens.add({
        targets: afterimage,
        alpha: 0,
        duration: 200,
        onComplete: () => afterimage.destroy(),
      });
    }

    this.tweens.add({
      targets: this.player,
      x: enemy.x,
      y: enemy.y,
      duration: 150,
      onComplete: () => {
        this.hitEffect(enemy.x, enemy.y, 0x00ffff);
        enemy.destroy();
        this.addScore(10);
      },
    });
  }

  private fireProjectile(enemy: Phaser.GameObjects.Arc) {
    const proj = this.add.circle(this.player.x, this.player.y, 8, 0x9b59b6);
    proj.setDepth(3);
    this.physics.add.existing(proj);
    this.projectiles.add(proj);

    const projGlow = this.add.circle(
      this.player.x,
      this.player.y,
      12,
      0x9b59b6,
      0.3,
    );
    projGlow.setDepth(2);
    this.tweens.add({
      targets: projGlow,
      alpha: 0,
      duration: 300,
      repeat: -1,
    });

    const angle = Phaser.Math.Angle.Between(
      this.player.x,
      this.player.y,
      enemy.x,
      enemy.y,
    );
    const body = proj.body as Phaser.Physics.Arcade.Body;
    body.setVelocity(Math.cos(angle) * 400, Math.sin(angle) * 400);

    const followTimer = this.time.addEvent({
      delay: 16,
      loop: true,
      callback: () => {
        if (proj.active) {
          projGlow.setPosition(proj.x, proj.y);
        } else {
          projGlow.destroy();
          followTimer.destroy();
        }
      },
    });

    this.time.delayedCall(2000, () => {
      if (proj.active) {
        proj.destroy();
        projGlow.destroy();
      }
    });
  }

  private yoyoAttack(enemy: Phaser.GameObjects.Arc) {
    this.yoyoLine.clear();

    const gradient = this.add.graphics();
    gradient.setDepth(2);
    gradient.lineStyle(4, 0xff69b4, 0.9);
    gradient.lineBetween(this.player.x, this.player.y, enemy.x, enemy.y);

    for (let i = 0; i < 5; i++) {
      const t = (i + 1) / (5 + 1);
      const sx = Phaser.Math.Linear(this.player.x, enemy.x, t);
      const sy = Phaser.Math.Linear(this.player.y, enemy.y, t);
      const spark = this.add.circle(sx, sy, 3, 0xff69b4, 1);
      spark.setDepth(3);
      this.tweens.add({
        targets: spark,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 250,
        onComplete: () => spark.destroy(),
      });
    }

    this.fireProjectile(enemy);
    this.time.delayedCall(300, () => {
      this.yoyoLine.clear();
      gradient.destroy();
    });
  }

  private blinkAttack(enemy: Phaser.GameObjects.Arc) {
    const blinkColor = 0xff8c00;

    for (let index = 0; index < 5; index++) {
      const ghost = this.add.image(
        this.player.x - index * 12,
        this.player.y,
        "player_" + this.hero.name,
      );
      ghost.setDisplaySize(48, 48);
      ghost.setAlpha(0.3);
      ghost.setTint(blinkColor);
      ghost.setDepth(-0.5);
      this.tweens.add({
        targets: ghost,
        alpha: 0,
        duration: 350,
        onComplete: () => ghost.destroy(),
      });
    }

    const flash = this.add.circle(enemy.x, enemy.y, 40, blinkColor, 0.6);
    flash.setDepth(4);
    this.tweens.add({
      targets: flash,
      scaleX: 2,
      scaleY: 2,
      alpha: 0,
      duration: 300,
      onComplete: () => flash.destroy(),
    });

    this.player.setPosition(enemy.x, enemy.y);
    this.hitEffect(enemy.x, enemy.y, blinkColor);
    enemy.destroy();
    this.addScore(15);
  }

  private spawnEnemy() {
    const sides = [
      { x: Phaser.Math.Between(0, this.gameWidth), y: -20 },
      { x: Phaser.Math.Between(0, this.gameWidth), y: this.gameHeight + 20 },
      { x: -20, y: Phaser.Math.Between(0, this.gameHeight) },
      { x: this.gameWidth + 20, y: Phaser.Math.Between(0, this.gameHeight) },
    ];
    const pos = Phaser.Utils.Array.GetRandom(sides);

    const enemy = this.add.circle(pos.x, pos.y, 16, 0xff2222);
    enemy.setDepth(1);

    const enemyGlow = this.add.circle(pos.x, pos.y, 22, 0xff0000, 0.2);
    enemyGlow.setDepth(0.5);
    this.enemyGlows.set(enemy, enemyGlow);

    this.tweens.add({
      targets: enemyGlow,
      alpha: 0.4,
      scaleX: 1.2,
      scaleY: 1.2,
      duration: 400,
      yoyo: true,
      repeat: -1,
    });

    this.physics.add.existing(enemy);
    this.enemies.add(enemy);

    const body = enemy.body as Phaser.Physics.Arcade.Body;
    const angle = Phaser.Math.Angle.Between(
      pos.x,
      pos.y,
      this.player.x,
      this.player.y,
    );
    body.setVelocity(
      Math.cos(angle) * ENEMY_SPEED,
      Math.sin(angle) * ENEMY_SPEED,
    );
  }

  private hitEffect(x: number, y: number, color: number) {
    for (let i = 0; i < 6; i++) {
      const particle = this.add.circle(x, y, 3, color, 1);
      particle.setDepth(5);
      const angle = (Math.PI * 2 * i) / 6;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 30,
        y: y + Math.sin(angle) * 30,
        alpha: 0,
        duration: 300,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private skillHitEffect(x: number, y: number) {
    for (let i = 0; i < 8; i++) {
      const particle = this.add.circle(x, y, 4, 0x9b59b6, 1);
      particle.setDepth(5);
      const angle = (Math.PI * 2 * i) / 8;
      this.tweens.add({
        targets: particle,
        x: x + Math.cos(angle) * 40,
        y: y + Math.sin(angle) * 40,
        alpha: 0,
        scaleX: 0,
        scaleY: 0,
        duration: 350,
        onComplete: () => particle.destroy(),
      });
    }
  }

  private addScore(points: number) {
    this.score += points;
    this.scoreText.setText(`Score: ${this.score}`);
  }

  private endGame() {
    const final =
      this.hero.name === getHOTW()
        ? Math.floor(this.score * HOTW_MULTIPLIER)
        : this.score;
    this.scene.stop();
    this.onGameOver(final);
  }
}
