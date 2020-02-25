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
const PARTICLE_SIZE = 1
const SELECTED_SCALE = 1.5
const SELECTED_COLOR = new THREE.Color(0, 130, 41)

const vshader = `
			attribute float size;
			attribute vec3 customColor;

			varying vec3 vColor;

			void main() {

				vColor = customColor;

				vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );

				gl_PointSize = size * ( 300.0 / -mvPosition.z );

				gl_Position = projectionMatrix * mvPosition;

      }`

const fshader = `
			uniform vec3 color;
			uniform sampler2D pointTexture;

			varying vec3 vColor;

			void main() {

				gl_FragColor = vec4( color * vColor, 1.0 );

				gl_FragColor = gl_FragColor * texture2D( pointTexture, gl_PointCoord );

				if ( gl_FragColor.a < ALPHATEST ) discard;

      }`

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
    this.refreshParticles()
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
      this.mouse = new THREE.Vector2()

      this.camera = this.createBaseCamera()
      this.createControls()
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
        .add(this.camera, 'zoom', 0, 10)
        .step(0.001)
        .listen()
    },
    resetControls() {
      this.controls.rotateSpeed = 1.0
      this.controls.zoomSpeed = 10
      this.controls.panSpeed = 10
      this.controls.mouseButtons.LEFT = THREE.MOUSE.PAN
      this.controls.mouseButtons.RIGHT = THREE.MOUSE.ROTATE
      this.controls.maxDistance = 1
      this.controls.minDistance = 0.009
      this.controls.noRotate = true
    },
    refreshParticles() {
      this.cleanParticles()

      const texture = new THREE.TextureLoader().load('/square.png')

      const particleCount = this.particleCount

      const side = Math.floor(Math.sqrt(particleCount))

      const positions = new Float32Array(particleCount * 3)
      const colors = new Float32Array(particleCount * 3)
      const sizes = new Float32Array(particleCount)

      let vertex
      const color = new THREE.Color()

      for (let i = 0, i3 = 0, l = particleCount; i < l; i++, i3 += 3) {
        const x = (i % side) * (1 + TILE_PADDING) - side * 0.5
        const y = Math.floor(i / side) * -(1 + TILE_PADDING) + side * 0.5
        const z = 0
        vertex = new THREE.Vector3(x, y, z)
        vertex.toArray(positions, i * 3)

        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)

        sizes[i] = PARTICLE_SIZE
      }

      const geometry = new THREE.BufferGeometry()
      geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
      geometry.setAttribute('customColor', new THREE.BufferAttribute(colors, 3))
      geometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))

      const material = new THREE.ShaderMaterial({
        uniforms: {
          color: { value: new THREE.Color(0xffffff) },
          pointTexture: {
            value: texture
          }
        },
        vertexShader: vshader,
        fragmentShader: fshader,

        alphaTest: 0.9
      })

      this.particles = new THREE.Points(geometry, material)

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
      const camera = new THREE.OrthographicCamera(
        (CAMERA_FRUSTUM * aspect) / -2,
        (CAMERA_FRUSTUM * aspect) / 2,
        CAMERA_FRUSTUM / 2,
        CAMERA_FRUSTUM / -2
      )
      camera.position.z = 10
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
      const t = Date.now() - this.cameraMoveStart

      const fromZoom = this.lastCamera.zoom
      const toZoom = this.zoom - fromZoom

      const toCamera = this.createBaseCamera()

      const zoom = this.easeInOutQuad(t, fromZoom, toZoom, MOVE_DURATION)

      toCamera.zoom = zoom

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

      const geometry = this.particles.geometry
      const attributes = geometry.attributes

      this.raycaster.setFromCamera(this.mouse, this.camera)

      const intersects = this.raycaster.intersectObject(this.particles)

      const normalSize = PARTICLE_SIZE
      const selectedSize = PARTICLE_SIZE * SELECTED_SCALE

      if (intersects.length > 0) {
        const index = intersects[0].index
        if (this.INTERSECTED.index != index) {
          attributes.size.array[this.INTERSECTED.index] = normalSize
          attributes.position.array[3 * this.INTERSECTED.index + 2] = 0
          if (this.INTERSECTED.color) {
            attributes.customColor.array[
              3 * this.INTERSECTED.index
            ] = this.INTERSECTED.color.r
            attributes.customColor.array[
              3 * this.INTERSECTED.index + 1
            ] = this.INTERSECTED.color.g
            attributes.customColor.array[
              3 * this.INTERSECTED.index + 2
            ] = this.INTERSECTED.color.b
          }
          const r = attributes.customColor.array[3 * index]
          const g = attributes.customColor.array[3 * index + 1]
          const b = attributes.customColor.array[3 * index + 2]

          this.INTERSECTED.index = index
          this.INTERSECTED.color = { r, g, b }

          attributes.size.array[index] = selectedSize
          attributes.customColor.array[3 * index] = SELECTED_COLOR.r
          attributes.customColor.array[3 * index + 1] = SELECTED_COLOR.g
          attributes.customColor.array[3 * index + 2] = SELECTED_COLOR.b
          attributes.position.array[3 * index + 2] = 1

          attributes.size.needsUpdate = true
          attributes.customColor.needsUpdate = true
          attributes.position.needsUpdate = true
        }
      } else if (this.INTERSECTED.index) {
        attributes.size.array[this.INTERSECTED.index] = normalSize
        attributes.customColor.array[
          3 * this.INTERSECTED.index
        ] = this.INTERSECTED.color.r
        attributes.customColor.array[
          3 * this.INTERSECTED.index + 1
        ] = this.INTERSECTED.color.g
        attributes.customColor.array[
          3 * this.INTERSECTED.index + 2
        ] = this.INTERSECTED.color.b
        attributes.position.array[3 * this.INTERSECTED.index + 2] = 0
        attributes.size.needsUpdate = true
        attributes.customColor.needsUpdate = true
        attributes.position.needsUpdate = true
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
