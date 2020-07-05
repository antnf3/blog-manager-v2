import "dotenv/config";
import getCoupangAPIData from "@antnf3/coupangapi";
import { setFileData, getFileData } from "@antnf3/file-utils";
import path from "path";

const ACCESS_KEY = `${process.env.ACCESS_KEY}`;
const SECRET_KEY = `${process.env.SECRET_KEY}`;
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
      // 쿠팡상품정보를 파일로 저장한다.
      const localFilePath = path.join(__dirname, RESULT_KEYWORD_INFO);
      const isDone = await setFileData(
        localFilePath,
        JSON.stringify(keywordList)
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
