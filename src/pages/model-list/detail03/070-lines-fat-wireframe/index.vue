<script setup lang="ts">
  import { Icon, Popup, RadioGroup, Radio, Checkbox, Slider } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-lines-fat-wireframe-page">
    <Page title="webgl-lines-fat-wireframe">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="lineType">
            <radio-group v-model="lineType" @change="lineTypeChange">
              <div class="item-param">
                <radio :name="0">LineGeometry</radio>
              </div>
              <div class="item-param">
                <radio :name="1">gl.LINE</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="AlphaToCoverage & dashed">
            <div class="item-param">
              <Checkbox v-model="alphaToCoverage" @change="alphaToCoverageChange">AlphaToCoverage</Checkbox>
            </div>
            <div class="item-param">
              <Checkbox v-model="dashed" @change="dashedChange">Dashed</Checkbox>
            </div>
          </Block>

          <Block title="dash / gap">
            <radio-group v-model="dashGap" @change="dashGapChange">
              <div class="item-param">
                <radio :name="0">2 : 1</radio>
              </div>
              <div class="item-param">
                <radio :name="1">1 : 1</radio>
              </div>
              <div class="item-param">
                <radio :name="2">1 : 2</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="width & dash scale">
            <div class="item-param">width</div>
            <div class="item-param slider">
              <Slider 
                v-model="width" :min="1" :max="10" :step="0.01" 
                @change="widthChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>

            <div class="item-param">dash scale</div>
            <div class="item-param slider">
              <Slider 
                v-model="dashScale" :min="0.5" :max="1" :step="0.01" 
                @change="dashScaleChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <div style="height: 200px"></div>
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
      lineType: 0,
      alphaToCoverage: true,
      dashed: false,
      dashGap: 1,
      width: 1,
      dashScale: 1
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
    lineTypeChange(lineType: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setLineType(lineType);
      }
    },
    alphaToCoverageChange(val: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAlphaToCoverage(val);
      }
    },
    dashedChange(val: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setLineDashed(val);
      }
    },
    dashGapChange(val: 0 | 1 | 2) {
      if (objModel) {
        this.closeHandle();
        objModel.setDashGap(val);
      }
    },
    widthChange(val: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setLineWidth(val);
      }
    },
    dashScaleChange(val: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setDashScale(val);
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
    },
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

  .webgl-lines-fat-wireframe-page {
    .absolute-page();
    background-color: #111111;
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

      .color-block {
        width: 120px;
        height: 35px;
        border-radius: 3px;
        border: 1px solid #ddd;
      }
    }

    .color-content {
      display: flex;
      flex-direction: column;
      .color-content-body {
        flex: 1;
        padding: 20px 10px;
        box-sizing: border-box;
      }

      .color-content-footer {
        .top-line();
        height: 55px;
        text-align: center;
        padding: 10px 10px;
        box-sizing: border-box;
      }
    }
  }
</style>
