export const layerId = (publicId: string) => publicId.replaceAll("/", ":");
const text = (s: string) => encodeURIComponent(s).replaceAll("%2C", "%252C").replaceAll("%2F", "%252F");

export function urls(cloudName: string = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "demo") {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const videoBase = `https://res.cloudinary.com/${cloudName}/video/upload`;
  const CARD_TILE = 600;
  const CARD_BAND = 80;
  const composite = (beforeId: string, afterId: string, w: number) =>
    [
      // Effects applied after layers are flattened do not reach faces in overlays, so pixelate each layer itself.
      `e_pixelate_faces:20/c_fill,w_${w},h_${w}`,
      `c_pad,w_${w * 2},h_${w},g_west`,
      `l_${layerId(afterId)}/e_pixelate_faces:20/c_fill,w_${w},h_${w}`,
      `fl_layer_apply,g_east`,
    ].join("/");

  return {
    video: (id: string) => `${videoBase}/f_auto,q_auto/${id}`,
    /** One share-ready image: 1–3 evidence frames side by side, timestamped, with a disclosure band. */
    campaignCard: (x: { frames: { assetId: string; label: string }[]; footer: string }) => {
      if (x.frames.length < 1 || x.frames.length > 3) throw new Error("A campaign card needs one to three frames.");
      const w = CARD_TILE;
      const [first, ...rest] = x.frames;
      return [
        base,
        `e_pixelate_faces:20/c_fill,g_auto,w_${w},h_${w}`,
        `c_lpad,w_${w * x.frames.length},h_${w + CARD_BAND},g_north_west,b_rgb:111111`,
        ...rest.map((f, i) => `l_${layerId(f.assetId)}/e_pixelate_faces:20/c_fill,g_auto,w_${w},h_${w}/fl_layer_apply,g_north_west,x_${w * (i + 1)},y_0`),
        ...x.frames.map(
          (f, i) => `l_text:Arial_26_bold:${text(f.label)},co_white,b_rgb:00000099/fl_layer_apply,g_north_west,x_${w * i + 16},y_${w - 50}`
        ),
        `l_text:Arial_22:${text(x.footer)},co_white/fl_layer_apply,g_south,y_26`,
        `e_pixelate_faces:20/f_auto,q_auto`,
        first!.assetId,
      ].join("/");
    },
    plate: (id: string, w: number) => `${base}/c_limit,w_${w}/f_auto,q_auto/${id}`,
    publicPlate: (id: string, w: number) => `${base}/c_limit,w_${w}/e_pixelate_faces:20/f_auto,q_auto/${id}`,
    thumb: (id: string, px = 112) => `${base}/c_fill,g_auto,w_${px},h_${px}/f_auto,q_auto/${id}`,
    ghost: (id: string, w: number) => `${base}/c_limit,w_${w}/e_grayscale/o_100/f_auto,q_auto/${id}`,
    sideBySide: (x: { beforeId: string; afterId: string; beforeLabel: string; afterLabel: string }, w = 800) =>
      [
        base,
        composite(x.beforeId, x.afterId, w),
        `l_text:Arial_28_bold:${text(x.beforeLabel)},co_white,b_rgb:00000099/fl_layer_apply,g_south_west,x_16,y_16`,
        `l_text:Arial_28_bold:${text(x.afterLabel)},co_white,b_rgb:00000099/fl_layer_apply,g_south_east,x_16,y_16`,
        `e_pixelate_faces:20/f_auto,q_auto`,
        x.beforeId,
      ].join("/"),
    social: (x: { beforeId: string; afterId: string }, ratio: "1:1" | "9:16" | "4:5", w = 800) =>
      [base, composite(x.beforeId, x.afterId, w), `c_fill,ar_${ratio},g_auto`, `e_pixelate_faces:20/f_auto,q_auto`, x.beforeId].join("/"),
  };
}
