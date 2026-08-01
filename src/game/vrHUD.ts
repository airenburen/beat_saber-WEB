import * as THREE from 'three'

function makeCanvas(w, h) {
  const c = document.createElement('canvas')
  c.width = w
  c.height = h
  return { canvas: c, ctx: c.getContext('2d') }
}

function makeSprite(canvas, scaleX, scaleY) {
  const tex = new THREE.CanvasTexture(canvas)
  tex.minFilter = THREE.LinearFilter
  tex.magFilter = THREE.LinearFilter
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
  const sp = new THREE.Sprite(mat)
  sp.scale.set(scaleX, scaleY, 1)
  return sp
}

export class VRHUD {
  scene: THREE.Scene
  camera: THREE.Camera
  group: THREE.Group

  _visible: boolean
  _pendingUpdate: boolean
  _lastScore: number
  _lastCombo: number
  _lastAcc: string
  _lastMult: string
  _lastEnergy: number
  _lastProgress: number
  _lastCountdown: string
  _lastResults: any
  _lastFail: any
  _lastPaused: boolean
  _songLabel: string

  scoreCtx: CanvasRenderingContext2D
  scoreCanvas: HTMLCanvasElement
  scoreSpr: THREE.Sprite
  comboCtx: CanvasRenderingContext2D
  comboCanvas: HTMLCanvasElement
  comboSpr: THREE.Sprite
  energyBg: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  energyFill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  progressBg: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  progressFill: THREE.Mesh<THREE.PlaneGeometry, THREE.MeshBasicMaterial>
  countCtx: CanvasRenderingContext2D
  countCanvas: HTMLCanvasElement
  countSpr: THREE.Sprite
  resCtx: CanvasRenderingContext2D
  resCanvas: HTMLCanvasElement
  resultsPanel: THREE.Group
  resultsSp: THREE.Mesh
  resultsTex: THREE.CanvasTexture
  failCtx: CanvasRenderingContext2D
  failCanvas: HTMLCanvasElement
  failPanel: THREE.Group
  failSp: THREE.Mesh
  failTex: THREE.CanvasTexture
  pauseCtx: CanvasRenderingContext2D
  pauseCanvas: HTMLCanvasElement
  pausePanel: THREE.Group
  pauseSp: THREE.Mesh
  pauseTex: THREE.CanvasTexture
  songCtx: CanvasRenderingContext2D
  songCanvas: HTMLCanvasElement
  songSpr: THREE.Sprite

  constructor(scene, camera) {
    this.scene = scene
    this.camera = camera
    this.group = new THREE.Group()
    this.group.renderOrder = 999
    this.group.matrixAutoUpdate = false
    scene.add(this.group)

    this._visible = true
    this._pendingUpdate = true
    this._lastScore = -1
    this._lastCombo = -1
    this._lastAcc = ''
    this._lastMult = ''
    this._lastEnergy = -1
    this._lastProgress = -1
    this._lastCountdown = ''
    this._lastResults = null
    this._lastFail = null
    this._lastPaused = false
    this._songLabel = ''

    this._initScore()
    this._initCombo()
    this._initEnergyBar()
    this._initProgressBar()
    this._initCountdown()
    this._initResults()
    this._initFail()
    this._initPausePanel()
    this._initSongLabel()
  }

  _initScore() {
    const { canvas, ctx } = makeCanvas(512, 96)
    this.scoreCtx = ctx
    this.scoreCanvas = canvas
    this.scoreSpr = makeSprite(canvas, 0.6, 0.11)
    this.scoreSpr.position.set(0, 0.35, 0)
    this.group.add(this.scoreSpr)
  }

  _initCombo() {
    const { canvas, ctx } = makeCanvas(512, 120)
    this.comboCtx = ctx
    this.comboCanvas = canvas
    this.comboSpr = makeSprite(canvas, 0.45, 0.11)
    this.comboSpr.position.set(0, 0.05, 0)
    this.group.add(this.comboSpr)
  }

