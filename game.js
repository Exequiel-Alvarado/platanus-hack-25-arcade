// Bubble Shooter Game for Platanus Hack 25
// Using Phaser 3 - No imports, pure vanilla JS

const Phaser = window.Phaser // Declare the Phaser variable

// Ensure a container with id 'game-container' exists (the iframe may not include it)
(function ensureGameContainer() {
  try {
    let container = document.getElementById('game-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'game-container'
      container.style.width = '800px'
      container.style.height = '600px'
      container.style.margin = '0'
      container.style.padding = '0'
      container.style.position = 'relative'
      // background will be handled by Phaser config
      document.body.appendChild(container)
    }
  } catch (e) {
    // If document isn't available yet, ignore — Phaser will create the canvas later
    console.warn('ensureGameContainer:', e && e.message)
  }
})()

class MenuScene extends Phaser.Scene {
  constructor() {
    super({ key: "MenuScene" })
  }

  create() {
    // Title
    const title = this.add.text(400, 150, "BUBBLE SHOOTER", {
      fontSize: "64px",
      fill: "#4ecdc4",
      fontFamily: "Arial",
      fontStyle: "bold",
    })
    title.setOrigin(0.5)

    const title2 = this.add.text(400, 50, "Exequiel Alvarado", {
      fontSize: "64px",
      fill: "#ffe66d",
      fontFamily: "Arial",
      fontStyle: "bold",
    })
    title2.setOrigin(0.5)

    // Subtitle
    const subtitle = this.add.text(400, 220, "Platanus Hack 25 Arcade", {
      fontSize: "24px",
      fill: "#ffe66d",
      fontFamily: "Arial",
    })
    subtitle.setOrigin(0.5)

    // Instructions
    const instructions = this.add.text(
      400,
      300,
      "Conecta 3+ burbujas del mismo color\n\n" + "Controles:\n" + "← → o A/D: Mover\n" + "ESPACIO: Disparar",
      {
        fontSize: "20px",
        fill: "#fff",
        fontFamily: "Arial",
        align: "center",
      },
    )
    instructions.setOrigin(0.5)

    // Start button
    const startButton = this.add.text(400, 450, "INICIAR JUEGO", {
      fontSize: "32px",
      fill: "#fff",
      fontFamily: "Arial",
      backgroundColor: "#4ecdc4",
      padding: { x: 30, y: 15 },
    })
    startButton.setOrigin(0.5)
    startButton.setInteractive({ useHandCursor: true })

    // Button hover effect
    startButton.on("pointerover", () => {
      startButton.setStyle({ backgroundColor: "#95e1d3" })
    })

    startButton.on("pointerout", () => {
      startButton.setStyle({ backgroundColor: "#4ecdc4" })
    })

    startButton.on("pointerdown", () => {
      this.scene.start("GameScene")
    })

    // High scores preview
    this.displayHighScoresPreview()
  }

  displayHighScoresPreview() {
    const highScores = getHighScores()
    if (highScores.length > 0) {
      let text = "MEJORES PUNTAJES:\n\n"
      const top10 = highScores.slice(0, 10)
      top10.forEach((entry, index) => {
        text += `${index + 1}. ${entry.name}: ${entry.score}\n`
      })

      const scoresText = this.add.text(400, 520, text, {
        fontSize: "16px",
        fill: "#ffe66d",
        fontFamily: "Arial",
        align: "center",
      })
      scoresText.setOrigin(0.5, 0)
    }
  }
}

class GameOverScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameOverScene" })
  }

  init(data) {
    this.finalScore = data.score || 0
    this.playerWon = data.won || false
  }

  create() {
    // Background
    this.add.rectangle(400, 300, 800, 600, 0x000022)

    // Game Over title
    const titleText = this.playerWon ? "YOU WIN!" : "GAME OVER!"
    const titleColor = this.playerWon ? "#4ecdc4" : "#ff6b6b"
    const gameOverText = this.add.text(400, 150, titleText, {
      fontSize: "64px",
      fill: titleColor,
      fontFamily: "Arial",
      fontStyle: "bold",
    })
    gameOverText.setOrigin(0.5)

    // Final score
    const finalScoreText = this.add.text(400, 220, "Final Score: " + this.finalScore, {
      fontSize: "32px",
      fill: "#fff",
      fontFamily: "Arial",
    })
    finalScoreText.setOrigin(0.5)

    // Check if it's a high score (only for losses, wins always save)
    if (this.playerWon || isHighScore(this.finalScore)) {
      const highScoreText = this.add.text(400, 270, this.playerWon ? "CONGRATULATIONS!" : "NEW HIGH SCORE!", {
        fontSize: "28px",
        fill: "#ffe66d",
        fontFamily: "Arial",
      })
      highScoreText.setOrigin(0.5)

      if (!this.playerWon) {
        const promptText = this.add.text(400, 310, "Enter your name:", {
          fontSize: "20px",
          fill: "#fff",
          fontFamily: "Arial",
        })
        promptText.setOrigin(0.5)

        this.createNameInput()
      } else {
        this.time.delayedCall(2000, () => this.showHighScoresAndRestart())
      }
    } else {
      this.showHighScoresAndRestart()
    }
      try {
        saveHighScore('YOU', this.finalScore)
      } catch (e) {
        console.log('Error guardando score automáticamente', e)
      }

      // Mostrar el top score (nombre y puntaje) en la parte superior central
      const highScores = getHighScores()
      let topTextStr = 'No high scores yet'
      if (highScores && highScores.length > 0) {
        const top = highScores[0]
        topTextStr = `${top.name}: ${top.score}`
      }
      const topScoreText = this.add.text(400, 80, topTextStr, { fontSize: '28px', fill: '#ffe66d', fontFamily: 'Arial' }).setOrigin(0.5)
      topScoreText.setDepth(30)

      // Mostrar puntaje del jugador en la esquina superior derecha (refuerzo)
      if (this.topRightScoreText) this.topRightScoreText.setText(String(this.finalScore))

      const container = document.getElementById('game-container')

      // Si, tras el guardado automático, nuestro score quedó en primer lugar, permitir editar el nombre del primer puesto
      const updated = getHighScores()
      const isNowTop = updated && updated.length > 0 && updated[0].score === this.finalScore && updated[0].name === 'YOU'

      if (isNowTop) {
        // Mostrar input para reemplazar 'YOU' por el nombre real en la posición 0
        const wrapper = document.createElement('div')
        wrapper.style.position = 'absolute'
        wrapper.style.left = '50%'
        wrapper.style.top = '360px'
        wrapper.style.transform = 'translate(-50%, -50%)'
        wrapper.style.zIndex = '1000'
        wrapper.style.textAlign = 'center'

        const prompt = document.createElement('div')
        prompt.textContent = '¡NUEVO RÉCORD! Ingresa tu nombre para el #1:'
        prompt.style.color = '#ffe66d'
        prompt.style.fontFamily = 'Arial'
        prompt.style.marginBottom = '8px'
        wrapper.appendChild(prompt)

        const input = document.createElement('input')
        input.type = 'text'
        input.maxLength = 12
        input.placeholder = 'TU NOMBRE'
        input.style.padding = '8px 12px'
        input.style.fontSize = '16px'
        input.style.border = '2px solid #4ecdc4'
        input.style.borderRadius = '4px'
        input.style.background = '#0b1220'
        input.style.color = '#fff'
        input.style.outline = 'none'
        wrapper.appendChild(input)

        const btn = document.createElement('button')
        btn.textContent = 'GUARDAR'
        btn.style.marginLeft = '8px'
        btn.style.padding = '8px 12px'
        btn.style.fontSize = '16px'
        btn.style.border = 'none'
        btn.style.borderRadius = '4px'
        btn.style.background = '#4ecdc4'
        btn.style.cursor = 'pointer'
        wrapper.appendChild(btn)

        container.appendChild(wrapper)
        input.focus()

        const cleanup = () => { try { container.removeChild(wrapper) } catch (e) { } }

        const submit = () => {
          const name = (input.value || '').trim() || 'YOU'
          // Actualizar el primer puesto en storage sin duplicar
          const hs = getHighScores()
          if (hs && hs.length > 0 && hs[0].score === this.finalScore) {
            hs[0].name = name
            try { localStorage.setItem('bubbleShooterScores', JSON.stringify(hs.slice(0,10))) } catch (e) {}
          }
          cleanup()
          // Mostrar lista top10
          showTop10.call(this)
        }

        btn.onclick = submit
        input.addEventListener('keypress', (e) => { if (e.key === 'Enter') submit() })
      } else {
        // No es primer puesto: mostrar lista top10 automáticamente
        showTop10.call(this)
      }

      // Muestra la lista top10 centrada en la pantalla
      function showTop10() {
        const hs = getHighScores()
        let text = 'TOP 10\n\n'
        if (!hs || hs.length === 0) text += 'No scores yet!'
        else {
          const top10 = hs.slice(0,10)
          top10.forEach((e, i) => { text += `${i+1}. ${e.name}: ${e.score}\n` })
        }
        const scoresText = this.add.text(400, 200, text, { fontSize: '18px', fill: '#ffe66d', fontFamily: 'Arial', align: 'center' }).setOrigin(0.5)
        scoresText.setDepth(30)

        // Reiniciar
        const restartText = this.add.text(400, 460, 'REINICIAR', { fontSize: '26px', fill: '#000', fontFamily: 'Arial', backgroundColor: '#4ecdc4', padding: { x: 14, y: 8 } }).setOrigin(0.5)
        restartText.setInteractive({ useHandCursor: true })
        restartText.setDepth(30)
        restartText.on('pointerdown', () => this.scene.restart())
        this.input.keyboard.once('keydown-R', () => this.scene.restart())
        this.input.keyboard.once('keydown-SPACE', () => this.scene.restart())
      }
  }

  createNameInput() {
    const input = document.createElement("input")
    input.type = "text"
    input.maxLength = 15
    input.placeholder = "Your name"
    input.style.position = "absolute"
    input.style.left = "50%"
    input.style.top = "55%"
    input.style.transform = "translate(-50%, -50%)"
    input.style.padding = "10px"
    input.style.fontSize = "20px"
    input.style.textAlign = "center"
    input.style.border = "2px solid #4ecdc4"
    input.style.borderRadius = "5px"
    input.style.backgroundColor = "#1a1a2e"
    input.style.color = "#fff"
    input.style.outline = "none"
    input.style.zIndex = "1000"

    const container = document.getElementById("game-container")
    container.appendChild(input)
    input.focus()

    const button = document.createElement("button")
    button.textContent = "SUBMIT"
    button.style.position = "absolute"
    button.style.left = "50%"
    button.style.top = "62%"
    button.style.transform = "translate(-50%, -50%)"
    button.style.padding = "10px 30px"
    button.style.fontSize = "18px"
    button.style.border = "none"
    button.style.borderRadius = "5px"
    button.style.backgroundColor = "#4ecdc4"
    button.style.color = "#1a1a2e"
    button.style.cursor = "pointer"
    button.style.fontWeight = "bold"
    button.style.zIndex = "1000"

    container.appendChild(button)

    const submitScore = () => {
      const name = input.value.trim() || "Anonymous"
      saveHighScore(name, this.finalScore)

      container.removeChild(input)
      container.removeChild(button)

      this.showHighScoresAndRestart()
    }

    button.onclick = submitScore
    input.addEventListener("keypress", (e) => {
      if (e.key === "Enter") {
        submitScore()
      }
    })
  }

  showHighScoresAndRestart() {
    // Display high scores
    const highScores = getHighScores()
    let text = "TOP SCORES\n\n"
    const top10 = highScores.slice(0, 10)

    if (top10.length === 0) {
      text += "No scores yet!"
    } else {
      top10.forEach((entry, index) => {
        text += `${index + 1}. ${entry.name}: ${entry.score}\n`
      })
    }

    const scoresText = this.add.text(400, 380, text, {
      fontSize: "16px",
      fill: "#ffe66d",
      fontFamily: "Arial",
      align: "center",
    })
    scoresText.setOrigin(0.5, 0)

    // Restart button
    const restartText = this.add.text(400, 520, "Press R to Restart", {
      fontSize: "24px",
      fill: "#4ecdc4",
      fontFamily: "Arial",
    })
    restartText.setOrigin(0.5)

    this.input.keyboard.on("keydown-R", () => {
      this.scene.start("MenuScene")
    })
  }
}

