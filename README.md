# Neon / After — Cover Lab

An original, offline browser studio for turning personal photos into neon-soaked, multi-panel city cover art. It uses the competition kit's two locally stored, image-model-made demo photographs and a hand-drawn canvas treatment. It uses no official game artwork or logos. The bundled Archivo and Archivo Black typefaces are licensed under SIL OFL 1.1; their license notices are in `app/fonts/`.

## Use

Open `app/index.html` in desktop Chrome, or serve the `app/` directory with any static HTTP server. There is no build step and no network dependency. Demo photos are included for an immediate preview. Add one or more JPG, PNG, or WebP files with **Add your photos**; images are decoded in the browser and never sent to a server.

Choose one of three layouts and one of three colour treatments, select a frame, and pick which photo it shows. Drag a photo inside a frame or use the zoom and position sliders to reframe it. Edit the headline and optional second line. Export at 1080 × 1080, 1080 × 1350, or 1920 × 1080; the download is a full-resolution PNG.

## Local development and hand-in

Requires Node.js 22, as provided by the competition kit.

```sh
node serve.ts
```

Open `http://localhost:8080`. To create a competition output folder, set `MAKEFUN_OUTPUT_DIR` and run the required root entry point:

```sh
MAKEFUN_OUTPUT_DIR=out node main.ts
```

The entry point copies `app/` and `screenshots/` and writes `dossier.json` with the unmodified `vendor/makefun-app.ts` supplied by the official kit. Replace the screenshots with the final 3–4 app captures before submission.

## Credits and license

The demo photos `app/samples/pier.jpg` and `app/samples/boulevard.jpg` are from the official competition starter kit, which identifies them as image-model-made and free to use. `vendor/makefun-app.ts` is the kit's required, unchanged dossier library. Original application code and design are licensed under the MIT License in `LICENSE`.
