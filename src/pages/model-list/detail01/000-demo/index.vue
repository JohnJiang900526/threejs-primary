<script setup lang="ts">
  import Page from "@/base/page/index.vue";
</script>

<template>
  <div class="key-frame-page">
    <Page title="矩形阵列">
      <div ref="container" class="key-frame-page-inner"></div>
    </Page>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import { Model } from "./tools";

export default defineComponent({
  mounted() {
    this.render();
  },
  methods: {
    render() {
      const model = new Model(this.$refs.container as HTMLDivElement);
      model.init();
    }
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .key-frame-page {
    .absolute-page();
    background-color: #000;
    .key-frame-page-inner {
      .width-and-height();
      background-color: #000;
    }
  }
</style>
