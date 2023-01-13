<script setup lang="ts">
  import { Icon, Popup, Checkbox, Slider } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="clipping-stencil-page">
    <Page title="clipping-stencil">
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
              <Checkbox v-model="animate" @change="animateChange">animate</Checkbox>
            </div>
          </Block>

          <Block title="PlaneX">
            <div class="item-param">
              <Checkbox v-model="displayHelperX" @change="(v) => {displayHelperChange('planeX', v)}">displayHelper</Checkbox>
            </div>
            <div class="item-param">Constant</div>
            <div class="item-param slider">
              <Slider 
                v-model="constantX" :min="-1" :max="1" :step="0.01" 
                @update:model-value="(v) => {constantChange('planeX', v)}" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Checkbox v-model="negatedX" @change="(v) => negatedChange('planeX', v)">negated</Checkbox>
            </div>
          </Block>

          <Block title="PlaneY">
            <div class="item-param">
              <Checkbox v-model="displayHelperY" @change="(v) => {displayHelperChange('planeY', v)}">displayHelper</Checkbox>
            </div>
            <div class="item-param">Constant</div>
            <div class="item-param slider">
              <Slider 
                v-model="constantY" :min="-1" :max="1" :step="0.01" 
                @update:model-value="(v) => {constantChange('planeY', v)}" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Checkbox v-model="negatedY" @change="(v) => {negatedChange('planeY', v)}">negated</Checkbox>
            </div>
          </Block>

          <Block title="PlaneZ">
            <div class="item-param">
              <Checkbox v-model="displayHelperZ" @change="(v) => {displayHelperChange('planeZ', v)}">displayHelper</Checkbox>
            </div>
            <div class="item-param">Constant</div>
            <div class="item-param slider">
              <Slider 
                v-model="constantZ" :min="-1" :max="1" :step="0.01" 
                @update:model-value="(v) => {constantChange('planeZ', v)}" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Checkbox v-model="negatedZ" @change="(v) => {negatedChange('planeZ', v)}">negated</Checkbox>
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
      animate: true,
      displayHelperX: false,
      constantX: 0,
      negatedX: false,

      displayHelperY: false,
      constantY: 0,
      negatedY: false,

      displayHelperZ: false,
      constantZ: 0,
      negatedZ: false,
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
    // animate
    animateChange(isCheck: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAnimate(isCheck);
      }
    },
    // displayHelper
    displayHelperChange(type: "planeX" | "planeY" | "planeZ", isCheck: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setDisplayHelper(type, isCheck);
      }
    },
    // Constant
    constantChange(type: "planeX" | "planeY" | "planeZ", val: number) {
      if (objModel) {
        objModel.setConstant(type, val);
      }
    },
    // negated
    negatedChange(type: "planeX" | "planeY" | "planeZ", isCheck: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setNegated(type, isCheck);
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

  .clipping-stencil-page {
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
