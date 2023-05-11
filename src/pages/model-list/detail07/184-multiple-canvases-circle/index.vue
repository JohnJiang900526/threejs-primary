<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-multiple-canvases-circle-page">
    <Page title="webgl-multiple-canvases-circle">
      <div ref="container" class="key-frame-page-inner">
        <div class="stage">
          <div class="shape ring backfaces">
            <canvas ref="canvas1" class="ring r1"></canvas>
            <canvas ref="canvas2" class="ring r2"></canvas>
            <canvas ref="canvas3" class="ring r3"></canvas>
            <canvas ref="canvas4" class="ring r4"></canvas>
            <canvas ref="canvas5" class="ring r5"></canvas>
          </div>
        </div>
      </div>
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
      const canvas: {code: String, canvas: HTMLCanvasElement}[] = [
        {
          code: "canvas1",
          canvas: this.$refs.canvas1 as HTMLCanvasElement,
        },
        {
          code: "canvas2",
          canvas: this.$refs.canvas2 as HTMLCanvasElement,
        },
        {
          code: "canvas3",
          canvas: this.$refs.canvas3 as HTMLCanvasElement,
        },
        {
          code: "canvas4",
          canvas: this.$refs.canvas4 as HTMLCanvasElement,
        },
        {
          code: "canvas5",
          canvas: this.$refs.canvas5 as HTMLCanvasElement,
        },
      ];
      objModel = new Model(this.$refs.container as HTMLDivElement, canvas);
      objModel.init();
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

  .webgl-multiple-canvases-circle-page {
    .absolute-page();
    background-color: #555;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      perspective: 800px;
			perspective-origin: 50% 225px;
      .stage {
        width: 100%;
        height: 100%;
        transform-style: preserve-3d;
        .shape {
          position: relative !important;
          top: 35%;
          margin: 0 auto;
          width: 200px;
          height: 200px;
          transform: translate(-50%, -50%, -0px);
          transform-style: preserve-3d;
        }
        .ring {
          position: absolute;
          display: block;
          width: 200px;
          height: 300px;
          text-align: center;
          font-family: Times, serif;
          font-size: 124pt;
          color: black;
          background-color: #fff;
          .r1 {
            transform: rotateY(300deg) translateZ(-380px);
          }
          .r2 {
            transform: rotateY(330deg) translateZ(-380px);
          }
          .r3 {
            transform: rotateY(0deg) translateZ(-380px);
          }
          .r4 {
            transform: rotateY(30deg) translateZ(-380px);
          }
          .r5 {
            transform: rotateY(60deg) translateZ(-380px);
          }
        }
        .shape {
          border: 0px;
          background-color: rgba(255, 255, 255, 0);
        }
      }
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
    }
  }
</style>
