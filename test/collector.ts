import { Writable } from "stream";

export class Collector extends Writable {
  public bufferedBytes: Uint8Array[] = [];

  _write(chunk: Uint8Array, encoding: string, callback: () => void) {
    console.log("collector write", chunk.length);
    this.bufferedBytes.push(chunk);
    callback();
  }
}
