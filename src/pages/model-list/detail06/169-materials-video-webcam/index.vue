<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-materials-video-webcam-page">
    <Page title="webgl-materials-video-webcam">
      <div ref="container" class="key-frame-page-inner">
      </div>
      <video ref="video" style="display:none" autoplay playsinline></video>
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
      show: false,
    };
  },
  mounted() {
    this.render();
  },
  methods: {
    // 渲染入口
    render() {
      objModel = new Model(this.$refs.container as HTMLDivElement, this.$refs.video as HTMLVideoElement);
      objModel.init();
    },
    closeVideo() {
      const video = this.$refs.video as HTMLVideoElement;
      const stream = video.srcObject as MediaStream;

      video.pause();
      // 关闭网络摄像头
      stream.getTracks().forEach((item) => {
        item.stop();
      });
    }
  },
  // 卸载前函数
  beforeUnmount() {
    objModel = null;
    this.closeVideo();
  }
});
</script>
<style lang='less'>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .webgl-materials-video-webcam-page {
    .absolute-page();
    background-color: #000;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      .actions {
        padding: 10px;
        box-sizing: border-box;
        position: absolute;
        right: 20px;
        top: 20px;
        z-index: 1000;
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
      .drawing-canvas {
        position: absolute;
				background-color: #000000;
				top: 0px;
				right: 0px;
				z-index: 3000;
				cursor: crosshair;
				touch-action: none;
      }
    }
  }
</style>
