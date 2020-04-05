<template>
  <div class="three">
    <canvas
      ref="three"
      class="three"
      @mousemove.prevent="onCanvasMouseMove"
      @touchmove.prevent="onCanvasMouseMove"
      @mousedown.prevent="onCanvasMouseDown"
      @touchstart.prevent="onCanvasMouseDown"
      @mouseup.prevent="onCanvasMouseUp"
      @touchend.prevent="onCanvasMouseUp"
    ></canvas>
  </div>
</template>

<script>
/* eslint-disable no-console */
import { mapState, mapGetters, mapActions } from 'vuex'

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import SpriteText from 'three-spritetext'

// camera stuff
const CAMERA_NEAR = 0.0001
const CAMERA_FAR = 10
const CAMERA_FOV = 45
const CAMERA_MIN_DIST = 0.001
const CAMERA_MAX_DIST = 4

const DOUBLE_CLICK_DELAY = 200

// tile stuff
const SMALL_ATLAS_SIZE = 2048
const BIG_ATLAS_SIZE = 8192
const ATLAS_TILE_SIZE = 32
const EMPTY_TEXTURE = new THREE.Texture(undefined)

const BASE_SCALE = 1.0
const BUCKET_Z = 1
const BUCKET_PADDING = 0.1
const FILE_Z = -1
const CURSOR_COLOR = new THREE.Color('hsl(3.6, 100%, 29%)')
const MOVE_DURATION = 300
const SCENE_PADDING = 2.0
const TEXT_SIZE = 0.025
const TEXT_Z = 0 // relative
const TILE_PADDING = 0.5

const vShader = `
precision mediump float;

// these come built in with three.js; they're basically always used in the same way (see below)
uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;
uniform vec3 cameraPosition;

// these are uniforms we specified
uniform float atlasPx;
uniform float cellPx;
uniform float pointScale;
uniform float showAtlases;
uniform float loadedAtlases;

// these are the buffer attributes we specified when creating the geometry
attribute vec3 position;
attribute vec2 uv;

// these are attributes we will pass from the vertex to the fragment shader
varying vec2 vUv;
varying float vShowAtlases;
varying float vLoadedAtlases;

attribute float fileIndex;
attribute float size;
varying float vFileIndex;
attribute vec3 color;
varying vec3 vColor;

void main() {
  vColor = color;
  vShowAtlases = showAtlases;
  vLoadedAtlases = loadedAtlases;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * pointScale / -mvPosition.z;
  gl_Position = projectionMatrix * mvPosition;

  // pass the varying data to the fragment shader
  vUv = uv;
  vFileIndex = fileIndex;
}
`

const buildTextureTree = (count) => {
  const tree = []
  for (let i = 0; i < count; i++) {
    const str = `
    if (textureIndex == ${i}) {
      gl_FragColor = texture2D(texture[${i}], uv);
      if (gl_FragColor == vec4(0.0, 0.0, 0.0, 0.0)) gl_FragColor = vec4(vColor, 1.0);
    }`
    tree.push(str)
  }
  return tree.join('')
}

const fShader = (atlasCount) => `
precision mediump float;

uniform sampler2D texture[${atlasCount}];
uniform float atlasPx;
uniform float cellPx;

varying vec2 vUv;
varying float vFileIndex;
varying float vShowAtlases;
varying float vLoadedAtlases;
varying vec3 vColor;

void main() {
  vec2 uv = (vUv * cellPx + gl_PointCoord.xy * cellPx) / atlasPx;
  int textureIndex = int(vFileIndex);

  if (vShowAtlases > 0.5 && vLoadedAtlases > 0.5) {
    ${buildTextureTree(atlasCount)}
  } else {
    gl_FragColor = vec4(vColor, 1.0);
  }
}
`

const getPointScale = (side) => {
  return window.innerHeight / (side * TILE_PADDING)
}

const getBoundsFromMesh = (obj) => {
  const o = new THREE.Box3()
  const count = obj.instanceMatrix.count
  const matrix = new THREE.Matrix4()
  const p = new THREE.Vector3()
  const s = new THREE.Vector3()
  const q = new THREE.Quaternion()
  for (let i = 0, i3 = 0, l = count; i < l; i++, i3 += 3) {
    obj.getMatrixAt(i, matrix)
    matrix.decompose(p, q, s)
    const x = p.x
    const y = p.y
    const z = p.z
    const objBucket = new THREE.Mesh(new THREE.PlaneBufferGeometry(s.x, s.x))
    objBucket.position.set(x, y, z * s.x)
    o.expandByObject(objBucket)
  }
  return o
}

