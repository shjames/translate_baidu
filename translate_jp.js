const crypto = require("crypto");

function md5Hnndler(content, md5) {
  return md5.update(content).digest("hex");
}
const trans_result_all = {};
const trans_result_error_all = {};

const axios = require("axios");
const fse = require("fs-extra");
// 导入需要翻译的数据
const replenish = require("./replenish.js");
const replenish_jp = [];
for (let key in replenish.replenish_jp) {
  replenish_jp.push(replenish.replenish_jp[key]);
}
getToken();
const OUT_PATH = "./export.json";
const OUT_PATH_error = "./export_error.json";

function getToken() {
  if (!replenish_jp.length) {
    //如果数组为空，则代表代表已经翻译完成，调用genarateData 输出文件
    genarateData(trans_result_all, OUT_PATH);
    if (trans_result_error_all.length) {
      genarateData(trans_result_error_all, OUT_PATH_error);
    }
  } else {
    // 每次取出数组最后一项进行翻译
    const popValue = replenish_jp.pop();
    const sign = `20230430001662173${popValue}${new Date().getTime()}ciMe2I4FFYDlCRNmLN66`;
    /**
     * http://api.fanyi.baidu.com/api/trans/vip/translate   百度通用翻译API HTTPS 地址
     * q: 翻译 query(注意为UTF-8编码)
     * from 未翻译之前的语言
     * to 翻译之后的语言
     * appid 百度翻译开发平台申请的APP ID
     * salt 随机数(这里使用了时间戳)
     * sign 签名(使用 MD5 算法生成的一段字符串，生成的签名长度为 32 位，签名中的英文字符均为小写格式。)生成方法：Step1. 将请求参数中的 APPID(appid)， 翻译 query(q，注意为UTF-8编码)，随机数(salt)，以及平台分配的密钥(可在管理控制台查看) 按照 appid+q+salt+密钥的顺序拼接得到字符串 1。
Step2. 对字符串 1 做 MD5 ，得到 32 位小写的 sign。示例： q=apple
     from=en
     to=zh
     appid=2015063000000001（请替换为您的appid）
     salt=1435660288（随机码）
     平台分配的密钥: 12345678，sign=MD5(2015063000000001apple143566028812345678)，得到sign=f89f9594663708c1605f3d736d01d2d4
     */
    const BACK_GATEWAY = `http://api.fanyi.baidu.com/api/trans/vip/translate?q=${popValue}&from=zh&to=${
      process.env.TRANSLATE_LANG
    }&appid=20230430001662173&salt=${new Date().getTime()}&sign=${md5Hnndler(
      sign,
      crypto.createHash("md5")
    )}`;
    axios(BACK_GATEWAY, {
      method: "GET",
      // headers: {
      //   "Content-type": "application/json",
      // },
    })
      .then((res) => {
        // 请求下一个翻译
        if (!res.data.error_code) {
          // 如果请求翻译接口没有报错，即是成功，则记录下翻译的结果
          for (let key in replenish.replenish_jp) {
            if (replenish.replenish_jp[key] === res.data.trans_result[0].src) {
              trans_result_all[key] = res.data.trans_result[0].dst;
            }
          }
        } else {
          // 记录错误结果
          for (let key in replenish.replenish_jp) {
            if (replenish.replenish_jp[key] === popValue) {
              trans_result_error_all[key] = popValue;
            }
          }
        }
        getToken();
      })
      .catch((e) => {
        //   console.log(e, "\n获取yapi-token接口失败!!!!!!");
        //   process.exit(1);
      });
  }
}
const listToMap = (list) => {
  const obj = {};
  list.trans_result.forEach((element) => {
    obj[element.src] = element.dst;
  });
  return obj;
};
const genarateData = (list, OUT_PATH_) => {
  fse.writeJsonSync(OUT_PATH_, list, (err, data) => {
    if (err) console.log(err, "\n获取yapi-token失败!!!!!!");
  });
};
