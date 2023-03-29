/*
  My first JavaScript program...
  There may be some bugs and etc.
  Some thoughts:
  I don't know where I should place my thoughts.
  As I can figure out, technically "example.com/path" and "example.com/path/" are different URLs, but they usually redirect to the same page.\
  There is no check for this in my code and the result is that they are different URLs.
  I'm trying to use some sort of "asynchronous recursive function", but I probably don't know a good way to intercept when all functions are completed.\
  So I've been using some tricky stuff, but I'm not sure if it's likely to cause bugs or not.
  Sometimes, probably due to a bad internet connection, the page fetch is interrupted and the program doesn't try to reconnect.\
  This means that the program doesn't make a 100% accuracy report.
  Some sites return "Your browser currently has JavaScript disabled..."
*/
const { JSDOM } = require("jsdom");
const readline = require("readline/promises");
const { stdin: input, stdout: output } = require("process");
const { setTimeout: sleep } = require("timers/promises");

function normalizeURL(url) {
  const myURL = new URL(url);
  return `${myURL.protocol}//${myURL.hostname}${myURL.pathname}`;
}

function fetchPref() {
  return {
    method: "GET",
    mode: "cors",
  };
}

async function fetchResp(url) {
  try {
    const response = await fetch(url, fetchPref);
    if (!response.ok) {
      throw new Error(`Bad status code: ${response.status}`);
    }
    const isContentTypeCorrect = response.headers
      .get("content-type")
      .includes("text/html");
    if (!isContentTypeCorrect) {
      throw new Error(
        `Bad content-type: ${response.headers.get("content-type")}`
      );
    }
    return response;
  } catch (err) {
    console.log(`url: ${url} raise Error "${err.message}"`);
    throw url;
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
    const absolUrl = new URL(url.href, validBase).href;
    return normalizeURL(absolUrl);
  };
  return subFunc;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const URLtoAbsolFunc = relURLsToAbsol(baseURL);
  const dom = new JSDOM(htmlBody);
  const HTMLAnchorElements = dom.window.document.getElementsByTagName("a");
  const URLsArray = Array.from(HTMLAnchorElements).map(URLtoAbsolFunc);
  return URLsArray;
}

async function inputFunc() {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = await rl.question(
      `Enter URL for "internal links" report:\n`
    );
    const domainURL = new URL(answer);
    console.log("Crawler Project: starting...");
    return `${domainURL.protocol}//${domainURL.hostname}`;
  } catch (err) {
    console.log(
      `Something wrong: ${err}\nEnter only valid URL. Example: "https://example.com"\n`
    );
    return await inputFunc();
  } finally {
    rl.close();
  }
  process.exit(1);
}

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
      //console.log(`page found:\n\t ${url}`);
    }
  }
  for await (let newCurrentURL of pages.URLsArray) {
    if (!pages.visitedPages.includes(newCurrentURL)) {
      pages.visitedPages.push(newCurrentURL);
      crawlPage(baseURL, newCurrentURL, pages);
    }
  }
  pages.activeFuncArray.pop();
  return pages;
}

async function programFinishCheck(pages) {
  if (!pages.activeFuncArray.length) {
    return;
  } else {
    console.log(
      `Count of active async crawPage functions: ${pages.activeFuncArray.length}`
    );
    await sleep(1000);
    return await programFinishCheck(pages);
  }
}

function postExtractDataFormat(pages) {
  const arrToKeyCountArray = (arr) => {
    const keyCountArr = [];
    const countObj = new Map(
      [...new Set(arr)].map((x) => [x, arr.filter((y) => y === x).length])
    ); //
    countObj.forEach((val, key) => {
      keyCountArr.push({ url: key, count: val });
    });
    return keyCountArr;
  }; // ECMAScript2015 option: https://stackoverflow.com/questions/5667888/counting-the-occurrences-frequency-of-array-elements

  const specialSortingFunc = (specArray) => {
    return specArray.sort(function (a, b) {
      return b.count - a.count;
    });
  };
  const filteredURLsArray = pages.URLsArray.filter(
    (url) => !pages.badPages.includes(url)
  );
  return specialSortingFunc(arrToKeyCountArray(filteredURLsArray));
}

function printReport(pages) {
  console.log("report is starting...\n");
  const formatedData = postExtractDataFormat(pages);
  for (let data of formatedData) {
    console.log(`Found ${data.count} internal links to ${data.url}`);
  }
}

//---------------------------------------------------------------

module.exports = {
  inputFunc,
  crawlPage,
  programFinishCheck,
  printReport,
};