const getBoundsFromGroup = (obj) => {
  const o = new THREE.Box3()
  const count = obj.children.length
  for (let i = 0, l = count; i < l; i++) {
    const child = obj.children[i]
    o.expandByObject(child)
  }
  return o
}

const easeInOutQuad = (t, b, c, d) => {
  // t: current time, b: beginning value, c: change In value, d: duration
  if ((t /= d / 2) < 1) return (c / 2) * t * t + b
  return (-c / 2) * (--t * (t - 2) - 1) + b
}

const createBaseCamera = () => {
  const aspect = window.innerWidth / window.innerHeight
  const camera = new THREE.PerspectiveCamera(
    CAMERA_FOV,
    aspect,
    CAMERA_NEAR,
    CAMERA_FAR
  )
  camera.position.x = 0
  camera.position.y = 0
  camera.position.z = BUCKET_Z + 10
  camera.updateProjectionMatrix()
  return camera
}

const createEmptyAtlases = (count) => {
  const atlases = []
  for (let i = 0; i < count; i++) {
    atlases.push(EMPTY_TEXTURE)
  }
  return atlases
}

const createText = (text, x, y, z, scale) => {
  text = text ? text : '[undefined]'
  if (isNaN(text) && text.indexOf('|||') !== -1) text = text.split('|||')[1]
  const myText = new SpriteText(text)
  myText.fontFace = 'monospace'
  myText.textHeight = TEXT_SIZE * scale
  myText.position.set(x, y, z)
  myText.center = new THREE.Vector2(0, 0)
  return myText
}

