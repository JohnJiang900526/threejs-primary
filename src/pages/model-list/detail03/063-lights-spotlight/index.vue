<script setup lang="ts">
  import { Icon, Popup, RadioGroup, Radio, Button, Slider, Checkbox } from 'vant';
  import { Sketch } from '@ckpack/vue-color';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-lights-spotlight-page">
    <Page title="webgl-lights-spotlight">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="设置Shadows">
            <div class="item-param">
              <Checkbox v-model="shadows" @change="shadowsChange">Shadows</Checkbox>
            </div>
          </Block>

          <Block title="设置颜色">
            <div @click="openColorHandle" class="color-block" :style="{'background-color': color}"></div>
          </Block>

          <Block title="设置Map">
            <radio-group v-model="map" @change="mapChange">
              <div v-for="item in maps" :key="item" class="item-param">
                <radio :name="item">{{item}}</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="设置intensity">
            <div class="item-param slider">
              <Slider 
                v-model="intensity" :min="0" :max="10" :step="0.01" 
                @change="intensityChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="设置distance">
            <div class="item-param slider">
              <Slider 
                v-model="distance" :min="50" :max="200" :step="0.01" 
                @change="distanceChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="设置angle">
            <div class="item-param slider">
              <Slider 
                v-model="angle" :min="0" :max="Math.PI/3" :step="0.01" 
                @change="angleChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="设置penumbra">
            <div class="item-param slider">
              <Slider 
                v-model="penumbra" :min="0" :max="1" :step="0.01" 
                @change="penumbraChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="设置decay">
            <div class="item-param slider">
              <Slider 
                v-model="decay" :min="1" :max="2" :step="0.01" 
                @change="decayChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="设置focus">
            <div class="item-param slider">
              <Slider 
                v-model="focus" :min="0" :max="1" :step="0.01" 
                @change="focusChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <div style="height: 200px"></div>

        </div>
      </Page>
    </Popup>

    <Popup :show="showColor" position="bottom" 
      @click-overlay="closeColorHandle" closeable
      :style="{ height: 'auto', width: '100%'}">
      <div class = "color-content">
        <div class="color-content-body">  
          <Sketch v-model="color" width="100%"/>
        </div>
        <div class="color-content-footer">
          <Button @click="closeColorHandle" size="small" type="primary" block>确定</Button>
        </div>
      </div>
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
      showColor: false,
      map: "disturb.jpg",
      color: "#ffffff",
      intensity: 5,
      distance: 100,
      angle: 0.52,
      penumbra: 1,
      decay: 2,
      focus: 1,
      shadows: true,
      maps: ['disturb.jpg', 'colors.png', 'uv_grid_opengl.jpg']
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
    shadowsChange(shadows: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setShadows(shadows);
      }
    },
    focusChange(focus: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setFocus(focus);
      }
    },
    decayChange(decay: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setDecay(decay);
      }
    },
    penumbraChange(penumbra: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setPenumbra(penumbra);
      }
    },
    angleChange(angle: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setAngle(angle);
      }
    },
    mapChange(map: string) {
      if (objModel) {
        this.closeHandle();
        objModel.setMap(map);
      }
    },
    colorChange(color: string) {
      if (objModel) {
        objModel.setColor(color);
      }
    },
    intensityChange(intensity: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setIntensity(intensity);
      }
    },
    distanceChange(distance: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setDistance(distance);
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
    openColorHandle() {
      this.showColor = true;
    },
    closeColorHandle() {
      this.showColor = false;
    }
  },
  // 卸载前函数
  beforeUnmount() {
    objModel = null;
  },
  watch: {
    color() {
      const toString = Object.prototype.toString;
      if (toString.call(this.color) === "[object Object]") {
        // @ts-ignore
        this.color = this.color.hex;
      }
      this.colorChange(this.color);
    }
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .webgl-lights-spotlight-page {
    .absolute-page();
    background-color: #000000;
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
