<script setup lang="ts">
  import { Icon } from 'vant';
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="webgl-materials-texture-filters-page">
    <Page title="webgl-materials-texture-filters">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="false" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>

        <div class="left-label">anisotropy: {{ anisotropy1 }}</div>
        <div class="right-label">anisotropy: {{ anisotropy2 }}</div>
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
      anisotropy1: 0,
      anisotropy2: 0,
    };
  },
  mounted() {
    this.render();
  },
  methods: {
    // 渲染入口
    render() {
      objModel = new Model(this.$refs.container as HTMLDivElement);
      objModel.init((anisotropy1, anisotropy2) => {
        this.anisotropy1 = anisotropy1;
        this.anisotropy2 = anisotropy2;
      });
    },
    
    // 打开设置面板
    openHandle(e: MouseEvent) {
      e.preventDefault();
      e.stopPropagation();
      
      this.show = true;
    },
    // 关闭
    closeHandle() {
      this.show = false;
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

  .webgl-materials-texture-filters-page {
    .absolute-page();
    background-color: #fff;
    .selection {
      position: absolute;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 100%;
      width: 100%;
      top: 45px;
      z-index: 999;
      .box {
        height: 100px;
				width: 100px;
				border: 1px solid white;
        margin-top: -45px;
      }
    }
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

      .left-label {
        position: absolute;
        left: 20px;
        bottom: 50px;
        z-index: 100;
        color: #333;
        font-size: 25px;
      }

      .right-label {
        position: absolute;
        right:20px;
        bottom: 50px;
        z-index: 100;
        color: #333;
        font-size: 25px;
      }
    }
  }
</style>
