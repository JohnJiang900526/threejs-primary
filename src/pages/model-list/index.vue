<script setup lang="ts">
  import { RouterView } from "vue-router";
  import { Cell, CellGroup } from 'vant';
  import Page from "@/base/page/index.vue";
</script>
<template>
  <div class="list-page">
    <Page title="模型列表">
      <div class="list-content">
        <cell-group>
          <cell 
            v-for="item in list" is-link
            @click="openAction(item.path)"
            :key="item.key" :title="item.title"/>
        </cell-group>
      </div>
    </Page>

    <RouterView/>
  </div>
</template>

<script lang="ts">
import { defineComponent } from "vue";
import PageList from "./page-list";

export default defineComponent({
  data () {
    return {
      list: [...PageList]
    };
  },
  methods: {
    openAction(path: string) {
      this.$router.push(path);
    }
  }
});
</script>
<style lang='less' scoped>
  @import "@/common/style/color.less";
  @import "@/common/style/mixins.less";

  .list-page {
    .relative-page ();
    .list-content {
      .width-and-height();
      overflow-y: auto;
      -webkit-overflow-scrolling: touch;
    }
  }
</style>
