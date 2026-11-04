import { DDUIXPunctuation } from "./punctuation";
import { DDUIXSource } from "./source";

export class DDUIXColor {
  public alpha?: number;
  public source: DDUIXSource;

  constructor(red: number, green: number, blue: number, source: DDUIXSource);
  constructor(red: number, green: number, blue: number, alpha: number, source: DDUIXSource);
  constructor(
    public red: number,
    public green: number,
    public blue: number,
    alphaOrSource: number | DDUIXSource,
    source?: DDUIXSource,
  ) {
    if (alphaOrSource instanceof DDUIXSource) {
      this.source = alphaOrSource;
    } else {
      this.alpha = alphaOrSource;
      this.source = source!;
    }
  }

  toString() {
    let hex = DDUIXPunctuation.Hash + toHex(this.red) + toHex(this.green) + toHex(this.blue);

    if (this.alpha !== undefined) {
      hex += toHex(this.alpha);
    }

    return hex;
  }
}

function toHex(value: number) {
  return value.toString(16).padStart(2, "0");
}
