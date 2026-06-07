const templateBackgroundTolerance = 22;

const isTemplateBackgroundPixel = (red: number, green: number, blue: number, alpha: number): boolean =>
  alpha <= 8
  || (
    red >= 255 - templateBackgroundTolerance
    && green >= 255 - templateBackgroundTolerance
    && blue >= 255 - templateBackgroundTolerance
  );

export const processTemplateImage = async (dataUrl: string): Promise<string> => {
  const image = new Image();
  image.src = dataUrl;
  await image.decode();

  const canvas = document.createElement("canvas");
  canvas.width = image.naturalWidth;
  canvas.height = image.naturalHeight;
  const context = canvas.getContext("2d");
  if (!context) {
    return dataUrl;
  }

  context.drawImage(image, 0, 0);
  const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
  const pixels = imageData.data;
  const visited = new Uint8Array(canvas.width * canvas.height);
  const queue: Array<[number, number]> = [];
  const enqueue = (x: number, y: number) => {
    if (x < 0 || y < 0 || x >= canvas.width || y >= canvas.height) {
      return;
    }
    const pixelIndex = y * canvas.width + x;
    if (visited[pixelIndex]) {
      return;
    }
    const dataIndex = pixelIndex * 4;
    const red = pixels[dataIndex] ?? 0;
    const green = pixels[dataIndex + 1] ?? 0;
    const blue = pixels[dataIndex + 2] ?? 0;
    const alpha = pixels[dataIndex + 3] ?? 0;
    if (!isTemplateBackgroundPixel(red, green, blue, alpha)) {
      return;
    }
    visited[pixelIndex] = 1;
    queue.push([x, y]);
  };

  for (let x = 0; x < canvas.width; x += 1) {
    enqueue(x, 0);
    enqueue(x, canvas.height - 1);
  }
  for (let y = 0; y < canvas.height; y += 1) {
    enqueue(0, y);
    enqueue(canvas.width - 1, y);
  }

  for (let index = 0; index < queue.length; index += 1) {
    const [x, y] = queue[index] ?? [0, 0];
    enqueue(x + 1, y);
    enqueue(x - 1, y);
    enqueue(x, y + 1);
    enqueue(x, y - 1);
  }

  for (let pixelIndex = 0; pixelIndex < visited.length; pixelIndex += 1) {
    if (visited[pixelIndex]) {
      pixels[(pixelIndex * 4) + 3] = 0;
    }
  }
  context.putImageData(imageData, 0, 0);
  return canvas.toDataURL("image/png");
};

export const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        resolve(reader.result);
      } else {
        reject(new Error("图片读取失败。"));
      }
    };
    reader.onerror = () => reject(new Error("图片读取失败。"));
    reader.readAsDataURL(file);
  });

export const processButtonBaseDesign = async (design: {
  sourceDataUrl: string;
  templateId: string;
  scalingMode: "fixedAspect" | "nineSlice";
  slice?: { top: number; right: number; bottom: number; left: number };
}) => ({
  ...design,
  sourceDataUrl: await processTemplateImage(design.sourceDataUrl),
});

export const processStretchVisualDesign = async (design: {
  templateId: string;
  sourceDataUrl: string;
  frame?: { x: number; y: number; width: number; height: number };
}) => ({
  ...design,
  sourceDataUrl: await processTemplateImage(design.sourceDataUrl),
});
