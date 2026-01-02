 // ICO generation logic

  function createBMPFromCanvas(canvas, size) {
    const ctx = canvas.getContext("2d");
    const tmp = document.createElement("canvas");
    tmp.width = size;
    tmp.height = size;
    const tctx = tmp.getContext("2d");
    tctx.clearRect(0, 0, size, size);
    tctx.drawImage(canvas, 0, 0, size, size);

    const imgData = tctx.getImageData(0, 0, size, size);
    const pixels = imgData.data;

    const rowSize = Math.ceil((24 * size + 31) / 32) * 4;
    const imageSize = rowSize * size;
    const fileSize = 54 + imageSize;

    const buffer = new ArrayBuffer(fileSize);
    const dv = new DataView(buffer);

    dv.setUint16(0, 0x4d42, true); 
    dv.setUint32(2, fileSize, true); 
    dv.setUint32(10, 54, true); 
    dv.setUint32(14, 40, true); 
    dv.setInt32(18, size, true); 
    dv.setInt32(22, -size, true); 
    dv.setUint16(26, 1, true); 
    dv.setUint16(28, 24, true); 
    dv.setUint32(34, imageSize, true); 

    let offset = 54;
    let i = 0;
    for (let y = 0; y < size; y++) {
      for (let x = 0; x < size; x++) {
        dv.setUint8(offset++, pixels[i + 2]); 
        dv.setUint8(offset++, pixels[i + 1]); 
        dv.setUint8(offset++, pixels[i]); 
        i += 4;
      }
      while ((offset - 54) % rowSize) dv.setUint8(offset++, 0);
    }
    return new Uint8Array(buffer);
  }

  const fileInput = document.getElementById("fileInput");
  const generateBtn = document.getElementById("generateBtn");
  const downloadICO = document.getElementById("downloadICO");
  const previewDiv = document.getElementById("preview");
  const outputDiv = document.getElementById("output");
  const baseCanvas = document.getElementById("canvas");

  let icoURL = null;

  generateBtn.onclick = () => {
    if (!fileInput.files.length) {
      alert("Choose an image first 😄");
      return;
    }

    const sizes = [16, 32, 48, 64, 128, 256];
    const file = fileInput.files[0];
    const img = new Image();
    img.src = URL.createObjectURL(file);

    img.onload = () => {
      baseCanvas.width = 256;
      baseCanvas.height = 256;
      const ctx = baseCanvas.getContext("2d");
      ctx.clearRect(0, 0, 256, 256);

      const ratio = Math.min(256 / img.width, 256 / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (256 - w) / 2;
      const y = (256 - h) / 2;

      ctx.drawImage(img, x, y, w, h);

      previewDiv.innerHTML = "";
      const bmps = sizes.map((s) => createBMPFromCanvas(baseCanvas, s));

      // ICO header
      const iconCount = bmps.length;
      const headerSize = 6 + 16 * iconCount;
      let imageOffset = headerSize;

      const totalSize =
        headerSize + bmps.reduce((a, b) => a + b.length, 0);
      const buffer = new ArrayBuffer(totalSize);
      const dv = new DataView(buffer);

      dv.setUint16(0, 0, true); 
      dv.setUint16(2, 1, true); 
      dv.setUint16(4, iconCount, true); 

      let offset = 6;
      bmps.forEach((bmp, i) => {
        const size = sizes[i];
        dv.setUint8(offset++, size === 256 ? 0 : size); 
        dv.setUint8(offset++, size === 256 ? 0 : size); 
        dv.setUint8(offset++, 0); 
        dv.setUint8(offset++, 0); 
        dv.setUint16(offset, 1, true);
        offset += 2; 
        dv.setUint16(offset, 24, true);
        offset += 2; 
        dv.setUint32(offset, bmp.length, true);
        offset += 4; 
        dv.setUint32(offset, imageOffset, true);
        offset += 4; 

        new Uint8Array(buffer, imageOffset, bmp.length).set(bmp);
        imageOffset += bmp.length;

        // Preview image element
        const blob = new Blob([bmp], { type: "image/bmp" });
        const url = URL.createObjectURL(blob);
        const imgPreview = document.createElement("img");
        imgPreview.src = url;
        imgPreview.width = size;
        imgPreview.height = size;
        previewDiv.appendChild(imgPreview);
      });

      icoURL = URL.createObjectURL(new Blob([buffer], { type: "image/x-icon" }));

      downloadICO.style.display = "inline-block";

      outputDiv.innerHTML = `Generated ICO file with sizes: ${sizes.join(", ")} px<br>
                             Total file size: ${(buffer.byteLength / 1024).toFixed(2)} KB`;
    };
  };

  downloadICO.onclick = () => {
    if (!icoURL) return;
    const a = document.createElement("a");
    a.href = icoURL;
    a.download = "favicon.ico";
    a.click();
  };