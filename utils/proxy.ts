const puppeteerExtra = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");
const logger = require("./logger");
const config = require("./config");

class Proxy {
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
    this.waitForFunction = 'document.querySelector("body")';
    this.isLinkCrawlTest = false;
    this.responseBody = "";
  }

  async initiateProfileQuery(
    countsLimitsData: number,
    id: string,
    username: string
  ) {
    logger.info("initiating profile query!");
    this.pageOptions = {
      waitUntil: "networkidle2",
      timeout: countsLimitsData * 1000,
    };
    puppeteerExtra.use(pluginStealth());
    this.browser = await puppeteerExtra.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on("request", (request: any) => {
      if (
        ["image", "stylesheet", "font", "script"].indexOf(
          request.resourceType()
        ) !== -1
      ) {
        request.abort();
      } else {
        logger.info("posting data ....");
        request.continue({
          method: "POST",
          postData: JSON.stringify({
            PublicKeyBase58Check: id,
            Username: username,
          }),
          headers: {
            ...request.headers(),
            "Content-Type": "application/json",
          },
        });
      }
    });
    this.page.on("requestfailed", (request: any) => {
      logger.info(request.url() + " " + request.failure().errorText);
    });
    this.isLinkCrawlTest = true;
  }

  async initiatePostsQuery(
    countsLimitsData: number,
    reader_id: string,
    profile_id: string,
    profile_username: string,
    numToFetch: number
  ) {
    logger.info("initiating profile query!");
    this.pageOptions = {
      waitUntil: "networkidle2",
      timeout: countsLimitsData * 1000,
    };
    puppeteerExtra.use(pluginStealth());
    this.browser = await puppeteerExtra.launch({
      headless: true,
      args: ["--no-sandbox"],
    });
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on("request", (request: any) => {
      if (
        ["image", "stylesheet", "font", "script"].indexOf(
          request.resourceType()
        ) !== -1
      ) {
        request.abort();
      } else {
        logger.info("posting data ....");
        request.continue({
          method: "POST",
          postData: JSON.stringify({
            LastPostHashHex: "",
            NumToFetch: numToFetch,
            PublicKeyBase58Check: profile_id,
            ReaderPublicKeyBase58Check: reader_id,
            Username: profile_username,
          }),
          headers: {
            ...request.headers(),
            "Content-Type": "application/json",
          },
        });
      }
    });
    this.page.on("requestfailed", (request: any) => {
      logger.info(request.url() + " " + request.failure().errorText);
    });
    this.isLinkCrawlTest = true;
  }

  async getProfile() {
    logger.info("starting crawl");
    const link = "https://api.bitclout.com/get-single-profile";
    const userAgent = randomUseragent.getRandom();
    const crawlResults = { isValidPage: true, pageSource: null };
    try {
      await this.page.setUserAgent(userAgent);
      logger.info("going to link: ", link);
      const resp = await this.page.goto(link, this.pageOptions);
      await this.page.waitForFunction(this.waitForFunction);
      crawlResults.pageSource = await this.page.content();
      this.responseBody = await resp.text();
      return this.responseBody;
    } catch (error) {
      crawlResults.isValidPage = false;
      logger.error(error);
      throw error;
    }
    if (this.isLinkCrawlTest) {
      this.close();
    }
  }

  async getPosts() {
    logger.info("starting crawl");
    const link = "https://api.bitclout.com/get-posts-for-public-key";
    const userAgent = randomUseragent.getRandom();
    const crawlResults = { isValidPage: true, pageSource: null };
    try {
      await this.page.setUserAgent(userAgent);
      logger.info("going to link: ", link);
      const resp = await this.page.goto(link, this.pageOptions);
      await this.page.waitForFunction(this.waitForFunction);
      crawlResults.pageSource = await this.page.content();
      this.responseBody = await resp.text();
      return this.responseBody;
    } catch (error) {
      crawlResults.isValidPage = false;
      logger.error(error);
      throw error;
    }
    if (this.isLinkCrawlTest) {
      this.close();
    }
  }

  close() {
    console.log("closing proxy");
    this.browser.close();
  }
}

// const proxy = new Proxy();

export default Proxy;
