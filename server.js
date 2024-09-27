const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const multer = require("multer");
const path = require("path");
const mysql = require("mysql2");
const http = require("http");
const { Server } = require("socket.io");
const pdf = require('pdf-poppler');


const app = express();
const port = 5001;

// Create a MySQL connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "Murali@17",
  database: "whatsapp",
});

db.connect((err) => {
  if (err) {
    console.error("Error connecting to MySQL:", err.stack);
    return;
  }
  console.log("Connected to MySQL as id " + db.threadId);
});

// Middleware setup
app.use(cors({ origin: "*" }));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Create HTTP server and Socket.IO server
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: "*" } });

// Store user socket connections
const userSocketMap = new Map();

io.on("connection", (socket) => {
  console.log(`User connected: ${socket.id}`);

  // Register user and store their socket ID
  socket.on("register", (phoneNumber) => {
    userSocketMap.set(phoneNumber, socket.id);
    console.log(`User with phone number ${phoneNumber} registered with socket ID ${socket.id}`);

    // Notify others that this user is online
    socket.broadcast.emit("user-status", { phoneNumber, status: "online" });
  });

  // Handle user disconnection
  socket.on("disconnect", () => {
    console.log("User disconnected");

    let disconnectedUserPhone = null;
    for (const [key, value] of userSocketMap.entries()) {
      if (value === socket.id) {
        disconnectedUserPhone = key;
        userSocketMap.delete(key);
        break;
      }
    }

    if (disconnectedUserPhone) {
      socket.broadcast.emit("user-status", { phoneNumber: disconnectedUserPhone, status: "offline" });
    }
  });

  // Handle messages
  socket.on("message", (message) => {
    // Emit to both sender and receiver
    io.to(message.senderPh).emit("message", message);
    io.to(message.receiverPh).emit("message", message);
  });
});

// Serve static files from 'uploads' directory
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Set up file upload using multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname)); // Save with a unique filename
  },
});

const upload = multer({ storage });

// API routes
app.get("/", (req, res) => {
  res.send("Welcome to the server!");
});
app.use(express.static('public'));

const saveMessage = async (req, res) => {
  const { name, content, time, senderPh, receiverPh, type } = req.body;

  try {
    db.query(
      "INSERT INTO messages (name, content, time, senderPh, receiverPh, type, text) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [name, content, time, senderPh, receiverPh, type, type === "text" ? content : null],
      (error, results) => {
        if (error) {
          console.error("Error saving message:", error);
          return res.status(500).json({ error: "Error saving message" });
        }

        const savedMessage = {
          id: results.insertId,
          name,
          content,
          time,
          senderPh,
          receiverPh,
          type,
        };

        console.log("Message saved to database:", savedMessage);

        // Emit the message to the receiver only
        const receiverSocketId = userSocketMap.get(receiverPh);
        if (receiverSocketId) {
          io.to(receiverSocketId).emit("message", savedMessage);
        }

        // Optionally, you might also want to send it to the sender if they are online
        const senderSocketId = userSocketMap.get(senderPh);
        if (senderSocketId) {
          io.to(senderSocketId).emit("message", savedMessage);
        }

        res.status(201).json(savedMessage);
      }
    );
  } catch (error) {
    console.error("Error saving message:", error);
    res.status(500).json({ error: "Error saving message" });
  }
};

app.post("/api/messages", saveMessage);



app.get("/api/messages", (req, res) => {
  const { senderPh, receiverPh } = req.query;
  if (!senderPh || !receiverPh) {
    return res.status(404).json({ error: "sender and receiver phone number required" });
  }
  const query = 'SELECT * FROM messages WHERE (senderPh=? AND receiverPh=?) OR (senderPh=? AND receiverPh=?)';
  db.query(query, [senderPh, receiverPh, receiverPh, senderPh], (err, results) => {
    if (err) {
      console.error('Error fetching messages:', err);
      return res.status(500).json({ message: 'Failed to fetch messages' });
    }
    res.status(200).json(results);
  });
});

// Express route to mark messages as read
app.put("/api/messages/markAsRead", (req, res) => {
  const { senderPh, receiverPh } = req.body;y
  
  if (!senderPh || !receiverPh) {
    return res.status(400).json({ error: "Sender and receiver phone numbers are required" });
  }

  const query = "UPDATE messages SET unreadCount = 0 WHERE senderPh = ? AND receiverPh = ?";
  
  db.query(query, [senderPh, receiverPh], (err, results) => {
    if (err) {
      console.error('Error updating unread messages:', err);
      return res.status(500).json({ message: 'Failed to mark messages as read' });
    }
    res.status(200).json({ message: "Messages marked as read", affectedRows: results.affectedRows });
  });
});



// POST endpoint to handle file upload
app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No file uploaded' });
  }

  const fileUrl = `http://localhost:${port}/uploads/${req.file.filename}`;
  console.log('File uploaded successfully:', fileUrl);

  res.status(201).json({ fileUrl });
});

// Start the server
server.listen(port, () => console.log(`Server running on port ${port}`));
