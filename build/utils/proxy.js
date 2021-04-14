"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PuppeteerService = void 0;
const puppeteerExtra = require("puppeteer-extra");
const pluginStealth = require("puppeteer-extra-plugin-stealth");
const randomUseragent = require("random-useragent");
class PuppeteerService {
    constructor() {
        this.browser = null;
        this.page = null;
        this.pageOptions = null;
        this.waitForFunction = "";
        this.isLinkCrawlTest = false;
        this.responseBody = "";
    }
    initiate(countsLimitsData, isLinkCrawlTest, id, check) {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("initiating!");
            this.pageOptions = {
                waitUntil: "networkidle2",
                timeout: countsLimitsData * 1000,
            };
            this.waitForFunction = 'document.querySelector("body")';
            puppeteerExtra.use(pluginStealth());
            this.browser = yield puppeteerExtra.launch({
                headless: true,
                args: ["--no-sandbox"],
            });
            this.page = yield this.browser.newPage();
            yield this.page.setRequestInterception(true);
            this.page.on("request", (request) => {
                // console.log('got the request: ', request)
                if (["image", "stylesheet", "font", "script"].indexOf(request.resourceType()) !== -1) {
                    request.abort();
                }
                else {
                    console.log("posting data ....");
                    request.continue({
                        method: "POST",
                        postData: JSON.stringify({
                            [check]: id,
                        }),
                        headers: Object.assign(Object.assign({}, request.headers()), { "Content-Type": "application/json" }),
                    });
                }
            });
            this.page.on("requestfailed", (request) => {
                console.log(request.url() + " " + request.failure().errorText);
            });
            this.isLinkCrawlTest = isLinkCrawlTest;
        });
    }
    crawlTransactionInfo() {
        return __awaiter(this, void 0, void 0, function* () {
            console.log("starting crawl");
            const link = "https://api.bitclout.com/api/v1/transaction-info";
            const userAgent = randomUseragent.getRandom();
            const crawlResults = { isValidPage: true, pageSource: null };
            try {
                yield this.page.setUserAgent(userAgent);
                console.log("going to link: ", link);
                const resp = yield this.page.goto(link, this.pageOptions);
                yield this.page.waitForFunction(this.waitForFunction);
                crawlResults.pageSource = yield this.page.content();
                this.responseBody = yield resp.text();
                return this.responseBody;
            }
            catch (error) {
                crawlResults.isValidPage = false;
                console.log(error);
                return error;
            }
            if (this.isLinkCrawlTest) {
                this.close();
            }
        });
    }
    close() {
        if (!this.browser) {
            this.browser.close();
        }
    }
}
exports.PuppeteerService = PuppeteerService;
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJveHkuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi91dGlscy9wcm94eS50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiOzs7Ozs7Ozs7Ozs7QUFBQSxNQUFNLGNBQWMsR0FBRyxPQUFPLENBQUMsaUJBQWlCLENBQUMsQ0FBQztBQUNsRCxNQUFNLGFBQWEsR0FBRyxPQUFPLENBQUMsZ0NBQWdDLENBQUMsQ0FBQztBQUNoRSxNQUFNLGVBQWUsR0FBRyxPQUFPLENBQUMsa0JBQWtCLENBQUMsQ0FBQztBQUVwRCxNQUFhLGdCQUFnQjtJQVEzQjtRQUNFLElBQUksQ0FBQyxPQUFPLEdBQUcsSUFBSSxDQUFDO1FBQ3BCLElBQUksQ0FBQyxJQUFJLEdBQUcsSUFBSSxDQUFDO1FBQ2pCLElBQUksQ0FBQyxXQUFXLEdBQUcsSUFBSSxDQUFDO1FBQ3hCLElBQUksQ0FBQyxlQUFlLEdBQUcsRUFBRSxDQUFDO1FBQzFCLElBQUksQ0FBQyxlQUFlLEdBQUcsS0FBSyxDQUFDO1FBQzdCLElBQUksQ0FBQyxZQUFZLEdBQUcsRUFBRSxDQUFDO0lBQ3pCLENBQUM7SUFFSyxRQUFRLENBQ1osZ0JBQXdCLEVBQ3hCLGVBQXdCLEVBQ3hCLEVBQVUsRUFDVixLQUFhOztZQUViLE9BQU8sQ0FBQyxHQUFHLENBQUMsYUFBYSxDQUFDLENBQUM7WUFDM0IsSUFBSSxDQUFDLFdBQVcsR0FBRztnQkFDakIsU0FBUyxFQUFFLGNBQWM7Z0JBQ3pCLE9BQU8sRUFBRSxnQkFBZ0IsR0FBRyxJQUFJO2FBQ2pDLENBQUM7WUFDRixJQUFJLENBQUMsZUFBZSxHQUFHLGdDQUFnQyxDQUFDO1lBQ3hELGNBQWMsQ0FBQyxHQUFHLENBQUMsYUFBYSxFQUFFLENBQUMsQ0FBQztZQUNwQyxJQUFJLENBQUMsT0FBTyxHQUFHLE1BQU0sY0FBYyxDQUFDLE1BQU0sQ0FBQztnQkFDekMsUUFBUSxFQUFFLElBQUk7Z0JBQ2QsSUFBSSxFQUFFLENBQUMsY0FBYyxDQUFDO2FBQ3ZCLENBQUMsQ0FBQztZQUNILElBQUksQ0FBQyxJQUFJLEdBQUcsTUFBTSxJQUFJLENBQUMsT0FBTyxDQUFDLE9BQU8sRUFBRSxDQUFDO1lBQ3pDLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxzQkFBc0IsQ0FBQyxJQUFJLENBQUMsQ0FBQztZQUM3QyxJQUFJLENBQUMsSUFBSSxDQUFDLEVBQUUsQ0FBQyxTQUFTLEVBQUUsQ0FBQyxPQUFZLEVBQUUsRUFBRTtnQkFDdkMsNENBQTRDO2dCQUM1QyxJQUNFLENBQUMsT0FBTyxFQUFFLFlBQVksRUFBRSxNQUFNLEVBQUUsUUFBUSxDQUFDLENBQUMsT0FBTyxDQUMvQyxPQUFPLENBQUMsWUFBWSxFQUFFLENBQ3ZCLEtBQUssQ0FBQyxDQUFDLEVBQ1I7b0JBQ0EsT0FBTyxDQUFDLEtBQUssRUFBRSxDQUFDO2lCQUNqQjtxQkFBTTtvQkFDTCxPQUFPLENBQUMsR0FBRyxDQUFDLG1CQUFtQixDQUFDLENBQUM7b0JBQ2pDLE9BQU8sQ0FBQyxRQUFRLENBQUM7d0JBQ2YsTUFBTSxFQUFFLE1BQU07d0JBQ2QsUUFBUSxFQUFFLElBQUksQ0FBQyxTQUFTLENBQUM7NEJBQ3ZCLENBQUMsS0FBSyxDQUFDLEVBQUUsRUFBRTt5QkFDWixDQUFDO3dCQUNGLE9BQU8sa0NBQ0YsT0FBTyxDQUFDLE9BQU8sRUFBRSxLQUNwQixjQUFjLEVBQUUsa0JBQWtCLEdBQ25DO3FCQUNGLENBQUMsQ0FBQztpQkFDSjtZQUNILENBQUMsQ0FBQyxDQUFDO1lBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxFQUFFLENBQUMsZUFBZSxFQUFFLENBQUMsT0FBWSxFQUFFLEVBQUU7Z0JBQzdDLE9BQU8sQ0FBQyxHQUFHLENBQUMsT0FBTyxDQUFDLEdBQUcsRUFBRSxHQUFHLEdBQUcsR0FBRyxPQUFPLENBQUMsT0FBTyxFQUFFLENBQUMsU0FBUyxDQUFDLENBQUM7WUFDakUsQ0FBQyxDQUFDLENBQUM7WUFDSCxJQUFJLENBQUMsZUFBZSxHQUFHLGVBQWUsQ0FBQztRQUN6QyxDQUFDO0tBQUE7SUFFSyxvQkFBb0I7O1lBQ3hCLE9BQU8sQ0FBQyxHQUFHLENBQUMsZ0JBQWdCLENBQUMsQ0FBQztZQUM5QixNQUFNLElBQUksR0FBRyxrREFBa0QsQ0FBQztZQUNoRSxNQUFNLFNBQVMsR0FBRyxlQUFlLENBQUMsU0FBUyxFQUFFLENBQUM7WUFDOUMsTUFBTSxZQUFZLEdBQUcsRUFBRSxXQUFXLEVBQUUsSUFBSSxFQUFFLFVBQVUsRUFBRSxJQUFJLEVBQUUsQ0FBQztZQUM3RCxJQUFJO2dCQUNGLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxZQUFZLENBQUMsU0FBUyxDQUFDLENBQUM7Z0JBQ3hDLE9BQU8sQ0FBQyxHQUFHLENBQUMsaUJBQWlCLEVBQUUsSUFBSSxDQUFDLENBQUM7Z0JBQ3JDLE1BQU0sSUFBSSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksQ0FBQyxJQUFJLENBQUMsSUFBSSxFQUFFLElBQUksQ0FBQyxXQUFXLENBQUMsQ0FBQztnQkFDMUQsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLGVBQWUsQ0FBQyxJQUFJLENBQUMsZUFBZSxDQUFDLENBQUM7Z0JBQ3RELFlBQVksQ0FBQyxVQUFVLEdBQUcsTUFBTSxJQUFJLENBQUMsSUFBSSxDQUFDLE9BQU8sRUFBRSxDQUFDO2dCQUNwRCxJQUFJLENBQUMsWUFBWSxHQUFHLE1BQU0sSUFBSSxDQUFDLElBQUksRUFBRSxDQUFDO2dCQUN0QyxPQUFPLElBQUksQ0FBQyxZQUFZLENBQUM7YUFDMUI7WUFBQyxPQUFPLEtBQUssRUFBRTtnQkFDZCxZQUFZLENBQUMsV0FBVyxHQUFHLEtBQUssQ0FBQztnQkFDakMsT0FBTyxDQUFDLEdBQUcsQ0FBQyxLQUFLLENBQUMsQ0FBQztnQkFDbkIsT0FBTyxLQUFLLENBQUM7YUFDZDtZQUNELElBQUksSUFBSSxDQUFDLGVBQWUsRUFBRTtnQkFDeEIsSUFBSSxDQUFDLEtBQUssRUFBRSxDQUFDO2FBQ2Q7UUFDSCxDQUFDO0tBQUE7SUFFRCxLQUFLO1FBQ0gsSUFBSSxDQUFDLElBQUksQ0FBQyxPQUFPLEVBQUU7WUFDakIsSUFBSSxDQUFDLE9BQU8sQ0FBQyxLQUFLLEVBQUUsQ0FBQztTQUN0QjtJQUNILENBQUM7Q0FDRjtBQTVGRCw0Q0E0RkMifQ==