class GameScene extends Phaser.Scene {
  constructor() {
    super({ key: "GameScene" });
  }

  init() {
    this.score = 0;
    this.gameOver = false;
  }

  preload() {
    // No external assets needed
  }

  create() {
    // Inicializar variables del juego
    this.shooter = null;
    this.currentBubble = null;
    this.bubbleGrid = [];
    this.score = 0;
    this.scoreText = null;
    this.gameOver = false;
    
    // Línea roja de game over
    this.gameOverLine = this.add.graphics();
    this.gameOverLine.lineStyle(4, 0xff0000);
    this.gameOverLine.lineBetween(0, 500, 800, 500);
    this.COLORS = [0x16de67, 0x16adde, 0x7513be, 0x5d0948, 0xbe13a2, 0xde1652, 0xed9f4f, 0xff4500, 0xd0ed4f, 0x40e0d0, 0x2fead7, 0xf7b0cd]
    this.BUBBLE_SIZE = 40
    this.GRID_ROWS = 8
    this.GRID_COLS = 15
    this.SHOOTER_Y = 550
    this.GAME_OVER_LINE_Y = 500
    this.highScoresText = null
    this.nameInputActive = false
    this.audioContext = this.sound.context

    // Create shooter
    this.shooter = this.add.graphics()
    this.shooter.x = 400
    this.shooter.y = this.SHOOTER_Y
    this.drawShooter(this.shooter)

    // Create current bubble to shoot
    this.createNewBubble()

    // Initialize bubble grid
    this.initializeBubbleGrid()

    // Draw game over line
    this.drawGameOverLine()

    // Score text
    this.scoreText = this.add.text(16, 16, "Score: 0", {
      fontSize: "24px",
      fill: "#fff",
      fontFamily: "Arial",
    })
    // Small top-right score (player's score) — shown during gameplay and Game Over
    this.topRightScoreText = this.add.text(784, 12, `${this.score}`, {
      fontSize: "18px",
      fill: "#ffe66d",
      fontFamily: "Arial",
    }).setOrigin(1, 0)

    this.displayHighScores()

    // Controls
    this.input.keyboard.on("keydown-LEFT", () => {
      if (!this.gameOver && !this.nameInputActive && this.shooter.x > 50) {
        this.shooter.x -= 20
        if (this.currentBubble) this.currentBubble.x -= 20
      }
    })

    this.input.keyboard.on("keydown-RIGHT", () => {
      if (!this.gameOver && !this.nameInputActive && this.shooter.x < 750) {
        this.shooter.x += 20
        if (this.currentBubble) this.currentBubble.x += 20
      }
    })

    this.input.keyboard.on("keydown-SPACE", () => {
      if (!this.gameOver && !this.nameInputActive && this.currentBubble && !this.currentBubble.launched) {
        this.shootBubble()
      }
    })

    this.input.keyboard.on("keydown-A", () => {
      if (!this.gameOver && !this.nameInputActive && this.shooter.x > 50) {
        this.shooter.x -= 20
        if (this.currentBubble) this.currentBubble.x -= 20
      }
    })

    this.input.keyboard.on("keydown-D", () => {
      if (!this.gameOver && !this.nameInputActive && this.shooter.x < 750) {
        this.shooter.x += 20
        if (this.currentBubble) this.currentBubble.x += 20
      }
    })
  }

