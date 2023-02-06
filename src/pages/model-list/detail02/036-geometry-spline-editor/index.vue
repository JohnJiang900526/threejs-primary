<script setup lang="ts">
  import { Icon, Popup, Checkbox, Slider, Button, Space} from 'vant';
  import Page from "@/base/page/index.vue";
  import Block from "@/base/block/index.vue";
</script>

<template>
  <div class="geometry-spline-editor-page">
    <Page title="geometry-spline-editor">
      <div ref="container" class="key-frame-page-inner">
        <div v-show="true" class="actions">
          <Icon @click="openHandle" name="wap-nav" color="#333"/>
        </div>
      </div>
    </Page>

    <Popup :show="show" position="right" @click-overlay="closeHandle" :style="{ height: '100%', width: '80%' }">
      <Page @click-left="closeHandle" :default-click="false" title="模型设置">
        <div class="settings-content">
          <Block title="Controller">
            <div class="item-param">
              <Checkbox v-model="uniform" @change="uniformChange">uniform</Checkbox>
            </div>

            <div class="item-param">tension</div>
            <div class="item-param slider">
              <Slider 
                v-model="tension" :min="0" :max="1" :step="0.01" 
                @update:model-value="tensionChange" bar-height="4px" active-color="#238bfe"></Slider>
            </div>

            <div class="item-param">
              <Checkbox v-model="centripetal" @change="centripetalChange">centripetal</Checkbox>
            </div>
            <div class="item-param">
              <Checkbox v-model="chordal" @change="chordalChange">chordal</Checkbox>
            </div>
          </Block>

          <Block title="动作操作">
            <Space size="2rem" wrap>  
              <Button @click="addPoint" size="small" type="primary">新增点</Button>
              <Button @click="removePoint" size="small" type="primary">删除点</Button>
              <Button @click="exportSpline" size="small" type="primary">打印Spline</Button>
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
      show: false,
      uniform: true,
      tension: 0.05,
      centripetal: true,
      chordal: true,
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
    addPoint() {
      if (objModel) {
        this.closeHandle();
        objModel.addPoint();
      }
    },
    removePoint() {
      if (objModel) {
        this.closeHandle();
        objModel.removePoint();
      }
    },
    exportSpline() {
      if (objModel) {
        this.closeHandle();
        objModel.exportSpline();
      }
    },
    uniformChange(uniform: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({uniform})
      }
    },
    tensionChange(val: number) {
      if (objModel) {
        objModel.setTension(val);
      }
    },
    centripetalChange(centripetal: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({centripetal})
      }
    },
    chordalChange(chordal: boolean) {
      if (objModel) {
        this.closeHandle();
        objModel.setAttr({chordal})
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

  .geometry-spline-editor-page {
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
