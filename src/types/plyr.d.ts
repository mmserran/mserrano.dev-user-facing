// plyr ships no bundled TypeScript types and there's no @types/plyr package -
// this is a minimal ambient declaration covering only the surface
// ImageTextVideo.tsx actually uses (construct against a media element, tear
// down on unmount).
declare module "plyr" {
  export default class Plyr {
    constructor(target: HTMLMediaElement, options?: Record<string, unknown>);
    destroy(): void;
  }
}

declare module "plyr/dist/plyr.css";
