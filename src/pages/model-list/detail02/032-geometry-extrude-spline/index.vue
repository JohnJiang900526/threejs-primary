<script setup lang="ts">
  import { Icon, Popup, RadioGroup, Radio, Checkbox, Slider} from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="geometry-extrude-spline-page">
    <Page title="geometry-extrude-spline">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#333"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="Spline">
            <radio-group v-model="spline" @change="splineChange">
              <div class="item-param">
                <radio name="GrannyKnot">GrannyKnot</radio>
              </div>
              <div class="item-param">
                <radio name="HeartCurve">HeartCurve</radio>
              </div>
              <div class="item-param">
                <radio name="VivianiCurve">VivianiCurve</radio>
              </div>
              <div class="item-param">
                <radio name="HelixCurve">HelixCurve</radio>
              </div>
              <div class="item-param">
                <radio name="TrefoilKnot">TrefoilKnot</radio>
              </div>
              <div class="item-param">
                <radio name="TorusKnot">TorusKnot</radio>
              </div>
              <div class="item-param">
                <radio name="CinquefoilKnot">CinquefoilKnot</radio>
              </div>
              <div class="item-param">
                <radio name="TrefoilPolynomialKnot">TrefoilPolynomialKnot</radio>
              </div>
              <div class="item-param">
                <radio name="FigureEightPolynomialKnot">FigureEightPolynomialKnot</radio>
              </div>
              <div class="item-param">
                <radio name="DecoratedTorusKnot4a">DecoratedTorusKnot4a</radio>
              </div>
              <div class="item-param">
                <radio name="DecoratedTorusKnot4b">DecoratedTorusKnot4b</radio>
              </div>
              <div class="item-param">
                <radio name="DecoratedTorusKnot5a">DecoratedTorusKnot5a</radio>
              </div>
              <div class="item-param">
                <radio name="DecoratedTorusKnot5c">DecoratedTorusKnot5c</radio>
              </div>
              <div class="item-param">
                <radio name="PipeSpline">PipeSpline</radio>
              </div>
              <div class="item-param">
                <radio name="SampleClosedSpline">SampleClosedSpline</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="Geometry">
            <div class="item-param">Scale</div>
            <div class="item-param slider">
              <Slider 
                v-model="scale" :min="2" :max="10" :step="2" 
                @update:model-value="scaleChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">ExtrusionSegments</div>
            <div class="item-param slider">
              <Slider 
                v-model="extrusionSegments" :min="50" :max="500" :step="50" 
                @update:model-value="extrusionSegmentsChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">RadiusSegments</div>
            <div class="item-param slider">
              <Slider 
                v-model="radiusSegments" :min="2" :max="12" :step="1" 
                @update:model-value="radiusSegmentsChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Checkbox v-model="closed" @change="closedChange">Closed</Checkbox>
            </div>

          </Block>

          <Block title="Camera">
            <div class="item-param">
              <Checkbox v-model="animationView" @change="animationViewChange">AnimationView</Checkbox>
            </div>
            <div class="item-param">
              <Checkbox v-model="lookAhead" @change="lookAheadChange">LookAhead</Checkbox>
            </div>
            <div class="item-param">
              <Checkbox v-model="cameraHelper" @change="cameraHelperChange">CameraHelper</Checkbox>
            </div>
          </Block>

          <div class="item-param" :style="{'height': '100px'}"></div>

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
      spline: "GrannyKnot",
      scale: 2,
      extrusionSegments: 50,
      radiusSegments: 3,
      closed: true,
      animationView: false,
      lookAhead: false,
      cameraHelper: false,
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
    // spline设置
    splineChange(spline: string) {
      if (objModel) {
        this.closeHandle();
        objModel.addTube({spline});
      }
    },
    scaleChange(scale: number) {
      if (objModel) {
        objModel.setScale({scale});
      }
    },
    extrusionSegmentsChange (extrusionSegments: number) {
      if (objModel) {
        objModel.addTube({extrusionSegments});
      }
    },
    radiusSegmentsChange (radiusSegments: number) {
      if (objModel) {
        objModel.addTube({radiusSegments});
      }
    },
    closedChange(closed: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.addTube({closed});
      }
    },
    animationViewChange(animationView: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.animateCamera({animationView});
      }
    },
    lookAheadChange(lookAhead: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.animateCamera({lookAhead});
      }
    },
    cameraHelperChange(cameraHelper: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.animateCamera({cameraHelper});
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

  .geometry-extrude-spline-page {
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
