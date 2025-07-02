import Phaser from 'phaser';
import './style.css';

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
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x001122);

    // Footer (author name)
    this.footer = this.add.text(400, 585, 'Created by Ishpreet Singh', {
      fontSize: '18px', fill: '#aaa', fontStyle: 'italic', stroke: '#222', strokeThickness: 2
    }).setOrigin(0.5);

    // UI
    this.score = 0;
    this.lives = 3;
    this.scoreText = this.add.text(24, 16, 'Score: 0', { fontSize: '28px', fill: '#fff', backgroundColor: '#222a', padding: { left: 10, right: 10, top: 4, bottom: 4 }, borderRadius: 8 });
    this.livesText = this.add.text(24, 54, 'Lives: 3', { fontSize: '28px', fill: '#fff', backgroundColor: '#222a', padding: { left: 10, right: 10, top: 4, bottom: 4 }, borderRadius: 8 });

    // Game over and start screens
    this.gameOverText = this.add.text(400, 220, '', { fontSize: '64px', fill: '#ff4444', stroke: '#000', strokeThickness: 6 }).setOrigin(0.5);
    this.startText = this.add.text(400, 320, 'Press SPACE to Start', { fontSize: '36px', fill: '#fff', stroke: '#000', strokeThickness: 4 }).setOrigin(0.5);
    this.instructionsText = this.add.text(400, 400, 'Arrow Keys: Move   |   Space: Shoot', { fontSize: '24px', fill: '#fff', stroke: '#000', strokeThickness: 2 }).setOrigin(0.5);

    // Hide game UI until game starts
    this.scoreText.setVisible(false);
    this.livesText.setVisible(false);

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

    // Collisions (enabled after game starts)
    // Enemy spawn timer (enabled after game starts)
  }

  update() {
    // Start screen logic
    if (!this.isGameStarted) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.startGamePlay();
      }
      return;
    }

    // Game over logic
    if (this.lives <= 0) {
      if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
        this.scene.restart();
      }
      return;
    }

    // Player movement
    if (this.cursors.left.isDown) {
      this.player.body.setVelocityX(-300);
    } else if (this.cursors.right.isDown) {
      this.player.body.setVelocityX(300);
    } else {
      this.player.body.setVelocityX(0);
    }

    // Shooting
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      this.shoot();
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
  width: 800,
  height: 600,
  parent: 'app',
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