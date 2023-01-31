<script setup lang="ts">
  import { Icon, Popup, Button, Space } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="skinning-blending-page">
    <Page title="skinning-blending">
      <div ref="container" class="key-frame-page-inner">
        <div class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="1. 显示操作">
            <Space size="2rem">  
              <Button @click="toggleShowModel" size="small" type="primary">显示/隐藏模型</Button>
              <Button @click="toggleShowSkeleton" size="small" type="primary">显示/隐藏骨架</Button>
            </Space>
          </Block>

          <Block title="2. 所有动画开启与关闭">
            <Space size="2rem">  
              <Button @click="deactivateAllActions" size="small" type="primary">所有停止动画</Button>
              <Button @click="activateAllActions" size="small" type="primary">所有启动动画</Button>
            </Space>
          </Block>

          <Block title="3. 模型的动作停止与启动">
            <Space size="2rem">
              <Button @click="togglePauseActions" size="small" type="primary">停止/启动</Button>
            </Space>
          </Block>

          <Block title="4. 模型的动作快慢">
            <Space size="2rem">
              <Button @click="walk" size="small" type="primary">正常动作</Button>
              <Button @click="slow" size="small" type="primary">慢跑动作</Button>
              <Button @click="run" size="small" type="primary">快跑动作</Button>
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
    toggleShowModel() {
      if (objModel) {
        objModel.toggleShowModel();
      }
    },
    toggleShowSkeleton() {
      if (objModel) {
        objModel.toggleShowSkeleton();
      }
    },
    activateAllActions() {
      if (objModel) {
        objModel.activateAllActions();
      }
    },
    deactivateAllActions() {
      if (objModel) {
        objModel.deactivateAllActions();
      }
    },
    togglePauseActions() {
      if (objModel) {
        objModel.togglePauseActions();
      }
    },
    slow() {
      if (objModel) {
        objModel.slow();
      }
    },
    walk () {
      if (objModel) {
        objModel.walk();
      }
    },
    run() {
      if (objModel) {
        objModel.run();
      }
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
    objModel = null;
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .skinning-blending-page {
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
