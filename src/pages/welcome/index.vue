<script lang="ts" setup>
  import logo from "@/assets/favicon_white.ico";

</script>

<template>
  <div class="welcome-page">
    <div class="message">
      <div class="logo-warp">
        <img class="logo" :src="logo" alt="logo">
      </div>

      <h1 class="title">欢迎来到我的three.js训练场</h1>

      <div class="entry" @click="entry"> 进入训练场</div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
export default defineComponent({
  methods: {
    entry() {
      this.$router.push("/list");
    }
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .welcome-page {
    .relative-page ();
    background-color: #12a7ff;
    .message {
      width: 100%;
      height: auto;
      padding: 10px;
      box-sizing: border-box;
      .positionCenter();
      top: 35%;
      .logo-warp {
        padding: 50px 10px;
        box-sizing: border-box;
        .logo {
          width: 100px;
          display: block;
          margin: 0 auto;
          animation: App-logo-spin infinite 5s linear;
        }
      }
      .title {
        color: #fff;
        text-align: center;
        line-height: 1.25;
        font-size: 1.5rem;
        word-break: break-all;
      }
      .entry {
        width: 80%;
        color: #fff;
        margin: 3rem auto 0 auto;
        border: 1px solid #fff;
        padding: 15px;
        box-sizing: border-box;
        border-radius: 25px;
        text-align: center;
        .text {
          color: #fff;
        }
      }
    }
  }

  @keyframes App-logo-spin {
    from {
      transform: rotate(0deg);
    }
    to {
      transform: rotate(360deg);
    }
  }
</style>
