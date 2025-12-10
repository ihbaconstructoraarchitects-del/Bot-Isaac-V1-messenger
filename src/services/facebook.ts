import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const ACCESS_TOKEN = process.env.ACCESS_TOKEN;

// Obtiene nombre del usuario por su PSID
export async function getUserName(psid: string): Promise<string | null> {
  try {
    const res = await axios.get(
      `https://graph.facebook.com/${psid}`,
      {
        params: {
          fields: "first_name,last_name",
          access_token: ACCESS_TOKEN
        }
      }
    );

    const data = res.data;

    return `${data.first_name ?? ""} ${data.last_name ?? ""}`.trim();

  } catch (err: any) {
    console.error("❌ Error obteniendo nombre del usuario:", err.response?.data || err);
    return null;
  }
}
