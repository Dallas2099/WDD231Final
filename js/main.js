import { fetchJSON } from "./api.js";
import { initUI } from "./ui.js";

(async function bootstrap(){
  const [bikes, types] = await Promise.all([
    fetchJSON("./data/bikes.json"),
    fetchJSON("./data/service-types.json")
  ]);
  initUI({ seedBikes: bikes, seedTypes: types });
})();
