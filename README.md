# music-downloader

Command line utility to download music from YouTube

## Installation

### [NPM](https://www.npmjs.com/)

```bash
npm i -g music-downloader
```

### [Yarn](https://yarnpkg.com/)

```bash
yarn global add music-downloader
```

## Usage

1. Run `music-downloader` in a console.
2. You will be prompted for a text file to load videos from.
3. Specify where a pre-existing directory to save audio to.
4. Wait for all downloads to complete.

### Accepted videos

Videos are loaded from a text file you specify. The file must end in the `txt` extension and have one video ID resolvable per line. A video ID resolvable is a YouTube.com URL, youtu.be URL, video ID. Duplicates are filtered out on execution, the file will not be modified.
