// 缓存方法 作用于全局

// 抛出一个缓存 LocalStore class
const defaultTag = "__PowerApp__";
export default class LocalStore {
  tag: string
  constructor (tag?: string) {
    if (!tag) {
      this.tag = defaultTag;
    } else {
      this.tag = tag;
    }
  }

  // key的加解密
  encodeKey() {}
  decodeKey() {}

  // value的加解密
  encodeValue() {}
  decodeValue() {}

  // 清除所有缓存信息
  clear() {}

  // token相关
  getToken() {}
  storeToken() {}
  removeToken() {}

  // 人员相关
  getUserData() {}
  storeUserData() {}
  removeUserData() {}

  // 登录账号&密码相关
  getAccount() {}
  storeAccount() {}
  removeAccount() {}

  // 当前EPS相关
  getCurrentEps() {}
  storeCurrentEps() {}
  removeCurrentEps() {}

  // sessionData相关
  getSessionData() {}
  storeSessionData() {}
  removeSessionData() {}

  // 当前表单流程相关
  getFormFlowData() {}
  storeFormFlowData() {}
  removeFormFlowData() {}
}

// 抛出一个缓存 LocalStore class 实例
export const localStore = new LocalStore();

