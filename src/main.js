import Phaser from 'phaser';
import './style.css';

const GAME_WIDTH = 800;
const GAME_HEIGHT = 600;

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: 'GameScene' });
  }

  preload() {
    // Create simple colored rectangles as textures
    const g1 = this.make.graphics({x:0, y:0, add:false});
    g1.fillStyle(0x00ff00).fillRect(0, 0, 32, 32);
    g1.generateTexture('player', 32, 32);

    const g2 = this.make.graphics({x:0, y:0, add:false});
    g2.fillStyle(0xff0000).fillRect(0, 0, 24, 24);
    g2.generateTexture('enemy', 24, 24);

    const g3 = this.make.graphics({x:0, y:0, add:false});
    g3.fillStyle(0xffff00).fillRect(0, 0, 4, 16);
    g3.generateTexture('bullet', 4, 16);
  }

  create() {
    // Responsive background
    this.bgRect = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT/2, GAME_WIDTH, GAME_HEIGHT, 0x001122);

    // Footer (author name)
    this.footer = this.add.text(GAME_WIDTH/2, GAME_HEIGHT-15, 'Created by Ishpreet Singh', {
      fontSize: '18px', fill: '#aaa', fontStyle: 'italic', stroke: '#222', strokeThickness: 2
    }).setOrigin(0.5);

    // UI
    this.score = 0;
    this.lives = 3;
    this.scoreText = this.add.text(24, 16, 'Score: 0', { fontSize: '28px', fill: '#fff', backgroundColor: '#222a', padding: { left: 10, right: 10, top: 4, bottom: 4 }, borderRadius: 8 });
    this.livesText = this.add.text(24, 54, 'Lives: 3', { fontSize: '28px', fill: '#fff', backgroundColor: '#222a', padding: { left: 10, right: 10, top: 4, bottom: 4 }, borderRadius: 8 });

    // Game over and start screens
    this.gameOverText = this.add.text(GAME_WIDTH/2, 220, '', { fontSize: '64px', fill: '#ff4444', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.startText = this.add.text(GAME_WIDTH/2, 320, 'Press SPACE or Tap Start', { fontSize: '36px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.instructionsText = this.add.text(GAME_WIDTH/2, 400, 'Arrow Keys: Move   |   Space: Shoot', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

    // Start button for mobile/touch
    this.startBtn = this.add.rectangle(GAME_WIDTH/2, 380, 180, 60, 0x2ecc40, 0.85).setOrigin(0.5).setInteractive();
    this.startBtnText = this.add.text(GAME_WIDTH/2, 380, 'START', { fontSize: '32px', fill: '#fff', fontStyle: 'bold' }).setOrigin(0.5);
    this.startBtn.on('pointerdown', () => {
      if (!this.isGameStarted) this.startGamePlay();
    });
    // Hide game UI until game starts
    this.scoreText.setVisible(false);
    this.livesText.setVisible(false);
    this.startBtn.setVisible(true);
    this.startBtnText.setVisible(true);

    // Game state
    this.isGameStarted = false;

    // Input
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    // Groups
    this.bullets = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });
    this.enemies = this.physics.add.group({
      classType: Phaser.Physics.Arcade.Sprite,
      runChildUpdate: true
    });

    // Touch controls for mobile
    this.createTouchControls();

    // Collisions (enabled after game starts)
    // Enemy spawn timer (enabled after game starts)
  }

  createTouchControls() {
    // Only show on mobile
    if (!this.sys.game.device.os.android && !this.sys.game.device.os.iOS) return;

    // Overlay for better touch visibility
    this.touchOverlay = this.add.rectangle(GAME_WIDTH/2, GAME_HEIGHT-60, GAME_WIDTH, 120, 0x000000, 0.15).setScrollFactor(0);

    // Left button
    this.leftBtn = this.add.circle(70, GAME_HEIGHT-70, 40, 0x333333, 0.7).setScrollFactor(0).setInteractive();
    this.leftBtnText = this.add.text(70, GAME_HEIGHT-70, '<', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);
    this.leftBtn.on('pointerdown', () => { this.leftDown = true; });
    this.leftBtn.on('pointerup', () => { this.leftDown = false; });
    this.leftBtn.on('pointerout', () => { this.leftDown = false; });
    this.leftBtn.on('pointercancel', () => { this.leftDown = false; });

    // Right button
    this.rightBtn = this.add.circle(170, GAME_HEIGHT-70, 40, 0x333333, 0.7).setScrollFactor(0).setInteractive();
    this.rightBtnText = this.add.text(170, GAME_HEIGHT-70, '>', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);
    this.rightBtn.on('pointerdown', () => { this.rightDown = true; });
    this.rightBtn.on('pointerup', () => { this.rightDown = false; });
    this.rightBtn.on('pointerout', () => { this.rightDown = false; });
    this.rightBtn.on('pointercancel', () => { this.rightDown = false; });

    // Shoot button
    this.shootBtn = this.add.circle(GAME_WIDTH-70, GAME_HEIGHT-70, 40, 0x2ecc40, 0.7).setScrollFactor(0).setInteractive();
    this.shootBtnText = this.add.text(GAME_WIDTH-70, GAME_HEIGHT-70, '●', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);
    this.shootBtn.on('pointerdown', () => { this.shootDown = true; });
    this.shootBtn.on('pointerup', () => { this.shootDown = false; });
    this.shootBtn.on('pointerout', () => { this.shootDown = false; });
    this.shootBtn.on('pointercancel', () => { this.shootDown = false; });

    // Jump button (optional, for platformers)
    // this.jumpBtn = this.add.circle(GAME_WIDTH-170, GAME_HEIGHT-70, 40, 0x3498db, 0.7).setScrollFactor(0).setInteractive();
    // this.jumpBtnText = this.add.text(GAME_WIDTH-170, GAME_HEIGHT-70, '↑', { fontSize: '36px', fill: '#fff' }).setOrigin(0.5);
    // this.jumpBtn.on('pointerdown', () => { this.jumpDown = true; });
    // this.jumpBtn.on('pointerup', () => { this.jumpDown = false; });
    // this.jumpBtn.on('pointerout', () => { this.jumpDown = false; });
    // this.jumpBtn.on('pointercancel', () => { this.jumpDown = false; });
  }

  update() {
    // Start screen logic
    if (!this.isGameStarted) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.startGamePlay();
      }
      // Show start button only if not started
      if (this.startBtn) {
        this.startBtn.setVisible(true);
        this.startBtnText.setVisible(true);
      }
      return;
    } else {
      if (this.startBtn) {
        this.startBtn.setVisible(false);
        this.startBtnText.setVisible(false);
      }
    }

    // Game over logic
    if (this.lives <= 0) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.scene.restart();
      }
      return;
    }

    // Player movement (keyboard or touch)
    let moveLeft = this.cursors.left.isDown || this.leftDown;
    let moveRight = this.cursors.right.isDown || this.rightDown;
    if (moveLeft) {
      this.player.body.setVelocityX(-300);
    } else if (moveRight) {
      this.player.body.setVelocityX(300);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Shooting (keyboard or touch)
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey) || this.shootDown) {
      this.shoot();
      this.shootDown = false; // Prevent autofire on touch
    }

    // Clean up off-screen objects
    this.bullets.children.entries.forEach(bullet => {
      if (bullet.y < 0) {
        bullet.destroy();
      }
    });

    this.enemies.children.entries.forEach(enemy => {
      if (enemy.y > 600) {
        enemy.destroy();
        // Lose a life if enemy passes the player
        if (this.lives > 0) {
          this.lives--;
          this.livesText.setText('Lives: ' + this.lives);
          if (this.lives <= 0) {
            this.physics.pause();
            this.gameOverText.setText('GAME OVER\nPress SPACE to restart');
          } else {
            // Optional: flash effect to indicate life lost
            this.player.setTint(0xff0000);
            this.time.delayedCall(200, () => {
              this.player.clearTint();
            });
          }
        }
      }
    });
  }

  startGamePlay() {
    this.isGameStarted = true;
    this.score = 0;
    this.lives = 3;
    this.scoreText.setText('Score: 0').setVisible(true);
    this.livesText.setText('Lives: 3').setVisible(true);
    this.gameOverText.setText('');
    this.startText.setVisible(false);
    this.instructionsText.setVisible(false);
    if (this.startBtn) {
      this.startBtn.setVisible(false);
      this.startBtnText.setVisible(false);
    }

    // Create player (if not already created)
    if (!this.player) {
      this.player = this.physics.add.sprite(400, 550, 'player');
      this.player.setCollideWorldBounds(true);
    } else {
      this.player.setPosition(400, 550);
      this.player.clearTint();
      this.player.setActive(true).setVisible(true);
      this.physics.world.enable(this.player);
    }

    // Remove all enemies and bullets
    this.bullets.clear(true, true);
    this.enemies.clear(true, true);

    // Enable collisions
    this.physics.add.overlap(this.bullets, this.enemies, this.destroyEnemy, null, this);
    this.physics.add.overlap(this.player, this.enemies, this.hitPlayer, null, this);

    // Start enemy spawn timer
    if (!this.enemyTimer) {
      this.enemyTimer = this.time.addEvent({
        delay: 1000,
        callback: this.spawnEnemy,
        callbackScope: this,
        loop: true
      });
    } else {
      this.enemyTimer.paused = false;
    }
  }

  shoot() {
    // Create bullet using the group's create method
    const bullet = this.bullets.create(this.player.x, this.player.y - 20, 'bullet');
    bullet.setVelocityY(-400);
  }

  spawnEnemy() {
    if (this.lives <= 0) return;
    
    const x = Phaser.Math.Between(50, 750);
    // Create enemy using the group's create method
    const enemy = this.enemies.create(x, 0, 'enemy');
    enemy.setVelocityY(150);
  }

  destroyEnemy(bullet, enemy) {
    bullet.destroy();
    enemy.destroy();
    this.score += 10;
    this.scoreText.setText('Score: ' + this.score);
  }

  hitPlayer(player, enemy) {
    enemy.destroy();
    this.lives--;
    this.livesText.setText('Lives: ' + this.lives);
    if (this.lives <= 0) {
      this.physics.pause();
      this.gameOverText.setText('GAME OVER\nPress SPACE to restart');
      this.startText.setVisible(false);
      this.instructionsText.setVisible(false);
    } else {
      // Flash effect
      this.player.setTint(0xff0000);
      this.time.delayedCall(200, () => {
        this.player.clearTint();
      });
    }
  }
}

const config = {
  type: Phaser.AUTO,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT,
    parent: 'app',
    min: {
      width: 320,
      height: 480
    },
    max: {
      width: 1280,
      height: 1024
    }
  },
  backgroundColor: '#000000',
  physics: {
    default: 'arcade',
    arcade: {
      gravity: { y: 0 },
      debug: false
    }
  },
  scene: GameScene
};

// Initialize the game
function startGame() {
  if (!document.getElementById('app')) {
    const appDiv = document.createElement('div');
    appDiv.id = 'app';
    document.body.appendChild(appDiv);
  }
  
  new Phaser.Game(config);
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', startGame);
} else {
  startGame();
}