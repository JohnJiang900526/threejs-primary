<script setup lang="ts">
  import { RouterView } from "vue-router";
  import { Cell, CellGroup, Search, Empty } from 'vant';
  import Page from "@/base/page/index.vue";
</script>
<template>
  <div class="list-page">
    <Page title="模型列表">
      <div class="list-content">
        <div class="list-content-header">
          <Search v-model="value" @update:model-value="change" placeholder="请输入模型名称" />
        </div>
        <div class="list-content-body">
          <div v-if="list.length > 0">
            <cell-group>
              <cell
                v-for="item in list" is-link
                @click="openAction(item.path)"
                :key="item.key" :title="item.title"/>
            </cell-group>
          </div>
          <div  v-else>
            <Empty image="search" description="没有匹配到对应的模型，请重新搜索"/>
          </div>
        </div>
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
      value: "",
      list: [...PageList],
      defaultData: [...PageList]
    };
  },
  methods: {
    change(val: string) {
      const arr = [...this.defaultData];
      const result = arr.filter((item) => item.title.includes(val));
      
      this.list = [...result];
    },
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
      display: flex;
      flex-direction: column;
      .list-content-header {
        height: 55px;
        flex: 0 0 55px;
        .bottom-line();
      }
      .list-content-body {
        flex: 1;
        overflow-y: auto;
        -webkit-overflow-scrolling: touch;
      }
    }
  }
</style>