  _initEnergyBar() {
    const barW = 0.5, barH = 0.016
    const bgGeo = new THREE.PlaneGeometry(barW, barH)
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x333344, transparent: true, opacity: 0.6, depthTest: false, depthWrite: false })
    this.energyBg = new THREE.Mesh(bgGeo, bgMat)
    this.energyBg.position.set(0, -0.2, 0)
    this.group.add(this.energyBg)

    const fillGeo = new THREE.PlaneGeometry(barW, barH)
    const fillMat = new THREE.MeshBasicMaterial({ color: 0x39e0ff, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })
    this.energyFill = new THREE.Mesh(fillGeo, fillMat)
    this.energyFill.position.set(0, -0.2, 0.001)
    this.energyFill.scale.x = 0
    this.group.add(this.energyFill)
  }

  _initProgressBar() {
    const barW = 0.8, barH = 0.006
    const bgGeo = new THREE.PlaneGeometry(barW, barH)
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x222233, transparent: true, opacity: 0.5, depthTest: false, depthWrite: false })
    this.progressBg = new THREE.Mesh(bgGeo, bgMat)
    this.progressBg.position.set(0, -0.15, 0)
    this.group.add(this.progressBg)

    const fillGeo = new THREE.PlaneGeometry(barW, barH)
    const fillMat = new THREE.MeshBasicMaterial({ color: 0xff2bd0, transparent: true, opacity: 0.9, depthTest: false, depthWrite: false })
    this.progressFill = new THREE.Mesh(fillGeo, fillMat)
    this.progressFill.position.set(0, -0.15, 0.001)
    this.progressFill.scale.x = 0
    this.group.add(this.progressFill)
  }

  _initCountdown() {
    const { canvas, ctx } = makeCanvas(256, 256)
    this.countCtx = ctx
    this.countCanvas = canvas
    this.countSpr = makeSprite(canvas, 0.6, 0.6)
    this.countSpr.position.set(0, 0.15, 0)
    this.countSpr.visible = false
    this.group.add(this.countSpr)
  }

  _initResults() {
    // Official-style: the whole view becomes the results screen — a large
    // frameless canvas with a soft vignette instead of a small boxed popup
    const panel = new THREE.Group()
    const { canvas, ctx } = makeCanvas(1536, 1024)
    this.resCtx = ctx
    this.resCanvas = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(2.7, 1.8), mat)
    sp.position.z = 0.003
    panel.add(sp)

    panel.visible = false
    panel.position.set(0, 0.18, 0)
    this.resultsPanel = panel
    this.resultsSp = sp
    this.resultsTex = tex
    this.group.add(panel)
  }

  _initFail() {
    const panel = new THREE.Group()
    const { canvas, ctx } = makeCanvas(1536, 768)
    this.failCtx = ctx
    this.failCanvas = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.25), mat)
    sp.position.z = 0.003
    panel.add(sp)

    panel.visible = false
    panel.position.set(0, 0.18, 0)
    this.failPanel = panel
    this.failSp = sp
    this.failTex = tex
    this.group.add(panel)
  }

  _initPausePanel() {
    const panel = new THREE.Group()
    const bgGeo = new THREE.PlaneGeometry(0.9, 0.5)
    const bgMat = new THREE.MeshBasicMaterial({ color: 0x060812, transparent: true, opacity: 0.88, depthTest: false, depthWrite: false })
    const bg = new THREE.Mesh(bgGeo, bgMat)
    panel.add(bg)

    const { canvas, ctx } = makeCanvas(1024, 568)
    this.pauseCtx = ctx
    this.pauseCanvas = canvas
    const tex = new THREE.CanvasTexture(canvas)
    tex.minFilter = THREE.LinearFilter
    tex.magFilter = THREE.LinearFilter
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false })
    const sp = new THREE.Mesh(new THREE.PlaneGeometry(0.85, 0.45), mat)
    sp.position.z = 0.003
    panel.add(sp)

    panel.visible = false
    panel.position.set(0, 0.05, 0)
    this.pausePanel = panel
    this.pauseSp = sp
    this.pauseTex = tex
    this.group.add(panel)
  }

  _initSongLabel() {
    const { canvas, ctx } = makeCanvas(512, 64)
    this.songCtx = ctx
    this.songCanvas = canvas
    this.songSpr = makeSprite(canvas, 0.7, 0.09)
    this.songSpr.position.set(-0.5, 0.35, 0)
    this.group.add(this.songSpr)
  }

  _drawScore(score, acc) {
    const ctx = this.scoreCtx
    const canvas = this.scoreCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.font = 'bold 48px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText(score.toLocaleString(), 256, 52)
    ctx.font = '18px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#7b84ab'
    ctx.fillText(acc, 256, 78)
  }

  _drawCombo(combo, mult) {
    const ctx = this.comboCtx
    const canvas = this.comboCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (combo < 2) { this.comboSpr.visible = false; return }
    this.comboSpr.visible = true
    ctx.textAlign = 'center'
    ctx.font = 'bold 48px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(255,255,255,0.3)'
    ctx.shadowBlur = 8
    ctx.fillText(String(combo), 256, 56)
    ctx.shadowBlur = 0
    ctx.font = '16px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#67719b'
    ctx.fillText(mult, 256, 86)
  }

  _drawSongLabel(label) {
    const ctx = this.songCtx
    const canvas = this.songCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'left'
    ctx.font = '18px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#cfd6f5'
    ctx.globalAlpha = 0.7
    ctx.fillText(label, 10, 30)
    ctx.globalAlpha = 1
  }

  _drawCountdown(text) {
    const ctx = this.countCtx
    const canvas = this.countCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.textAlign = 'center'
    ctx.font = 'bold 100px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(0,229,255,0.8)'
    ctx.shadowBlur = 24
    ctx.fillText(text, 128, 150)
  }

  _drawResults(title, rank, score, acc, combo, hits) {
    const ctx = this.resCtx
    const canvas = this.resCanvas
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    // Soft vignette so the stage dims behind the results, official-style
    const vg = ctx.createRadialGradient(W / 2, H / 2, 120, W / 2, H / 2, W * 0.62)
    vg.addColorStop(0, 'rgba(3,5,14,0.82)')
    vg.addColorStop(1, 'rgba(3,5,14,0)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)

    ctx.textAlign = 'center'
    ctx.textBaseline = 'alphabetic'
    ctx.font = 'bold 64px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.shadowColor = 'rgba(127,220,255,0.5)'
    ctx.shadowBlur = 24
    ctx.fillText(title, W / 2, 150)
    ctx.shadowBlur = 0

    // Giant rank, left of center
    ctx.font = 'bold 340px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    const grd = ctx.createLinearGradient(0, 260, 0, 640)
    grd.addColorStop(0, '#ffffff')
    grd.addColorStop(1, '#ffd76e')
    ctx.fillStyle = grd
    ctx.shadowColor = 'rgba(255,210,110,0.65)'
    ctx.shadowBlur = 50
    ctx.fillText(rank, W * 0.31, 620)
    ctx.shadowBlur = 0

    // Stats column, right of center
    const cols = [
      { label: 'SCORE', val: score },
      { label: 'ACCURACY', val: acc },
      { label: 'MAX COMBO', val: String(combo) },
      { label: 'HITS', val: hits },
    ]
    cols.forEach(({ label, val }, i) => {
      const y = 330 + i * 92
      ctx.textAlign = 'left'
      ctx.font = '30px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
      ctx.fillStyle = '#8a94b8'
      ctx.fillText(label, W * 0.55, y)
      ctx.font = 'bold 52px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
      ctx.fillStyle = '#ffffff'
      ctx.fillText(val, W * 0.55, y + 54)
    })

    ctx.textAlign = 'center'
    ctx.font = '26px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#7b84ab'
    ctx.fillText('激光指向下方按钮 · 扣扳机选择  (POINT & TRIGGER)', W / 2, H - 90)
  }

  _drawFail(title, sub, score) {
    const ctx = this.failCtx
    const canvas = this.failCanvas
    const W = canvas.width, H = canvas.height
    ctx.clearRect(0, 0, W, H)

    const vg = ctx.createRadialGradient(W / 2, H / 2, 100, W / 2, H / 2, W * 0.58)
    vg.addColorStop(0, 'rgba(14,3,6,0.82)')
    vg.addColorStop(1, 'rgba(14,3,6,0)')
    ctx.fillStyle = vg
    ctx.fillRect(0, 0, W, H)

    ctx.textAlign = 'center'
    ctx.font = 'bold 120px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ff4466'
    ctx.shadowColor = 'rgba(255,44,66,0.75)'
    ctx.shadowBlur = 40
    ctx.fillText(title, W / 2, 250)
    ctx.shadowBlur = 0

    ctx.font = '40px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#a8b0cf'
    ctx.fillText(sub, W / 2, 360)

    ctx.font = 'bold 64px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('SCORE ' + score, W / 2, 490)

    ctx.font = '26px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#7b84ab'
    ctx.fillText('激光指向下方按钮 · 扣扳机选择  (POINT & TRIGGER)', W / 2, H - 70)
  }

  _drawPause() {
    const ctx = this.pauseCtx
    const canvas = this.pauseCanvas
    ctx.clearRect(0, 0, canvas.width, canvas.height)

    ctx.textAlign = 'center'
    ctx.font = 'bold 48px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#ffffff'
    ctx.fillText('PAUSED', 512, 100)

    ctx.font = '20px "Rajdhani", "Avenir Next", "PingFang SC", sans-serif'
    ctx.fillStyle = '#7b84ab'
    ctx.fillText('激光指向下方按钮 · 扣扳机选择  (POINT & TRIGGER)', 512, 180)
  }

  setSongLabel(label) {
    this._drawSongLabel(label)
    this.songSpr.material.map.needsUpdate = true
  }

  /** Force-hide overlay panels (the vrmenu branch never calls update()). */
  hidePanels() {
    this.resultsPanel.visible = false
    this.failPanel.visible = false
    this.pausePanel.visible = false
    this.countSpr.visible = false
    this._lastResults = null
    this._lastFail = null
    this._lastPaused = false
  }

  update(state, score, combo, acc, mult, energy, progress, countdownText, songLabel, resultsData, failData, paused) {
    const pos = this.camera.position.clone()
    const dir = new THREE.Vector3()
    this.camera.getWorldDirection(dir)
    const fwd = pos.clone().addScaledVector(dir, 2)
    this.group.position.copy(fwd)
    this.group.lookAt(pos)
    this.group.updateMatrix()
    this.group.updateMatrixWorld()

    if (songLabel && songLabel !== this._songLabel) {
      this._songLabel = songLabel
      this._drawSongLabel(songLabel)
      this.songSpr.material.map.needsUpdate = true
    }

    if (countdownText && countdownText !== this._lastCountdown) {
      this._lastCountdown = countdownText
      this._drawCountdown(countdownText)
      this.countSpr.material.map.needsUpdate = true
      this.countSpr.visible = true
    } else if (!countdownText) {
      this.countSpr.visible = false
    }

    const isPlaying = state === 'playing'
    const isResults = state === 'results'
    const isFailed = state === 'failed'
    const isPaused = state === 'paused'

    this.scoreSpr.visible = isPlaying
    this.comboSpr.visible = isPlaying
    this.songSpr.visible = isPlaying
    this.energyBg.visible = isPlaying
    this.energyFill.visible = isPlaying
    this.progressBg.visible = isPlaying
    this.progressFill.visible = isPlaying

    if (isPlaying) {
      if (score !== this._lastScore || acc !== this._lastAcc) {
        this._lastScore = score
        this._lastAcc = acc
        this._drawScore(score, acc)
        this.scoreSpr.material.map.needsUpdate = true
      }
      if (combo !== this._lastCombo || mult !== this._lastMult) {
        this._lastCombo = combo
        this._lastMult = mult
        this._drawCombo(combo, mult)
        this.comboSpr.material.map.needsUpdate = true
      }
      if (energy !== this._lastEnergy) {
        this._lastEnergy = energy
        const geo = this.energyFill.geometry
        const w = geo.parameters.width
        this.energyFill.position.x = -(w / 2) * (1 - energy)
        this.energyFill.position.y = -0.2
        this.energyFill.scale.x = Math.max(0.005, energy)
        this.energyFill.material.color.set(energy < 0.3 ? 0xff3b5b : 0x39e0ff)
      }
      if (progress !== this._lastProgress) {
        this._lastProgress = progress
        const geo = this.progressFill.geometry
        const w = geo.parameters.width
        const p = Math.max(0.005, Math.min(progress, 100) / 100)
        this.progressFill.position.x = -(w / 2) * (1 - p)
        this.progressFill.position.y = -0.15
        this.progressFill.scale.x = p
      }
    }

    if (isResults) {
      this.resultsPanel.visible = true
      if (resultsData && resultsData !== this._lastResults) {
        this._lastResults = resultsData
        this._drawResults(resultsData.title, resultsData.rank, resultsData.score, resultsData.acc, resultsData.combo, resultsData.hits)
        this.resultsTex.needsUpdate = true
      }
    } else {
      this.resultsPanel.visible = false
    }

    if (isFailed) {
      this.failPanel.visible = true
      if (failData && failData !== this._lastFail) {
        this._lastFail = failData
        this._drawFail(failData.title, failData.sub, failData.score)
        this.failTex.needsUpdate = true
      }
    } else {
      this.failPanel.visible = false
    }

    if (isPaused && !this._lastPaused) {
      this.pausePanel.visible = true
      this._drawPause()
      this.pauseTex.needsUpdate = true
    } else if (!isPaused) {
      this.pausePanel.visible = false
    }
    this._lastPaused = isPaused
  }

  dispose() {
    this.group.traverse((o: any) => {
      if (o.geometry) o.geometry.dispose()
      if (o.material) {
        if (o.material.map) o.material.map.dispose()
        o.material.dispose()
      }
    })
    if (this.group.parent) this.group.parent.remove(this.group)
  }
}
