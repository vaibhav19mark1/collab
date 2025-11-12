import axios from "axios";
import { Room } from "@/types/room.types";

type FetchRoomsParams = {
  setIsLoading: (loading: boolean) => void;
  setRooms: (rooms: Room[]) => void;
  filter: string;
};

const fetchRooms = async ({
  setIsLoading,
  setRooms,
  filter,
}: FetchRoomsParams) => {
  setIsLoading(true);
  try {
    const response = await axios.get(`/api/rooms?filter=${filter}`);
    const data = response.data;
    setRooms(data.rooms || []);
  } catch (error) {
    console.error("Error fetching rooms:", error);
  } finally {
    setIsLoading(false);
  }
};

export { fetchRooms };
