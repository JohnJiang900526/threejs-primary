<script setup lang="ts">
  import { Icon, Popup, Button, Space } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="skinning-morph-page">
    <Page title="skinning_morph">
      <div ref="container" class="key-frame-page-inner">
        <div class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="1. 状态">
            <Space size="1rem" wrap>  
              <Button @click="stateAction('Idle', 0.5)" size="small" type="primary">Idle</Button>
              <Button @click="stateAction('Walking', 0.5)" size="small" type="primary">Walking</Button>
              <Button @click="stateAction('Running', 0.5)" size="small" type="primary">Running</Button>
              <Button @click="stateAction('Dance', 0.5)" size="small" type="primary">Dance</Button>
              <Button @click="stateAction('Death', 0.5)" size="small" type="primary">Death</Button>
              <Button @click="stateAction('Sitting', 0.5)" size="small" type="primary">Sitting</Button>
              <Button @click="stateAction('Standing', 0.5)" size="small" type="primary">Standing</Button>
            </Space>
          </Block>

          <Block title="2. 表情动作">
            <Space size="1rem" wrap>  
              <Button @click="emoteAction('Jump', 0.5)" size="small" type="primary">Jump</Button>
              <Button @click="emoteAction('Yes', 0.5)" size="small" type="primary">Yes</Button>
              <Button @click="emoteAction('No', 0.5)" size="small" type="primary">No</Button>
              <Button @click="emoteAction('Wave', 0.5)" size="small" type="primary">Wave</Button>
              <Button @click="emoteAction('Punch', 0.5)" size="small" type="primary">Punch</Button>
              <Button @click="emoteAction('ThumbsUp', 0.5)" size="small" type="primary">ThumbsUp</Button>
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
    // 状态操作
    stateAction(key: string, duration: number) {
      if (objModel) {
        this.closeHandle();
        objModel.stateAction(key, duration);
      }
    },
    // 表情操作
    emoteAction(key: string, duration: number) {
      if (objModel) {
        this.closeHandle();
        objModel.emoteAction(key, duration);
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

  .skinning-morph-page {
    .absolute-page();
    background-color: #e0e0e0;
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
