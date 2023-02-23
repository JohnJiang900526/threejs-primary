<script setup lang="ts">
  import { Icon, Popup, Space, Button } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-lights-hemisphere-page">
    <Page title="webgl-lights-hemisphere">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="操作">
            <Space size="2rem" direction="vertical"> 
              <Button @click="hemisphereToggle" size="small" type="primary">hemisphereToggle</Button>
              <Button @click="directionalToggle" size="small" type="primary">directionalToggle</Button>
              <Button @click="allLightToggle" size="small" type="primary">allLightToggle</Button>
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
    hemisphereToggle() {
      if (objModel) {
        this.closeHandle();
        objModel.hemisphereToggle();
      }
    },
    directionalToggle() {
      if (objModel) {
        this.closeHandle();
        objModel.directionalToggle();
      }
    },
    allLightToggle() {
      if (objModel) {
        this.closeHandle();
        objModel.allLightToggle();
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

  .webgl-lights-hemisphere-page {
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
