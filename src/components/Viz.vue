<template>
  <canvas
    ref="three"
    class="three"
    @dblclick.prevent="onDoubleClick"
    @click.prevent="onClick"
  ></canvas>
</template>

<script>
import { mapState, mapGetters } from 'vuex'

import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import SpriteText from 'three-spritetext'

import { FormatType } from '@/utils/types'

const BUCKET_Z = 3000
const FILE_Z = 10
const CAMERA_NEAR = 0.01
const CAMERA_FAR = BUCKET_Z * 3
const CAMERA_FOV = 30
const COLOR_SELECTED = new THREE.Color('rgb(255, 0, 0)')
const COLOR_HOVERED = new THREE.Color('hsl(3.6, 100%, 50%)')
const COLOR_OTHER = new THREE.Color('hsl(0, 100%, 30%)')
const CURSOR_SCALE = 4
const MOVE_DURATION = 300
const SCENE_PADDING = 0.995
const TEXT_SIZE = 100
const TEXT_Z = 0.1 // relative
const TILE_COLOR_DIST = 100
const TILE_FILE_DIST = 50
const TILE_PADDING = 25
const TILE_SIZE = 1000

const getBoundsFromMesh = (obj) => {
  const o = new THREE.Box3()
  const count = obj.instanceMatrix.count
  for (let i = 0, i3 = 0, l = count; i < l; i++, i3 += 3) {
    const matrix = new THREE.Matrix4()
    obj.getMatrixAt(i, matrix)
    const p = new THREE.Vector3()
    const s = new THREE.Vector3()
    matrix.decompose(p, new THREE.Quaternion(), s)
    const x = p.x
    const y = p.y
    const z = p.z
    const objBucket = new THREE.Mesh(
      new THREE.PlaneGeometry(TILE_SIZE * s.x, TILE_SIZE * s.x)
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
  myText.fontFace = 'Avenir'
  myText.textHeight = TEXT_SIZE * scale
  myText.position.set(x, y, z)
  myText.center = new THREE.Vector2(0, 0)
  return myText
}

export default {
  components: {},
  data() {
    return {
      isMoving: false,
      fileMode: false,
      renderer: null,
      camera: null,
      scene: null,
      bucketsGroup: null,
      filesMesh: null,
      cursor: null,
      selectedBucket: null,
      textGroup: null,
      controls: null,
      lastCamera: null,
      toCamera: null,
      toLook: null,
      cameraMoveStart: null,
      zoom: 1,
      mouse: {},
      raycaster: null,
      PAST_INTERSECTED: {},
      selectedInstance: {}
    }
  },
  computed: {
    formats() {
      return FormatType
    },
    ...mapGetters(['totalFromBuckets']),
    ...mapState(['currentBucket', 'itemsTotal', 'stuff'])
  },
  mounted() {
    this.init()
    this.createControls()
    this.paintBuckets()
    this.moveCameraTo(this.bucketsGroup)
    this.animate()
    window.addEventListener('resize', this.onResize)
    document.addEventListener('mousemove', this.onDocumentMouseMove)
  },
  beforeDestroy() {
    // Unregister resize before destroying this Vue instance
    window.removeEventListener('resize', this.onResize)
    document.removeEventListener('mousemove', this.onDocumentMouseMove)
  },
  methods: {
    init() {
      this.renderer = new THREE.WebGLRenderer({
        antialias: true,
        canvas: this.$refs.three
      }) // false improves the frame rate
      this.renderer.outputEncoding = THREE.sRGBEncoding
      this.renderer.gammaFactor = 2.2
      this.renderer.setPixelRatio(window.devicePixelRatio)

      this.renderer.setSize(window.innerWidth, window.innerHeight)

      this.scene = new THREE.Scene()

      this.raycaster = new THREE.Raycaster()
      this.raycaster.params.Points.threshold = TILE_SIZE * 0.5
      this.mouse = new THREE.Vector2(-1e10, -1e10)

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
      const material = new THREE.LineBasicMaterial({
        color: COLOR_HOVERED,
        linewidth: 1
      })
      const mesh = new THREE.Line(geometry, material)
      mesh.visible = false
      this.cursor = mesh
      this.scene.add(this.cursor)

      const gui = new GUI()

      gui.add(this.camera.position, 'x').listen()
      gui.add(this.camera.position, 'y').listen()
      gui.add(this.camera.position, 'z').listen()
    },
    onDoubleClick() {
      if (this.isMoving) return
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        this.selectedBucket = this.stuff[this.PAST_INTERSECTED.obj.bucketIndex]
        this.$store.commit('setBucket', this.selectedBucket)
        const x = this.PAST_INTERSECTED.obj.position.x
        const y = this.PAST_INTERSECTED.obj.position.y
        const w = this.PAST_INTERSECTED.obj.geometry.parameters.width
        const obj = new THREE.Mesh(new THREE.PlaneGeometry(w, w))
        obj.position.set(x, y, FILE_Z)
        this.moveCameraTo(obj)
        this.paintFiles(obj)
        this.fileMode = true
      }
    },
    onClick() {
      if (this.isMoving) return
      this.cleanFiles()
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        if (
          this.PAST_INTERSECTED.instanceId !== this.selectedInstance.instanceId
        ) {
          this.resetIntersectedColor(this.selectedInstance)
          this.moveCameraTo(this.PAST_INTERSECTED.obj)
          this.selectedInstance = { ...this.PAST_INTERSECTED }
        }
      } else {
        if (this.selectedInstance.instanceId) {
          this.moveCameraTo(this.selectedInstance.obj)
        } else {
          this.moveCameraTo(this.bucketsGroup)
        }
        this.resetIntersectedColor(this.selectedInstance)
        this.selectedInstance = {}
        this.fileMode = false
      }
      this.$store.commit('setBucket', null)
    },
    getClickedGeometry() {
      const id = this.PAST_INTERSECTED.instanceId
      const x = this.PAST_INTERSECTED.obj.position.x
      const y = this.PAST_INTERSECTED.obj.position.y
      const z = this.PAST_INTERSECTED.obj.position.z
      const s = this.PAST_INTERSECTED.obj.geometry.parameters.width / TILE_SIZE
      return { x, y, z, s, id }
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 1
      this.controls.panSpeed = 1
      this.controls.maxDistance = BUCKET_Z * 1.5
      this.controls.minDistance = FILE_Z
      // this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      // this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.noRotate = true
      this.controls.screenSpacePanning = true
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.1
      this.controls.addEventListener('end', this.filesInView)
    },
    filesInView() {
      if (!this.fileMode) return
      const dz = this.camera.position.z - FILE_Z
      const aspect = this.camera.aspect
      const h = 2 * dz * Math.tan(CAMERA_FOV * 0.5 * (Math.PI / 180))
      const w = h * aspect
      const { side, realW } = this.filesMesh.mga
      console.log(w, h, realW, side)
    },
    cleanFiles() {
      if (!this.filesMesh) return
      this.scene.remove(this.filesMesh)
    },
    paintFiles(obj) {
      this.cleanFiles()

      const tileCount = this.selectedBucket.count
      const side = Math.ceil(Math.sqrt(tileCount))
      const w = obj.geometry.parameters.width
      const tileSize = w / side
      const padding = tileSize * (TILE_PADDING / TILE_SIZE)
      const realW = side * tileSize + (side - 1) * padding

      const x = obj.position.x - realW / 2 + tileSize / 2
      const y = obj.position.y + realW / 2 - tileSize / 2
      const z = obj.position.z

      const geometry = new THREE.PlaneBufferGeometry(tileSize, tileSize)

      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })

      this.filesMesh = new THREE.InstancedMesh(geometry, material, tileCount)
      this.filesMesh.mga = { realW, side }

      const colors = new Float32Array(tileCount * 3)

      const color = new THREE.Color()
      const transform = new THREE.Object3D()

      for (let i = 0, i3 = 0, l = tileCount; i < l; i++, i3 += 3) {
        const xT = x + (i % side) * (tileSize + padding)
        const yT = y + Math.floor(i / side) * -(tileSize + padding)
        const zT = z
        transform.position.set(xT, yT, zT)
        transform.updateMatrix()

        this.filesMesh.setMatrixAt(i, transform.matrix)

        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)
      }

      geometry.setAttribute(
        'color',
        new THREE.InstancedBufferAttribute(colors, 3)
      )
      material.vertexColors = THREE.VertexColors

      this.scene.add(this.filesMesh)
    },
    paintBuckets() {
      this.cleanBuckets()

      const buckets = Object.values(this.stuff).filter((b) => b.count > 0)
      buckets.sort((a, b) => b.count - a.count)

      const bucketCount = buckets.length

      const colors = new Float32Array(bucketCount * 3)

      const color = new THREE.Color()

      let lastX = 0

      const bucketsGroup = new THREE.Group()

      const textGroup = new THREE.Group()

      for (let i = 0, i3 = 0, l = bucketCount; i < l; i++, i3 += 3) {
        const b = buckets[i]
        const count = b.count
        const text = b.name
        const pct = count / this.itemsTotal
        const scale = Math.sqrt(pct)
        const w = TILE_SIZE * scale
        const x = lastX + w / 2
        lastX = x + w / 2 + TILE_PADDING * scale
        const y = -w / 2
        const z = BUCKET_Z

        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)

        // thumb
        const geometry = new THREE.PlaneBufferGeometry(
          TILE_SIZE * scale,
          TILE_SIZE * scale
        )
        const url =
          process.env.VUE_APP_THUMBS_BASE_URL +
          '/' +
          b.images[Math.floor(Math.random() * b.images.length)]
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
        const textTop = y + w / 2 + TILE_PADDING * scale
        const textZ = BUCKET_Z + TEXT_Z * scale
        const labelStr = text
        const numberStr = count
        textGroup.add(
          createText(
            `${labelStr} (${new Intl.NumberFormat().format(numberStr)})`,
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
      this.controls.update()
      this.render()
    },
    onResize() {
      this.camera.aspect = window.innerWidth / window.innerHeight
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
    },
    onDocumentMouseMove(event) {
      event.preventDefault()
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    },
    resetIntersectedColor(instance) {
      if (!instance.obj) return
      this.cursor.visible = false
    },
    render() {
      this.$refs.three.classList.remove('pointer')

      if (this.bucketsGroup) {
        if (this.mouse) this.raycaster.setFromCamera(this.mouse, this.camera)

        const intersects = this.bucketsGroup.children
          .map((ch) => this.raycaster.intersectObject(ch))
          .filter((ch) => ch.length > 0)
          .map((ch) => ch[0])

        if (intersects.length > 0) {
          this.$refs.three.classList.add('pointer')
          const obj = intersects[0].object
          const instanceId = obj.bucketIndex
          if (this.PAST_INTERSECTED.instanceId !== instanceId) {
            if (
              this.selectedInstance.instanceId !==
              this.PAST_INTERSECTED.instanceId
            ) {
              this.resetIntersectedColor(this.PAST_INTERSECTED)
            }

            this.PAST_INTERSECTED.instanceId = instanceId
            this.PAST_INTERSECTED.obj = obj
            const scale = obj.geometry.parameters.width / TILE_SIZE
            const position = obj.position.clone()
            this.cursor.position.copy(position)
            this.cursor.scale = new THREE.Vector3(scale, scale, scale)
            this.cursor.visible = true
          }
        } else if (this.PAST_INTERSECTED.instanceId) {
          this.resetIntersectedColor(this.PAST_INTERSECTED)
          this.PAST_INTERSECTED = {}
        }
      }

      this.renderer.render(this.scene, this.camera)
    }
  }
}
</script>

<style lang="scss" scoped>
.three {
  height: 100vh;
  width: 100vw;
}
.pointer {
  cursor: pointer;
}
</style>
