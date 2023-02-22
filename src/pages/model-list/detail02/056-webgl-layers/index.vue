<script setup lang="ts">
  import { Icon, Popup, Space, Button } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-layers-page">
    <Page title="webgl-layers">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#666"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="操作">
            <Space size="2rem" wrap>
              <Button @click="toggleRed" size="small" type="primary">toggle red</Button>
              <Button @click="toggleGreen" size="small" type="primary">toggle green</Button>
              <Button @click="toggleBlue" size="small" type="primary">toggle blue</Button>
              <Button @click="enableAll" size="small" type="primary">enable all</Button>
              <Button @click="disableAll" size="small" type="primary">disable all</Button>
            </Space>
          </Block>
        </div>
      </Page>
    </Popup>
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
    toggleRed() {
      if (objModel) {
        this.closeHandle();
        objModel.toggleRed();
      }
    },
    toggleGreen() {
      if (objModel) {
        this.closeHandle();
        objModel.toggleGreen();
      }
    },
    toggleBlue() {
      if (objModel) {
        this.closeHandle();
        objModel.toggleBlue();
      }
    },
    enableAll() {
      if (objModel) {
        this.closeHandle();
        objModel.enableAll();
      }
    },
    disableAll() {
      if (objModel) {
        this.closeHandle();
        objModel.disableAll();
      }
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
    }
  },
  // 卸载前函数
  beforeUnmount() {
    objModel = null;
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .webgl-layers-page {
    .absolute-page();
    background-color: #f0f0f0;
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
    }

    .settings-content {
      .width-and-height();
      overflow-x: hidden;
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
      .item-param {
        box-sizing: border-box;
        padding: 10px;
        &.slider {
          padding: 15px 20px;
        }
      }
    }
  }
</style>
