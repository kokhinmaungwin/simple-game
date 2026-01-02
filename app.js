const input = document.getElementById("fileInput");
const btn = document.getElementById("generateBtn");
const preview = document.getElementById("preview");
const downloadICO = document.getElementById("downloadICO");

btn.onclick = async () => {
  if(!input.files[0]){
    alert("Choose an image first");
    return;
  }

  const file = input.files[0];
  const bitmap = await createImageBitmap(file);

  const sizes = [16, 32, 48, 64, 128, 256];
  const pngBuffers = [];
  preview.innerHTML = "";

  for(const size of sizes){
    const canvas = document.createElement("canvas");
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(bitmap, 0, 0, size, size);

    const url = canvas.toDataURL("image/png");
    const img = document.createElement("img");
    img.src = url;
    img.width = size;
    img.height = size;
    preview.appendChild(img);

    const bin = await (await fetch(url)).arrayBuffer();
    pngBuffers.push(new Uint8Array(bin));
  }

  // create ICO
  const icoBuffer = await ICO.encode(pngBuffers);
  const blob = new Blob([icoBuffer], {type: "image/x-icon"});

  downloadICO.style.display = "inline-block";
  downloadICO.onclick = () => {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = "favicon.ico";
    a.click();
  };
};
