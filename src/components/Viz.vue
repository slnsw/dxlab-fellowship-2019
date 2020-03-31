<template>
  <div class="three">
    <div class="file hidden" ref="file">
      <div v-if="fileData.palette" class="palette">
        <span
          class="color"
          v-for="(color, index) in fileData.palette"
          :key="index"
          :style="{
            backgroundColor: color.color,
            width: color.percent * 100 + '%'
          }"
        ></span>
      </div>
      <div class="loading" v-if="!fileData.title">Loading...</div>
      <img
        v-if="fileData.image"
        :src="fileData.image"
        alt=""
        class="thumbnail"
      />
      <p v-if="fileData.title">{{ fileData.title }}</p>
    </div>
    <canvas
      ref="three"
      class="three"
      @mousedown="onDocumentMouseMove"
      @dblclick.prevent="onDoubleClick"
      @click.prevent="onClick"
    ></canvas>
  </div>
</template>

<script>
/* eslint-disable no-console */
const axios = require('axios').default

import { mapState, mapGetters, mapActions } from 'vuex'

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import SpriteText from 'three-spritetext'

// api stuff
const API_KEY = process.env.VUE_APP_API_KEY
const API_BASE_URL = process.env.VUE_APP_API_BASE_URL
const THUMBS_BASE_URL = process.env.VUE_APP_THUMBS_BASE_URL
const FILES_BASE_URL = process.env.VUE_APP_FILES_BASE_URL
const API_CALL_DELAY = 500 // ms to wait before hitting api

// camera stuff
const CAMERA_NEAR = 0.00005
const CAMERA_FAR = 10
const CAMERA_FOV = 45
const CAMERA_MAX_DIST = 4
const CAMERA_MIN_DIST = 0

// tile stuff
const ATLAS_SIZE = 2048
const ATLAS_PER_SIDE = 64
const ATLAS_TILE_SIZE = 32
const BASE_SCALE = 0.49
const BUCKET_Z = 1
const FILE_Z = 0.003
const CHANGE_DELAY = 1000 // how often to load images on pan/zoom (ms)
const CURSOR_COLOR = new THREE.Color('hsl(3.6, 100%, 29%)')
const HOVER_PADDING = 10
const HOVER_WIDTH = 300
const MAX_VISIBLE_FILES = 1000
const MOVE_DURATION = 300
const SCENE_PADDING = 1.0
const TEXT_SIZE = 0.06
const TEXT_Z = 0 // relative
const TILE_PADDING = 0.03125
const TILE_SIZE = 0.9

const instance = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'x-api-key': API_KEY },
  timeout: 10000
})

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
uniform float atlases;

// these are the buffer attributes we specified when creating the geometry
attribute vec3 position;
attribute vec2 uv;

// these are attributes we will pass from the vertex to the fragment shader
varying vec2 vUv;
varying float vAtlases;

attribute float size;
attribute vec3 color;
varying vec3 vColor;

void main() {
  vColor = color;
  vAtlases = atlases;
  vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
  gl_PointSize = size * ( 1400.0 / -mvPosition.z );
  gl_Position = projectionMatrix * mvPosition;

  // pass the varying data to the fragment shader
  vUv = uv;
}
`

const fShader = `
precision mediump float;

uniform sampler2D texture;
uniform float atlasPx;
uniform float cellPx;

varying vec2 vUv;
varying float vAtlases;
varying vec3 vColor;

