const { test, expect } = require("@jest/globals");
const { normalizeURL, getURLsFromHTML } = require("./crawl.js");
const { JSDOM } = require("jsdom");

function getSettings() {
  return {
    method: "GET",
    mode: "cors",
    headers: {
      "X-API-Key": "Testing",
      "Content-Type": "application/json",
    },
  };
}

// const myTestInputs = [
//   "httpss://wagslane.dev/path///",
//   "https://wagsLane.Dev/path",
//   "https://wagslane.dev/path",
//   "http://wagslane.dev/path",
// ];

// for (teInput of myTestInputs) {
//   test(`${teInput} can be transform to wagslane.dev/path`, () => {
//     expect("wagslane.dev/path").toBe(normalizeURL(teInput));
//   });
// }
async function fetchBodyFromUrl(url) {
  const response = await fetch(url, getSettings());
  return response;
}
let teInput = fetchBodyFromUrl("https://blog.boot.dev");
console.log(teInput);
console.log(teInput);
test(`trying to find a link in htlm body`, () => {
  expect(getURLsFromHTML(teInput, "https://blog.boot.dev")).toBe(
    "https://boot.dev"
  );
});
