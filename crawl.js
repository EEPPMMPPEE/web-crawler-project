const { JSDOM } = require("jsdom");

function normalizeURL(url) {
  const myURL = new URL(url);
  return `${myURL.hostname}${myURL.pathname}${myURL.search}`;
}

function getURLsFromHTML(htmlBody, baseURL) {
  const dom = new JSDOM(htmlBody);
  let myArray = dom.window.document.getElementsByTagName("a");
  //let resArray = myArray.map((x) => new URL(x, baseURL).href);
  return myArray;
}

module.exports = {
  normalizeURL,
  getURLsFromHTML,
};
