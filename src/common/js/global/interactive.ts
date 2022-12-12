// 交互方法
// 和PowerMobile2 客户端交互
// 和企业微信APP交互
// 和钉钉APP交互
// 和第三方未知平台集成

import Plus from "./branchs/plus";
import Wechat from "./branchs/wechat";
import Dingtalk from "./branchs/dingtalk";
import Other from "./branchs/other";
import Web from "./branchs/web";

export default class Interactive {
  private platname: string
  private instance: Plus | Wechat | Dingtalk | Other | Web
  private plus: any
  private globalConfig: any
  private isMobile: boolean
  constructor() {
    // @ts-ignore
    this.plus = window.plus;
    // @ts-ignore
    this.globalConfig = window.globalConfig;
    this.isMobile = this.mobile();
    this.platname = this.getPlatName();
    this.instance = this.getInstance();
  }

  // 判断是否为移动端环境
  private mobile() {
    const { navigator } = window;
    const userAgent = navigator.userAgent.toLowerCase();
    return userAgent.includes("mobile");
  }

  // 当前平台名称
  private getPlatName(): string {
    const plus: any = this.plus;
    if (plus) { return plus?.os?.name }

    const userAgent = window.navigator.userAgent.toLowerCase();
    // 判断是否为微信环境
    const isWechat = userAgent.includes("micromessenger");
    
    if (isWechat) {
      // 企业微信
      if (userAgent.includes("wxwork")) {
        if (userAgent.includes("android")) {
          return "wechat-work,Android";
        }
  
        if (userAgent.includes("iphone")) {
          return "wechat-work,iOS";
        }
  
        if (userAgent.includes("windows")) {
          return "wechat-work,windows";
        }
  
        if (userAgent.includes("windows")) {
          return "wechat-work,windows";
        }
  
        if (userAgent.includes("macintosh")) {
          return "wechat-work,mac";
        }
  
        return "wechat-work";
      } else { // 微信环境
        if (userAgent.includes("android")) {
          return "wechat,Android";
        }

        if (userAgent.includes("iphone")) {
          return "wechat,iOS";
        }

        if (userAgent.includes("windows")) {
          return "wechat,windows";
        }

        if (userAgent.includes("windows")) {
          return "wechat,windows";
        }

        if (userAgent.includes("macintosh")) {
          return "wechat,mac";
        }

        return "wechat";
      }
    }

    // 判断是否为钉钉环境
    const isDingtalk = userAgent.includes("dingtalk");
    if (isDingtalk) {
      if (userAgent.includes("android")) {
        return "dingtalk,Android";
      }

      if (userAgent.includes("iphone")) {
        return "dingtalk,iOS";
      }
      return "dingtalk";
    }

    return "Web";
  }

  // 实例化 初始化
  private getInstance() {
    const isOtherApp = this.globalConfig?.isOtherApp;
    if (this.plus) { return new Plus(); }
    if (this.platname.includes("wechat")) { return new Wechat(); }
    if (this.platname.includes("dingtalk")) { return new Dingtalk(); }
    if (this.isMobile && isOtherApp) { return new Other(); }
    return new Web();
  }

  // 拍照
  openCamera() {
    this.instance.openCamera();
  }
  // 图库
  openGallery() {
    this.instance.openGallery();
  }
  // 打开系统文件
  openFile() {
    this.instance.openFile();
  }
  // 二维码调用
  openQrCode() {
    this.instance.openQrCode();
  }
  // 地理位置
  getLocation() {
    this.instance.getLocation();
  }
}

