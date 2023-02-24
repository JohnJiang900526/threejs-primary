<script setup lang="ts">
  import { Icon, Popup, RadioGroup, Radio, Checkbox, Slider } from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="webgl-lights-physical-page">
    <Page title="webgl-lights-physical">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#fff"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="exposure">
            <div class="item-param">exposure</div>
            <div class="item-param slider">
              <Slider 
                v-model="exposure" :min="0" :max="1" :step="0.01" 
                @change="exposureChange" 
                bar-height="4px" active-color="#238bfe"/>
            </div>
          </Block>

          <Block title="shadows">
            <div class="item-param">
              <Checkbox v-model="shadows" @change="shadowsChange">shadows</Checkbox>
            </div>
          </Block>

          <Block title="hemiIrradiance">
            <radio-group v-model="hemiIrradiance" @change="hemiIrradianceChange">
              <div v-for="item in hemiIrradianceData" :key="item" class="item-param">
                <radio :name="item">{{item}}</radio>
              </div>
            </radio-group>
          </Block>

          <Block title="bulbPower">
            <radio-group v-model="bulbPower" @change="bulbPowerChange">
              <div v-for="item in bulbPowerData" :key="item" class="item-param">
                <radio :name="item">{{item}}</radio>
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
      exposure: 0.68,
      shadows: true,
      hemiIrradiance: "0.0001 lx (Moonless Night)",
      hemiIrradianceData:[
        '0.0001 lx (Moonless Night)',
        '0.002 lx (Night Airglow)',
        '0.5 lx (Full Moon)',
        '3.4 lx (City Twilight)',
        '50 lx (Living Room)',
        '100 lx (Very Overcast)',
        '350 lx (Office Room)',
        '400 lx (Sunrise/Sunset)',
        '1000 lx (Overcast)',
        '18000 lx (Daylight)',
        '50000 lx (Direct Sun)',
      ],
      bulbPower: '400 lm (40W)',
      bulbPowerData: [
        '110000 lm (1000W)',
        '3500 lm (300W)',
        '1700 lm (100W)',
        '800 lm (60W)',
        '400 lm (40W)',
        '180 lm (25W)',
        '20 lm (4W)',
        'Off',
      ]
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
    exposureChange(exposure: number) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({exposure});
      }
    },
    shadowsChange(shadows: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({shadows});
      }
    },
    hemiIrradianceChange(hemiIrradiance: string) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({hemiIrradiance});
      }
    },
    bulbPowerChange(bulbPower: string) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({bulbPower});
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

  .webgl-lights-physical-page {
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
    }
  }
</style>
