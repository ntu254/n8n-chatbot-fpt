import AsyncStorage from "@react-native-async-storage/async-storage";

const KEY = "tua_session_id";

function randomId() {
  // Simple RFC4122-like random id (not cryptographically secure)
  const rnd = () => Math.floor((1 + Math.random()) * 0x10000).toString(16).substring(1);
  return `${rnd()}${rnd()}-${rnd()}-${rnd()}-${rnd()}-${rnd()}${rnd()}${rnd()}`;
}

export async function getOrCreateSessionId(): Promise<string> {
  let id = await AsyncStorage.getItem(KEY);
  if (!id) {
    id = randomId();
    await AsyncStorage.setItem(KEY, id);
  }
  return id;
}