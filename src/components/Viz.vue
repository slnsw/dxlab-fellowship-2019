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
import { TrackballControls } from 'three/examples/jsm/controls/TrackballControls.js'
import SpriteText from 'three-spritetext'

import { FormatType } from '@/utils/types'

const FILE_Z = 10
const BUCKET_Z = 300
const TEXT_Z = 0.1 // relative
const MOVE_DURATION = 300
const TILE_PADDING = 1
const CAMERA_NEAR = 0.01
const CAMERA_FAR = 1000
const CAMERA_FOV = 60
const SCENE_PADDING = 1.5
const PARTICLE_SIZE = 100
const TEXT_SIZE = 10
const CAMERA_DIST = 10
const SELECTED_COLOR = new THREE.Color('rgb(255, 0, 0)')
const HOVERED_COLOR = new THREE.Color('rgb(0, 130, 41)')
const OTHER_COLOR = new THREE.Color('hsl(0, 100%, 30)')

export default {
  components: {},
  data() {
    return {
      renderer: null,
      camera: null,
      scene: null,
      bucketsMesh: null,
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
    formatsById() {
      const formats = this.formats
      const values = Object.values(formats)
      const result = {}
      values.forEach((val) => {
        result[val.id] = val.title
      })
      return result
    },
    ...mapGetters(['totalFromBuckets', 'bucketInfo']),
    ...mapState(['currentBucket', 'currentBucketId', 'itemsTotal', 'buckets'])
  },
  watch: {
    currentBucketId() {
      this.paintBuckets()
      this.moveCameraTo()
    }
  },
  mounted() {
    this.init()
    this.createControls()
    this.paintBuckets()
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
    createText(text, x, y, z, scale) {
      text = text ? text : '[undefined]'
      if (isNaN(text) && text.indexOf('|||') !== -1) text = text.split('|||')[1]
      const myText = new SpriteText(text)
      myText.fontFace = 'Aaux ProLight OSF'
      myText.textHeight = TEXT_SIZE * scale
      myText.position.set(x, y, z)
      myText.material.rotation = Math.PI / 8
      myText.center = new THREE.Vector2(0, 0)
      return myText
    },
    onDoubleClick() {
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        const { x, y, z, s } = this.getClickedGeometry()
        const obj = new THREE.Mesh(
          new THREE.PlaneGeometry(PARTICLE_SIZE * s.x, PARTICLE_SIZE * s.x)
        )
        obj.position.set(x, y, FILE_Z + CAMERA_DIST * s.x)
        this.selectedInstance = { ...this.PAST_INTERSECTED }
        this.moveCameraTo(obj)
      }
    },
    onClick() {
      if (this.PAST_INTERSECTED.instanceId !== undefined) {
        this.resetIntersectedColor(this.selectedInstance)
        this.setClickedColor()
        const { x, y, z, s } = this.getClickedGeometry()
        const obj = new THREE.Mesh(
          new THREE.PlaneGeometry(PARTICLE_SIZE * s.x, PARTICLE_SIZE * s.x)
        )
        obj.position.set(x, y, z + CAMERA_DIST * s.x)
        this.moveCameraTo(obj)
        this.selectedInstance = { ...this.PAST_INTERSECTED }
      } else {
        if (this.selectedInstance) {
          this.resetIntersectedColor(this.selectedInstance)
          this.selectedInstance = {}
        }
      }
    },
    getClickedGeometry() {
      const attributes = this.bucketsMesh.geometry.attributes
      const id = this.PAST_INTERSECTED.instanceId
      const x = attributes.customPosition.array[id * 3]
      const y = attributes.customPosition.array[id * 3 + 1]
      const z = attributes.customPosition.array[id * 3 + 2]
      const matrix = new THREE.Matrix4()
      this.bucketsMesh.getMatrixAt(id, matrix)
      const s = new THREE.Vector3()
      matrix.decompose(new THREE.Vector3(), new THREE.Quaternion(), s)
      return { x, y, z, s }
    },
    setClickedColor() {
      const attributes = this.bucketsMesh.geometry.attributes
      const id = this.PAST_INTERSECTED.instanceId
      attributes.color.array[id * 3] = SELECTED_COLOR.r
      attributes.color.array[id * 3 + 1] = SELECTED_COLOR.g
      attributes.color.array[id * 3 + 2] = SELECTED_COLOR.b
      attributes.color.needsUpdate = true
    },
    createControls() {
      this.controls = new TrackballControls(this.camera, this.$refs.three)
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
    paintBuckets() {
      this.cleanBuckets()

      const buckets = this.buckets

      const bucketCount = buckets.length

      const colors = new Float32Array(bucketCount * 3)
      const positions = new Float32Array(bucketCount * 3)

      const color = new THREE.Color()
      const position = new THREE.Vector3()
      const transform = new THREE.Object3D()

      let lastX = 0

      const material = new THREE.MeshBasicMaterial({ color: 0xffff00 })

      const geometry = new THREE.PlaneBufferGeometry(
        PARTICLE_SIZE,
        PARTICLE_SIZE
      )

      const bucketsMesh = new THREE.InstancedMesh(
        geometry,
        material,
        bucketCount
      )

      const textGroup = new THREE.Group()

      for (let i = 0, i3 = 0, l = bucketCount; i < l; i++, i3 += 3) {
        const b = buckets[i]
        const count = b.count
        const text = this.bucketInfo(b.id).name
        const pct = count / this.itemsTotal
        const scale = Math.sqrt(pct)
        const w = PARTICLE_SIZE * scale
        const x = lastX + w / 2
        lastX = x + w / 2 + TILE_PADDING
        const y = -w / 2
        const z = BUCKET_Z

        transform.position.set(x, y, z)
        transform.scale.set(scale, scale, scale)
        transform.updateMatrix()

        bucketsMesh.setMatrixAt(i, transform.matrix)

        position.set(x, y, z)
        position.toArray(positions, i * 3)
        color.setHSL(0.01 + 0.1 * (i / l), 1.0, 0.5)
        color.toArray(colors, i * 3)

        // text particles
        const textTop = y + w / 2 + TILE_PADDING * scale
        const textZ = BUCKET_Z + TEXT_Z * scale
        const labelStr = text
        const numberStr = count
        textGroup.add(
          this.createText(
            `${labelStr} (${new Intl.NumberFormat().format(numberStr)})`,
            x,
            textTop,
            textZ,
            scale
          )
        )
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

      this.bucketsMesh = bucketsMesh

      this.textGroup = textGroup

      this.scene.add(this.bucketsMesh)
      this.scene.add(this.textGroup)
    },
    cleanBuckets() {
      if (!this.bucketsMesh) return
      this.textGroup.children.forEach((t) => t.material.map.dispose())

      this.scene.remove(this.bucketsMesh)
      this.scene.remove(this.textGroup)

      this.bucketsMesh.material.dispose()
      this.bucketsMesh.geometry.dispose()
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
      camera.position.z = BUCKET_Z + 10
      camera.updateProjectionMatrix()
      return camera
    },
    moveCameraTo(obj) {
      let o

      if (!obj) {
        // centering on the current base bucket
        o = new THREE.Box3()
        const count = this.bucketsMesh.instanceMatrix.count
        for (let i = 0, i3 = 0, l = count; i < l; i++, i3 += 3) {
          const matrix = new THREE.Matrix4()
          this.bucketsMesh.getMatrixAt(i, matrix)
          const p = new THREE.Vector3()
          const s = new THREE.Vector3()
          matrix.decompose(p, new THREE.Quaternion(), s)
          const x = p.x
          const y = p.y
          const z = p.z
          const objBucket = new THREE.Mesh(
            new THREE.PlaneGeometry(PARTICLE_SIZE * s.x, PARTICLE_SIZE * s.x)
          )
          objBucket.position.set(x, y, z * s.x)
          o.expandByObject(objBucket)
        }
      } else {
        o = new THREE.Box3().setFromObject(obj)
      }

      const sphere = new THREE.Sphere()
      o.getBoundingSphere(sphere)
      const side = !obj
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
      const geometry = this.bucketsMesh.geometry
      const attributes = geometry.attributes
      attributes.color.array[3 * instance.instanceId] = instance.color.r
      attributes.color.array[3 * instance.instanceId + 1] = instance.color.g
      attributes.color.array[3 * instance.instanceId + 2] = instance.color.b
      attributes.color.needsUpdate = true
    },
    render() {
      if (this.bucketsMesh) {
        const geometry = this.bucketsMesh.geometry
        const attributes = geometry.attributes

        if (this.mouse) this.raycaster.setFromCamera(this.mouse, this.camera)

        const intersects = this.raycaster.intersectObject(this.bucketsMesh)

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
