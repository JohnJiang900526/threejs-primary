<template>
  <div class="webgl-page">
    <Page title="256.WEBGL 后处理 像素">
      <div ref="container" class="page-inner">
      </div>
    </Page>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, onBeforeUnmount } from "vue";
import Page from "@/base/page/index.vue";
import { Model } from "./tools";

let objModel: Model | null = null;
const container = ref<HTMLDivElement>(document.createElement("div"));

onMounted(() => {
  objModel = new Model(container.value);
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
