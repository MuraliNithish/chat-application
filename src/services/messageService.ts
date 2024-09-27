// import { Response, Request}  from "express";
// import { AppDataSource } from "../config/database";
// import { Message } from "../entity/message";
// export const saveMessage = async (req: Request, res: Response) => {
//   const { name, content, time, senderPh, receiverPh, type } = req.body;

//   try {
//     const messageRepository = AppDataSource.getRepository(Message);
//     const message = messageRepository.create({
//       name,
//       content,
//       time,
//       senderPh,
//       receiverPh,
//       type,
//       text: type === "text" ? content : null,
//     });

//     await messageRepository.save(message);

//     res.status(201).json(message);
//   } catch (error) {
//     console.error("Error saving message:", error);
//     res.status(500).json({ error: "Error saving message" });
//   }
// };

// export const getMessages = async (req: Request, res: Response) => {
//   try {
//     const messageRepository = AppDataSource.getRepository(Message);
//     const messages = await messageRepository.find({
//       order: { time: "ASC" }
//     });
//     res.status(200).json(messages);
//   } catch (error) {
//     console.error("Error fetching messages:", error);
//     res.status(500).json({ error: "Error fetching messages" });
//   }
// };

// export const markMessageAsRead = async (req: Request, res: Response) => {
//   const { id } = req.params;
//   try {
//     const messageRepository = AppDataSource.getRepository(Message);
//     const message = await messageRepository.findOneBy({ id: parseInt(id) });

//     if (message) {
//       message.is_read = true;
//       await messageRepository.save(message);
//       res.status(200).json(message);
//     } else {
//       res.status(404).json({ message: "Message not found" });
//     }
//   } catch (error) {
//     console.error("Error updating message:", error);
//     res.status(500).json({ message: "Internal server error" });
//   }
// };