  update() {
    if (this.gameOver) return

    // Check if any bubble has reached the game over line
    for (let row = 0; row < this.bubbleGrid.length; row++) {
      for (let col = 0; col < this.bubbleGrid[row].length; col++) {
        const bubble = this.bubbleGrid[row][col]
        if (bubble) {
          console.log(`Bubble at row ${row}, col ${col}: y=${bubble.y}, line=${this.GAME_OVER_LINE_Y}`)
          if (bubble.y >= this.GAME_OVER_LINE_Y) {
            console.log(`Game Over triggered: bubble at y=${bubble.y}, line at y=${this.GAME_OVER_LINE_Y}`)
            this.gameOver = true
            this.endGame()
            return
          }
        }
      }
    }

    // Check if there are no more bubbles (player won)
    let totalBubbles = 0
    for (let row = 0; row < this.bubbleGrid.length; row++) {
      for (let col = 0; col < this.GRID_COLS; col++) {
        if (this.bubbleGrid[row] && this.bubbleGrid[row][col]) {
          totalBubbles++
        }
      }
    }

    if (totalBubbles === 0) {
      console.log("Player won! No more bubbles")
      this.gameOver = true
      this.scene.start("GameOverScene", { score: this.score, won: true })
      return
    }
  }

  drawShooter(graphics) {
    graphics.clear()
    graphics.fillStyle(0xffffff, 1)
    graphics.fillTriangle(-15, 0, 15, 0, 0, -30)
  }

