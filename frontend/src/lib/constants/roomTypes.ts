export const FRONTEND_TO_BACKEND_ROOM_TYPE: Record<string, string> = {
  single: "PHONG_TRO",
  shared: "NGAN_GIAN",
  apartment: "CHUNG_CU",
  studio: "CHUNG_CU_MINI",
  house: "NHA_NGUYEN_CAN",
};

export const BACKEND_TO_FRONTEND_ROOM_TYPE: Record<string, string> = {
  PHONG_TRO: "single",
  NGAN_GIAN: "shared",
  CHUNG_CU: "apartment",
  CHUNG_CU_MINI: "studio",
  NHA_NGUYEN_CAN: "house",
};
