export const layerId = (publicId: string) => publicId.replaceAll("/", ":");
const text = (s: string) => encodeURIComponent(s).replaceAll("%2C", "%252C").replaceAll("%2F", "%252F");

export function urls(cloudName: string) {
  const base = `https://res.cloudinary.com/${cloudName}/image/upload`;
  const composite = (beforeId: string, afterId: string, w: number) =>
    [
      `c_fill,w_${w},h_${w}`,
      `c_pad,w_${w * 2},h_${w},g_west`,
      `l_${layerId(afterId)},c_fill,w_${w},h_${w}`,
      `fl_layer_apply,g_east`,
    ].join("/");

  return {
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
