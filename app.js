const input = document.getElementById("fileInput");
const btn = document.getElementById("generateBtn");
const preview = document.getElementById("preview");
const downloadICO = document.getElementById("downloadICO");

btn.onclick = async () => {

  if (!input.files.length) {
    alert("Select an image first 🙂");
    return;
  }

  const file = input.files[0];
  const imgURL = URL.createObjectURL(file);

  const img = new Image();
  img.src = imgURL;

  img.onload = async () => {

    preview.innerHTML = "";     // clear old preview

    const sizes = [16, 32, 48, 64, 128, 256];
    const pngBuffers = [];

    for (const size of sizes) {

      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;

      const ctx = canvas.getContext("2d");

      // clear & draw source to avoid blank white icon
      ctx.clearRect(0, 0, size, size);

      // keep aspect ratio centered
      const ratio = Math.min(size / img.width, size / img.height);
      const w = img.width * ratio;
      const h = img.height * ratio;
      const x = (size - w) / 2;
      const y = (size - h) / 2;

      ctx.drawImage(img, x, y, w, h);

      // show preview
      const url = canvas.toDataURL("image/png");
      preview.innerHTML = `<img src="${url}">`;

      sizeText.textContent = "Generated Size: " + size + " x " + size;

      imgBlobURL = url;

      downloadBtn.style.display = "inline-block";
    };
    img.src = e.target.result;
  };
  reader.readAsDataURL(file);
};

downloadBtn.onclick = () => {
  const a = document.createElement("a");
  a.href = imgBlobURL;
  a.download = "favicon.png"; // safe
  a.click();
};
