import { server } from "./app.js";
import { connect_to_db } from "./utils/db.js";

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
  connect_to_db();
  console.log(`Server is running on port ${PORT}`);
});