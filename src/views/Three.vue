<template>
  <canvas ref="three" class="three"></canvas>
</template>

<script>
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

const MAX_PARTICLES = 10000
const START_PARTICLES = 1000
const MOVE_DURATION = 300
const TILE_PADDING = 0.05
const CAMERA_NEAR = 100
const CAMERA_FAR = 100000
const SCENE_PADDING = 1.15
const PARTICLE_SIZE = 1
const SELECTED_SCALE = 1.5
const SELECTED_COLOR = new THREE.Color(0, 130, 41)

export default {
  components: {},
  data() {
    return {
      renderer: null,
      camera: null,
      scene: null,
      particles: null,
      controls: null,
      particleCount: START_PARTICLES,
      lastCamera: null,
      toCamera: null,
      cameraMoveStart: null,
      zoom: 1,
      mouse: {},
      raycaster: null,
      INTERSECTED: {}
    }
  },
  computed: {},
  mounted() {
    this.init()
    this.createControls()
    this.refreshParticles()
    this.initMoveCamera()
    this.animate()
    // console.log(
    //   this.camera.position.x,
    //   this.camera.position.y,
    //   this.camera.position.z
    // )
    this.controls.addEventListener('end', (e) => {
      console.log(
        this.camera.position.x,
        this.camera.position.y,
        this.camera.position.z
      )
    })
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
      this.raycaster.params.Points.threshold = PARTICLE_SIZE * 0.5
      this.mouse = new THREE.Vector2()

      this.camera = this.createBaseCamera()
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.resetControls()

      const gui = new GUI()
      gui
        .add(this, 'particleCount', 1, MAX_PARTICLES)
        .step(1)
        .onFinishChange(() => {
          this.refreshParticles()
          this.initMoveCamera()
        })
        .listen()
      gui
        .add(this, 'zoom', 0, 1)
        .step(0.001)
        .listen()
      gui
        .add(this.camera, 'fov', 0, 180)
        .step(0.001)
        .listen()
    },
    resetControls() {
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 10
      this.controls.panSpeed = 0.5
      this.controls.maxDistance = CAMERA_FAR
      this.controls.minDistance = CAMERA_NEAR
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.noRotate = true
    },
    refreshParticles() {
      this.cleanParticles()

      const particleCount = this.particleCount

      const side = Math.floor(Math.sqrt(particleCount))

      const geometry = new THREE.PlaneBufferGeometry(
        PARTICLE_SIZE,
        PARTICLE_SIZE
      )

      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })

      this.particles = new THREE.InstancedMesh(
        geometry,
        material,
        particleCount
      )

      const colors = new Float32Array(particleCount * 3)

      const color = new THREE.Color()
      const transform = new THREE.Object3D()

      for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
        const x = (i % side) * (PARTICLE_SIZE + TILE_PADDING) - side * 0.5
        const y =
          Math.floor(i / side) * -(PARTICLE_SIZE + TILE_PADDING) + side * 0.5
        const z = 0
        transform.position.set(x, y, z)
        transform.updateMatrix()

        this.particles.setMatrixAt(i, transform.matrix)

        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)
      }

      geometry.setAttribute(
        'color',
        new THREE.InstancedBufferAttribute(colors, 3)
      )
      material.vertexColors = THREE.VertexColors

      this.scene.add(this.particles)
    },
    cleanParticles() {
      if (!this.particles) return
      this.particles.material.dispose()
      this.particles.geometry.dispose()

      this.scene.remove(this.particles)
    },
    createBaseCamera() {
      const aspect = window.innerWidth / window.innerHeight
      const camera = new THREE.PerspectiveCamera(
        1,
        aspect,
        0.1,
        CAMERA_FAR * 10
      )
      camera.position.x = 0
      camera.position.y = 0
      camera.position.z = 10
      return camera
    },
    initMoveCamera() {
      this.lastCamera = this.camera.clone()

      let side = Math.ceil(Math.sqrt(this.particleCount))
      side = side * SCENE_PADDING

      this.zoom = 1 / side

      const dist = 10

      const fov = 2 * Math.atan(side / (2 * dist)) * (180 / Math.PI) // in degrees

      this.zoom = fov

      this.cameraMoveStart = Date.now()
    },
    interpolateCamera() {
      if (!this.lastCamera) return
      const t = Date.now() - this.cameraMoveStart

      const fromZoom = this.lastCamera.fov
      const toZoom = this.zoom - fromZoom

      const toCamera = this.createBaseCamera()

      const zoom = this.easeInOutQuad(t, fromZoom, toZoom, MOVE_DURATION)

      // toCamera.fov = zoom

      this.resetControls()

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
      this.camera.aspect = window.innerWidth / window.innerHeight
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

      const geometry = this.particles.geometry
      const attributes = geometry.attributes

      this.raycaster.setFromCamera(this.mouse, this.camera)

      const intersects = this.raycaster.intersectObject(this.particles)

      const normalSize = PARTICLE_SIZE
      const selectedSize = PARTICLE_SIZE * SELECTED_SCALE

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId
        if (this.INTERSECTED.instanceId != instanceId) {
          if (this.INTERSECTED.color) {
            attributes.color.array[
              3 * this.INTERSECTED.instanceId
            ] = this.INTERSECTED.color.r
            attributes.color.array[
              3 * this.INTERSECTED.instanceId + 1
            ] = this.INTERSECTED.color.g
            attributes.color.array[
              3 * this.INTERSECTED.instanceId + 2
            ] = this.INTERSECTED.color.b
          }
          const r = attributes.color.array[3 * instanceId]
          const g = attributes.color.array[3 * instanceId + 1]
          const b = attributes.color.array[3 * instanceId + 2]

          this.INTERSECTED.instanceId = instanceId
          this.INTERSECTED.color = { r, g, b }

          attributes.color.array[3 * instanceId] = SELECTED_COLOR.r
          attributes.color.array[3 * instanceId + 1] = SELECTED_COLOR.g
          attributes.color.array[3 * instanceId + 2] = SELECTED_COLOR.b

          attributes.color.needsUpdate = true
        }
      } else if (this.INTERSECTED.instanceId) {
        attributes.color.array[
          3 * this.INTERSECTED.instanceId
        ] = this.INTERSECTED.color.r
        attributes.color.array[
          3 * this.INTERSECTED.instanceId + 1
        ] = this.INTERSECTED.color.g
        attributes.color.array[
          3 * this.INTERSECTED.instanceId + 2
        ] = this.INTERSECTED.color.b
        attributes.color.needsUpdate = true
        this.INTERSECTED = {}
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