export default {
  components: {},
  data() {
    return {
      isDragging: false,
      bucketsGroup: null,
      camera: null,
      cameraMoveStart: null,
      cameraObj: null,
      controls: null,
      cursor: null,
      detailMode: false,
      isMoving: false,
      clickTimeout: null,
      lastImage: null,
      lastTap: 0,
      lastMouse: null,
      lastMouseMoveId: null,
      lastChange: 0,
      lastFileId: null,
      fileMode: false,
      filesMoveFrom: null,
      filesMoveStart: null,
      filesMoveTo: null,
      filesObject: null,
      lastCamera: null,
      mouse: {},
      PAST_INTERSECTED: {},
      pickingMesh: null,
      raycaster: null,
      renderer: null,
      scaled: false,
      scene: null,
      selectedInstance: {},
      selectedBucket: null,
      textGroup: null,
      toCamera: null,
      toLook: null,
      visibleFiles: [],
      visibleFilesCount: 0
    }
  },
  computed: {
    ...mapGetters(['totalFromBuckets']),
    ...mapState([
      'fileData',
      'defaultPositions',
      'defaultColors',
      'huePositions',
      'hueIndexes',
      'tsnePositions',
      'tsneIndexes',
      'atlases',
      'loadedAtlas',
      'currentBucket',
      'itemsTotal',
      'sort',
      'stuff',
      'showAtlases'
    ])
  },
  mounted() {
    this.init()
    this.createControls()
    this.paintBuckets()
    this.moveCameraTo(this.bucketsGroup)
    this.animate()
    window.addEventListener('resize', this.onResize)
    document.addEventListener('mouseout', this.onCanvasMouseOut)
  },
  beforeDestroy() {
    // Unregister resize before destroying this Vue instance
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('mouseout', this.onCanvasMouseOut)
  },
  watch: {
    currentBucket(newB) {
      if (newB) {
        if (this.cameraObj) {
          this.initFiles(this.cameraObj)
          this.paintSort()
        }
      }
    },
    atlases() {
      this.paintAtlas()
    },
    showAtlases(shown) {
      if (shown && this.selectedBucket) {
        const { atlasCount } = this.calculateAtlases()
        this.fetchAtlases(atlasCount)
      }
      this.paintAtlas()
    },
    sort(to, from) {
      this.filesMoveStart = Date.now()
      this.filesMoveFrom = from
      this.filesMoveTo = to
    }
  },
  methods: {
    backToEverything() {
      this.camera.layers.enable(0)
      this.cleanFiles()
      this.moveCameraTo(this.bucketsGroup)
      this.hideCursor()
      this.selectedInstance = {}
      this.fileMode = false
      this.$store.commit('setBucket', null)
    },
    paintSort() {
      if (!this.filesObject) return
      this.filesMoveStart = Date.now() - MOVE_DURATION
      this.filesMoveTo = this.sort
    },
    init() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: this.$refs.three,
        powerPreference: 'high-performance'
      }) // false improves the frame rate
      this.renderer.outputEncoding = THREE.sRGBEncoding
      this.renderer.gammaFactor = 2.2
      this.renderer.setPixelRatio(window.devicePixelRatio)

      this.renderer.setSize(window.innerWidth, window.innerHeight)

      this.scene = new THREE.Scene()
      this.scene.background = new THREE.Color('hsl(0, 0%, 15%)')

      this.raycaster = new THREE.Raycaster()
      this.mouse = new THREE.Vector2(-1e10, -1e10) // init far outside the canvas

      this.camera = createBaseCamera()

      // cursor
      const geometry = new THREE.ShapeBufferGeometry(
        new THREE.Shape()
          .moveTo(0.5, 0.5)
          .lineTo(0.5, -0.5)
          .lineTo(-0.5, -0.5)
          .lineTo(-0.5, 0.5)
          .lineTo(0.5, 0.5)
      )
      const material = new THREE.MeshBasicMaterial({
        color: CURSOR_COLOR
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      this.cursor = mesh
      this.scene.add(this.cursor)

      // const gui = new GUI()

      // gui.add(this, 'showAtlases')
    },
    onDoubleClick(e) {
      this.camera.layers.disableAll()
      if (this.fileMode) {
        this.camera.layers.enable(1)
        return
      }
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        this.camera.layers.enable(1)
        const key = this.PAST_INTERSECTED.obj.bucketIndex
        this.selectedBucket = this.stuff[key]
        const x = this.PAST_INTERSECTED.obj.position.x
        const y = this.PAST_INTERSECTED.obj.position.y
        const w = this.PAST_INTERSECTED.obj.geometry.parameters.width
        const obj = new THREE.Mesh(new THREE.PlaneBufferGeometry(w, w))
        obj.position.set(x, y, FILE_Z)
        this.moveCameraTo(obj)
        this.fileMode = true
        this.cameraObj = obj
        window.setTimeout(() => (this.PAST_INTERSECTED = {}), 100)
        this.$store.commit('setBucket', this.selectedBucket)
      } else {
        this.camera.layers.enable(0)
      }
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 1
      this.controls.panSpeed = 0.1
      this.controls.maxDistance = CAMERA_MAX_DIST
      this.controls.minDistance = CAMERA_MIN_DIST
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.noRotate = true
      this.controls.dynamicDampingFactor = 0.1
    },
    cleanFiles() {
      if (this.filesObject) {
        this.scene.remove(this.filesObject)
        this.filesObject.geometry.dispose()
        if (this.filesObject.material.map)
          this.filesObject.material.map.dispose()
        this.filesObject.material.dispose()
      }

      // TODO: dispose of atlases

      // remove picking
      if (this.pickingMesh) {
        this.scene.remove(this.pickingMesh)
        this.pickingMesh.geometry.dispose()
        this.pickingMesh.material.map.dispose()
        this.pickingMesh.material.dispose()
      }
    },
    calculateAtlases() {
      if (!this.selectedBucket) return
      const tileCount = this.selectedBucket.count

      const smallAtlasCount = Math.pow(SMALL_ATLAS_SIZE / ATLAS_TILE_SIZE, 2)

      const bigAtlasCount = Math.pow(BIG_ATLAS_SIZE / ATLAS_TILE_SIZE, 2)

      let countPerAtlas, atlasSize

      if (tileCount > smallAtlasCount) {
        atlasSize = BIG_ATLAS_SIZE
        countPerAtlas = bigAtlasCount
      } else {
        atlasSize = SMALL_ATLAS_SIZE
        countPerAtlas = smallAtlasCount
      }

      const atlasPerSide = atlasSize / ATLAS_TILE_SIZE

      const atlasCount = Math.ceil(tileCount / countPerAtlas)

      return {
        atlasPerSide,
        countPerAtlas,
        atlasSize,
        atlasCount
      }
    },
    fetchAtlases(atlasCount) {
      let loadedAtlases = false
      // check to see if atlases are in memory
      let atlases = this.atlases[this.currentBucket.key]
      if (atlases && atlases.length === atlasCount) {
        loadedAtlases = true
      } else {
        atlases = createEmptyAtlases(atlasCount)
        // load the atlases asynchronously
        const bucket = this.currentBucket
        this.getCurrentAtlases({ bucket, atlasCount })
      }
      return { atlases, loadedAtlases }
    },
    paintAtlas() {
      if (!this.filesObject) return
      if (!this.currentBucket) return
      if (!this.showAtlases) {
        // remove atlases
        const { atlasCount } = this.calculateAtlases()
        const atlases = createEmptyAtlases(atlasCount)
        this.filesObject.material.uniforms.texture.value = atlases
        this.filesObject.material.uniforms.texture.needsUpdate = true
        this.filesObject.material.uniforms.loadedAtlases.value = 0.0
        this.filesObject.material.uniforms.loadedAtlases.needsUpdate = true
        this.filesObject.material.uniforms.showAtlases.value = 0.0
        this.filesObject.material.uniforms.showAtlases.needsUpdate = true
      } else if (this.atlases[this.currentBucket.key]) {
        const arr = [],
          observable = this.atlases[this.currentBucket.key]
        for (let i = 0; i < Number.POSITIVE_INFINITY; i++) {
          if (observable[i]) arr.push(observable[i])
          else break
        }
        this.filesObject.material.uniforms.texture.value = arr
        this.filesObject.material.uniforms.texture.needsUpdate = true
        this.filesObject.material.uniforms.loadedAtlases.value = 1.0
        this.filesObject.material.uniforms.loadedAtlases.needsUpdate = true
        this.filesObject.material.uniforms.showAtlases.value = 1.0
        this.filesObject.material.uniforms.showAtlases.needsUpdate = true
      }
    },
    initFiles(obj) {
      this.cleanFiles()

      const tileCount = this.selectedBucket.count

      const side = Math.ceil(Math.sqrt(tileCount))
      const w = obj.geometry.parameters.width
      const tileSize = w / side
      const realW = w

      const geometry = new THREE.BufferGeometry()

      const {
        atlasPerSide,
        countPerAtlas,
        atlasSize,
        atlasCount
      } = this.calculateAtlases()

      let atlases = [],
        loadedAtlases = false
      if (this.showAtlases) {
        const fetched = this.fetchAtlases(atlasCount)
        atlases = fetched.atlases
        loadedAtlases = fetched.loadedAtlases
      } else {
        atlases = createEmptyAtlases(atlasCount)
      }

      const material = new THREE.RawShaderMaterial({
        vertexShader: vShader,
        fragmentShader: fShader(atlasCount),
        uniforms: {
          loadedAtlases: {
            type: 'f',
            value: loadedAtlases ? 1.0 : 0.0
          },
          showAtlases: {
            type: 'f',
            value: this.showAtlases ? 1.0 : 0.0
          },
          texture: {
            type: 't',
            value: atlases
          },
          atlasPx: {
            type: 'f',
            value: atlasSize
          },
          cellPx: {
            type: 'f',
            value: ATLAS_TILE_SIZE
          },
          pointScale: {
            type: 'f',
            value: getPointScale(side)
          }
        },
        depthTest: true,
        transparent: true,
        vertexColors: true
      })

      const uvs = new Float32Array(tileCount * 2)
      const fIndices = new Float32Array(tileCount)

      for (let i = 0; i < tileCount; i++) {
        const fileIndex = Math.floor(i / countPerAtlas)
        const j = i % countPerAtlas // index in atlas
        const x = j % atlasPerSide // position in atlas
        const y = Math.floor(j / atlasPerSide)
        uvs[i * 2] = x
        uvs[i * 2 + 1] = y
        fIndices[i] = fileIndex
      }

      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2, true))

      const sizes = new Float32Array(tileCount).fill(w) // for some reason the size of the point is the size of the full square ¯\_(ツ)_/¯
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      geometry.setAttribute('fileIndex', new THREE.BufferAttribute(fIndices, 1))

      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(this.defaultColors, 3)
      )

      this.filesObject = new THREE.Points(geometry, material)
      this.filesObject.frustumCulled = false
      this.filesObject.layers.set(1)

      // picking texture
      const emptyTexture = createEmptyAtlases(1)[0]
      const planeMaterial = new THREE.MeshBasicMaterial({
        opacity: 0,
        transparent: true,
        map: emptyTexture
      })
      const pickingGeometry = new THREE.PlaneBufferGeometry(realW, realW, 1, 1)
      this.pickingMesh = new THREE.Mesh(pickingGeometry, planeMaterial)
      this.pickingMesh.layers.set(1)
      this.pickingMesh.position.x = obj.position.x
      this.pickingMesh.position.y = obj.position.y
      this.pickingMesh.position.z = obj.position.z
      this.scene.add(this.pickingMesh)

      // an mga object to hold the bucket file real world data
      this.filesObject.mga = {
        realW,
        side,
        tileSize,
        tileCount,
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z
      }

      this.scene.add(this.filesObject)
    },
    findLastImageFinalPosition() {
      if (!this.lastImage) return
      const { fileId, obj } = this.lastImage
      let positions
      switch (this.sort) {
        case 'default':
          positions = this.defaultPositions
          break
        case 'hue':
          positions = this.huePositions
          break
        case 'similar':
          positions = this.tsnePositions
          break
      }
      const index = this.currentBucket.ids.indexOf(fileId)
      if (index === -1) return
      const col = positions[index * 3]
      const row = positions[index * 3 + 1]
      const z = FILE_Z

      const { x, y, realW, side } = this.filesObject.mga

      const size = 1 / side
      const normalizedX = col * size * realW
      const normalizedY = row * size * realW
      const halfWidth = realW * 0.5 // parent obj is x,y centered
      const normalizedHalfTile = size * 0.5 * realW

      const tx = x + normalizedX - halfWidth + normalizedHalfTile
      const ty = y - normalizedY + halfWidth - normalizedHalfTile

      obj.position.x = tx
      obj.position.y = ty
      obj.position.z = z
      return obj
    },
    interpolateFiles() {
      if (!this.filesObject || !this.filesMoveStart) return
      if (this.lastImage && this.currentBucket) {
        const obj = this.findLastImageFinalPosition()
        if (obj) this.moveCameraTo(obj)
      }
      const t = Date.now() - this.filesMoveStart
      let from, to
      switch (this.filesMoveFrom) {
        case 'default':
          from = this.defaultPositions
          break
        case 'hue':
          from = this.huePositions
          break
        case 'similar':
          from = this.tsnePositions
          break
      }
      switch (this.filesMoveTo) {
        case 'default':
          to = this.defaultPositions
          break
        case 'hue':
          to = this.huePositions
          break
        case 'similar':
          to = this.tsnePositions
          break
      }
      if (t >= MOVE_DURATION) {
        from = to
        this.filesMoveStart = null
      }

      const { realW, tileCount, tileSize, side } = this.filesObject.mga
      const x = this.filesObject.mga.x - realW * 0.5 + tileSize * 0.5
      const y = this.filesObject.mga.y + realW * 0.5 - tileSize * 0.5
      const z = this.filesObject.mga.z

      const spacing = realW / side
      const positions = new Float32Array(tileCount * 3)
      const position = new THREE.Vector3()

      for (let i = 0, i3 = 0, l = tileCount; i < l; i++, i3 += 3) {
        const xF = from[i3]
        const yF = from[i3 + 1]
        const zF = from[i3 + 2]
        const xT = to[i3]
        const yT = to[i3 + 1]
        const zT = to[i3 + 2]
        let xx = easeInOutQuad(t, xF, xT - xF, MOVE_DURATION)
        let yy = easeInOutQuad(t, yF, yT - yF, MOVE_DURATION)
        let zz = easeInOutQuad(t, zF, zT - zF, MOVE_DURATION)

        xx = x + xx * spacing
        yy = y + yy * -spacing
        zz = z + zz
        position.set(xx, yy, zz)
        position.toArray(positions, i3)
      }
      this.filesObject.geometry.setAttribute(
        'position',
        new THREE.Float32BufferAttribute(positions, 3)
      )
    },
    paintBuckets() {
      this.cleanBuckets()

      const buckets = Object.values(this.stuff).filter((b) => b.count > 0)
      buckets.sort((a, b) => b.count - a.count)

      const bucketCount = buckets.length
      const colors = new Float32Array(bucketCount * 3)
      const color = new THREE.Color()
      const bucketsGroup = new THREE.Group()
      const textGroup = new THREE.Group()
      const side = Math.ceil(Math.sqrt(bucketCount))
      const xini = -1
      const yini = 1
      const fullW = 2
      const spacing = fullW / side

      for (let i = 0, i3 = 0, l = bucketCount; i < l; i++, i3 += 3) {
        const b = buckets[i]
        const count = b.count
        const text = b.name
        const pct = count / this.itemsTotal
        const scale = this.scaled ? Math.sqrt(pct) : BASE_SCALE
        const w = (spacing - spacing * BUCKET_PADDING) * scale
        const x = xini + (i % side) * spacing
        const y = yini - Math.floor(i / side) * spacing
        const z = BUCKET_Z

        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)

        // thumb
        const geometry = new THREE.PlaneBufferGeometry(w, w)
        const url = b.images[Math.floor(Math.random() * b.images.length)]
        const texture = new THREE.TextureLoader().load(url)
        texture.encoding = THREE.sRGBEncoding
        const material = new THREE.MeshBasicMaterial({
          map: texture,
          color: 0xffffff
        })
        const mesh = new THREE.Mesh(geometry, material)
        mesh.bucketIndex = b.key
        mesh.position.set(x, y, z)
        bucketsGroup.add(mesh)

        // text particles
        const textTop = y + w / 2
        const textZ = BUCKET_Z + TEXT_Z * scale
        const labelStr = text
        const numberStr = count
        textGroup.add(
          createText(
            `${labelStr.toUpperCase()}: ${new Intl.NumberFormat().format(
              numberStr
            )}`,
            x - w / 2,
            textTop,
            textZ,
            scale
          )
        )
      }

      this.bucketsGroup = bucketsGroup

      this.textGroup = textGroup

      this.scene.add(this.bucketsGroup)
      this.scene.add(this.textGroup)
    },
    cleanBuckets() {
      if (!this.bucketsGroup) return
      this.textGroup.children.forEach((t) => t.material.map.dispose())
      this.bucketsGroup.children.forEach((t) => {
        t.geometry.dispose()
        t.material.map.dispose()
      })
      this.scene.remove(this.bucketsGroup)
      this.scene.remove(this.textGroup)
    },
    moveCameraTo(obj) {
      let o

      if (obj instanceof THREE.InstancedMesh) {
        o = getBoundsFromMesh(obj)
      } else if (obj instanceof THREE.Group) {
        // centering on the current base bucket
        o = getBoundsFromGroup(obj)
      } else {
        o = new THREE.Box3().setFromObject(obj)
      }

      const sphere = new THREE.Sphere()
      o.getBoundingSphere(sphere)
      const side = sphere.radius * SCENE_PADDING

      const center = new THREE.Vector3()
      o.getCenter(center)

      const fov = CAMERA_FOV * (Math.PI / 180)
      const dist = Math.abs(side / Math.sin(fov / 2))

      const dir = new THREE.Vector3(0, 0, 1)
      const newPos = new THREE.Vector3().addVectors(center, dir.setLength(dist))

      this.lastCamera = this.camera.clone()
      this.toCamera = this.camera.clone()
      this.toCamera.position.copy(newPos)
      this.toLook = center

      this.cameraMoveStart = Date.now()
      this.isMoving = true
    },
    interpolateCamera() {
      if (!this.lastCamera) return
      const t = Date.now() - this.cameraMoveStart

      const xF = this.lastCamera.position.x
      const yF = this.lastCamera.position.y
      const zF = this.lastCamera.position.z
      const xT = this.toCamera.position.x
      const yT = this.toCamera.position.y
      const zT = this.toCamera.position.z
      const newPos = new THREE.Vector3()
      newPos.x = easeInOutQuad(t, xF, xT - xF, MOVE_DURATION)
      newPos.y = easeInOutQuad(t, yF, yT - yF, MOVE_DURATION)
      newPos.z = easeInOutQuad(t, zF, zT - zF, MOVE_DURATION)
      this.camera.position.copy(newPos)

      const cF = this.controls.target.clone()
      const cT = this.toLook.clone()
      const center = new THREE.Vector3()
      center.x = easeInOutQuad(t, cF.x, cT.x - cF.x, MOVE_DURATION)
      center.y = easeInOutQuad(t, cF.y, cT.y - cF.y, MOVE_DURATION)
      center.z = easeInOutQuad(t, cF.z, cT.z - cF.z, MOVE_DURATION)
      this.controls.target.copy(center)

      if (t > MOVE_DURATION) {
        this.camera.position.copy(this.toCamera.position)
        this.controls.target.copy(this.toLook)
        this.lastCamera = null
        this.toCamera = null
        this.isMoving = false
      }
    },
    animate() {
      requestAnimationFrame(this.animate)
      this.interpolateCamera()
      this.interpolateFiles()
      this.controls.update()
      this.render()
    },
    onResize() {
      const w = window.innerWidth
      const h = window.innerHeight
      this.renderer.setSize(w, h)
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      if (this.filesObject) {
        const { side } = this.filesObject.mga
        this.filesObject.material.uniforms.pointScale.value = getPointScale(
          side
        )
        this.filesObject.material.uniforms.pointScale.needsUpdate = true
      }
    },
    onCanvasMouseOut(event) {
      this.lastFileId = null
    },
    onCanvasMouseUp(event) {
      this.isDragging = false
      const lastX = this.lastMouse.clientX
      const lastY = this.lastMouse.clientY

      const newX = event.clientX
      const newY = event.clientY

      const isClick = Math.abs(newX - lastX) < 2 && Math.abs(newY - lastY) < 2

      if (!isClick) {
        this.lastImage = null // user interacted. we should “forget” the image
        return
      }

      const now = Date.now()
      const tapLength = now - this.lastTap
      clearTimeout(this.clickTimeout)
      let isDoubleClick = false

      if (tapLength < DOUBLE_CLICK_DELAY && tapLength > 0) {
        isDoubleClick = true
      } else {
        this.clickTimeout = window.setTimeout(
          () => clearTimeout(this.clickTimeout),
          DOUBLE_CLICK_DELAY
        )
      }

      this.lastTap = now

      if (isDoubleClick) {
        this.onDoubleClick(event)
        return
      }

      this.camera.layers.disableAll()
      if (this.isMoving) return
      if (this.fileMode) {
        this.camera.layers.enable(1)
        if (this.PAST_INTERSECTED.instanceId === undefined) {
          // clicked outside
          // if (this.detailMode) {
          //   // go back to files
          //   // this.camera.layers.enable(1)
          //   // this.detailMode = false
          //   // this.moveCameraTo(this.cameraObj)
          //   // } else {
          //   //   // go back to bucket
          //   //   this.camera.layers.enable(0)
          //   //   this.fileMode = false
          //   //   this.cleanFiles()
          //   //   this.moveCameraTo(this.selectedInstance.obj)
          //   //   this.$store.commit('setBucket', null)
          // }
        } else {
          // clicked a file
          this.detailMode = true
          this.lastImage = { ...this.PAST_INTERSECTED }
          this.moveCameraTo(this.PAST_INTERSECTED.obj)
          this.loadFile()
        }
        return
      }
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        // there is a selected bucket
        this.camera.layers.enable(0)
        if (
          this.PAST_INTERSECTED.instanceId !== this.selectedInstance.instanceId
        ) {
          this.lastImage = null
          this.hideCursor()
          this.moveCameraTo(this.PAST_INTERSECTED.obj)
          this.selectedInstance = { ...this.PAST_INTERSECTED }
        }
        this.$store.commit('setBucket', null)
      } else {
        this.lastImage = null
        this.backToEverything()
      }
    },
    onCanvasMouseDown(event) {
      this.onCanvasMouseMove(event)
      this.isDragging = true
      this.lastMouse = event
    },
    onCanvasMouseMove(event) {
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    },
    hideCursor() {
      this.cursor.visible = false
    },
    render() {
      this.renderer.render(this.scene, this.camera)
      if (this.$refs.three) this.$refs.three.classList.remove('pointer')

      if (this.mouse) this.raycaster.setFromCamera(this.mouse, this.camera)

      this.pickBucket()
      this.pickFile()
    },
    getFileAt(uv) {
      if (!this.currentBucket) return
      const { x, y } = uv
      const { realW, side } = this.filesObject.mga
      const mx = this.filesObject.mga.x
      const my = this.filesObject.mga.y
      const col = Math.floor(side * x)
      const row = Math.floor(side * (1 - y))
      const size = 1 / side
      const yy = 1 - y
      const xmin = col * size + (size * TILE_PADDING) / 8
      const xmax = col * size + size - (size * TILE_PADDING) / 8
      const ymin = row * size + (size * TILE_PADDING) / 8
      const ymax = row * size + size - (size * TILE_PADDING) / 8
      // make sure it is above a square and not in the gutter
      const index = col + row * side
      if (x > xmin && x < xmax && yy > ymin && yy < ymax) {
        let fileId
        switch (this.sort) {
          case 'default':
            fileId = this.currentBucket.ids[index]
            break
          case 'hue':
            fileId = this.currentBucket.ids[this.hueIndexes[index]]
            break
          case 'similar':
            // uses same indexing as default
            fileId = this.currentBucket.ids[this.tsneIndexes[index]]
            break
        }
        if (!fileId) return null
        const instanceId = index
        const normalizedX = col * size * realW
        const normalizedY = row * size * realW
        const halfWidth = realW * 0.5 // parent obj is x,y centered
        const normalizedHalfTile = size * 0.5 * realW
        const tx = mx + normalizedX - halfWidth + normalizedHalfTile
        const ty = my - normalizedY + halfWidth - normalizedHalfTile
        return { instanceId, fileId, tx, ty }
      }
      return null
    },
    pickFile() {
      if (this.pickingMesh && this.fileMode) {
        const intersects = this.raycaster.intersectObject(this.pickingMesh)

        if (intersects.length > 0 && intersects[0].uv) {
          const data = this.getFileAt(intersects[0].uv)
          if (data) {
            const { instanceId, fileId, tx, ty } = data
            if (this.$refs.three) this.$refs.three.classList.add('pointer')
            if (this.PAST_INTERSECTED.instanceId !== instanceId) {
              // new thing
              const { tileSize } = this.filesObject.mga

              const point = intersects[0].point
              // make area bigger so it doesnt zoom so close
              const geometry = new THREE.PlaneBufferGeometry(
                tileSize * 2,
                tileSize * 2
              )
              const material = new THREE.MeshBasicMaterial()
              const obj = new THREE.Mesh(geometry, material)
              obj.position.x = tx
              obj.position.y = ty
              obj.position.z = point.z
              this.PAST_INTERSECTED.instanceId = instanceId
              this.PAST_INTERSECTED.obj = obj
              this.PAST_INTERSECTED.fileId = fileId
            }
          } else {
            if (this.$refs.three) this.$refs.three.classList.remove('pointer')
            this.PAST_INTERSECTED = {}
          }
        } else if (this.PAST_INTERSECTED.instanceId) {
          if (this.$refs.three) this.$refs.three.classList.remove('pointer')
          this.PAST_INTERSECTED = {}
        }
      }
    },
    loadFile() {
      // get data from API
      if (!this.PAST_INTERSECTED.fileId) {
        this.lastFileId = null
        return
      }
      const fileId = this.PAST_INTERSECTED.fileId
      if (fileId === this.lastFileId) return
      this.lastFileId = fileId
      this.$store.commit('setFileData', {})
      this.$store.dispatch('loadFile', fileId)
    },
    pickBucket() {
      if (this.bucketsGroup && !this.fileMode) {
        const intersects = this.bucketsGroup.children
          .map((ch) => this.raycaster.intersectObject(ch))
          .filter((ch) => ch.length > 0)
          .map((ch) => ch[0])

        if (intersects.length > 0) {
          if (this.$refs.three) this.$refs.three.classList.add('pointer')
          const obj = intersects[0].object
          const instanceId = obj.bucketIndex
          if (this.PAST_INTERSECTED.instanceId !== instanceId) {
            if (
              this.selectedInstance.instanceId !==
              this.PAST_INTERSECTED.instanceId
            ) {
              this.hideCursor()
            }

            this.PAST_INTERSECTED.instanceId = instanceId
            this.PAST_INTERSECTED.obj = obj
            const w = obj.geometry.parameters.width
            this.cursor.position.x = obj.position.x
            this.cursor.position.y = obj.position.y + w * 0.5 + w * 0.05
            this.cursor.position.z = obj.position.z
            this.cursor.scale = new THREE.Vector3(w * 1.02, w * 0.1, w)
            this.cursor.visible = true
          }
        } else if (this.PAST_INTERSECTED.instanceId) {
          this.hideCursor()
          this.PAST_INTERSECTED = {}
        }
      }
    },
    ...mapActions(['getCurrentAtlases'])
  }
}
</script>

<style lang="scss" scoped>
@import '@/assets/variables';

.three {
  height: 100vh;
  width: 100vw;
  position: relative;
}
.pointer {
  cursor: pointer;
}
</style>
