import { describe, expect, it } from "bun:test";
import { Collector } from "./collector";
import { Readable } from "stream";

const chunkSize = 1024 * 16; // 16 kb
const bigData = Buffer.from(Array(chunkSize * 5).fill("a"));

const createResponse = () =>
  new Response(
    new ReadableStream({
      async start(controller) {
        console.log("Start");
        const chunksNum = Math.ceil(bigData.length / chunkSize);
        console.log("chunksNum", chunksNum);

        for (let i = 0; i < chunksNum; i++) {
          console.log(`sending chunk ${i}`);
          const start = i * chunkSize;
          controller.enqueue(bigData.subarray(start, start + chunkSize));
        }

        controller.close();
      },
    }),
    {
      headers: {
        "content-length": bigData.length.toString(),
      },
    },
  );

describe("pipe-on-ReadableFromWeb", () => {
  it(`should return body`, async () => {
    const data = await new Promise<string>((resolve, reject) => {
      const collector = new Collector();
      const response = Readable.fromWeb(createResponse().body!);
      response.pipe(collector);
      response.on("error", (err) => {
        console.log("stream error", err);
        collector.end();
        reject(err);
      });
      response.on("data", (chunk) => {
        console.log("response chunk", chunk.length);
      });
      response.on("close", () => {
        console.log("response close");
      });
      collector.on("drain", () => {
        console.log("collector drain");
      });
      collector.on("error", reject);
      collector.on("finish", () => {
        console.log("collector finish");
        const result = Buffer.concat(collector.bufferedBytes).toString("utf8");
        resolve(result);
      });
    });

    expect(data).toBeDefined();
    expect(data.length).toEqual(chunkSize * 5);
  });
});
