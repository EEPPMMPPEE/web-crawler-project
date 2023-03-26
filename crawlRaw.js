const { JSDOM } = require("jsdom");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { setTimeout: sleep } = require("timers/promises");

function fetchPref() {
  return {
    method: "GET",
    mode: "cors",
    headers: {
      "Content-Type": "application/json",
    },
  };
}

function normalizeURL(url) {
  const myURL = new URL(url);
  return `${myURL.protocol}//${myURL.hostname}${myURL.pathname}`;
}

async function fetchResp(domain) {
  try {
    const response = await fetch(`${domain}`, fetchPref);
    const isRespSucces = 199 < response.status < 300;
    if (!isRespSucces) {
      throw new Error(`Bad status code: ${response.status}`);
    }
    const isCorrectContentType = response.headers
      .get("content-type")
      .includes("text/html");
    if (!isCorrectContentType) {
      throw new Error(
        `Bad content-type: ${response.headers.get("content-type")}`
      );
    }
    return response;
  } catch (err) {
    console.log(`url: ${domain} raise Error "${err.message}"`);
    throw domain;
  }
}

async function respTextBody(resp) {
  try {
    return await resp.text();
  } catch (error) {
    return "";
  }
}

function relURLsToAbsol(baseUrl) {
  const subFunc = (url) => {
    const validBase = new URL(baseUrl);
    try {
      const absolUrl = new URL(url.href, validBase).href;
      return normalizeURL(absolUrl);
    } catch (err) {
      console.log(`Ploho: ${url}\nDomain: ${validBase}`);
      return normalizeURL(url.href);
    }
  };
  return subFunc;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const URLtoAbsol = relURLsToAbsol(baseURL);
  const dom = new JSDOM(htmlBody);
  const HTMLAnchorElementsArray = dom.window.document.getElementsByTagName("a");
  const myArray = Array.from(HTMLAnchorElementsArray).map(URLtoAbsol);
  return myArray;
}

async function inputFunc() {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question("Enter URL for executing URLs:\n");
    new URL(answer);
    return answer;
  } catch (err) {
    console.log(`Error: `, err);
  } finally {
    rl.close();
    console.log("Crawler Project: starting...");
  }
  process.exit(1);
}
//---------------------------------------------------
async function crawlPage(baseURL, currentURL, pages) {
  pages.activeFuncArray.push("true");
  const resp = await fetchResp(currentURL).catch((badPage) => {
    pages.visitedPages.push(badPage);
    pages.badPages.push(badPage);
  });
  const textBody = await respTextBody(resp);
  const URLsArray = getURLsFromHTML(textBody, baseURL);
  for await (let url of URLsArray) {
    let isValidPage =
      new URL(url).host === new URL(baseURL).host &&
      !pages.badPages.includes(url);
    if (isValidPage) {
      pages.URLsArray.push(url);
      console.log(`page found:\n\t ${url}`);
    }
  }
  for await (let newCurrentURL of pages.URLsArray) {
    if (!pages.visitedPages.includes(newCurrentURL)) {
      pages.visitedPages.push(newCurrentURL);
      crawlPage(baseURL, newCurrentURL, pages);
    } else {
      //console.log(`don't trying to crawl ${newCurrentURL}`);
    }
  }
  pages.activeFuncArray.pop();
  return pages;
}

async function programmFinishCheck(pages) {
  if (!pages.activeFuncArray.length) {
    return printReport;
  } else {
    console.log(`Not all func finished yet: ${pages.activeFuncArray.length}`);
    await sleep(1000);
    return await programmFinishCheck(pages);
  }
}

function postExecuteDataFormat(pages) {
  const arrToKeyCountArrayFunc = (arr) => {
    const keyCountArr = [];
    const countObj = new Map(
      [...new Set(arr)].map((x) => [x, arr.filter((y) => y === x).length])
    );
    countObj.forEach((val, key) => {
      keyCountArr.push({ url: key, count: val });
    });
    return keyCountArr;
  };

  const specialSortingFunc = (specArray) => {
    return specArray.sort(function (a, b) {
      return b.count - a.count;
    });
  };
  filteredURLsArray = pages.URLsArray.filter(
    (url) => !pages.badPages.includes(url)
  );
  return specialSortingFunc(arrToKeyCountArrayFunc(filteredURLsArray));
}

function printReport(pages) {
  console.log("report is starting...\n");
  const formatedData = postExecuteDataFormat(pages);
  for (let data of formatedData) {
    console.log(`Found ${data.count} internal links to ${data.url}`);
  }
}

//---------------------------------------------------------------

async function main() {
  const pages = {
    URLsArray: [],
    visitedPages: [],
    badPages: [],
    activeFuncArray: [],
  };
  const domain = await inputFunc();
  await crawlPage(domain, domain, pages);
  programmFinishCheck(pages).then((printReport) => {
    printReport(pages);
  });
}
main();
