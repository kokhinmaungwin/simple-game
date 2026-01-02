function createBMPFromCanvas(canvas, size) {
  const tmp = document.createElement("canvas");
  tmp.width = size;
  tmp.height = size;
  const tctx = tmp.getContext("2d");

  // ပုံကို resize ဆွဲ
  tctx.clearRect(0, 0, size, size);
  tctx.drawImage(canvas, 0, 0, size, size);

  const imgData = tctx.getImageData(0, 0, size, size);
  const pixels = imgData.data;

  // BMP row size = each row aligned to 4 bytes boundary
  const rowSize = Math.floor((24 * size + 31) / 32) * 4;
  const imageSize = rowSize * size;
  const fileSize = 54 + imageSize;

  const buffer = new ArrayBuffer(fileSize);
  const dv = new DataView(buffer);

  // BMP Header
  dv.setUint16(0, 0x4d42, true);           // BM
  dv.setUint32(2, fileSize, true);         // File size
  dv.setUint32(6, 0, true);                 // Reserved
  dv.setUint32(10, 54, true);               // Pixel data offset
  // DIB header
  dv.setUint32(14, 40, true);               // DIB header size
  dv.setInt32(18, size, true);              // Width
  dv.setInt32(22, -size, true);             // Height (negative for top-down bitmap)
  dv.setUint16(26, 1, true);                // Planes
  dv.setUint16(28, 24, true);               // Bits per pixel
  dv.setUint32(30, 0, true);                // Compression (0 = none)
  dv.setUint32(34, imageSize, true);        // Image size
  dv.setInt32(38, 0, true);                 // X pixels per meter
  dv.setInt32(42, 0, true);                 // Y pixels per meter
  dv.setUint32(46, 0, true);                // Colors used
  dv.setUint32(50, 0, true);                // Important colors

  let offset = 54;
  for (let y = 0; y < size; y++) {
    let rowOffset = offset + y * rowSize;
    for (let x = 0; x < size; x++) {
      const pxIndex = (y * size + x) * 4;
      // BMP format stores pixels in BGR order, ignoring alpha
      dv.setUint8(rowOffset++, pixels[pxIndex + 2]); // Blue
      dv.setUint8(rowOffset++, pixels[pxIndex + 1]); // Green
      dv.setUint8(rowOffset++, pixels[pxIndex]);     // Red
    }
    // Padding zeros for row alignment
    while ((rowOffset - offset) % rowSize !== 0) {
      dv.setUint8(rowOffset++, 0);
    }
  }

  return new Uint8Array(buffer);
}

document.getElementById("generateBtn").onclick = () => {
  const fileInput = document.getElementById("fileInput");
  if (!fileInput.files.length) {
    alert("Choose an image first 😄");
    return;
  }

  const sizes = [16, 32, 48, 64, 128, 256];  // fixed sizes example
  const file = fileInput.files[0];
  const img = new Image();
  img.src = URL.createObjectURL(file);

  img.onload = () => {
    const baseCanvas = document.createElement("canvas");
    baseCanvas.width = 256;
    baseCanvas.height = 256;
    const ctx = baseCanvas.getContext("2d");
    ctx.clearRect(0, 0, 256, 256);

    // maintain aspect ratio and center
    const ratio = Math.min(256 / img.width, 256 / img.height);
    const w = img.width * ratio;
    const h = img.height * ratio;
    const x = (256 - w) / 2;
    const y = (256 - h) / 2;

    ctx.drawImage(img, x, y, w, h);

    // create BMP images for each size
    const bmps = sizes.map(s => createBMPFromCanvas(baseCanvas, s));

    // ICO header
    const iconCount = bmps.length;
    const headerSize = 6 + 16 * iconCount;
    let imageOffset = headerSize;

    const totalSize = headerSize + bmps.reduce((a,b) => a + b.length, 0);
    const buffer = new ArrayBuffer(totalSize);
    const dv = new DataView(buffer);

    dv.setUint16(0, 0, true);        // Reserved
    dv.setUint16(2, 1, true);        // Image type (icon)
    dv.setUint16(4, iconCount, true);// Number of images

    let offset = 6;
    bmps.forEach((bmp, i) => {
      const size = sizes[i];
      dv.setUint8(offset++, size === 256 ? 0 : size); // Width
      dv.setUint8(offset++, size === 256 ? 0 : size); // Height
      dv.setUint8(offset++, 0); // Color palette
      dv.setUint8(offset++, 0); // Reserved
      dv.setUint16(offset, 1, true); offset += 2;  // Color planes
      dv.setUint16(offset, 24, true); offset += 2; // Bits per pixel
      dv.setUint32(offset, bmp.length, true); offset += 4; // Size of bmp data
      dv.setUint32(offset, imageOffset, true); offset += 4; // Offset of bmp data

      new Uint8Array(buffer, imageOffset, bmp.length).set(bmp);
      imageOffset += bmp.length;
    });

    const blob = new Blob([buffer], { type: "image/x-icon" });
    const icoURL = URL.createObjectURL(blob);

    const downloadICO = document.getElementById("downloadICO");
    downloadICO.style.display = "inline-block";

    downloadICO.onclick = () => {
      const a = document.createElement("a");
      a.href = icoURL;
      a.download = "favicon.ico";
      a.click();
    };
  };
};