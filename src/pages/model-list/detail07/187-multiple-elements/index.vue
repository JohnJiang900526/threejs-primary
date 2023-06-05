<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-multiple-elements-page">
    <Page title="webgl-multiple-elements">
      <canvas id="c"></canvas>
      <div ref="container" class="key-frame-page-inner"></div>
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

  .webgl-multiple-elements-page {
    .absolute-page();
    background-color: #fff;
    #c {
      position: absolute;
      left: 0;
      width: 100%;
      height: 100%;
    }
    .key-frame-page-inner {
      position: relative;
      .width-and-height();
      top: 0; 
      width: 100%;
      z-index: 1;
      padding: 3em 0 0 0;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      .list-item {
				display: inline-block;
				margin: 1em;
				padding: 1em;
				box-shadow: 1px 2px 4px 0px rgba(0,0,0,0.25);
			}

			.list-item > div:nth-child(1) {
				width: 200px;
				height: 200px;
			}

			.list-item > div:nth-child(2) {
				color: #888;
				font-family: sans-serif;
				font-size: large;
				width: 200px;
				margin-top: 0.5em;
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
