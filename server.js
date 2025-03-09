import express from "express";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const app = express();

app.use(express.json());

app.get("/users", async (req, res) => {
  const users = await prisma.user.findMany();
  res.json(users);
});

app.post("/users", async (req, res) => {
  const { name, email } = req.body;
  const user = await prisma.user.create({
    data: { name, email },
  });
  res.json(user);
});
//Create post with two db calls
//First check if user exists
//Second - create post
//If user does not exist, return 404
app.post("/post", async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      return res.status(404).json({ error: "User not found" });
    }

    // Create new post
    const post = await prisma.post.create({
      data: {
        title,
        content,
        userId, // Foreign key
      },
    });

    return res.status(201).json(post); // Send the created post as a response
  } catch (error) {
    console.error(error);
    return res.status(500).json({ error: "Failed to create post" });
  }
});

//Create post with one db call
app.post("/post2", async (req, res) => {
  const { title, content, userId } = req.body;

  try {
    // Create post while linking it to an existing user
    const post = await prisma.post.create({
      data: {
        title,
        content,
        user: {
          connect: { id: userId }, // Connect post to an existing user
        },
      },
    });

    return res.status(201).json(post);
  } catch (error) {
    console.error(error);

    // Handle the error if userId doesn't exist
    if (error.code === "P2025") {
      return res.status(404).json({ error: "User not found" });
    }

    return res.status(500).json({ error: "Failed to create post" });
  }
});

app.listen(3000, () => {
  console.log("Server is running on port 3000");
});
