<script lang="ts" setup>
  import { NavBar } from 'vant';
</script>

<template>
  <div class="page-content">
    <div class="page-header">
      <nav-bar @click-left="back" :title="title" left-arrow/>
    </div>
    <div class="page-body">
      <slot></slot>
    </div>
  </div>
</template>

<script lang="ts">
import {defineComponent} from "vue";

export default defineComponent({
  props: {
    title: {
      type: String,
      default() {
        return "";
      }
    },
    defaultClick: {
      type: Boolean,
      default() { return true }
    }
  },
  methods: {
    back() {
      if (this.defaultClick) {
        this.$router.back();
      } else {
        this.$emit("click-left");
      }
    }
  }
});
</script>

<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";
  .page-content {
    .width-and-height();
    display: flex;
    flex-direction: column;
    .page-header {
      max-height: 50px;
      flex: 0 0 auto;
      overflow: hidden;
    }
    .page-body {
      flex: 1;
      height: 100%;
      overflow: hidden;
    }
  }
</style>