  drawGameOverLine() {
    const line = this.add.graphics()
    line.lineStyle(3, 0xff0000, 1)
    line.moveTo(0, this.GAME_OVER_LINE_Y)
    line.lineTo(800, this.GAME_OVER_LINE_Y)
    line.strokePath()
  }

  createNewBubble() {
    const color = Phaser.Utils.Array.GetRandom(this.COLORS)
    this.currentBubble = this.add.graphics()
    this.currentBubble.fillStyle(color, 1)
    this.currentBubble.fillCircle(0, 0, this.BUBBLE_SIZE / 2)
    this.currentBubble.x = this.shooter.x
    this.currentBubble.y = this.shooter.y - 40
    this.currentBubble.color = color
    this.currentBubble.launched = false
    this.currentBubble.velocityX = 0
    this.currentBubble.velocityY = 0
  }

  shootBubble() {
    if (!this.currentBubble || this.currentBubble.launched) return

    this.playShootSound()
    this.currentBubble.launched = true
    this.currentBubble.velocityY = -8

    const moveBubble = () => {
      if (!this.currentBubble || !this.currentBubble.launched) return

      this.currentBubble.x += this.currentBubble.velocityX
      this.currentBubble.y += this.currentBubble.velocityY

      if (this.currentBubble.x <= this.BUBBLE_SIZE / 2 || this.currentBubble.x >= 800 - this.BUBBLE_SIZE / 2) {
        this.currentBubble.velocityX *= -1
      }

      if (this.currentBubble.y <= this.BUBBLE_SIZE / 2 || this.checkGridCollision(this.currentBubble)) {
        this.snapToGrid(this.currentBubble)
        this.currentBubble.launched = false
        this.checkMatches(this.currentBubble)
        this.currentBubble = null
        this.time.delayedCall(200, () => this.createNewBubble())
        return
      }

      if (this.currentBubble.y >= this.SHOOTER_Y) {
        this.endGame()
        return
      }

      this.time.delayedCall(16, moveBubble)
    }

    moveBubble()
  }

  initializeBubbleGrid() {
    for (let row = 0; row < 5; row++) {
      this.bubbleGrid[row] = []
      for (let col = 0; col < this.GRID_COLS; col++) {
        const offset = row % 2 === 0 ? 0 : this.BUBBLE_SIZE / 2
        const x = col * this.BUBBLE_SIZE + this.BUBBLE_SIZE / 2 + offset + 20
        const y = row * this.BUBBLE_SIZE + this.BUBBLE_SIZE / 2 + 20

        const color = Phaser.Utils.Array.GetRandom(this.COLORS)
        const bubble = this.add.graphics()
        bubble.fillStyle(color, 1)
        bubble.fillCircle(0, 0, this.BUBBLE_SIZE / 2)
        bubble.x = x
        bubble.y = y
        bubble.color = color
        bubble.row = row
        bubble.col = col

        this.bubbleGrid[row][col] = bubble
      }
    }
  }

  checkGridCollision(bubble) {
    for (let row = 0; row < this.bubbleGrid.length; row++) {
      for (let col = 0; col < this.bubbleGrid[row].length; col++) {
        const gridBubble = this.bubbleGrid[row][col]
        if (gridBubble) {
          const dist = Phaser.Math.Distance.Between(bubble.x, bubble.y, gridBubble.x, gridBubble.y)
          if (dist < this.BUBBLE_SIZE) {
            return true
          }
        }
      }
    }
    return false
  }

