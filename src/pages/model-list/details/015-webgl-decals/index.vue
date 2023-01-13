<script setup lang="ts">
  import { Icon, Popup, Checkbox, Slider, Button } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-decals-page">
    <Page title="webgl-decals">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="Controller">
            <div class="item-param">
              <Checkbox v-model="rotate" @change="rotateChange">rotate</Checkbox>
            </div>
            <div class="item-param">minScale</div>
            <div class="item-param slider">
              <Slider 
                v-model="minScale" :min="1" :max="30" :step="0.01" 
                @update:model-value="minScaleChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">maxScale</div>
            <div class="item-param slider">
              <Slider 
                v-model="maxScale" :min="1" :max="30" :step="0.01" 
                @update:model-value="maxScaleChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Button @click="clearHander" size="small" type="primary">清除油漆</Button>
            </div>
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
      rotate: true,
      minScale: 1,
      maxScale: 1,
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

    rotateChange(check: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setRotate(check);
      }
    },

    minScaleChange(val: number) {
      if (objModel) {
        objModel.setMinScale(val);
      }
    },

    maxScaleChange(val: number) {
      if (objModel) {
        objModel.setMaxScale(val);
      }
    },

    clearHander() {
      if (objModel) {
        this.closeHandle();
        objModel.clear();
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

  .webgl-decals-page {
    .absolute-page();
    background-color: #000;
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
