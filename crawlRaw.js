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
  return `${myURL.hostname}${myURL.pathname}`;
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
      return absolUrl;
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
  const myArray = [
    ...new Set(Array.from(HTMLAnchorElementsArray).map(URLtoAbsol)),
  ];
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
  });
  const textBody = await respTextBody(resp);
  const URLsArray = getURLsFromHTML(textBody, baseURL);
  for await (let url of URLsArray) {
    let isValidPage =
      !pages.URLsArray.includes(url) &&
      new URL(url).host === new URL(baseURL).host &&
      url !== baseURL;
    if (isValidPage) {
      pages.URLsArray.push(url);
      console.log(`new page found:\n\t ${url}`);
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
    return pages.URLsArray.length;
  } else {
    console.log(`Not all func finished yet: ${pages.activeFuncArray.length}`);
    await sleep(1000);
    return await programmFinishCheck(pages);
  }
}

async function main() {
  const pages = {
    URLsArray: [],
    visitedPages: [],
    activeFuncArray: [],
  };
  const domain = await inputFunc();
  await crawlPage(domain, domain, pages);
  programmFinishCheck(pages).then((count) => {
    console.log(`Number of pages is: ${count}`);
  });
}
main();
