<template>
  <canvas ref="three" class="three" @click="onClick"></canvas>
</template>

<script>
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

const MAX_PARTICLES = 10000
const START_PARTICLES = 100
const MOVE_DURATION = 300
const TILE_PADDING = 0.05
const CAMERA_NEAR = 0.1
const CAMERA_FAR = 100000
const CAMERA_FOV = 60
const SCENE_PADDING = 0.7
const PARTICLE_SIZE = 1
const SELECTED_COLOR = new THREE.Color(255, 0, 0)
const HOVERED_COLOR = new THREE.Color(0, 130, 41)

export default {
  components: {},
  data() {
    return {
      categories: ['format', 'author', 'subject'],
      renderer: null,
      camera: null,
      scene: null,
      particles: null,
      controls: null,
      particleCount: START_PARTICLES,
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
  computed: {},
  mounted() {
    this.init()
    this.createControls()
    this.refreshParticles()
    this.moveCameraTo()
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
      this.raycaster.params.Points.threshold = PARTICLE_SIZE * 0.5
      this.mouse = new THREE.Vector2(-1e10, -1e10)

      this.camera = this.createBaseCamera()
    },
    onClick() {
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        this.resetIntersectedColor(this.selectedInstance)
        const x = this.particles.geometry.attributes.customPosition.array[
          this.PAST_INTERSECTED.instanceId * 3
        ]
        const y = this.particles.geometry.attributes.customPosition.array[
          this.PAST_INTERSECTED.instanceId * 3 + 1
        ]
        const z = this.particles.geometry.attributes.customPosition.array[
          this.PAST_INTERSECTED.instanceId * 3 + 2
        ]
        this.particles.geometry.attributes.color.array[
          this.PAST_INTERSECTED.instanceId * 3
        ] = SELECTED_COLOR.r
        this.particles.geometry.attributes.color.array[
          this.PAST_INTERSECTED.instanceId * 3 + 1
        ] = SELECTED_COLOR.g
        this.particles.geometry.attributes.color.array[
          this.PAST_INTERSECTED.instanceId * 3 + 2
        ] = SELECTED_COLOR.b
        this.particles.geometry.attributes.color.needsUpdate = true
        const obj = new THREE.Mesh(new THREE.PlaneGeometry(1, 1))
        obj.position.set(x, y, z)
        this.selectedInstance = { ...this.PAST_INTERSECTED }
        this.moveCameraTo(obj)
      }
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
      this.resetControls()

      const gui = new GUI()
      gui
        .add(this, 'particleCount', 1, MAX_PARTICLES)
        .step(10)
        .onFinishChange(() => {
          this.refreshParticles()
          this.moveCameraTo()
        })
        .listen()

      const f1 = gui.addFolder('Camera')
      f1.add(this.camera.position, 'x', 0, 100)
        .step(1)
        .listen()
      f1.add(this.camera.position, 'y', 0, 100)
        .step(1)
        .listen()
      f1.add(this.camera.position, 'z', 0, 1000)
        .step(1)
        .listen()
    },
    resetControls() {
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 1
      this.controls.panSpeed = 1
      this.controls.maxDistance = CAMERA_FAR
      this.controls.minDistance = CAMERA_NEAR
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.noRotate = true
      this.controls.screenSpacePanning = true
      this.controls.enableDamping = true
      this.controls.dampingFactor = 0.1
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
      const positions = new Float32Array(particleCount * 3)

      const color = new THREE.Color()
      const position = new THREE.Vector3()
      const transform = new THREE.Object3D()

      for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
        const x = (i % side) * (PARTICLE_SIZE + TILE_PADDING) - side * 0.5
        const y =
          Math.floor(i / side) * -(PARTICLE_SIZE + TILE_PADDING) + side * 0.5
        const z = 0
        transform.position.set(x, y, z)
        transform.updateMatrix()

        this.particles.setMatrixAt(i, transform.matrix)

        position.set(x, y, z)
        position.toArray(positions, i * 3)
        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)
      }

      geometry.setAttribute(
        'customPosition',
        new THREE.InstancedBufferAttribute(positions, 3)
      )
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
        CAMERA_FOV,
        aspect,
        0.1,
        CAMERA_FAR * 10
      )
      camera.position.x = 0
      camera.position.y = 0
      camera.position.z = 10
      camera.updateProjectionMatrix()
      return camera
    },
    moveCameraTo(obj) {
      let o = obj

      if (!obj) o = this.particles

      o.geometry.computeBoundingSphere()

      const fov = CAMERA_FOV * (Math.PI / 180)

      let side = !obj
        ? Math.ceil(Math.sqrt(this.particleCount))
        : o.geometry.boundingSphere.radius
      side = side * SCENE_PADDING

      const center = new THREE.Vector3(o.position.x, o.position.y, 0)

      const dist = Math.abs(side / Math.sin(fov / 2))

      const dir = new THREE.Vector3().subVectors(
        this.camera.position,
        this.controls.target
      )

      const newPos = new THREE.Vector3().addVectors(center, dir.setLength(dist))

      this.lastCamera = this.camera.clone()
      this.toCamera = this.camera.clone()
      this.toCamera.position.copy(newPos)
      this.toLook = center

      this.cameraMoveStart = Date.now()
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
      newPos.x = this.easeInOutQuad(t, xF, xT - xF, MOVE_DURATION)
      newPos.y = this.easeInOutQuad(t, yF, yT - yF, MOVE_DURATION)
      newPos.z = this.easeInOutQuad(t, zF, zT - zF, MOVE_DURATION)
      this.camera.position.copy(newPos)

      const cF = this.controls.target.clone()
      const cT = this.toLook.clone()
      const center = new THREE.Vector3()
      center.x = this.easeInOutQuad(t, cF.x, cT.x - cF.x, MOVE_DURATION)
      center.y = this.easeInOutQuad(t, cF.y, cT.y - cF.y, MOVE_DURATION)
      center.z = this.easeInOutQuad(t, cF.z, cT.z - cF.z, MOVE_DURATION)
      this.controls.target.copy(center)

      if (t > MOVE_DURATION) {
        this.camera.position.copy(this.toCamera.position)
        this.controls.target.copy(this.toLook)
        this.lastCamera = null
        this.toCamera = null
      }
    },
    animate() {
      requestAnimationFrame(this.animate)
      this.interpolateCamera()
      this.controls.update()
      this.render()
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
    },
    onDocumentMouseMove(event) {
      event.preventDefault()
      this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1
      this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1
    },
    resetIntersectedColor(instance) {
      if (!instance.color) return
      const geometry = this.particles.geometry
      const attributes = geometry.attributes
      attributes.color.array[3 * instance.instanceId] = instance.color.r
      attributes.color.array[3 * instance.instanceId + 1] = instance.color.g
      attributes.color.array[3 * instance.instanceId + 2] = instance.color.b
      attributes.color.needsUpdate = true
    },
    render() {
      const geometry = this.particles.geometry
      const attributes = geometry.attributes

      if (this.mouse) this.raycaster.setFromCamera(this.mouse, this.camera)

      const intersects = this.raycaster.intersectObject(this.particles)

      if (intersects.length > 0) {
        const instanceId = intersects[0].instanceId
        if (this.PAST_INTERSECTED.instanceId !== instanceId) {
          const r = attributes.color.array[3 * instanceId]
          const g = attributes.color.array[3 * instanceId + 1]
          const b = attributes.color.array[3 * instanceId + 2]

          if (this.selectedInstance.instanceId !== instanceId) {
            attributes.color.array[3 * instanceId] = HOVERED_COLOR.r
            attributes.color.array[3 * instanceId + 1] = HOVERED_COLOR.g
            attributes.color.array[3 * instanceId + 2] = HOVERED_COLOR.b
          }

          if (
            this.PAST_INTERSECTED.color &&
            this.selectedInstance.instanceId !==
              this.PAST_INTERSECTED.instanceId
          ) {
            this.resetIntersectedColor(this.PAST_INTERSECTED)
          }

          this.PAST_INTERSECTED.instanceId = instanceId
          this.PAST_INTERSECTED.color = { r, g, b }

          attributes.color.needsUpdate = true
        }
      } else if (
        this.PAST_INTERSECTED.instanceId &&
        this.selectedInstance.instanceId !== this.PAST_INTERSECTED.instanceId
      ) {
        this.resetIntersectedColor(this.PAST_INTERSECTED)
        this.PAST_INTERSECTED = {}
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