  snapToGrid(bubble) {
    let closestRow = Math.round((bubble.y - 20 - this.BUBBLE_SIZE / 2) / this.BUBBLE_SIZE)
    closestRow = Math.max(0, closestRow)

    const offset = closestRow % 2 === 0 ? 0 : this.BUBBLE_SIZE / 2
    let closestCol = Math.round((bubble.x - 20 - this.BUBBLE_SIZE / 2 - offset) / this.BUBBLE_SIZE)
    closestCol = Math.max(0, Math.min(this.GRID_COLS - 1, closestCol))

    while (this.bubbleGrid.length <= closestRow) {
      this.bubbleGrid.push([])
    }

    while (this.bubbleGrid[closestRow][closestCol]) {
      closestRow--
      if (closestRow < 0) {
        closestRow = 0
        break
      }
    }

    const finalOffset = closestRow % 2 === 0 ? 0 : this.BUBBLE_SIZE / 2
    bubble.x = closestCol * this.BUBBLE_SIZE + this.BUBBLE_SIZE / 2 + finalOffset + 20
    bubble.y = closestRow * this.BUBBLE_SIZE + this.BUBBLE_SIZE / 2 + 20
    bubble.row = closestRow
    bubble.col = closestCol

    this.bubbleGrid[closestRow][closestCol] = bubble
  }

  checkMatches(bubble) {
    const matches = []
    const toCheck = [bubble]
    const checked = new Set()

    while (toCheck.length > 0) {
      const current = toCheck.pop()
      const key = `${current.row},${current.col}`

      if (checked.has(key)) continue
      checked.add(key)

      if (current.color === bubble.color) {
        matches.push(current)

        const neighbors = this.getNeighbors(current.row, current.col)
        for (const neighbor of neighbors) {
          if (neighbor && !checked.has(`${neighbor.row},${neighbor.col}`)) {
            toCheck.push(neighbor)
          }
        }
      }
    }

    if (matches.length >= 3) {
      this.playPopSound()
      for (const match of matches) {
        match.destroy()
        this.bubbleGrid[match.row][match.col] = null
        this.score += 10
      }
      this.scoreText.setText("Score: " + this.score)
      if (this.topRightScoreText) this.topRightScoreText.setText(String(this.score))

      this.time.delayedCall(100, () => this.removeFloatingBubbles())
    }
  }

  getNeighbors(row, col) {
    const neighbors = []
    const isEvenRow = row % 2 === 0

    const offsets = isEvenRow
      ? [
          [-1, -1],
          [-1, 0],
          [0, -1],
          [0, 1],
          [1, -1],
          [1, 0],
        ]
      : [
          [-1, 0],
          [-1, 1],
          [0, -1],
          [0, 1],
          [1, 0],
          [1, 1],
        ]

    for (const [dRow, dCol] of offsets) {
      const newRow = row + dRow
      const newCol = col + dCol
      if (
        newRow >= 0 &&
        newRow < this.bubbleGrid.length &&
        newCol >= 0 &&
        newCol < this.GRID_COLS &&
        this.bubbleGrid[newRow] &&
        this.bubbleGrid[newRow][newCol]
      ) {
        neighbors.push(this.bubbleGrid[newRow][newCol])
      }
    }

    return neighbors
  }

  removeFloatingBubbles() {
    const connected = new Set()

    for (let col = 0; col < this.GRID_COLS; col++) {
      if (this.bubbleGrid[0] && this.bubbleGrid[0][col]) {
        this.markConnected(this.bubbleGrid[0][col], connected)
      }
    }

    let floatingCount = 0
    for (let row = 0; row < this.bubbleGrid.length; row++) {
      for (let col = 0; col < this.GRID_COLS; col++) {
        const bubble = this.bubbleGrid[row][col]
        if (bubble && !connected.has(`${row},${col}`)) {
          bubble.destroy()
          this.bubbleGrid[row][col] = null
          this.score += 5
          floatingCount++
        }
      }
    }

    if (floatingCount > 0) {
      this.playPopSound()
    }

    this.scoreText.setText("Score: " + this.score)
    if (this.topRightScoreText) this.topRightScoreText.setText(String(this.score))
  }

