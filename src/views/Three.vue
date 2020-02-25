<template>
  <canvas ref="three" class="three"></canvas>
</template>

<script>
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

const MAX_PARTICLES = 10000
const START_PARTICLES = 119
const CAMERA_FRUSTUM = 1
const MOVE_DURATION = 300
const TILE_PADDING = 0.04
const SCENE_PADDING = 1.15

export default {
  components: {},
  data() {
    return {
      renderer: null,
      camera: null,
      scene: null,
      mesh: null,
      controls: null,
      particleCount: START_PARTICLES,
      lastCamera: null,
      toCamera: null,
      cameraMoveStart: null,
      zoom: 1,
      mouse: {},
      raycaster: null,
      hlMesh: null
    }
  },
  computed: {},
  mounted() {
    this.init()
    this.refreshMesh()
    this.initMoveCamera()
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
        antialias: false,
        canvas: this.$refs.three
      }) // false improves the frame rate
      this.renderer.setPixelRatio(window.devicePixelRatio)

      this.renderer.setSize(window.innerWidth, window.innerHeight)

      this.renderer.outputEncoding = THREE.sRGBEncoding

      this.scene = new THREE.Scene()

      this.raycaster = new THREE.Raycaster()

      this.camera = this.createBaseCamera()
      this.createControls()
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 10
      this.controls.panSpeed = 200
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.maxDistance = 0.9
      this.controls.minDistance = 0.0009
      this.controls.noRotate = true

      const gui = new GUI()
      gui
        .add(this, 'particleCount', 1, MAX_PARTICLES)
        .step(1)
        .onFinishChange(() => {
          this.refreshMesh()
          this.initMoveCamera()
        })
        .listen()
      gui
        .add(this, 'zoom', 0, 1)
        .step(0.001)
        .listen()
    },
    refreshMesh() {
      this.cleanMesh()

      const texture = new THREE.TextureLoader().load(
        'https://raw.githubusercontent.com/mgiraldo/vue-threejs-hello-world/master/public/textures/cobblestone.png'
      )

      const particleCount = this.particleCount

      const side = Math.floor(Math.sqrt(particleCount))

      const hlGeometry = new THREE.PlaneBufferGeometry(
        1 + TILE_PADDING,
        1 + TILE_PADDING
      )
      const hlMaterial = new THREE.MeshBasicMaterial({
        color: 0x880000,
        side: THREE.DoubleSide
      })
      this.hlMesh = new THREE.Mesh(hlGeometry, hlMaterial)
      const x = -side * 0.5
      const y = side * 0.5
      this.hlMesh.position.set(x, y, -0.1)
      this.scene.add(this.hlMesh)

      const geometry = new THREE.PlaneBufferGeometry(1, 1)
      const material = new THREE.MeshBasicMaterial({
        color: 0x888888,
        map: texture,
        side: THREE.DoubleSide
      })
      this.mesh = new THREE.InstancedMesh(geometry, material, particleCount)

      const transform = new THREE.Object3D()

      for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
        const x = (i % side) * (1 + TILE_PADDING) - side * 0.5
        const y = Math.floor(i / side) * -1.02 + side * 0.5
        const z = 0
        transform.position.set(x, y, z)
        transform.updateMatrix()
        this.mesh.setMatrixAt(i, transform.matrix)
      }

      this.scene.add(this.mesh)
    },
    cleanMesh() {
      const meshes = []

      this.scene.traverse(function(object) {
        if (object.isMesh) meshes.push(object)
      })

      for (let i = 0; i < meshes.length; i++) {
        const mesh = meshes[i]
        mesh.material.dispose()
        mesh.geometry.dispose()

        this.scene.remove(mesh)
      }
    },
    createBaseCamera() {
      const aspect = window.innerWidth / window.innerHeight
      const camera = new THREE.OrthographicCamera(
        (CAMERA_FRUSTUM * aspect) / -2,
        (CAMERA_FRUSTUM * aspect) / 2,
        CAMERA_FRUSTUM / 2,
        CAMERA_FRUSTUM / -2
      )
      camera.position.z = 1
      return camera
    },
    initMoveCamera() {
      this.lastCamera = this.camera.clone()

      let side = Math.ceil(Math.sqrt(this.particleCount))
      side = side * SCENE_PADDING
      this.zoom = 1 / side

      this.cameraMoveStart = Date.now()
    },
    interpolateCamera() {
      if (!this.lastCamera) return
      const from = this.lastCamera.zoom
      const to = this.zoom - from
      const t = Date.now() - this.cameraMoveStart
      const zoom = this.easeInOutQuad(t, from, to, MOVE_DURATION)
      const toCamera = this.createBaseCamera()
      toCamera.zoom = zoom
      toCamera.updateProjectionMatrix()
      this.camera.copy(toCamera)
      if (t > MOVE_DURATION) {
        this.lastCamera = null
      }
    },
    animate() {
      requestAnimationFrame(this.animate)
      this.render()
      this.controls.update()
      this.interpolateCamera()
    },
    easeInOutQuad(t, b, c, d) {
      // t: current time, b: beginning value, c: change In value, d: duration
      if ((t /= d / 2) < 1) return (c / 2) * t * t + b
      return (-c / 2) * (--t * (t - 2) - 1) + b
    },
    easeOutQuad(t, b, c, d) {
      // t: current time, b: beginning value, c: change In value, d: duration
      return -c * (t /= d) * (t - 2) + b
    },
    onResize() {
      const aspect = window.innerWidth / window.innerHeight
      this.camera.left = (CAMERA_FRUSTUM * aspect) / -2
      this.camera.right = (CAMERA_FRUSTUM * aspect) / 2
      this.camera.top = CAMERA_FRUSTUM / 2
      this.camera.bottom = CAMERA_FRUSTUM / -2
      this.camera.updateProjectionMatrix()
      this.renderer.setSize(window.innerWidth, window.innerHeight)
      this.controls.handleResize()
    },
    onDocumentMouseMove(event) {
      event.preventDefault()

      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    },
    render() {
      this.raycaster.setFromCamera(this.mouse, this.camera)

      const intersects = this.raycaster.intersectObject(this.mesh)
      const side = Math.floor(Math.sqrt(this.particleCount))
      const maxX = Math.floor(side * 0.5) - 1
      const minY = -Math.ceil(side * 0.5) - 1

      if (intersects.length > 0) {
        const intersected = intersects[0]
        const point = intersected.point
        let x = Math.round(point.x)
        let y = Math.round(point.y)
        if (x > maxX) x = maxX
        if (y < minY) y = minY
        this.hlMesh.position.set(x, y, -0.1)
      } else {
        //
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
</style>
