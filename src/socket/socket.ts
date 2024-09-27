// import { Server } from "socket.io";

// export const setupSocketIO = (server: any) => {
//   const io = new Server(server, { cors: { origin: "*" } });

//   const userSocketMap = new Map();

//   io.on("connection", (socket) => {
//     console.log(`User connected: ${socket.id}`);

//     socket.on("register", (phoneNumber) => {
//       userSocketMap.set(phoneNumber, socket.id);
//       console.log(`User with phone number ${phoneNumber} registered with socket ID ${socket.id}`);
//     });

//     socket.on("message", (msg) => {
//       const { receiverPh, senderPh } = msg;
//       const receiverSocketId = userSocketMap.get(receiverPh);
//       if (receiverSocketId) {
//         io.to(receiverSocketId).emit("message", msg);
//       }
//       const senderSocketId = userSocketMap.get(senderPh);
//       if (senderSocketId) {
//         io.to(senderSocketId).emit("message_sent", { status: "delivered" });
//       }
//     });

//     socket.on("disconnect", () => {
//       console.log("User disconnected");

//       for (const [key, value] of userSocketMap.entries()) {
//         if (value === socket.id) {
//           userSocketMap.delete(key);
//           break;
//         }
//       }
//     });
//   });
// };
