<template>
  <canvas ref="three" class="three"></canvas>
</template>

<script>
import * as THREE from 'three'
import { GUI } from 'three/examples/jsm/libs/dat.gui.module.js'
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'

const START_PARTICLES = 64
const CAMERA_FAR = 100000
const CAMERA_FOV = 60
const SPRITE_URL = process.env.BASE_URL + 'assets/medals.jpg'
const texture = new THREE.TextureLoader().load(SPRITE_URL)
texture.encoding = THREE.sRGBEncoding

const vShader = `
attribute vec2 offset;
attribute float size;

varying vec2 vOffset;

void main() {

    vOffset = offset;

    vec4 mvPosition = modelViewMatrix * vec4( position, 1.0 );
    gl_PointSize = 64.0;
    gl_PointSize = size * ( 256000.0 / -mvPosition.z );

    gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1.0 );

}
`

const fShader = `
uniform sampler2D texture;
uniform vec2 repeat;

varying vec2 vOffset;

void main() {

    vec2 uv = vec2( gl_PointCoord.x, 1.0 - gl_PointCoord.y );

    vec4 tex = texture2D( texture, uv * repeat + vOffset );

    if ( tex.a < 0.5 ) discard;

    gl_FragColor = tex;

}
`

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
      mouse: {},
      raycaster: null
    }
  },
  computed: {},
  mounted() {
    this.init()
    this.createControls()
    this.refreshParticles()
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
      this.renderer.setPixelRatio(window.devicePixelRatio)

      this.renderer.setSize(window.innerWidth, window.innerHeight)

      this.renderer.outputEncoding = THREE.sRGBEncoding
      this.renderer.gammaFactor = 2.2

      this.scene = new THREE.Scene()

      this.raycaster = new THREE.Raycaster()
      this.mouse = new THREE.Vector2(-1e10, -1e10)

      this.camera = this.createBaseCamera()
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)

      const gui = new GUI()

      gui
        .add(this.camera.position, 'x', 0, 100)
        .step(1)
        .listen()
      gui
        .add(this.camera.position, 'y', 0, 100)
        .step(1)
        .listen()
      gui
        .add(this.camera.position, 'z', 0, 1000)
        .step(1)
        .listen()
    },
    refreshParticles() {
      const particleCount = this.particleCount
      const geometry = new THREE.Geometry()
      const material = new THREE.MeshBasicMaterial({
        map: texture
      })

      // Identify the total number of cols & rows in the image atlas
      const atlas = { width: 256, height: 256, cols: 8, rows: 8 }

      // Identify the subimage size in px
      const tile = {
        width: atlas.width / atlas.cols,
        height: atlas.width / atlas.cols
      }

      let xini = -atlas.width / 2
      let yini = atlas.height / 2
      const tileSize = 1 / atlas.cols

      for (let i = 0; i < particleCount; i++) {
        // Create x, y, z coords for this subimage
        // inverted because the top-left is the first image but bottom left is the origin in webgl
        const coords = {
          x: xini + (i % atlas.cols) * tile.width,
          y: yini - Math.floor(i / atlas.rows) * tile.width,
          z: -400
        }

        geometry.vertices.push(
          new THREE.Vector3(coords.x, coords.y, coords.z),
          new THREE.Vector3(coords.x + tile.width, coords.y, coords.z),
          new THREE.Vector3(
            coords.x + tile.width,
            coords.y + tile.height,
            coords.z
          ),
          new THREE.Vector3(coords.x, coords.y + tile.height, coords.z)
        )

        // Add the first face (the lower-right triangle)
        const faceOne = new THREE.Face3(
          geometry.vertices.length - 4,
          geometry.vertices.length - 3,
          geometry.vertices.length - 2
        )

        // Add the second face (the upper-left triangle)
        const faceTwo = new THREE.Face3(
          geometry.vertices.length - 4,
          geometry.vertices.length - 2,
          geometry.vertices.length - 1
        )

        // Add those faces to the geometry
        geometry.faces.push(faceOne, faceTwo)

        // Identify this subimage's offset in the x dimension
        // An xOffset of 0 means the subimage starts flush with
        // the left-hand edge of the atlas
        const xOffset = (i % atlas.rows) * tileSize

        // Identify the subimage's offset in the y dimension
        // A yOffset of 0 means the subimage starts flush with
        // the top edge of the atlas
        const yOffset = (atlas.rows - 1 - Math.floor(i / atlas.rows)) * tileSize

        // Use the xOffset and yOffset (and the knowledge that
        // each row and column contains only 10 images) to specify
        // the regions of the current image
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(xOffset, yOffset),
          new THREE.Vector2(xOffset + tileSize, yOffset),
          new THREE.Vector2(xOffset + tileSize, yOffset + tileSize)
        ])

        // Map the region of the image described by the lower-left,
        // upper-right, and upper-left vertices to `faceTwo`
        geometry.faceVertexUvs[0].push([
          new THREE.Vector2(xOffset, yOffset),
          new THREE.Vector2(xOffset + tileSize, yOffset + tileSize),
          new THREE.Vector2(xOffset, yOffset + tileSize)
        ])
      }

      // Combine the image geometry and material into a mesh
      const mesh = new THREE.Mesh(geometry, material)

      // Set the position of the image mesh in the x,y,z dimensions
      mesh.position.set(0, 0, 0)

      // Add the image to the scene
      this.scene.add(mesh)

      // point cloud version

      // geometry
      const pgeometry = new THREE.BufferGeometry()

      // attributes
      const positions = new Float32Array(particleCount * 3) // 3 coordinates per point
      const offsets = new Float32Array(particleCount * 2) // 2 coordinates per point
      const sizes = new Float32Array(particleCount)

      // populate offsets
      const offset = new THREE.Vector2()
      const position = new THREE.Vector3()

      xini = 0
      yini = atlas.height / 2 + tile.width / 2

      for (let i = 0, index = 0, l = particleCount; i < l; i++, index += 2) {
        offset.set(
          (i % atlas.rows) * tileSize,
          (atlas.rows - 1 - Math.floor(i / atlas.rows)) * tileSize
        )

        const x = xini + (i % atlas.cols) * tile.width
        const y = yini - Math.floor(i / atlas.rows) * tile.width
        const z = -400

        position.set(x, y, z)
        position.toArray(positions, i * 3)

        sizes[i] = tileSize

        offsets[index] = offset.x
        offsets[index + 1] = offset.y
      }

      pgeometry.setAttribute(
        'position',
        new THREE.BufferAttribute(positions, 3)
      )
      pgeometry.setAttribute('offset', new THREE.BufferAttribute(offsets, 2))
      pgeometry.setAttribute('size', new THREE.BufferAttribute(sizes, 1))
      // uniforms
      const uniforms = {
        texture: { value: texture },
        repeat: { value: new THREE.Vector2(tileSize, tileSize) }
      }

      // material
      const pmaterial = new THREE.ShaderMaterial({
        uniforms,
        vertexShader: vShader,
        fragmentShader: fShader,
        transparent: true
      })

      // point cloud
      const pointCloud = new THREE.Points(pgeometry, pmaterial)
      pointCloud.position.set(atlas.width, 0, 0)

      this.scene.add(pointCloud)
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
    animate() {
      requestAnimationFrame(this.animate)
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
    render() {
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
