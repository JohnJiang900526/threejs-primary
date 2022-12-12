<template>
  <div class="block-module">
    <div class="block-title">
      {{ title }}
    </div>
    <div class="block-body">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  props: {
    title: {
      type: String,
      default: ""
    }
  }
});

</script>
<style lang='less' scoped>
.block-module {
  width: 100%;
  .block-title {
    padding: 10px;
    font-size: 16px;
    color: #666;
  }
  .block-body {
    padding: 10px 15px;
    box-sizing: border-box;
  }
}
</style>