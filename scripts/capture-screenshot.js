const puppeteer = require("puppeteer-core");
const path = require("path");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    headless: "new",
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });

  const page = await browser.newPage();
  await page.setViewport({
    width: 390,
    height: 844,
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });

  page.on("console", (msg) => console.log("PAGE LOG:", msg.text()));
  page.on("pageerror", (err) => console.log("PAGE ERROR:", err.message));

  console.log("Navigating to http://localhost:8081...");
  await page.goto("http://localhost:8081", {
    waitUntil: "networkidle0",
    timeout: 30000,
  });

  // Wait extra 3 seconds for React Native web bundle and images to render
  await new Promise((r) => setTimeout(r, 3000));

  const domSummary = await page.evaluate(() => {
    const root = document.getElementById("root");
    const styleTags = Array.from(document.querySelectorAll("style")).map((s) => s.textContent?.slice(0, 100));
    const firstText = document.querySelector("div, span, p");
    return {
      styleTagsCount: styleTags.length,
      styleTagsSample: styleTags,
      firstTextClasses: firstText?.className,
      bodyHtml: root?.innerHTML?.slice(0, 500),
    };
  });
  console.log("DOM Summary:", JSON.stringify(domSummary, null, 2));

  const outputPath = path.resolve(__dirname, "../assets/auth-screenshot.png");
  await page.screenshot({ path: outputPath, type: "png" });
  console.log("Screenshot saved to:", outputPath);

  await browser.close();
})();
