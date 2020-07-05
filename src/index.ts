import "dotenv/config";
import getCoupangAPIData from "@antnf3/coupangapi";
import { setFileData, getFileData, isFile } from "@antnf3/file-utils";
import { promises as fs } from "fs";
import path from "path";

const ACCESS_KEY = `${process.env.ACCESS_KEY}`;
const SECRET_KEY = `${process.env.SECRET_KEY}`;

// getCoupangAPIData({
//   subUrls: "SEARCH",
//   categoryId: undefined,
//   limit: 1,
//   subId: "anderson",
//   keyword: "맥북프로",
//   transUrls: undefined,
//   accessKey: ACCESS_KEY,
//   secretKey: SECRET_KEY,
// }).then((data) => console.log(data));

const searchProducts = [{ product: "", limit: 1 }];

async function main() {
  const ph = path.join(__dirname, "../_searchProducts/products.json");
  const data = await getFileData(ph);
  console.log(data);
}
main();