void main() {
  vec2 uv = (vUv * cellPx + gl_PointCoord.xy * cellPx) / atlasPx;

  if (vAtlases > 0.5) {
    gl_FragColor = texture2D(texture, uv);
  } else {
    gl_FragColor = vec4(vColor, 1.0);
  }

  // this line mixes the actual texture color with some red
  //gl_FragColor = mix(gl_FragColor, vec4(1.0, 0.0, 0.0, 1.0), 0.5);
}
`

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
    const objBucket = new THREE.Mesh(
      new THREE.PlaneBufferGeometry(TILE_SIZE * s.x, TILE_SIZE * s.x)
    )
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

const createText = (text, x, y, z, scale) => {
  text = text ? text : '[undefined]'
  if (isNaN(text) && text.indexOf('|||') !== -1) text = text.split('|||')[1]
  const myText = new SpriteText(text)
  myText.fontFace = 'Space Mono'
  myText.textHeight = TEXT_SIZE * scale
  myText.position.set(x, y, z)
  myText.center = new THREE.Vector2(0, 0)
  return myText
}

export default {
  components: {},
  data() {
    return {
      bucketsGroup: null,
      camera: null,
      cameraMoveStart: null,
      cameraObj: null,
      controls: null,
      cursor: null,
      isMoving: false,
      lastMouseMoveId: null,
      lastChange: 0,
      lastFileId: null,
      fileData: {},
      fileMode: false,
      filesGroup: null,
      filesLoaded: null,
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
      showAtlases: false,
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
      'defaultPositions',
      'defaultColors',
      'huePositions',
      'hueIndexes',
      'atlases',
      'loadedAtlas',
      'currentBucket',
      'itemsTotal',
      'sort',
      'stuff'
    ])
  },
  mounted() {
    this.init()
    this.createControls()
    this.paintBuckets()
    this.moveCameraTo(this.bucketsGroup)
    this.animate()
    window.addEventListener('resize', this.onResize)
    document.addEventListener('mousemove', this.onDocumentMouseMove)
    document.addEventListener('mouseout', this.onDocumentMouseOut)
  },
  beforeDestroy() {
    // Unregister resize before destroying this Vue instance
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('mousemove', this.onDocumentMouseMove)
    document.removeEventListener('mouseout', this.onDocumentMouseOut)
  },
  watch: {
    currentBucket(newB) {
      if (newB) {
        if (this.cameraObj) {
          this.initFiles(this.cameraObj)
          this.paintSort()
        }
        this.getcurrentAtlases()
      }
    },
    loadedAtlas(newCount) {
      if (newCount === 0) this.paintAtlas()
    },
    scaled(newScale) {
      // console.log(newScale)
    },
    sort(to, from) {
      this.filesMoveStart = Date.now()
      this.filesMoveFrom = from
      this.filesMoveTo = to
    }
  },
  methods: {
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
          .moveTo(TILE_SIZE / 2, TILE_SIZE / 2)
          .lineTo(TILE_SIZE / 2, -TILE_SIZE / 2)
          .lineTo(-TILE_SIZE / 2, -TILE_SIZE / 2)
          .lineTo(-TILE_SIZE / 2, TILE_SIZE / 2)
          .lineTo(TILE_SIZE / 2, TILE_SIZE / 2)
      )
      const material = new THREE.MeshBasicMaterial({
        color: CURSOR_COLOR
      })
      const mesh = new THREE.Mesh(geometry, material)
      mesh.visible = false
      this.cursor = mesh
      this.scene.add(this.cursor)

      const gui = new GUI()

      gui.add(this, 'showAtlases')
    },
    onDoubleClick(e) {
      if (this.fileMode) {
        if (this.PAST_INTERSECTED.fileId !== undefined) {
          // double-clicked a file
          const url = FILES_BASE_URL + '/' + this.PAST_INTERSECTED.fileId
          window.open(url, '_blank')
        }
        return
      }
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        this.selectedBucket = this.stuff[this.PAST_INTERSECTED.obj.bucketIndex]
        const tileCount = this.selectedBucket.count
        const pct = tileCount / this.itemsTotal
        const scale = this.scaled ? BASE_SCALE : Math.sqrt(pct)
        const x = this.PAST_INTERSECTED.obj.position.x
        const y = this.PAST_INTERSECTED.obj.position.y
        const w = this.PAST_INTERSECTED.obj.geometry.parameters.width * scale
        const obj = new THREE.Mesh(new THREE.PlaneBufferGeometry(w, w))
        obj.position.set(x, y, FILE_Z)
        this.moveCameraTo(obj)
        this.fileMode = true
        this.cameraObj = obj
        window.setTimeout(() => (this.PAST_INTERSECTED = {}), 100)
        this.$store.commit('setBucket', this.selectedBucket)
      }
    },
    onClick() {
      console.log('click', this.PAST_INTERSECTED)
      if (this.isMoving) return
      if (this.fileMode) {
        if (this.PAST_INTERSECTED.instanceId === undefined) {
          // clicked outside
          this.fileMode = false
          this.cleanFiles()
          this.moveCameraTo(this.selectedInstance.obj)
          this.$store.commit('setBucket', null)
        } else {
          // clicked a file
          console.log('file')
          this.moveCameraTo(this.PAST_INTERSECTED.obj)
        }
        return
      }
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        // there is a selected bucket
        if (
          this.PAST_INTERSECTED.instanceId !== this.selectedInstance.instanceId
        ) {
          console.log('bucket')
          this.hideCursor()
          this.moveCameraTo(this.PAST_INTERSECTED.obj)
          this.selectedInstance = { ...this.PAST_INTERSECTED }
        }
      } else {
        console.log('main')
        this.moveCameraTo(this.bucketsGroup)
        this.hideCursor()
        this.selectedInstance = {}
        this.fileMode = false
      }
      this.$store.commit('setBucket', null)
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 1
      this.controls.panSpeed = 0.1
      this.controls.maxDistance = CAMERA_MAX_DIST
      this.controls.minDistance = CAMERA_MIN_DIST
      // this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      // this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.noRotate = true
      this.controls.dynamicDampingFactor = 0.1
    },
    filesInView() {
      if (!this.fileMode || !this.filesObject) return
      const now = Date.now()
      if (now - this.lastChange < CHANGE_DELAY) return
      this.lastChange = now
      const cx = this.camera.position.x
      const cy = this.camera.position.y
      const dz = this.camera.position.z - FILE_Z
      const aspect = this.camera.aspect
      const h = 2 * dz * Math.tan(CAMERA_FOV * 0.5 * (Math.PI / 180))
      const w = h * aspect
      const { side, realW, x, y } = this.filesObject.mga
      const tileSize = realW / side
      let minx = cx - w * 0.5
      let miny = cy - h * 0.5
      let maxx = cx + w * 0.5
      let maxy = cy + h * 0.5
      const fminx = x - realW * 0.5
      const fminy = y - realW * 0.5
      const fmaxx = x + realW * 0.5
      const fmaxy = y + realW * 0.5
      const results = []
      this.visibleFilesCount = 0
      if (minx < fminx && miny < fminy && maxx > fmaxx && maxy > fmaxy) {
        // all the things
        const l = this.selectedBucket.count
        if (l > MAX_VISIBLE_FILES) return
        for (let i = 0; i < l; i++) {
          results.push(i)
        }
      } else {
        // a subset of things
        if (miny < fminy) miny = fminy
        if (minx < fminx) minx = fminx
        if (maxy > fmaxy) maxy = fmaxy
        if (maxx > fmaxx) maxx = fmaxx
        const dx = maxx - minx
        const dy = maxy - miny
        const row = Math.abs(Math.floor((maxy - fmaxy) / tileSize))
        const col = Math.abs(Math.floor((minx - fminx) / tileSize))
        const cc = Math.floor(dx / tileSize)
        const rr = Math.floor(dy / tileSize)
        if (cc * rr > MAX_VISIBLE_FILES) return
        for (let i = 0; i < cc; i++) {
          for (let j = 0; j < rr; j++) {
            results.push(((col + i) % side) + (row + j) * side)
          }
        }
      }
      this.visibleFiles = results.sort((a, b) => a - b)
      this.visibleFilesCount = results.length
      this.loadFiles()
    },
    loadFiles() {
      if (!this.currentBucket) return
      const ids = this.currentBucket.ids
      this.visibleFiles.forEach((idx) => {
        const id = ids[idx]
        const url = THUMBS_BASE_URL + '/' + id
        this.putFileInIndex(url, idx)
      })
    },
    putFileInIndex(url, idx) {
      if (this.filesLoaded.has(idx)) return
      const tileSize = this.filesObject.mga.tileSize

      const matrix = new THREE.Matrix4()
      this.filesObject.getMatrixAt(idx, matrix)

      const p = new THREE.Vector3()
      matrix.decompose(p, new THREE.Quaternion(), new THREE.Vector3())
      const x = p.x
      const y = p.y
      const z = p.z

      const transform = new THREE.Object3D()
      transform.position.set(x, y, z)
      transform.scale.set(0, 0, 0)
      transform.updateMatrix()
      this.filesObject.setMatrixAt(idx, transform.matrix)
      this.filesObject.instanceMatrix.needsUpdate = true

      const texture = new THREE.TextureLoader().load(url)
      texture.encoding = THREE.sRGBEncoding

      const material = new THREE.MeshBasicMaterial({ map: texture })

      const fileMesh = new THREE.Mesh(
        new THREE.PlaneBufferGeometry(tileSize, tileSize),
        material
      )
      fileMesh.position.set(x, y, z)
      this.filesGroup.add(fileMesh)
      this.filesLoaded.add(idx)
    },
    cleanFiles() {
      this.filesLoaded = null
      if (!this.filesObject) return
      this.scene.remove(this.filesObject)

      // TODO: dispose of atlases

      // remove picking
      this.scene.remove(this.pickingMesh)
      this.pickingMesh.geometry.dispose()
      this.pickingMesh.material.map.dispose()
      this.pickingMesh.material.dispose()

      // TODO: legacy. must delete (probably)
      if (!this.filesGroup) return
      this.filesGroup.children.forEach((t) => {
        t.geometry.dispose()
        t.material.dispose()
        t.material.map.dispose()
      })
      this.scene.remove(this.filesGroup)
    },
    paintAtlas() {
      console.log('painting atlases')
    },
    initFiles(obj) {
      this.cleanFiles()

      this.filesLoaded = new Set()

      const tileCount = this.selectedBucket.count
      const side = Math.ceil(Math.sqrt(tileCount))
      const w = obj.geometry.parameters.width
      const tileSize = w / side
      const padding = tileSize * (TILE_PADDING / TILE_SIZE)
      const realW = side * tileSize + (side - 1) * padding

      const geometry = new THREE.BufferGeometry()

      const url = '/atlas/' + this.currentBucket.key + '_0.jpg'
      const texture = new THREE.TextureLoader().load(url)
      texture.flipY = false

      const material = new THREE.RawShaderMaterial({
        vertexShader: vShader,
        fragmentShader: fShader,
        uniforms: {
          atlases: {
            type: 'f',
            value: this.showAtlases ? 1.0 : 0.0
          },
          texture: {
            type: 't',
            value: texture
          },
          atlasPx: {
            type: 'f',
            value: ATLAS_SIZE
          },
          cellPx: {
            type: 'f',
            value: ATLAS_TILE_SIZE
          }
        },
        depthTest: true,
        transparent: true,
        vertexColors: true
      })

      const uvs = new Float32Array(tileCount * 2)

      for (let i = 0; i < tileCount; i++) {
        const x = i % ATLAS_PER_SIDE
        const y = Math.floor(i / ATLAS_PER_SIDE)
        uvs[i * 2] = x
        uvs[i * 2 + 1] = y
      }

      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2, true))

      geometry.setAttribute(
        'color',
        new THREE.Float32BufferAttribute(this.defaultColors, 3)
      )

      geometry.setAttribute(
        'size',
        new THREE.Float32BufferAttribute(
          new Float32Array(tileCount).fill(tileSize, 0, tileCount),
          1
        )
      )

      this.filesObject = new THREE.Points(geometry, material)

      // picking texture
      const emptyTexture = new THREE.Texture(undefined, THREE.UVMapping)
      const planeMaterial = new THREE.MeshBasicMaterial({
        opacity: 0,
        transparent: true,
        map: emptyTexture
      })
      const pickingGeometry = new THREE.PlaneBufferGeometry(realW, realW, 1, 1)
      this.pickingMesh = new THREE.Mesh(pickingGeometry, planeMaterial)
      this.pickingMesh.position.x = obj.position.x
      this.pickingMesh.position.y = obj.position.y
      this.pickingMesh.position.z = obj.position.z
      this.scene.add(this.pickingMesh)

      // an mga object to hold the bucket file real world data
      this.filesObject.mga = {
        realW,
        side,
        tileSize,
        x: obj.position.x,
        y: obj.position.y,
        z: obj.position.z
      }

      this.scene.add(this.filesObject)
      this.filesGroup = new THREE.Group()
      this.scene.add(this.filesGroup)
    },
    interpolateFiles() {
      if (!this.filesMoveStart) return
      const t = Date.now() - this.filesMoveStart
      let from, to
      if (this.filesMoveTo === 'hue') {
        from = this.defaultPositions
        to = this.huePositions
      } else {
        from = this.huePositions
        to = this.defaultPositions
      }
      if (t >= MOVE_DURATION) {
        from = to
        this.filesMoveStart = null
      }

      const { realW, tileSize } = this.filesObject.mga
      const x = this.filesObject.mga.x - realW * 0.5 + tileSize * 0.5
      const y = this.filesObject.mga.y + realW * 0.5 - tileSize * 0.5
      const z = this.filesObject.mga.z

      const padding = tileSize * (TILE_PADDING / TILE_SIZE)

      const tileCount = this.selectedBucket.count

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

        xx = x + xx * (tileSize + padding)
        yy = y + yy * -(tileSize + padding)
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
      const spacing = 2 / (side - 1)

      for (let i = 0, i3 = 0, l = bucketCount; i < l; i++, i3 += 3) {
        const b = buckets[i]
        const count = b.count
        const text = b.name
        const pct = count / this.itemsTotal
        const scale = this.scaled ? Math.sqrt(pct) : BASE_SCALE
        const w = TILE_SIZE * scale
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
      const side =
        obj instanceof THREE.InstancedMesh
          ? sphere.radius * 0.9 * SCENE_PADDING
          : sphere.radius * SCENE_PADDING

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
      this.camera.aspect = w / h
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(w, h)
    },
    onDocumentMouseOut(event) {
      this.lastFileId = null
      this.fileData = {}
      if (this.$refs.file) this.$refs.file.classList.add('hidden')
    },
    onDocumentMouseMove(event) {
      if (this.lastMouseMoveId) window.clearTimeout(this.lastMouseMoveId)
      this.lastMouseMoveId = window.setTimeout(this.loadFile, API_CALL_DELAY)
      event.preventDefault()
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
      this.positionFile(this.PAST_INTERSECTED.fileId)
    },
    hideCursor() {
      this.cursor.visible = false
    },
    render() {
      // this.filesInView()
      this.renderer.render(this.scene, this.camera)
      if (this.$refs.three) this.$refs.three.classList.remove('pointer')

      if (this.mouse) this.raycaster.setFromCamera(this.mouse, this.camera)

      this.pickBucket()
      this.pickFile()
    },
    getFileAt(uv) {
      const { x, y } = uv
      const { realW, tileSize, side } = this.filesObject.mga
      const mx = this.filesObject.mga.x
      const my = this.filesObject.mga.y
      const col = Math.floor(side * x)
      const row = Math.floor(side * (1 - y))
      const padding = tileSize * (TILE_PADDING / TILE_SIZE)
      const xx = realW * x
      const yy = realW - realW * y
      const xmin = col * (tileSize + padding) + padding
      const xmax = col * (tileSize + padding) + padding + tileSize
      const ymin = row * (tileSize + padding) + padding
      const ymax = row * (tileSize + padding) + padding + tileSize
      // make sure it is above a square and not in the gutter
      const tileCount = this.selectedBucket.count
      const index = col + row * side
      if (
        index < tileCount &&
        xx > xmin &&
        xx < xmax &&
        yy > ymin &&
        yy < ymax
      ) {
        const fileId =
          this.sort === 'default'
            ? this.currentBucket.ids[index]
            : this.currentBucket.ids[this.hueIndexes[index]]
        const instanceId = index
        const tx = mx + xmin + tileSize * 0.5 - realW * 0.5
        const ty = my - ymin - tileSize * 0.5 + realW * 0.5
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
              // new thing so clear fileData
              const size = this.filesObject.geometry.getAttribute('size')
                .array[0]

              this.fileData = {}
              const point = intersects[0].point
              const geometry = new THREE.PlaneBufferGeometry(size, size)
              const material = new THREE.MeshBasicMaterial()
              const obj = new THREE.Mesh(geometry, material)
              console.log(intersects[0])
              obj.position.x = tx
              obj.position.y = ty
              obj.position.z = point.z
              this.PAST_INTERSECTED.instanceId = instanceId
              this.PAST_INTERSECTED.obj = obj
              this.PAST_INTERSECTED.fileId = fileId
            }
          } else {
            this.$refs.three.classList.remove('pointer')
            this.PAST_INTERSECTED = {}
          }
        } else if (this.PAST_INTERSECTED.instanceId) {
          this.PAST_INTERSECTED = {}
        }
      }
    },
    positionFile(visible) {
      if (!this.$refs.file) return
      const elem = this.$refs.file
      if (!visible) {
        this.lastFileId = null
        elem.classList.add('hidden')
        return
      }
      // position hover
      elem.classList.remove('hidden')
      let left = (window.innerWidth * (this.mouse.x + 1)) / 2
      if (left + HOVER_WIDTH > window.innerWidth)
        left = left - HOVER_WIDTH - HOVER_PADDING * 4
      let top = (window.innerHeight * (this.mouse.y - 1)) / -2 - HOVER_WIDTH / 2
      if (top + HOVER_WIDTH > window.innerHeight) top = top - HOVER_WIDTH / 2
      if (top < 0) top = HOVER_PADDING
      elem.style.left = left + HOVER_PADDING + 'px'
      elem.style.top = top + HOVER_PADDING + 'px'
    },
    loadFile() {
      // get data from API
      if (!this.$refs.file) return
      if (!this.PAST_INTERSECTED.fileId) {
        this.lastFileId = null
        return
      }
      const fileId = this.PAST_INTERSECTED.fileId
      if (fileId === this.lastFileId) return
      this.fileData = {}
      this.lastFileId = fileId
      let url = '/files/' + fileId
      instance.get(url).then((response) => {
        const image = response.data.file.image.variants['300_300'].url
        const title = response.data.file.title
        this.fileData = { ...this.fileData, image, title }
      })
      url = THUMBS_BASE_URL + '/data/' + fileId
      instance.get(url).then((colorResponse) => {
        const paletteStr = colorResponse.data.palette_colors
        const palette = paletteStr
          .split(',')
          .map((i) => i.split(':'))
          .map((p) => {
            return { color: p[0], percent: Number(p[1]) }
          })
        this.fileData = { ...this.fileData, palette }
      })
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
            const scale = obj.geometry.parameters.width / TILE_SIZE
            this.cursor.position.x = obj.position.x
            this.cursor.position.y = obj.position.y + scale * 0.5
            this.cursor.position.z = obj.position.z
            this.cursor.scale = new THREE.Vector3(
              scale * 1.02,
              scale * 0.1,
              scale
            )
            this.cursor.visible = true
          }
        } else if (this.PAST_INTERSECTED.instanceId) {
          this.hideCursor()
          this.PAST_INTERSECTED = {}
        }
      }
    },
    ...mapActions(['getcurrentAtlases'])
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
.file {
  background-color: transparentize($color: $bg-color, $amount: 0.25);
  display: flex;
  flex-direction: column;
  padding: 0.5rem;
  position: absolute;
  min-height: calc(300px + 1rem);
  min-width: calc(300px + 1rem);
  max-width: calc(300px + 1rem);
  z-index: 1;

  &.hidden {
    display: none;
  }
}
.loading {
  display: flex;
  justify-content: center;
  align-items: center;
  width: 300px;
  height: 300px;
}
.palette {
  display: flex;
}
.color {
  font-size: 0.75rem;
  height: 2rem;
  padding: 0.5rem;
}
.thumbnail {
  background-color: lighten($color: $bg-color, $amount: 10%);
  width: 300px;
  height: 300px;
}
</style>
