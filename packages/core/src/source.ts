export class DDUIXSourcePosition {
  static readonly Internal = new DDUIXSourcePosition(-1, -1, -1);

  constructor(
    public offset: number,
    public line: number,
    public character: number,
  ) {}
}

export class DDUIXSource {
  static readonly Internal = new this(
    "",
    DDUIXSourcePosition.Internal,
    DDUIXSourcePosition.Internal,
  );

  constructor(
    public file: string,
    public start: DDUIXSourcePosition,
    public end: DDUIXSourcePosition,
  ) {}
}
