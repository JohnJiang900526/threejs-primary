<template>
  <div class="webgl-page">
    <Page :title="title">
      <div ref="container" class="page-inner">
        <canvas ref="canvas1" class="canvas"></canvas>
        <canvas ref="canvas2" class="canvas"></canvas>
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount, computed } from "vue";
import { useRoute } from "vue-router";
import Page from "@/base/page/index.vue";
import { Model } from "./tools";

const route = useRoute();
const title = computed(() => {
  return route.meta.title as string;
});

let objModel: Model | null = null;
const container = ref<HTMLDivElement>(document.createElement("div"));
const canvas1 = ref<HTMLCanvasElement>(document.createElement("canvas"));
const canvas2 = ref<HTMLCanvasElement>(document.createElement("canvas"));

onMounted(() => {
  objModel = new Model(container.value, canvas1.value, canvas2.value);
  objModel?.init();
});

onBeforeUnmount(() => {
  objModel?.dispose();
  objModel = null;
});
</script>
<style lang='less'>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .webgl-page {
    .absolute-page();
    .page-inner {
      position: relative;
      .width-and-height();
      background-color: #000;
      display: flex !important;
      .canvas {
        flex: 1;
        width: 50%;
        height: 100%;
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
