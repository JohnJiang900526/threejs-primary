<script setup lang="ts">
  import { Icon, Popup, Button, Space } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="skinning-additive-blending-page">
    <Page title="skinning-additive-blending">
      <div ref="container" class="key-frame-page-inner">
        <div class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="1. 基础操作">
            <Space size="2rem">  
              <Button @click="stateActive('None')" size="small" type="primary">None</Button>
              <Button @click="stateActive('idle')" size="small" type="primary">idle</Button>
              <Button @click="stateActive('walk')" size="small" type="primary">walk</Button>
              <Button @click="stateActive('run')" size="small" type="primary">run</Button>
            </Space>
          </Block>

          <Block title="2. 动作操作">
            <Space size="2rem">  
              <Button @click="controlScale('normal')" size="small" type="primary">normal</Button>
              <Button @click="controlScale('slow')" size="small" type="primary">slow</Button>
              <Button @click="controlScale('fast')" size="small" type="primary">fast</Button>
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
      show: false
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
    stateActive(key: string) {
      if (objModel) {
        this.closeHandle();
        objModel.stateActive(key);
      }
    },
    controlScale(type: "slow" | "fast" | "normal") {
      this.closeHandle();
      if (objModel) {objModel.controlScale(type)}
    },
    // 打开设置面板
    openHandle() {
      this.show = true;
    },
    // 关闭
    closeHandle() {
      this.show = false;
    }
  },
  // 卸载前函数
  beforeUnmount() {
    
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .skinning-additive-blending-page {
    .absolute-page();
    background-color: #a0a0a0;
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
    }
  }
</style>
