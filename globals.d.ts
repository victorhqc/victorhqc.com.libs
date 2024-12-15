declare global {
  interface Window {
    PhotoStack: typeof PhotoStack;
  }

  class PhotoStack {
    constructor(options: Options);
    init(): Promise<void>;
  }

  interface Options {
    stackSelector: string;
    slideSelector: string;
    zAxisChange: number;
    yAxisChange: number;
  }
}

export {};
