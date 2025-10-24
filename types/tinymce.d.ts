declare module "tinymce" {
  export interface Editor {
    on(event: string, callback: (...args: any[]) => void): void;
    getBody(): HTMLElement & { style: CSSStyleDeclaration };
    dom: {
      setAttrib(node: Element, attr: string, value: string): void;
    };
  }
}
