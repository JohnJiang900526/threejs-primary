<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-multiple-canvases-complex-page">
    <Page title="webgl-multiple-canvases-complex">
      <div ref="container" class="key-frame-page-inner">
        <div class="canvas-warp">  
          <canvas ref="canvas1" class="canvas1 ring r1"></canvas>
          <canvas ref="canvas2" class="canvas2 ring r2"></canvas>
          <canvas ref="canvas3" class="canvas3 ring r3"></canvas>
        </div>
      </div>
    </Page>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Model } from "./tools";

interface ICanvasParams {
  code: String, 
  canvas: HTMLCanvasElement,
  viewX: number, 
  viewY: number,
}

let objModel: Model | null;
export default defineComponent({
  mounted() {
    this.render();
  },
  methods: {
    // 渲染入口
    render() {
      const canvas: ICanvasParams[] = [
        {
          code: "canvas1",
          canvas: this.$refs.canvas1 as HTMLCanvasElement,
          viewX: 0, 
          viewY: 0,
        },
        {
          code: "canvas2",
          canvas: this.$refs.canvas2 as HTMLCanvasElement,
          viewX: 150, 
          viewY: 200,
        },
        {
          code: "canvas3",
          canvas: this.$refs.canvas3 as HTMLCanvasElement,
          viewX: 75, 
          viewY: 300,
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

  .webgl-multiple-canvases-complex-page {
    .absolute-page();
    background-color: #555;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      .canvas-warp {
        position: absolute;
        .positionCenter();
        width: 100%;
        height: auto;
        canvas {
          position: relative;
          display: block;
          outline: 1px solid red;
          &.canvas1 {
            width: 300px;
            height: 200px;
          }
          &.canvas2 {
            width: 400px;
            height: 100px;
            left: 150px;
          }
          &.canvas3 {
            width: 200px;
            height: 300px;
            left: 75px;
          }
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
