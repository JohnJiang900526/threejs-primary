<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-shader-page">
    <Page title="webgl-shader">
      <div ref="container" class="key-frame-page-inner"></div>
    </Page>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Model } from "./tools";

let objModel: Model | null;
export default defineComponent({
  data() {
    return {
      show: false
    };
  },
  mounted() {
    this.render();
  },
  methods: {
    // 渲染入口
    render() {
      objModel = new Model(this.$refs.container as HTMLDivElement);

      setTimeout(() => {
        objModel?.init();
      }, 100);
    },
  },
  // 卸载前函数
  beforeUnmount() {
    objModel = null;
  }
});
</script>
<style lang='less'>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .webgl-shader-page {
    .absolute-page();
    background-color: #fff;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      .color-params {
        position: absolute;
        top: 10%;
        left: 50%;
        transform: translate(-50%, -50%);
        z-index: 100;
        color: #fff;
      }
      .lil-gui.root {
        max-height: 50%;
        max-width: 80%;
        position: absolute;
        top: auto;
        bottom: 0;
        left: 0;
        right: auto;
      }
    }
  }
</style>
