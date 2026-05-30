import { z } from "zod";

/** GeoJSON Point: coordinates are `[longitude, latitude]`. */
export const geoJsonPointSchema = z
  .object({
    type: z.literal("Point"),
    coordinates: z.tuple([
      z.number().min(-180).max(180),
      z.number().min(-85).max(85),
    ]),
  })
  .strict();

export type GeoJsonPoint = z.infer<typeof geoJsonPointSchema>;
