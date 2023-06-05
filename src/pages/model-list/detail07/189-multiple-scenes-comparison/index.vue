<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-multiple-scenes-comparison-page">
    <Page title="webgl-multiple-scenes-comparison">
      <div ref="container" class="key-frame-page-inner">
        <div id="slider" class="slider"></div>
      </div>
    </Page>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Model } from "./tools";

let objModel: Model | null;
export default defineComponent({
  mounted() {
    this.render();
  },
  methods: {
    // 渲染入口
    render() {
      objModel = new Model(this.$refs.container as HTMLDivElement);
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

  .webgl-multiple-scenes-comparison-page {
    .absolute-page();
    background-color: #fff;
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      .slider {
				position: absolute;
				cursor: ew-resize;

				width: 40px;
				height: 40px;
				background-color: #F32196;
				opacity: 0.7;
				border-radius: 50%;

				top: calc(50% - 20px);
				left: calc(50% - 20px);
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
