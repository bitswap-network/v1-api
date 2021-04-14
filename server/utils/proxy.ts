const puppeteerExtra = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");

export class PuppeteerService {
  browser: any;
  page: any;
  pageOptions: any;
  waitForFunction: string;
  isLinkCrawlTest: boolean;
  responseBody: string;

  constructor() {
    this.browser = null;
    this.page = null;
    this.pageOptions = null;
    this.waitForFunction = "";
    this.isLinkCrawlTest = false;
    this.responseBody = "";
  }

  async initiate(
    countsLimitsData: number,
    isLinkCrawlTest: boolean,
    id: string,
    check: string
  ) {
    console.log("initiating!");
    this.pageOptions = {
      waitUntil: "networkidle2",
      timeout: countsLimitsData * 1000,
    };
    this.waitForFunction = 'document.querySelector("body")';
    puppeteerExtra.use(pluginStealth());
    this.browser = await puppeteerExtra.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on("request", (request: any) => {
      // console.log('got the request: ', request)
      if (
        ["image", "stylesheet", "font", "script"].indexOf(
          request.resourceType()
        ) !== -1
      ) {
        request.abort();
      } else {
        console.log("posting data ....");
        request.continue({
          method: "POST",
          postData: JSON.stringify({
            [check]: id,
          }),
          headers: {
            ...request.headers(),
            "Content-Type": "application/json",
          },
        });
      }
    });
    this.page.on("requestfailed", (request: any) => {
      console.log(request.url() + " " + request.failure().errorText);
    });
    this.isLinkCrawlTest = isLinkCrawlTest;
  }

  async crawlTransactionInfo() {
    console.log("starting crawl");
    const link = "https://api.bitclout.com/api/v1/transaction-info";
    const userAgent = randomUseragent.getRandom();
    const crawlResults = { isValidPage: true, pageSource: null };
    try {
      await this.page.setUserAgent(userAgent);
      console.log("going to link: ", link);
      const resp = await this.page.goto(link, this.pageOptions);
      await this.page.waitForFunction(this.waitForFunction);
      crawlResults.pageSource = await this.page.content();
      this.responseBody = await resp.text();
      return this.responseBody;
    } catch (error) {
      crawlResults.isValidPage = false;
      console.log(error);
      return error;
    }
    if (this.isLinkCrawlTest) {
      this.close();
    }
  }

  close() {
    if (!this.browser) {
      this.browser.close();
    }
  }
}
