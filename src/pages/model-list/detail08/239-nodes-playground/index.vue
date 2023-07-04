<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-nodes-playground-page">
    <Page title="webgl-nodes-playground">
      <div ref="container" class="key-frame-page-inner">
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
      objModel = new Model(this.$refs.container as HTMLDivElement);
      objModel.init();
    },
  },
  // 卸载前函数
  beforeUnmount() {
    objModel?.dispose();
    objModel = null;
  }
});
</script>
<style lang='less'>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";
  @import "@/common/examples/fonts/open-sans/open-sans.css";
  @import "@/common/examples/fonts/tabler-icons/tabler-icons.min.css";

  .webgl-nodes-playground-page {
    .absolute-page();
    background-color: #333;
    .key-frame-page-inner {
      position: absolute;
      left: 0;
      top: 0;
      .width-and-height();
      position: relative;
      flow {
				position: absolute;
				top: 0;
				left: 0;
				height: 100%;
				width: 100%;
				box-shadow: inset 0 0 20px 0px #000000;
				pointer-events: none;
        f-canvas {
          pointer-events: auto;
          &:not(.focusing) {
            background: #191919ed;
          }
        }
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
