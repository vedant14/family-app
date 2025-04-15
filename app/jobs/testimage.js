import puppeteer from "puppeteer";
import sharp from "sharp";
import fs from "fs";

const htmlContent = `
  <html>
    <head>
      <style>
        body {
          width: 800px;
          height: 480px;
          margin: 0;
          display: grid;
          place-items: center;
          font-family: sans-serif;
          background: white;
        }
        .container {
          width: 90%;
          border: 1px solid black;
          padding: 20px;
          text-align: center;
        }
        h1 {
          font-size: 24px;
          margin: 0 0 10px 0;
        }
        p {
          margin: 4px 0;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>My Poem</h1>
        <p>Roses are red,</p>
        <p>Violets are blue,</p>
        <p>This is an image,</p>
        <p>Rendered just for you.</p>
      </div>
    </body>
  </html>
`;

async function renderToBMP() {
  const browser = await puppeteer.launch();
  const page = await browser.newPage();

  await page.setViewport({ width: 800, height: 480, deviceScaleFactor: 1 });
  await page.setContent(htmlContent, { waitUntil: "networkidle0" });

  const pngBuffer = await page.screenshot({ fullPage: false });

  await browser.close();

  // Just pipe it to a BMP without specifying the format explicitly
  await sharp(pngBuffer).toFile("output.bmp");

  console.log("✅ BMP saved as output.bmp");
}

renderToBMP().catch((err) => {
  console.error("❌ Error:", err);
});
