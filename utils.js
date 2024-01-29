const generateCanvas = async (uri) => {
  const qrCodeUrl = await qr.toDataURL(uri, { type: "png" });

  const canvas = Canvas.createCanvas(244, 244);
  const ctx = canvas.getContext("2d");

  const image = await Canvas.loadImage(qrCodeUrl);
  ctx.drawImage(image, 0, 0, canvas.width, canvas.height);

  const attachment = new AttachmentBuilder(await canvas.encode("png"), {
    name: "image.png",
  });

  return attachment;
};

const isAdmin = (user) => {
  return user.permissions.has("ADMINISTRATOR");
};

module.exports = {
  generateCanvas,
  isAdmin,
};
