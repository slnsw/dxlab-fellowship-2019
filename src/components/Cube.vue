<template>
  <object3d v-bind="$attrs">
    <mesh name="Cube">
      <geometry type="Box" :args="[size, size, size]"></geometry>
      <material type="MeshBasic">
        <texture
          :url="
            `https://raw.githubusercontent.com/fritx/vue-threejs/chore/vuecli3/public/static/textures/${texture}.png`
          "
        ></texture>
      </material>
    </mesh>
  </object3d>
</template>

<script>
export default { props: { size: Number, texture: String } }
</script>

<style lang="scss" scoped></style>
