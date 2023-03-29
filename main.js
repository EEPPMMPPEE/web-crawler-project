/*
  "Web Crawler"
  JavaScript application that generates an "internal links" report for any website on the internet by crawling each page of the site.
  Alpha version.
  Tested on: "https://blog.boot.dev"
*/

const {
  inputFunc,
  crawlPage,
  programFinishCheck,
  printReport,
} = require("./crawl");

async function main() {
  const pages = {
    URLsArray: [],
    visitedPages: [],
    badPages: [],
    activeFuncArray: [],
  };
  const domain = await inputFunc();
  crawlPage(domain, domain, pages);
  programFinishCheck(pages).then(() => {
    printReport(pages);
  });
}
main();
