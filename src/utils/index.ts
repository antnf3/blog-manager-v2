// const cheerio = require("cheerio"),
//   axios = require("axios"),
//   fs = require("fs");

import cheerio from "cheerio";
import fs from "fs";
import axios from "axios";
// const url2 = `https://link.coupang.com/re/AFFSDP?lptag=AF9123011&subid=antnfGithub&pageKey=218854031&itemId=678503000&vendorItemId=4746947369&traceid=V0-113-a66b0905ff613502`;
// getHtmlData({ productId: "218854031", orignUrl: url2 });
interface getHtmlDataProps {
  productId: number;
  orignUrl: string;
}
interface getHtmlReturnProps {
  discountRate: string; // 할인률
  originPrice: string; // 원래가격
  ratingStarNum: string; // 별 70%
  reviewCount: string; // 리뷰 갯수
  arrNames: string[]; // 이름
  arrStarNum: string[]; // 별표시
  arrRegDate: string[]; // 리뷰등록일
  arrProductInfo: string[]; // 구입상품정보
  arrHeadline: string[]; // 리뷰 제목
  arrImg: string[]; // 이미지
  arrContext: string[]; // 리뷰 내용
  arrEssentials: string[]; // 필수 표기정보
  arrDetailImg: string[]; // 상세 이미지 url
}

async function getHtmlData({ productId, orignUrl }: getHtmlDataProps) {
  const url = new URL(orignUrl);
  url.searchParams.delete("lptag");
  url.searchParams.delete("subid");

  const itemId = url.searchParams.get("itemId");
  const vendorItemId = url.searchParams.get("vendorItemId");

  const transurl = url.toString();
  const reviewUrl = `https://www.coupang.com/vp/product/reviews?productId=${productId}&page=1&size=5&sortBy=ORDER_SCORE_ASC&ratings=&q=&viRoleCode=2&ratingSummary=true`;
  const detailUrl = `https://www.coupang.com/vp/products/1309083120/items/${itemId}/vendoritems/${vendorItemId}`;

  let discountRate = ""; // 할인률
  let originPrice = ""; // 원래가격
  let ratingStarNum = ""; // 별 70%
  let reviewCount = ""; // 리뷰 갯수
  let arrNames: string[] = []; // 이름
  let arrStarNum: string[] = []; // 별표시
  let arrRegDate: string[] = []; // 리뷰등록일
  let arrProductInfo: string[] = []; // 구입상품정보
  let arrHeadline: string[] = []; // 리뷰 제목
  let arrImg: string[] = []; // 이미지
  let arrContext: string[] = []; // 리뷰 내용
  let arrEssentials: string[] = []; // 필수 표기정보
  let arrDetailImg: string[] = []; // 상세 이미지 url

  try {
    const res = await axios.get(transurl);
    if (res.status == 200) {
      // fnMakeHtml(res.data);
      const $$ = cheerio.load(res.data);

      // discountRate = $$(".prod-origin-price > .discount-rate").text().trim(); // 할인률
      // originPrice = $$(".prod-origin-price > .origin-price").text().trim(); // 원래가격
      $$(".prod-origin-price > .discount-rate").each(function (
        idx: any,
        obj: any
      ) {
        if (idx === 0) {
          discountRate = $$(obj).text().trim();
        } // 할인률
      });
      $$(".prod-origin-price > .origin-price").each(function (
        idx: any,
        obj: any
      ) {
        if (idx === 0) {
          originPrice = $$(obj).text().trim();
        } // 원래가격
      });

      ratingStarNum =
        $$(".prod-buy-header__productreview .rating-star-num").attr("style") ||
        ""; // 별 70%
      reviewCount = $$(".prod-buy-header__productreview .count").text().trim(); // 리뷰 갯수

      // 리뷰 클로링
      try {
        const resReview = await axios.get(reviewUrl);
        if (resReview.status == 200) {
          const $$ = cheerio.load(resReview.data);
          $$(".sdp-review__article__list").each(function (idx: any, obj: any) {
            arrNames.push(
              $$(obj)
                .find(".sdp-review__article__list__info__user__name")
                .text()
                .trim()
            ); // 이름
            arrStarNum.push(
              $$(obj)
                .find(
                  ".sdp-review__article__list__info__product-info__star-orange"
                )
                .attr("data-rating") || ""
            ); // 평점 별 갯수
            arrRegDate.push(
              $$(obj)
                .find(
                  ".sdp-review__article__list__info__product-info__reg-date"
                )
                .text()
                .trim()
            ); // 리뷰등록일
            arrProductInfo.push(
              $$(obj)
                .find(".sdp-review__article__list__info__product-info__name")
                .text()
                .trim()
            ); // 구입상품정보
            arrHeadline.push(
              $$(obj).find(".sdp-review__article__list__headline").text().trim()
            ); // 리뷰 제목
            arrImg.push(
              $$(obj)
                .find(".sdp-review__article__list__attachment__img")
                .attr("src") || ""
            ); // 이미지
            arrContext.push(
              $$(obj)
                .find(".sdp-review__article__list__review__content")
                .text()
                .trim()
            ); // 리뷰 내용
          });
        }
      } catch (error) {
        console.log("reviewUrl error");
      }

      try {
        const resReview = await axios.get(detailUrl);
        if (resReview.status == 200) {
          const { essentials, details } = resReview.data;

          arrEssentials = essentials; // 필수 표기정보

          const detailImg = details.reduce((acc: string[], cur: any) => {
            if (cur.vendorItemContentDescriptions[0].imageType) {
              acc.push(cur.vendorItemContentDescriptions[0].content);
            } else {
              const $$ = cheerio.load(
                cur.vendorItemContentDescriptions[0].content
              );
              $$("img").each((idx: any, obj: any) => {
                acc.push($$(obj).attr("src") || "");
              });
            }
            return acc;
          }, []);
          arrDetailImg = detailImg; // 상세 이미지 url
        }
      } catch (error) {
        console.log("detailUrl error");
      }
    }
  } catch (error) {
    console.log("transurl error");
  }

  // console.log(discountRate); // 할인률
  // console.log(originPrice); // 원래가격
  // console.log(ratingStarNum); // 별 70%
  // console.log(reviewCount); // 리뷰 갯수
  // console.log(arrNames); // 이름
  // console.log(arrStarNum); // 별표시
  // console.log(arrRegDate); // 리뷰등록일
  // console.log(arrProductInfo); // 구입상품정보
  // console.log(arrHeadline); // 리뷰 제목
  // console.log(arrImg); // 이미지
  // console.log(arrContext); // 리뷰 내용
  return {
    discountRate: discountRate === "%" ? "" : discountRate,
    originPrice: originPrice === "원" ? "" : originPrice,
    ratingStarNum,
    reviewCount,
    arrNames,
    arrStarNum,
    arrRegDate,
    arrProductInfo,
    arrHeadline,
    arrImg,
    arrContext,
    arrEssentials,
    arrDetailImg,
  };
}

function fnMakeHtml(html: any) {
  fs.writeFile("page1.html", html, "utf-8", function (e: any) {
    if (e) {
      console.log(e);
    }
  });
}

export { getHtmlData };
