<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-multiple-canvases-grid-page">
    <Page title="webgl-multiple-canvases-grid">
      <div ref="container" class="key-frame-page-inner">
        <div class="canvas-warp">  
          <div class="canvas-row">
						<canvas ref="canvas1"></canvas>
						<canvas ref="canvas2"></canvas>
					</div>
					<div class="canvas-row">
						<canvas ref="canvas3"></canvas>
						<canvas ref="canvas4"></canvas>
					</div>
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
      const canvas1 = this.$refs.canvas1 as HTMLCanvasElement;
      const canvas2 = this.$refs.canvas2 as HTMLCanvasElement;
      const canvas3 = this.$refs.canvas3 as HTMLCanvasElement;
      const canvas4 = this.$refs.canvas4 as HTMLCanvasElement;

      const canvas: ICanvasParams[] = [
        {
          code: "canvas1",
          canvas: canvas1,
          viewX: canvas1.clientWidth * 0, 
          viewY: canvas1.clientHeight * 0,
        },
        {
          code: "canvas2",
          canvas: canvas2,
          viewX: canvas2.clientWidth * 1, 
          viewY: canvas2.clientHeight * 0,
        },
        {
          code: "canvas3",
          canvas: canvas3,
          viewX: canvas3.clientWidth * 0, 
          viewY: canvas3.clientHeight * 1,
        },
        {
          code: "canvas4",
          canvas: canvas4,
          viewX: canvas4.clientWidth * 1, 
          viewY: canvas4.clientHeight * 1,
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

  .webgl-multiple-canvases-grid-page {
    .absolute-page();
    background-color: #555;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      .canvas-warp {
        width: 100%;
        .positionCenter();
        .canvas-row {
          width: 100%;
          display: flex;
          canvas {
            flex: 1;
            position: relative;
            float: left;
            width: 50%;
            height: 200px;
            outline: 1px solid red;
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
