<script setup lang="ts">
  import { Icon, Popup, RadioGroup, Radio} from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="depth-texture-page">
    <Page title="depth-texture">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="Format">
            <radio-group v-model="format" @change="formatChange">
              <div class="item-param">
                <radio name="DepthFormat">DepthFormat</radio>
              </div>

              <div class="item-param">
                <radio name="DepthStencilFormat">DepthStencilFormat</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="Type">
            <radio-group v-model="type" @change="typeChange">
              <div class="item-param">
                <radio name="UnsignedShortType">UnsignedShortType</radio>
              </div>

              <div class="item-param">
                <radio name="UnsignedIntType">UnsignedIntType</radio>
              </div>

              <div class="item-param">
                <radio name="UnsignedInt248Type">UnsignedInt248Type</radio>
              </div>

            </radio-group>
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
      format: "DepthFormat",
      type: "UnsignedShortType",
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

    formatChange(val: "DepthFormat" | "DepthStencilFormat") {
      if (objModel) {
        this.closeHandle();
        objModel.setFormat(val);
      }
    },
    typeChange(val: "UnsignedShortType" | "UnsignedIntType" | "UnsignedInt248Type") {
      if (objModel) {
        this.closeHandle();
        objModel.setTypes(val);
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

  .depth-texture-page {
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