  markConnected(bubble, connected) {
    const key = `${bubble.row},${bubble.col}`
    if (connected.has(key)) return

    connected.add(key)
    const neighbors = this.getNeighbors(bubble.row, bubble.col)
    for (const neighbor of neighbors) {
      this.markConnected(neighbor, connected)
    }
  }

  displayHighScores() {
    // Removed right-side panel: keep this function minimal so no panel is drawn
    // If any previous panel objects exist, destroy them
    if (this.highScoresPanel) {
      this.highScoresPanel.destroy()
      this.highScoresPanel = null
    }
    if (this.highScoresGroup) {
      this.highScoresGroup.destroy()
      this.highScoresGroup = null
    }
  }

  endGame() {
    // Marcar gameOver y bloquear controles
    this.gameOver = true
    
  // Crear overlay semi-transparente (completo)
  if (this._overlay) this._overlay.destroy()
  this._overlay = this.add.graphics()
  this._overlay.fillStyle(0x000000, 0.6)
  this._overlay.fillRect(0, 0, 800, 600)
  this._overlay.setDepth(20)

    // Texto de Game Over
    const gameOverText = this.add.text(400, 250, 'GAME OVER', {
      fontSize: '64px',
      fill: '#ff0000',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    gameOverText.setDepth(30)

    // Mostrar puntaje final
    const finalScoreText = this.add.text(400, 320, `Score: ${this.score}`, {
      fontSize: '32px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    // Texto para reiniciar
    const restartText = this.add.text(400, 390, 'Presiona ESPACIO para reiniciar', {
      fontSize: '24px',
      fill: '#ffffff',
      fontFamily: 'Arial'
    }).setOrigin(0.5)
    
    // Escuchar evento de tecla ENTER
    this.input.keyboard.once('keydown-SPACE', () => {
      this.scene.restart()
    })
  }

  playShootSound() {
    if (!this.audioContext) return
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    oscillator.frequency.setValueAtTime(800, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(400, this.audioContext.currentTime + 0.1)
    gainNode.gain.setValueAtTime(0.1, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1)
    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + 0.1)
  }

  playPopSound() {
    if (!this.audioContext) return
    const oscillator = this.audioContext.createOscillator()
    const gainNode = this.audioContext.createGain()
    oscillator.connect(gainNode)
    gainNode.connect(this.audioContext.destination)
    oscillator.frequency.setValueAtTime(600, this.audioContext.currentTime)
    oscillator.frequency.exponentialRampToValueAtTime(200, this.audioContext.currentTime + 0.2)
    gainNode.gain.setValueAtTime(0.05, this.audioContext.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.2)
    oscillator.start()
    oscillator.stop(this.audioContext.currentTime + 0.2)
  }
}

function getHighScores() {
  const scores = localStorage.getItem("bubbleShooterHighScores")
  return scores ? JSON.parse(scores) : []
}

function saveHighScore(name, score) {
  const highScores = getHighScores()
  highScores.push({ name, score, date: new Date().toLocaleDateString() })
  highScores.sort((a, b) => b.score - a.score)
  const top10 = highScores.slice(0, 10)
  localStorage.setItem("bubbleShooterHighScores", JSON.stringify(top10))
}

function isHighScore(score) {
  const highScores = getHighScores()
  return highScores.length < 10 || score > highScores[highScores.length - 1].score
}

// Función auxiliar para puntajes
function getHighScores() {
    try {
        const scores = localStorage.getItem('bubbleShooterScores');
        return scores ? JSON.parse(scores) : [];
    } catch {
        return [];
    }
}

function saveHighScore(name, score) {
    try {
        const highScores = getHighScores();
        highScores.push({ name, score, date: new Date().toLocaleDateString() });
        highScores.sort((a, b) => b.score - a.score);
        localStorage.setItem('bubbleShooterScores', JSON.stringify(highScores.slice(0, 10)));
    } catch {
        console.log('Error saving score');
    }
}

// Initialize the game after scenes are defined
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    backgroundColor: '#000022',
    dom: {
        createContainer: true
    },
  scene: [MenuScene, GameScene, GameOverScene],
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: false
        }
    }
};

// Start the game
const game = new Phaser.Game(config);
