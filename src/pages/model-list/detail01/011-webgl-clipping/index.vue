<script setup lang="ts">
  import { Icon, Popup, Checkbox, Slider } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-clipping-page">
    <Page title="webgl-clipping">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="Local Clipping">
            <div class="item-param">
              <Checkbox v-model="localEnabled" @change="localEnabledChange">Enabled</Checkbox>
            </div>
            <div class="item-param">
              <Checkbox v-model="localShadows" @change="localShadowsChange">Shadows</Checkbox>
            </div>
            <div class="item-param">Plane</div>
            <div class="item-param slider">
              <Slider 
                v-model="localPlane" :min="0.1" :max="1.25" :step="0.01" 
                @update:model-value="localPlaneChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>
          </Block>

          <Block title="Global Clipping">
            <div class="item-param">
              <Checkbox v-model="globalEnabled" @change="globalEnabledChange">Enabled</Checkbox>
            </div>
            <div class="item-param">Plane</div>
            <div class="item-param slider">
              <Slider 
                v-model="globalPlane" :min="-0.4" :max="3" :step="0.01" 
                @update:model-value="globalPlaneChange" bar-height="4px" active-color="#238bfe"></Slider>
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
      localEnabled: true,
      localShadows: true,
      localPlane: 0.8,
      globalEnabled: false,
      globalPlane: 0.1,
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
    // Enabled
    localEnabledChange(check: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setEnabled("local", check);
      }
    },
    globalEnabledChange(check: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setEnabled("global", check);
      }
    },

    // Shadows
    localShadowsChange (check: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setShadows("local", check);
      }
    },

    // Plane
    localPlaneChange(val: number) {
      if (objModel) {
        objModel.setPlane("local", val);
      }
    },
    globalPlaneChange(val: number) {
      if (objModel) {
        objModel.setPlane("global", val);
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

  .webgl-clipping-page {
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
