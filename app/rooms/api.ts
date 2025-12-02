import axios from "axios";
import { Room } from "@/types/room.types";

type FetchRoomsParams = {
  setIsLoading: (loading: boolean) => void;
  setRooms: (rooms: Room[]) => void;
};

const fetchRooms = async ({ setIsLoading, setRooms }: FetchRoomsParams) => {
  setIsLoading(true);
  try {
    // Fetch all rooms - filtering will be done locally
    const response = await axios.get(`/api/rooms?filter=all`);
    const data = response.data;
    setRooms(data.rooms || []);
  } catch (error) {
    console.error("Error fetching rooms:", error);
  } finally {
    setIsLoading(false);
  }
};

export { fetchRooms };
