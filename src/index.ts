import "dotenv/config";
import getCoupangAPIData from "@antnf3/coupangapi";
import {
  setFileData,
  getFileData,
  downloadMultiImage,
} from "@antnf3/file-utils";
import path from "path";
import { getHtmlData } from "./utils";
import { getShutCutUrl } from "@antnf3/shortcuturl";

const ACCESS_KEY = `${process.env.ACCESS_KEY}`;
const SECRET_KEY = `${process.env.SECRET_KEY}`;
const URL_CLIENT_ID = `${process.env.URL_CLIENT_ID}`;
const URL_CLIENT_SECRET = `${process.env.URL_CLIENT_SECRET}`;

const KEYWORD_INFO = "../_searchProducts/products.json";
const RESULT_KEYWORD_INFO = "../_searchProducts/resultKeyword.json";

/**
 * main
 */
async function main() {
  // 검색KEYWORD정보 가져오기
  const filePath = path.join(__dirname, KEYWORD_INFO);
  const products = await getProductJson(filePath);
  if (products) {
    // 해당KEYWORD의 COUPANG상품정보 가져오기
    const keywordList = await getCoupangKeyword(products);
    if (keywordList.length > 0) {
      // 상품 상세정보 크롤링 및 네이버 단축 URL
      const arrCrawlerDetail = keywordList.map(async (keyword) => {
        const detailInfo = await getHtmlData({
          productId: keyword.productId,
          orignUrl: keyword.productUrl,
        });
        // 네이버 단축URL
        const shortCutUrl = await getShutCutUrl(
          keyword.productUrl,
          URL_CLIENT_ID,
          URL_CLIENT_SECRET
        );
        const shortCutResult = { shortCutUrl: "" };
        if (shortCutUrl.code === "200" && shortCutUrl.url) {
          shortCutResult.shortCutUrl = shortCutUrl.url;
        }

        return { ...keyword, ...shortCutResult, ...detailInfo };
      });
      const arrCrawlerResult = await Promise.all(arrCrawlerDetail);
      // 이미지 다운로드
      const arrImgDown = arrCrawlerResult.map(async (crawlerData) => {
        const localPath = path.join(
          __dirname,
          `../_searchProducts/${crawlerData.productId}`
        );
        const { productImage, arrImg } = crawlerData;
        const arrImgUrl = [productImage, ...arrImg];
        console.log(arrImgUrl);
        return await downloadMultiImage(arrImgUrl, localPath);
      });

      await Promise.all(arrImgDown);

      // 쿠팡상품정보를 파일로 저장한다.
      const localFilePath = path.join(__dirname, RESULT_KEYWORD_INFO);
      const isDone = await setFileData(
        localFilePath,
        JSON.stringify(arrCrawlerResult)
      );
    }
  }
}

interface dataProps {
  keyword: string;
  subId: string;
  limit: number;
}
type returnDataProps = dataProps[] | undefined;

/**
 * 검색할 제품명가져오기
 * @param filePath
 */
async function getProductJson(filePath: string): Promise<returnDataProps> {
  let resultData;
  try {
    resultData = await getFileData<dataProps[]>(filePath);
  } catch (e) {
    console.log(e);
  }
  return resultData;
}

/**
 * 쿠팡파트너스 API를 이용하여 KEYWORD의 상품을 가져온다.
 */
async function getCoupangKeyword(products: dataProps[]) {
  const promiseProducts = products.map((product) => {
    const params = {
      subUrls: "SEARCH",
      categoryId: undefined,
      limit: product.limit,
      subId: product.subId,
      keyword: product.keyword,
      transUrls: undefined,
      accessKey: ACCESS_KEY,
      secretKey: SECRET_KEY,
    };
    return getCoupangAPIData(params);
  });

  const result = await Promise.all(promiseProducts);
  const transResult = result.reduce((acc, cur) => {
    cur.forEach((detail) => acc.push(detail));
    return acc;
  }, []);
  return transResult;
}

main();
